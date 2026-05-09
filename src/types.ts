import type * as vscode from "vscode";

export interface ModelInfo {
	id: string;
	name: string;
	family: string;
	version: string;
	maxInputTokens: number;
	maxOutputTokens: number;
	tooltip: string;
	baseUrl: string;
	thinking: boolean;
	thinkingEffortSupport: boolean;
	capabilities: {
		imageInput: boolean;
		toolCalling: boolean;
	};
}

export interface VendorConfig {
	vendorId: string;
	displayName: string;
	defaultBaseUrl: string;
	settingsKey: string;
	models: ModelInfo[];
	/** Whether this vendor's API supports controllable thinking mode */
	thinkingCapable: boolean;
}

export interface OpenAIMessage {
	role: "system" | "user" | "assistant" | "tool";
	content: string | OpenAIContentPart[];
	name?: string;
	tool_calls?: OpenAIToolCall[];
	tool_call_id?: string;
	reasoning_content?: string;
}

export type OpenAIContentPart =
	| { type: "text"; text: string }
	| { type: "image_url"; image_url: { url: string } };

export interface OpenAIToolCall {
	id: string;
	type: "function";
	function: {
		name: string;
		arguments: string;
	};
}

export interface OpenAITool {
	type: "function";
	function: {
		name: string;
		description: string;
		parameters: Record<string, unknown>;
	};
}

export interface StreamChunk {
	id: string;
	created: number;
	model: string;
	choices: Array<{
		index: number;
		delta: {
			role?: string;
			content?: string;
			reasoning_content?: string;
			tool_calls?: Array<{
				index: number;
				id?: string;
				type?: string;
				function?: {
					name?: string;
					arguments?: string;
				};
			}>;
		};
		finish_reason: string | null;
	}>;
}

export interface ChatResponse {
	id: string;
	created: number;
	model: string;
	choices: Array<{
		index: number;
		message: {
			role: string;
			content: string;
			tool_calls?: OpenAIToolCall[];
		};
		finish_reason: string;
	}>;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

export type ThinkingEffort = "low" | "medium" | "high" | "max";

// Picker schema values: superset of ThinkingEffort plus on/off semantics.
//   - "none" → user opted out of thinking for this turn
//   - "on"   → thinking enabled but the model has no fine-grained effort knob
//   - low/medium/high/max → thinking enabled with that effort level
export type RequestedEffort = "none" | "low" | "medium" | "high" | "max" | "on";

// 4-level menu for models with thinkingEffortSupport=true (Qwen).
export const THINKING_EFFORT_SCHEMA = {
	properties: {
		reasoningEffort: {
			type: "string",
			title: "Thinking Effort",
			enum: ["none", "low", "medium", "high"],
			enumItemLabels: ["None", "Low", "Medium", "High"],
			enumDescriptions: [
				"No reasoning",
				"Faster responses",
				"Balanced",
				"Deeper reasoning",
			],
			default: "medium",
			group: "navigation",
		},
	},
} as const;

// DeepSeek-specific menu — V4 API exposes only "high" and "max" plus none.
// Mirrors DeepSeekforCopilot's UX one-to-one.
export const DEEPSEEK_THINKING_EFFORT_SCHEMA = {
	properties: {
		reasoningEffort: {
			type: "string",
			title: "Thinking Effort",
			enum: ["none", "high", "max"],
			enumItemLabels: ["None", "High", "Max"],
			enumDescriptions: ["No reasoning", "Balanced", "Max reasoning"],
			default: "high",
			group: "navigation",
		},
	},
} as const;

// 2-level menu for models that support thinking but no effort knob
// (GLM, Kimi, MiniMax, Volcengine reasoning models).
export const THINKING_TOGGLE_SCHEMA = {
	properties: {
		reasoningEffort: {
			type: "string",
			title: "Thinking",
			enum: ["none", "on"],
			enumItemLabels: ["None", "On"],
			enumDescriptions: ["No reasoning", "Reasoning enabled"],
			default: "on",
			group: "navigation",
		},
	},
} as const;

// VS Code stable types do not yet include `configurationSchema` — extend via
// intersection (same approach as DeepSeekforCopilot). No proposed-API opt-in needed.
export type ModelPickerChatInformation = vscode.LanguageModelChatInformation & {
	readonly configurationSchema?:
		| typeof THINKING_EFFORT_SCHEMA
		| typeof DEEPSEEK_THINKING_EFFORT_SCHEMA
		| typeof THINKING_TOGGLE_SCHEMA;
};

export type ModelConfigurationOptions =
	vscode.ProvideLanguageModelChatResponseOptions & {
		readonly modelConfiguration?: Record<string, unknown>;
	};

export const DEFAULT_CONTEXT_LENGTH = 131072;

export type ContextLength =
	| "default"
	| "4k"
	| "8k"
	| "16k"
	| "32k"
	| "64k"
	| "128k"
	| "256k"
	| "512k"
	| "1m"
	| "custom";

export const CONTEXT_LENGTH_LIMITS: Record<Exclude<ContextLength, "default" | "custom">, number> = {
	"4k": 4096,
	"8k": 8192,
	"16k": 16384,
	"32k": 32768,
	"64k": 65536,
	"128k": 131072,
	"256k": 262144,
	"512k": 524288,
	"1m": 1048576,
};

export interface ChatOptions {
	maxTokens?: number;
	tools?: OpenAITool[];
	thinking?: boolean;
	thinkingEffort?: ThinkingEffort;
	vendorId?: string;
	extraHeaders?: Record<string, string>;
}

export function toLanguageModelChatInformation(
	model: ModelInfo,
	vendorId?: string,
): ModelPickerChatInformation {
	const base: ModelPickerChatInformation = {
		id: model.id,
		name: model.name,
		family: model.family,
		version: model.version,
		tooltip: model.tooltip,
		detail: model.tooltip,
		maxInputTokens: model.maxInputTokens,
		maxOutputTokens: model.maxOutputTokens,
		capabilities: model.capabilities,
	};
	if (!model.thinking) return base;
	let schema:
		| typeof THINKING_EFFORT_SCHEMA
		| typeof DEEPSEEK_THINKING_EFFORT_SCHEMA
		| typeof THINKING_TOGGLE_SCHEMA;
	if (!model.thinkingEffortSupport) {
		schema = THINKING_TOGGLE_SCHEMA;
	} else if (vendorId === "deepseek") {
		schema = DEEPSEEK_THINKING_EFFORT_SCHEMA;
	} else {
		schema = THINKING_EFFORT_SCHEMA;
	}
	return { ...base, configurationSchema: schema };
}

/**
 * Apply the user-configured context length limit to a model's maxInputTokens.
 * Returns the smaller of the model's native limit and the user's chosen limit.
 */
export function applyContextLength(
	modelMaxInputTokens: number,
	contextLength: ContextLength,
	customContextLength: number,
): number {
	if (contextLength === "default") {
		return modelMaxInputTokens;
	}
	if (contextLength === "custom") {
		return Math.min(modelMaxInputTokens, customContextLength);
	}
	const limit = CONTEXT_LENGTH_LIMITS[contextLength];
	return limit !== undefined ? Math.min(modelMaxInputTokens, limit) : modelMaxInputTokens;
}
