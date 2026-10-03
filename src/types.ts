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
	 * The picker's effort menu this model exposes, declared next to the
	 * model instead of a vendorId/modelId branch chain in
	 * toLanguageModelChatInformation. Only meaningful when thinking &&
	 * !thinkingLocked && thinkingEffortSupport; omitted → see
	 * resolveEffortMenu. The menu is also the effort domain the provider
	 * clamps every request into.
	 */
	effortMenu?: EffortMenu;
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

// None / High two-level menu for models whose native effort domain is
// none|high only (e.g. SenseNova glm-5.2 / deepseek-v4-flash where
// models.dev confirms low|medium|high all behave identically to high).
export const THINKING_EFFORT_NONE_HIGH_SCHEMA = {
	properties: {
		reasoningEffort: {
			type: "string",
			title: "Thinking Effort",
			enum: ["none", "high"],
			enumItemLabels: ["None", "High"],
			enumDescriptions: [
				"No reasoning",
				"Deeper reasoning",
			],
			default: "high",
			group: "navigation",
		},
	},
} as const;

// None / Low / High menu for models whose native effort domain is low|high
// (StepFun step-3.5-flash).
export const THINKING_EFFORT_NO_MEDIUM_SCHEMA = {
	properties: {
		reasoningEffort: {
			type: "string",
			title: "Thinking Effort",
			enum: ["none", "low", "high"],
			enumItemLabels: ["None", "Low", "High"],
			enumDescriptions: [
				"No reasoning",
				"Faster responses",
				"Deeper reasoning",
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

// Models whose thinking is always on server-side. Single source of truth
// for the provider's always-on enforcement: a legacy "none" from
// programmatic callers can never serialize a disabling thinking object for
// them. Picker menus come from ModelInfo.effortMenu in the catalog — every
// always-thinking ID that exposes a menu (k3 / kimi-k3 / the GLM-5.3 family
// / MiniMax-M3.1-Flash-Preview) is annotated there.
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

// Catalog of picker effort menus. Declared per model via ModelInfo.effortMenu
// so the menu and the model's serialization contract live in one place —
// adding a model with a non-default domain no longer requires touching the
// branch chain in toLanguageModelChatInformation.
export type EffortMenu =
	| "toggle" // None / On — no effort knob (THINKING_TOGGLE_SCHEMA)
	| "four-level" // None/Low/Medium/High (THINKING_EFFORT_SCHEMA)
	| "none-low-high-max" // DeepSeek domain (DEEPSEEK_THINKING_EFFORT_SCHEMA)
	| "none-high-max" // DashScope non-snapshot V4 Pro etc. (THINKING_EFFORT_NO_LOW_SCHEMA)
	| "none-low-high" // StepFun step-3.5-flash (THINKING_EFFORT_NO_MEDIUM_SCHEMA)
	| "none-high" // SenseNova glm-5.2/deepseek-v4-flash: none|high only (THINKING_EFFORT_NONE_HIGH_SCHEMA)
	| "low-high-max" // always-on K3/GLM-5.3 (ALWAYS_THINKING_EFFORT_SCHEMA)
	| "high-max" // always-on GLM-5.2 family (ALWAYS_EFFORT_HIGH_MAX_SCHEMA)
	| "low-medium-high-xhigh-max"; // MiniMax M3.1 (MINIMAX_M31_EFFORT_SCHEMA)

export const EFFORT_MENU_SCHEMAS: Record<
	EffortMenu,
	ModelPickerChatInformation["configurationSchema"] extends infer S ? (S extends object ? S : never) : never
> = {
	toggle: THINKING_TOGGLE_SCHEMA,
	"four-level": THINKING_EFFORT_SCHEMA,
	"none-low-high-max": DEEPSEEK_THINKING_EFFORT_SCHEMA,
	"none-high-max": THINKING_EFFORT_NO_LOW_SCHEMA,
	"none-low-high": THINKING_EFFORT_NO_MEDIUM_SCHEMA,
	"none-high": THINKING_EFFORT_NONE_HIGH_SCHEMA,
	"low-high-max": ALWAYS_THINKING_EFFORT_SCHEMA,
	"high-max": ALWAYS_EFFORT_HIGH_MAX_SCHEMA,
	"low-medium-high-xhigh-max": MINIMAX_M31_EFFORT_SCHEMA,
};

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
		| typeof THINKING_EFFORT_NO_MEDIUM_SCHEMA
		| typeof THINKING_EFFORT_NONE_HIGH_SCHEMA
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

/**
 * Effort menu (and thus effort domain) of an effort-capable model: the
 * catalog's effortMenu, else Low/High/Max for always-thinking IDs (a menu
 * with None would offer an opt-out the server ignores), else the generic
 * four-level menu.
 */
export function resolveEffortMenu(model: ModelInfo): EffortMenu {
	return model.effortMenu ?? (ALWAYS_THINKING_MODEL_IDS.has(model.id) ? "low-high-max" : "four-level");
}

export function toLanguageModelChatInformation(model: ModelInfo): ModelPickerChatInformation {
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
	if (!model.thinkingEffortSupport) {
		return { ...base, configurationSchema: THINKING_TOGGLE_SCHEMA };
	}
	return { ...base, configurationSchema: EFFORT_MENU_SCHEMAS[resolveEffortMenu(model)] };
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
