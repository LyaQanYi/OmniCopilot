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
	/** Thinking permanently on: no picker menu, "None" is not available. */
	thinkingLocked?: boolean;
	/**
	 * With thinking on, the endpoint rejects multi-step tool loops whose
	 * assistant messages lack `reasoning_content` (interleaved thinking must
	 * be preserved alongside tool results); provider.ts backfills an empty
	 * string when the host dropped thinking parts. Declared on the Qwen
	 * Token Plan hosted models — and on `auto`, which may route to them
	 * (native Qwen targets ignore the empty field) — so the backfill list
	 * lives in the catalog instead of a hardcoded ID-prefix match.
	 */
	needsReasoningBackfillWhenThinking?: boolean;
	capabilities: {
		imageInput: boolean;
		toolCalling: boolean;
	};
}

export interface VendorConfig {
	vendorId: string;
	displayName: string;
	defaultBaseUrl: string;
	models: ModelInfo[];
	/** Whether this vendor's API supports controllable thinking mode */
	thinkingCapable: boolean;
	/**
	 * Thinking arrives interleaved inside `content` as literal <think>…</think>
	 * tags (MiniMax's native API). When false (default), thinking comes via
	 * `reasoning_content` deltas and `content` is emitted verbatim — answer
	 * text quoting the tags must never be mistaken for delimiters.
	 */
	inlineThinkTags?: boolean;
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

/** OpenAI-compatible usage payload (final streaming chunk / chat response). */
export interface OpenAIUsage {
	prompt_tokens: number;
	completion_tokens: number;
	total_tokens: number;
	prompt_tokens_details?: {
		cached_tokens?: number;
	};
}

export interface StreamChunk {
	id: string;
	created: number;
	model: string;
	/** Present on the final chunk when stream_options.include_usage was sent. */
	usage?: OpenAIUsage | null;
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

export type ThinkingEffort = "low" | "medium" | "high" | "xhigh" | "max";

// Picker schema values: superset of ThinkingEffort plus on/off semantics.
//   - "none" → user opted out of thinking for this turn
//   - "on"   → thinking enabled but the model has no fine-grained effort knob
//   - low/medium/high/xhigh/max → thinking enabled with that effort level
export type RequestedEffort = "none" | "low" | "medium" | "high" | "xhigh" | "max" | "on";

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

// Qwen-hosted DeepSeek V4 Pro (non-snapshot) menu — DashScope's DeepSeek
// doc lists "low" as supported only on deepseek-v4.1-flash,
// deepseek-v4-flash-0731 and deepseek-v4-pro-0813, so the honest domain on
// the non-snapshot v4-pro is None / High / Max.
export const THINKING_EFFORT_NO_LOW_SCHEMA = {
	properties: {
		reasoningEffort: {
			type: "string",
			title: "Thinking Effort",
			enum: ["none", "high", "max"],
			enumItemLabels: ["None", "High", "Max"],
			enumDescriptions: [
				"Disables thinking",
				"Enhanced reasoning (API default)",
				"Deepest reasoning",
			],
			default: "high",
			group: "navigation",
		},
	},
} as const;

// Three-level effort menu (no "None") for models whose thinking is always
// on and cannot be disabled server-side: Kimi K3 (k3 / k3-256k / kimi-k3)
// and GLM-5.3 / GLM-5.3-Flash. Effort maps to top-level reasoning_effort =
// "low" | "high" | "max" (Code endpoint default: high).
export const ALWAYS_THINKING_EFFORT_SCHEMA = {
	properties: {
		reasoningEffort: {
			type: "string",
			title: "Thinking Effort",
			enum: ["low", "high", "max"],
			enumItemLabels: ["Low", "High", "Max"],
			enumDescriptions: [
				"Faster responses",
				"Balanced",
				"Deepest reasoning",
			],
			default: "high",
			group: "navigation",
		},
	},
} as const;

// Two-level always-on effort menu (High/Max) for GLM-5.2-family models:
// thinking cannot be disabled and the native reasoning_effort domain is
// high|max (per models.dev / Zhipu's own docs).
export const ALWAYS_EFFORT_HIGH_MAX_SCHEMA = {
	properties: {
		reasoningEffort: {
			type: "string",
			title: "Thinking Effort",
			enum: ["high", "max"],
			enumItemLabels: ["High", "Max"],
			enumDescriptions: [
				"Balanced (API default)",
				"Deepest reasoning",
			],
			default: "high",
			group: "navigation",
		},
	},
} as const;

// Five-level effort menu for MiniMax M3.1 (always-on thinking, tunable depth
// low…max including the xhigh tier) per models.dev.
export const MINIMAX_M31_EFFORT_SCHEMA = {
	properties: {
		reasoningEffort: {
			type: "string",
			title: "Thinking Effort",
			enum: ["low", "medium", "high", "xhigh", "max"],
			enumItemLabels: ["Low", "Medium", "High", "XHigh", "Max"],
			enumDescriptions: [
				"Fastest responses",
				"Light reasoning",
				"Balanced",
				"Enhanced reasoning",
				"Deepest reasoning",
			],
			default: "high",
			group: "navigation",
		},
	},
} as const;

// Models whose thinking is always on server-side and whose picker exposes
// the three-level effort menu. Single source of truth: the picker branch and
// the provider's always-on enforcement both read this set, so a legacy
// "none" from programmatic callers can never serialize a disabling thinking
// object for them. MiniMax-M3.1-Flash-Preview is always-on too (its dedicated
// five-level menu is picked before this set in toLanguageModelChatInformation).
export const ALWAYS_THINKING_MODEL_IDS: ReadonlySet<string> = new Set([
	"k3",
	"k3-256k",
	"kimi-k3",
	"glm-5.3",
	"glm-5.3-flash",
	"glm-5.3-highspeed",
	"glm-5.3-flashx",
	"zai-org/GLM-5.3",
	"zai-org/GLM-5.3-Flash",
	"umans-coder",
	"umans-glm-5.3-flash",
	"glm-5-3-flash-260828",
	"MiniMax-M3.1-Flash-Preview",
]);

// GLM-5.2-family IDs that expose the High/Max always-on menu.
export const GLM_52_MODEL_IDS: ReadonlySet<string> = new Set([
	"glm-5.2",
	"glm-5.2-highspeed",
	"zai-org/GLM-5.2",
]);

// DeepSeek V4 menu — the one effort-capable family where "None" genuinely
// disables thinking (an explicit thinking:{type:"disabled"} is sent), so a
// four-level menu including None is honest here.
export const DEEPSEEK_THINKING_EFFORT_SCHEMA = {
	properties: {
		reasoningEffort: {
			type: "string",
			title: "Thinking Effort",
			enum: ["none", "low", "high", "max"],
			enumItemLabels: ["None", "Low", "High", "Max"],
			enumDescriptions: [
				"Disables thinking (sent explicitly to the API)",
				"Lighter reasoning",
				"Enhanced reasoning (API default)",
				"Deepest reasoning",
			],
			default: "high",
			group: "navigation",
		},
	},
} as const;

// 2-level menu for models that support thinking but no effort knob
// (pre-5.3 GLM, Kimi, MiniMax, Volcengine reasoning models).
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

// `configurationSchema` is declared on the `chatProvider` proposed API
// (`vscode.proposed.chatProvider.d.ts`) and is therefore absent from the
// stable `@types/vscode` definitions we compile against. We extend the
// stable type via intersection so the field type-checks; VS Code 1.108+
// already honours `configurationSchema` at runtime, which is why this
// works without declaring `enabledApiProposals` in package.json today.
// If a future VS Code release gates this behind the proposed-API opt-in,
// add `"enabledApiProposals": ["chatProvider"]` alongside `engines` and
// note the dependency in the README.
export type ModelPickerChatInformation = vscode.LanguageModelChatInformation & {
	readonly configurationSchema?:
		| typeof THINKING_EFFORT_SCHEMA
		| typeof DEEPSEEK_THINKING_EFFORT_SCHEMA
		| typeof THINKING_EFFORT_NO_LOW_SCHEMA
		| typeof ALWAYS_THINKING_EFFORT_SCHEMA
		| typeof ALWAYS_EFFORT_HIGH_MAX_SCHEMA
		| typeof MINIMAX_M31_EFFORT_SCHEMA
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
	if (model.thinkingLocked) return base;
	let schema:
		| typeof THINKING_EFFORT_SCHEMA
		| typeof DEEPSEEK_THINKING_EFFORT_SCHEMA
		| typeof THINKING_EFFORT_NO_LOW_SCHEMA
		| typeof ALWAYS_THINKING_EFFORT_SCHEMA
		| typeof ALWAYS_EFFORT_HIGH_MAX_SCHEMA
		| typeof MINIMAX_M31_EFFORT_SCHEMA
		| typeof THINKING_TOGGLE_SCHEMA;
	if (!model.thinkingEffortSupport) {
		schema = THINKING_TOGGLE_SCHEMA;
	} else if (model.id === "MiniMax-M3.1-Flash-Preview") {
		// Checked before the ALWAYS set: M3.1 is always-on but exposes the
		// five-level low…max domain instead of the three-level one.
		schema = MINIMAX_M31_EFFORT_SCHEMA;
	} else if (ALWAYS_THINKING_MODEL_IDS.has(model.id)) {
		schema = ALWAYS_THINKING_EFFORT_SCHEMA;
	} else if (
		(vendorId === "glm-coding-plan" ||
			vendorId === "zhipu" ||
			vendorId === "zai" ||
			vendorId === "siliconflow" ||
			vendorId === "siliconflow-cn") &&
		GLM_52_MODEL_IDS.has(model.id)
	) {
		// GLM-5.2 family: thinking always on, native domain high|max.
		schema = ALWAYS_EFFORT_HIGH_MAX_SCHEMA;
	} else if (
		(vendorId === "siliconflow" || vendorId === "siliconflow-cn") &&
		!model.id.startsWith("zai-org/")
	) {
		// SiliconFlow hosts the Kimi/DeepSeek/Qwen/… lineups behind a
		// budget_tokens knob (128–32768) — the None/Low/High/Max menu maps
		// to enable_thinking + thinking_budget in api.ts.
		schema = DEEPSEEK_THINKING_EFFORT_SCHEMA;
	} else if (
		(vendorId === "moonshot" || vendorId === "kimi-code-plan-intl") &&
		model.id === "kimi-for-coding"
	) {
		// models.dev: kimi-for-coding gained a native low|high|max effort knob
		// alongside the thinking object on both Code Plan endpoints.
		schema = DEEPSEEK_THINKING_EFFORT_SCHEMA;
	} else if (
		vendorId === "scnet-token-plan" &&
		(model.id === "DeepSeek-V4.1-Flash" ||
			model.id === "DeepSeek-V4-Pro" ||
			model.id === "DeepSeek-V4-Flash")
	) {
		// SCNet's DeepSeek hosting: toggle + native high|max only.
		schema = THINKING_EFFORT_NO_LOW_SCHEMA;
	} else if (vendorId === "sensenova" && model.id === "deepseek-v4-pro") {
		// SenseNova's DeepSeek V4 Pro: toggle + high|max.
		schema = THINKING_EFFORT_NO_LOW_SCHEMA;
	} else if (vendorId === "qwen" && model.id === "deepseek-v4-pro") {
		// The non-snapshot DeepSeek V4 Pro rejects "low" on DashScope —
		// see THINKING_EFFORT_NO_LOW_SCHEMA.
		schema = THINKING_EFFORT_NO_LOW_SCHEMA;
	} else if (
		vendorId === "qwen" &&
		(model.id === "deepseek-v4-pro-0813" ||
			model.id === "deepseek-v4-flash-0731" ||
			model.id === "deepseek-v4.1-flash" ||
			model.id === "glm-5.2")
	) {
		// DashScope-hosted DeepSeek/GLM accept the full native effort domain
		// (low/high/max) that the generic Qwen menu (None-Low-Medium-High)
		// cannot express — per the DashScope DeepSeek/GLM docs, "low" is
		// supported on v4.1-flash and the two snapshot IDs, and GLM hosts
		// low|high|max natively. Token Plan's glm-5.3 never reaches this
		// branch: the global ALWAYS_THINKING_MODEL_IDS check above matches it
		// first, which is also the correct menu here — DashScope hosts
		// GLM-5.3 in thinking-only mode (enable_thinking=false is ignored),
		// matching Zhipu's own endpoints.
		schema = DEEPSEEK_THINKING_EFFORT_SCHEMA;
	} else if (
		(vendorId === "volcengine" || vendorId === "volcengine-agent-plan") &&
		(model.id === "deepseek-v4-flash" ||
			model.id === "deepseek-v4-pro" ||
			model.id === "deepseek-v4.1-flash")
	) {
		// Volcengine-hosted DeepSeek per the deep-thinking doc: v4.1-flash
		// takes low/high/max natively; v4-flash/v4-pro map medium→low and
		// max→high (see applyThinkingParams in api.ts), so the honest menu
		// is the DeepSeek None/Low/High/Max domain without Medium.
		schema = DEEPSEEK_THINKING_EFFORT_SCHEMA;
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
