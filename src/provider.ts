import * as vscode from "vscode";
import { OpenAICompatibleClient, ApiError, mapApiError, getKimiExtraHeaders } from "./api.js";
import type {
	ModelInfo,
	VendorConfig,
	OpenAIMessage,
	OpenAITool,
	OpenAIContentPart,
	ThinkingEffort,
	ContextLength,
	ModelConfigurationOptions,
} from "./types.js";
import { toLanguageModelChatInformation, applyContextLength, DEFAULT_CONTEXT_LENGTH, ALWAYS_THINKING_MODEL_IDS } from "./types.js";

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

/**
 * Resolve the (thinking, effort) pair for a single chat request.
 *
 * Priority order:
 *   1. The picker's `modelConfiguration.reasoningEffort` (set per-turn via the
 *      Copilot model picker's secondary menu — see THINKING_EFFORT_SCHEMA /
 *      THINKING_TOGGLE_SCHEMA).
 *   2. Legacy `modelOptions.thinkingBudget` (kept for callers that bypass the
 *      picker, e.g. older programmatic clients).
 *   3. Model default — `thinking: true` with effort=`medium` for effort-capable
 *      models, otherwise `thinking: true` with no effort knob.
 */
function resolveRequestedEffort(
	options: ModelConfigurationOptions,
	modelDef: ModelInfo | undefined,
): { thinking: boolean; effort: ThinkingEffort | undefined } {
	const raw =
		(options.modelConfiguration?.reasoningEffort as unknown) ??
		(options.modelOptions?.thinkingBudget as unknown);

	if (raw === "none") return { thinking: false, effort: undefined };
	if (raw === "on") return { thinking: true, effort: undefined };
	if (raw === "low" || raw === "medium" || raw === "high" || raw === "max") {
		return { thinking: true, effort: raw };
	}

	if (!(modelDef?.thinking ?? false)) return { thinking: false, effort: undefined };
	return {
		thinking: true,
		effort: modelDef?.thinkingEffortSupport ? "medium" : undefined,
	};
}

function isVisionEnabled(): boolean {
	const config = vscode.workspace.getConfiguration("omniCopilot");
	return config.get<boolean>("enableVision", true);
}

function getEffectiveMaxInputTokens(
	modelMaxInputTokens: number,
	contextLength: ContextLength,
	customContextLength: number,
): number {
	return applyContextLength(modelMaxInputTokens, contextLength, customContextLength);
}

/**
 * Vendors whose APIs accept the `reasoning_content` field on messages.
 * Vendors not listed here (Volcengine, MiniMax, generic/custom) may reject
 * requests that contain the field.
 */
function supportsReasoningContent(vendorId?: string): boolean {
	switch (vendorId) {
		case "deepseek":
		case "qwen":
		case "moonshot":
		case "moonshot-open":
		case "glm-coding-plan-cn":
			return true;
		default:
			return false;
	}
}

function convertRole(
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

interface BuildMessagesOptions {
	supportsVision: boolean;
	vendorId?: string;
}

/**
 * Shared message-serialization logic used by MultiModelChatProvider. Converts
 * VS Code chat messages into OpenAI-compatible message objects, handling
 * vision parts, tool calls, and vendor-gated reasoning_content.
 */
function buildOpenAIMessages(
	messages: readonly vscode.LanguageModelChatRequestMessage[],
	opts: BuildMessagesOptions,
): OpenAIMessage[] {
	const includeReasoning = supportsReasoningContent(opts.vendorId);
	const result: OpenAIMessage[] = [];

	for (const msg of messages) {
		const role = convertRole(msg.role);
		let textContent = "";
		let reasoningContent = "";
		let toolCalls: OpenAIMessage["tool_calls"] | undefined;
		let toolCallId: string | undefined;
		const imageParts: OpenAIContentPart[] = [];

		for (const part of msg.content) {
			if (part instanceof vscode.LanguageModelTextPart) {
				textContent += part.value;
			} else if (
				ThinkingPartCtor &&
				part instanceof ThinkingPartCtor
			) {
				reasoningContent += (part as any).value;
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
				opts.supportsVision &&
				role === "user" &&
				part instanceof vscode.LanguageModelDataPart &&
				part.mimeType?.startsWith("image/")
			) {
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
			const message: OpenAIMessage = {
				role: "assistant",
				content: textContent || "",
				tool_calls: toolCalls,
			};
			if (includeReasoning && reasoningContent) {
				message.reasoning_content = reasoningContent;
			}
			result.push(message);
		} else if (imageParts.length > 0) {
			const contentParts: OpenAIContentPart[] = [];
			if (textContent) {
				contentParts.push({ type: "text", text: textContent });
			}
			contentParts.push(...imageParts);
			result.push({ role, content: contentParts, name: msg.name });
		} else {
			const message: OpenAIMessage = { role, content: textContent, name: msg.name };
			if (includeReasoning && role === "assistant" && reasoningContent) {
				message.reasoning_content = reasoningContent;
			}
			result.push(message);
		}
	}

	return result;
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

		const config = vscode.workspace.getConfiguration("omniCopilot");
		const contextLength = config.get<string>("contextLength", "default") as ContextLength;
		const customContextLength = config.get<number>("customContextLength", DEFAULT_CONTEXT_LENGTH);

		// Preset models
		const result = this.vendorConfig.models.map((m) => {
			const info = toLanguageModelChatInformation(m, this.vendorConfig.vendorId);
			return {
				...info,
				maxInputTokens: getEffectiveMaxInputTokens(info.maxInputTokens, contextLength, customContextLength),
			};
		});

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

		// Resolve thinking + effort: per-turn picker value first, then global default.
		// Vendor-incapable models force thinking=false regardless of picker choice.
		const { thinking: requestedThinking, effort: requestedEffort } =
			resolveRequestedEffort(options as ModelConfigurationOptions, modelDef);
		const modelSupportsThinking =
			this.vendorConfig.thinkingCapable && (modelDef?.thinking ?? false);
		// Thinking-locked models (K2.7 Code family, MiniMax M2.x) and
		// always-on models (K3, GLM-5.3 family) think permanently on their
		// endpoints; the picker cannot turn them off.
		const thinking =
			modelDef?.thinkingLocked || ALWAYS_THINKING_MODEL_IDS.has(modelDef?.id ?? "")
				? true
				: modelSupportsThinking
					? requestedThinking
					: false;
		const thinkingEffort =
			!modelDef?.thinkingLocked &&
			thinking &&
			(modelDef?.thinkingEffortSupport ?? false)
				? requestedEffort
				: undefined;

		const supportsVision =
			isVisionEnabled() && (modelDef?.capabilities.imageInput ?? false);

		let apiMessages = this.convertMessages(messages, supportsVision);
		const apiTools = this.convertTools(options.tools);
		const maxTokens = options.modelOptions?.maxTokens as number | undefined;

		// Vendor-specific extra headers (Kimi requires special headers)
		const extraHeaders =
			this.vendorConfig.vendorId === "moonshot"
				? getKimiExtraHeaders()
				: undefined;

		// Kimi requires reasoning_content on all assistant messages when thinking is enabled
		if (this.vendorConfig.vendorId === "moonshot" && thinking) {
			apiMessages = apiMessages.map((msg) => {
				if (msg.role === "assistant" && !msg.reasoning_content) {
					return { ...msg, reasoning_content: "" };
				}
				return msg;
			});
		}

		// Some providers reject multi-step tool loops where assistant
		// messages lack reasoning_content — DeepSeek always; Zhipu for its
		// always-thinking 5.3 models (interleaved thinking requires
		// preserving reasoning_content alongside tool results); Kimi Open
		// Platform whenever thinking is on (K3 and K2.7 always think). The
		// host may drop thinking parts from history, so backfill "".
		const needsReasoningBackfill =
			this.vendorConfig.vendorId === "deepseek" ||
			this.vendorConfig.vendorId === "glm-coding-plan-cn" ||
			(this.vendorConfig.vendorId === "moonshot-open" && thinking) ||
			(this.vendorConfig.vendorId === "qwen" &&
				thinking &&
				(model.id ?? "").startsWith("deepseek-v4"));
		if (needsReasoningBackfill && apiTools && apiTools.length > 0) {
			apiMessages = apiMessages.map((msg) =>
				msg.role === "assistant" && msg.reasoning_content === undefined
					? { ...msg, reasoning_content: "" }
					: msg,
			);
		}

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

	private convertMessages(
		messages: readonly vscode.LanguageModelChatRequestMessage[],
		supportsVision: boolean,
	): OpenAIMessage[] {
		return buildOpenAIMessages(messages, {
			supportsVision,
			vendorId: this.vendorConfig.vendorId,
		});
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
