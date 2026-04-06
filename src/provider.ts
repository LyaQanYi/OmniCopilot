import * as vscode from "vscode";
import { OpenAICompatibleClient, ApiError, mapApiError, getKimiExtraHeaders } from "./api.js";
import type {
	ModelInfo,
	VendorConfig,
	OpenAIMessage,
	OpenAITool,
	OpenAIContentPart,
	ThinkingEffort,
} from "./types.js";
import { toLanguageModelChatInformation } from "./types.js";

// ─── Thinking Tag Processing ─────────────────────────────────────────────────

interface ThinkingState {
	buffer: string;
	insideThinking: boolean;
}

interface ThinkingParsedPart {
	type: "text" | "thinking";
	value: string;
}

interface ToolCallBuilder {
	id: string;
	name: string;
	arguments: string;
}

const THINK_OPEN = "<think>";
const THINK_CLOSE = "</think>";

/**
 * Sanitize a tool's inputSchema for strict APIs (DeepSeek, etc.).
 * VS Code may pass schemas where `type` is null or the schema itself is
 * undefined. DeepSeek requires `"type": "object"` at the top level.
 */
function sanitizeToolParameters(
	schema: object | undefined | null,
): Record<string, unknown> {
	if (!schema || typeof schema !== "object") {
		return { type: "object", properties: {} };
	}
	const result = deepSanitizeSchema(schema) as Record<string, unknown>;
	// Ensure top-level type is always "object"
	if (!result["type"] || result["type"] === null) {
		result["type"] = "object";
	}
	return result;
}

function deepSanitizeSchema(obj: unknown): unknown {
	if (obj === null || obj === undefined || typeof obj !== "object") {
		return obj;
	}
	if (Array.isArray(obj)) {
		return obj.map(deepSanitizeSchema);
	}
	const record = obj as Record<string, unknown>;
	const out: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(record)) {
		if (key === "type" && value === null) {
			out[key] = "object";
		} else {
			out[key] = deepSanitizeSchema(value);
		}
	}
	return out;
}

// Runtime detection: LanguageModelThinkingPart is a proposed API that may
// graduate to stable in a future VS Code release. When available, thinking
// content renders as a native collapsible UI; otherwise it falls back to text.
const ThinkingPartCtor: (new (value: string) => unknown) | undefined =
	(vscode as any).LanguageModelThinkingPart;

function reportThinkingPart(
	progress: vscode.Progress<vscode.LanguageModelResponsePart>,
	part: ThinkingParsedPart,
): void {
	if (part.type === "thinking" && ThinkingPartCtor) {
		progress.report(new ThinkingPartCtor(part.value) as any);
	} else {
		progress.report(new vscode.LanguageModelTextPart(part.value));
	}
}

function findTrailingPartialMatch(buffer: string, tag: string): number {
	for (let i = Math.min(tag.length - 1, buffer.length); i >= 1; i--) {
		if (buffer.slice(-i) === tag.slice(0, i)) {
			return i;
		}
	}
	return 0;
}

/**
 * Parses content with <think>...</think> tags into structured parts.
 * When strip=true, thinking content is discarded.
 */
function processThinkingContent(
	content: string,
	state: ThinkingState,
	strip: boolean,
): { parts: ThinkingParsedPart[]; state: ThinkingState } {
	const parts: ThinkingParsedPart[] = [];
	let buffer = state.buffer + content;
	let insideThinking = state.insideThinking;

	while (buffer.length > 0) {
		const tag = insideThinking ? THINK_CLOSE : THINK_OPEN;
		const tagIdx = buffer.indexOf(tag);

		if (tagIdx !== -1) {
			const before = buffer.slice(0, tagIdx);
			if (before) {
				if (insideThinking) {
					if (!strip) {
						parts.push({ type: "thinking", value: before });
					}
				} else {
					parts.push({ type: "text", value: before });
				}
			}
			buffer = buffer.slice(tagIdx + tag.length);
			insideThinking = !insideThinking;
			continue;
		}

		const partialMatch = findTrailingPartialMatch(buffer, tag);
		if (partialMatch > 0) {
			const emittable = buffer.slice(0, -partialMatch);
			if (emittable) {
				if (insideThinking) {
					if (!strip) {
						parts.push({ type: "thinking", value: emittable });
					}
				} else {
					parts.push({ type: "text", value: emittable });
				}
			}
			buffer = buffer.slice(-partialMatch);
		} else {
			if (insideThinking) {
				if (!strip) {
					parts.push({ type: "thinking", value: buffer });
				}
			} else {
				parts.push({ type: "text", value: buffer });
			}
			buffer = "";
		}
		break;
	}

	return { parts, state: { buffer, insideThinking } };
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function getObjectProperty(source: unknown, key: string): unknown {
	if (!source || typeof source !== "object") return undefined;
	return (source as Record<string, unknown>)[key];
}

function getApiKey(
	options: vscode.PrepareLanguageModelChatModelOptions,
): string | undefined {
	const configuration = getObjectProperty(options, "configuration");
	const apiKey = getObjectProperty(configuration, "apiKey");
	if (typeof apiKey !== "string") return undefined;
	const normalized = apiKey.trim();
	return normalized.length > 0 ? normalized : undefined;
}

function getConfigString(
	options: vscode.PrepareLanguageModelChatModelOptions,
	key: string,
): string | undefined {
	const configuration = getObjectProperty(options, "configuration");
	const value = getObjectProperty(configuration, key);
	if (typeof value !== "string") return undefined;
	const normalized = value.trim();
	return normalized.length > 0 ? normalized : undefined;
}

function getToolCallBuilder(
	builders: Map<number, ToolCallBuilder>,
	index: number,
): ToolCallBuilder {
	const existing = builders.get(index);
	if (existing) return existing;
	const created: ToolCallBuilder = { id: "", name: "", arguments: "" };
	builders.set(index, created);
	return created;
}

function emitToolCalls(
	progress: vscode.Progress<vscode.LanguageModelResponsePart>,
	builders: Map<number, ToolCallBuilder>,
): void {
	for (const [, builder] of builders) {
		if (!builder.id || !builder.name) continue;
		let args: Record<string, unknown> = {};
		try {
			args = JSON.parse(builder.arguments || "{}");
		} catch (e) {
			const errMsg = e instanceof Error ? e.message : String(e);
			// Log parse error for debugging — still emit the tool call with empty args
			// since the LLM intended to invoke the tool
			void vscode.window.showWarningMessage(
				`[OmniCopilot] Failed to parse tool call arguments for ${builder.name}: ${errMsg} | raw: ${builder.arguments}`,
			);
		}
		progress.report(
			new vscode.LanguageModelToolCallPart(builder.id, builder.name, args),
		);
	}
	builders.clear();
}

function resolveThinking(modelDefault: boolean): boolean {
	const config = vscode.workspace.getConfiguration("omniCopilot");
	const setting = config.get<string>("enableThinking", "auto");
	switch (setting) {
		case "always":
			return true;
		case "never":
			return false;
		default:
			return modelDefault;
	}
}

function getThinkingEffort(): ThinkingEffort {
	const config = vscode.workspace.getConfiguration("omniCopilot");
	const effort = config.get<string>("thinkingEffort", "medium");
	if (effort === "low" || effort === "medium" || effort === "high") {
		return effort;
	}
	return "medium";
}

function isVisionEnabled(): boolean {
	const config = vscode.workspace.getConfiguration("omniCopilot");
	return config.get<boolean>("enableVision", true);
}

// ─── Multi-Model Provider ────────────────────────────────────────────────────

export class MultiModelChatProvider
	implements vscode.LanguageModelChatProvider
{
	private apiKey: string | undefined;
	private readonly vendorConfig: VendorConfig;

	constructor(vendorConfig: VendorConfig) {
		this.vendorConfig = vendorConfig;
	}

	provideLanguageModelChatInformation(
		options: vscode.PrepareLanguageModelChatModelOptions,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.LanguageModelChatInformation[]> {
		const key = getApiKey(options);
		if (!key) return [];

		this.apiKey = key;

		// Preset models
		const presetIds = new Set(this.vendorConfig.models.map((m) => m.id));
		const result = this.vendorConfig.models.map(toLanguageModelChatInformation);

		// Custom model IDs from settings
		const customIds = vscode.workspace
			.getConfiguration()
			.get<string[]>(this.vendorConfig.settingsKey, []);

		for (const customId of customIds) {
			const trimmed = customId.trim();
			if (!trimmed || presetIds.has(trimmed)) continue;

			result.push(
				toLanguageModelChatInformation(
					this.createCustomModelInfo(trimmed),
				),
			);
		}

		return result;
	}

	async provideLanguageModelChatResponse(
		model: vscode.LanguageModelChatInformation,
		messages: readonly vscode.LanguageModelChatRequestMessage[],
		options: vscode.ProvideLanguageModelChatResponseOptions,
		progress: vscode.Progress<vscode.LanguageModelResponsePart>,
		token: vscode.CancellationToken,
	): Promise<void> {
		if (!this.apiKey) {
			throw new Error(
				"API key not configured. Configure it via the model picker.",
			);
		}

		const client = new OpenAICompatibleClient(this.apiKey);
		const modelDef = this.findModelDef(model.id);
		const baseUrl = modelDef?.baseUrl ?? this.vendorConfig.defaultBaseUrl;
		// Only allow thinking when both vendor and model support it
		const modelSupportsThinking =
			this.vendorConfig.thinkingCapable && (modelDef?.thinking ?? false);
		const thinking = modelSupportsThinking
			? resolveThinking(true)
			: false;
		const supportsVision =
			isVisionEnabled() && (modelDef?.capabilities.imageInput ?? false);

		const apiMessages = this.convertMessages(messages, supportsVision);
		const apiTools = this.convertTools(options.tools);
		const maxTokens = options.modelOptions?.maxTokens as number | undefined;

		// Read thinkingBudget from modelOptions (VS Code may send this in future)
		const modelThinkingBudget = options.modelOptions?.thinkingBudget as string | undefined;
		const thinkingEffort =
			thinking && (modelDef?.thinkingEffortSupport ?? false)
				? (modelThinkingBudget as ThinkingEffort | undefined) ||
					getThinkingEffort()
				: undefined;

		// Vendor-specific extra headers (Kimi requires special headers)
		const extraHeaders =
			this.vendorConfig.vendorId === "moonshot"
				? getKimiExtraHeaders()
				: undefined;

		try {
			const stream = client.streamChat(
				model.id,
				apiMessages,
				baseUrl,
				{
					maxTokens,
					tools: apiTools,
					thinking,
					thinkingEffort,
					vendorId: this.vendorConfig.vendorId,
					extraHeaders,
				},
				token,
			);

			const toolCallBuilders = new Map<number, ToolCallBuilder>();
			let thinkingState: ThinkingState = {
				buffer: "",
				insideThinking: false,
			};
			let inReasoningStream = false;

			for await (const chunk of stream) {
				if (token.isCancellationRequested) break;

				for (const choice of chunk.choices) {
					const delta = choice.delta;

					// Some providers (DeepSeek, Kimi) use reasoning_content for think output
					const textContent = delta.content || "";
					const reasoningContent = delta.reasoning_content || "";

					// Build combined content with proper <think> boundary tags
					let combinedContent = "";
					if (reasoningContent) {
						if (!inReasoningStream) {
							combinedContent += "<think>";
							inReasoningStream = true;
						}
						combinedContent += reasoningContent;
					}
					if (textContent) {
						if (inReasoningStream) {
							combinedContent += "</think>";
							inReasoningStream = false;
						}
						combinedContent += textContent;
					}
					// Close reasoning at end of stream
					if (!reasoningContent && !textContent && inReasoningStream && choice.finish_reason) {
						combinedContent = "</think>";
						inReasoningStream = false;
					}

					if (combinedContent) {
						// Parse thinking tags into structured parts
						const result = processThinkingContent(
							combinedContent,
							thinkingState,
							!thinking,
						);
						thinkingState = result.state;
						for (const part of result.parts) {
							reportThinkingPart(progress, part);
						}
					}

					if (delta.tool_calls) {
						for (const toolCall of delta.tool_calls) {
							const builder = getToolCallBuilder(
								toolCallBuilders,
								toolCall.index,
							);
							if (toolCall.id) builder.id = toolCall.id;
							if (toolCall.function?.name)
								builder.name = toolCall.function.name;
							if (toolCall.function?.arguments)
								builder.arguments +=
									toolCall.function.arguments;
						}
					}

					if (choice.finish_reason === "tool_calls") {
						emitToolCalls(progress, toolCallBuilders);
					}
				}
			}

			// Flush any thinking buffer remaining after the stream ends
			if (thinkingState.buffer) {
				let flushContent = thinkingState.buffer;
				if (inReasoningStream) {
					flushContent += THINK_CLOSE;
				}
				const flushResult = processThinkingContent(
					flushContent,
					{ buffer: "", insideThinking: thinkingState.insideThinking },
					!thinking,
				);
				for (const part of flushResult.parts) {
					reportThinkingPart(progress, part);
				}
			}
			// Flush any pending tool calls not yet emitted
			if (toolCallBuilders.size > 0) {
				emitToolCalls(progress, toolCallBuilders);
			}
		} catch (error) {
			if (!(error instanceof ApiError)) throw error;
			throw mapApiError(error, this.vendorConfig.displayName);
		}
	}

	provideTokenCount(
		_model: vscode.LanguageModelChatInformation,
		text: string | vscode.LanguageModelChatRequestMessage,
		_token: vscode.CancellationToken,
	): Thenable<number> {
		if (typeof text === "string") {
			return Promise.resolve(Math.ceil(text.length / 4));
		}
		let totalChars = 0;
		for (const part of text.content) {
			if (part instanceof vscode.LanguageModelTextPart) {
				totalChars += part.value.length;
			} else if (part instanceof vscode.LanguageModelToolCallPart) {
				totalChars += part.name.length + JSON.stringify(part.input).length;
			} else if (part instanceof vscode.LanguageModelToolResultPart) {
				totalChars += JSON.stringify(part.content).length;
			} else {
				totalChars += JSON.stringify(part).length;
			}
		}
		return Promise.resolve(Math.ceil(totalChars / 4));
	}

	private findModelDef(modelId: string): ModelInfo | undefined {
		return this.vendorConfig.models.find((m) => m.id === modelId);
	}

	private createCustomModelInfo(modelId: string): ModelInfo {
		return {
			id: modelId,
			name: modelId,
			family: this.vendorConfig.vendorId,
			version: "custom",
			tooltip: `${this.vendorConfig.displayName} — custom model`,
			maxInputTokens: 131072,
			maxOutputTokens: 4096,
			baseUrl: this.vendorConfig.defaultBaseUrl,
			thinking: false,
			thinkingEffortSupport: false,
			capabilities: { imageInput: false, toolCalling: true },
		};
	}

	private convertMessages(
		messages: readonly vscode.LanguageModelChatRequestMessage[],
		supportsVision: boolean,
	): OpenAIMessage[] {
		const result: OpenAIMessage[] = [];

		for (const msg of messages) {
			const role = this.convertRole(msg.role);
			let textContent = "";
			let toolCalls: OpenAIMessage["tool_calls"] | undefined;
			let toolCallId: string | undefined;
			const imageParts: OpenAIContentPart[] = [];

			for (const part of msg.content) {
				if (part instanceof vscode.LanguageModelTextPart) {
					textContent += part.value;
				} else if (part instanceof vscode.LanguageModelToolCallPart) {
					if (!toolCalls) toolCalls = [];
					toolCalls.push({
						id: part.callId,
						type: "function",
						function: {
							name: part.name,
							arguments: JSON.stringify(part.input),
						},
					});
				} else if (part instanceof vscode.LanguageModelToolResultPart) {
					toolCallId = part.callId;
					textContent =
						typeof part.content === "string"
							? part.content
							: JSON.stringify(part.content);
				} else if (
					supportsVision &&
					role === "user" &&
					part instanceof vscode.LanguageModelDataPart &&
					part.mimeType?.startsWith("image/")
				) {
					// Vision: image data (only for actual images in user messages)
					const base64 = Buffer.from(part.data).toString("base64");
					imageParts.push({
						type: "image_url",
						image_url: {
							url: `data:${part.mimeType};base64,${base64}`,
						},
					});
				}
			}

			if (toolCallId) {
				result.push({
					role: "tool",
					content: textContent,
					tool_call_id: toolCallId,
				});
			} else if (toolCalls && toolCalls.length > 0) {
				result.push({
					role: "assistant",
					content: textContent || "",
					tool_calls: toolCalls,
				});
			} else if (imageParts.length > 0) {
				// Multi-modal message with text + images
				const contentParts: OpenAIContentPart[] = [];
				if (textContent) {
					contentParts.push({ type: "text", text: textContent });
				}
				contentParts.push(...imageParts);
				result.push({ role, content: contentParts, name: msg.name });
			} else {
				result.push({ role, content: textContent, name: msg.name });
			}
		}

		return result;
	}

	private convertRole(
		role: vscode.LanguageModelChatMessageRole,
	): "system" | "user" | "assistant" {
		switch (role) {
			case vscode.LanguageModelChatMessageRole.User:
				return "user";
			case vscode.LanguageModelChatMessageRole.Assistant:
				return "assistant";
			default:
				return "user";
		}
	}

	private convertTools(
		tools?: readonly vscode.LanguageModelChatTool[],
	): OpenAITool[] | undefined {
		if (!tools || tools.length === 0) return undefined;
		return tools.map((tool) => ({
			type: "function" as const,
			function: {
				name: tool.name,
				description: tool.description,
				parameters: sanitizeToolParameters(tool.inputSchema),
			},
		}));
	}
}

// ─── Custom OpenAI Compatible Provider ───────────────────────────────────────

export class CustomOpenAIProvider
	implements vscode.LanguageModelChatProvider
{
	private apiKey: string | undefined;
	private apiUrl: string | undefined;
	private modelId: string | undefined;
	private modelName: string | undefined;

	provideLanguageModelChatInformation(
		options: vscode.PrepareLanguageModelChatModelOptions,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.LanguageModelChatInformation[]> {
		const key = getApiKey(options);
		if (!key) return [];

		this.apiKey = key;
		this.apiUrl = getConfigString(options, "apiUrl");
		this.modelId = getConfigString(options, "modelId");
		this.modelName = getConfigString(options, "modelName");

		if (!this.apiUrl || !this.modelId) return [];

		const displayName = this.modelName || this.modelId;

		return [
			{
				id: this.modelId,
				name: displayName,
				family: "custom",
				version: "1",
				tooltip: `Custom model at ${this.apiUrl}`,
				detail: `Custom model at ${this.apiUrl}`,
				maxInputTokens: 131072,
				maxOutputTokens: 4096,
				capabilities: { imageInput: false, toolCalling: true },
			},
		];
	}

	async provideLanguageModelChatResponse(
		model: vscode.LanguageModelChatInformation,
		messages: readonly vscode.LanguageModelChatRequestMessage[],
		options: vscode.ProvideLanguageModelChatResponseOptions,
		progress: vscode.Progress<vscode.LanguageModelResponsePart>,
		token: vscode.CancellationToken,
	): Promise<void> {
		if (!this.apiKey || !this.apiUrl) {
			throw new Error(
				"API key and URL not configured. Configure them via the model picker.",
			);
		}

		const client = new OpenAICompatibleClient(this.apiKey);
		const apiMessages = this.convertMessages(messages);
		const apiTools = this.convertTools(options.tools);
		const maxTokens = options.modelOptions?.maxTokens as number | undefined;

		// Custom provider doesn't send thinking params to API but should
		// respect the global setting when stripping <think> tags from output.
		// Default to showing thinking (true) so "auto" preserves existing
		// behaviour; only "never" will strip.
		const showThinking = resolveThinking(true);

		try {
			const stream = client.streamChat(
				model.id,
				apiMessages,
				this.apiUrl,
				{ maxTokens, tools: apiTools },
				token,
			);

			const toolCallBuilders = new Map<number, ToolCallBuilder>();
			let thinkingState: ThinkingState = {
				buffer: "",
				insideThinking: false,
			};
			let inReasoningStream = false;

			for await (const chunk of stream) {
				if (token.isCancellationRequested) break;

				for (const choice of chunk.choices) {
					const delta = choice.delta;

					const textContent = delta.content || "";
					const reasoningContent = delta.reasoning_content || "";

					let combinedContent = "";
					if (reasoningContent) {
						if (!inReasoningStream) {
							combinedContent += "<think>";
							inReasoningStream = true;
						}
						combinedContent += reasoningContent;
					}
					if (textContent) {
						if (inReasoningStream) {
							combinedContent += "</think>";
							inReasoningStream = false;
						}
						combinedContent += textContent;
					}
					if (!reasoningContent && !textContent && inReasoningStream && choice.finish_reason) {
						combinedContent = "</think>";
						inReasoningStream = false;
					}

					if (combinedContent) {
						const result = processThinkingContent(
							combinedContent,
							thinkingState,
							!showThinking,
						);
						thinkingState = result.state;
						for (const part of result.parts) {
							reportThinkingPart(progress, part);
						}
					}

					if (delta.tool_calls) {
						for (const toolCall of delta.tool_calls) {
							const builder = getToolCallBuilder(
								toolCallBuilders,
								toolCall.index,
							);
							if (toolCall.id) builder.id = toolCall.id;
							if (toolCall.function?.name)
								builder.name = toolCall.function.name;
							if (toolCall.function?.arguments)
								builder.arguments +=
									toolCall.function.arguments;
						}
					}

					if (choice.finish_reason === "tool_calls") {
						emitToolCalls(progress, toolCallBuilders);
					}
				}
			}

			// Flush any thinking buffer remaining after the stream ends
			if (thinkingState.buffer) {
				let flushContent = thinkingState.buffer;
				if (inReasoningStream) {
					flushContent += THINK_CLOSE;
				}
				const flushResult = processThinkingContent(flushContent, { buffer: "", insideThinking: thinkingState.insideThinking }, !showThinking);
				for (const part of flushResult.parts) {
					reportThinkingPart(progress, part);
				}
			}
		// Flush any pending tool calls not yet emitted
			if (toolCallBuilders.size > 0) {
				emitToolCalls(progress, toolCallBuilders);
			}
		} catch (error) {
			if (!(error instanceof ApiError)) throw error;
			throw mapApiError(error, "Custom");
		}
	}

	provideTokenCount(
		_model: vscode.LanguageModelChatInformation,
		text: string | vscode.LanguageModelChatRequestMessage,
		_token: vscode.CancellationToken,
	): Thenable<number> {
		if (typeof text === "string") {
			return Promise.resolve(Math.ceil(text.length / 4));
		}
		let totalChars = 0;
		for (const part of text.content) {
			if (part instanceof vscode.LanguageModelTextPart) {
				totalChars += part.value.length;
			} else if (part instanceof vscode.LanguageModelToolCallPart) {
				totalChars += part.name.length + JSON.stringify(part.input).length;
			} else if (part instanceof vscode.LanguageModelToolResultPart) {
				totalChars += JSON.stringify(part.content).length;
			} else {
				totalChars += JSON.stringify(part).length;
			}
		}
		return Promise.resolve(Math.ceil(totalChars / 4));
	}

	private convertMessages(
		messages: readonly vscode.LanguageModelChatRequestMessage[],
	): OpenAIMessage[] {
		const result: OpenAIMessage[] = [];

		for (const msg of messages) {
			const role = this.convertRole(msg.role);
			let textContent = "";
			let toolCalls: OpenAIMessage["tool_calls"] | undefined;
			let toolCallId: string | undefined;

			for (const part of msg.content) {
				if (part instanceof vscode.LanguageModelTextPart) {
					textContent += part.value;
				} else if (part instanceof vscode.LanguageModelToolCallPart) {
					if (!toolCalls) toolCalls = [];
					toolCalls.push({
						id: part.callId,
						type: "function",
						function: {
							name: part.name,
							arguments: JSON.stringify(part.input),
						},
					});
				} else if (part instanceof vscode.LanguageModelToolResultPart) {
					toolCallId = part.callId;
					textContent =
						typeof part.content === "string"
							? part.content
							: JSON.stringify(part.content);
				}
			}

			if (toolCallId) {
				result.push({
					role: "tool",
					content: textContent,
					tool_call_id: toolCallId,
				});
			} else if (toolCalls && toolCalls.length > 0) {
				result.push({
					role: "assistant",
					content: textContent || "",
					tool_calls: toolCalls,
				});
			} else {
				result.push({ role, content: textContent, name: msg.name });
			}
		}

		return result;
	}

	private convertRole(
		role: vscode.LanguageModelChatMessageRole,
	): "system" | "user" | "assistant" {
		switch (role) {
			case vscode.LanguageModelChatMessageRole.User:
				return "user";
			case vscode.LanguageModelChatMessageRole.Assistant:
				return "assistant";
			default:
				return "user";
		}
	}

	private convertTools(
		tools?: readonly vscode.LanguageModelChatTool[],
	): OpenAITool[] | undefined {
		if (!tools || tools.length === 0) return undefined;
		return tools.map((tool) => ({
			type: "function" as const,
			function: {
				name: tool.name,
				description: tool.description,
				parameters: sanitizeToolParameters(tool.inputSchema),
			},
		}));
	}
}
