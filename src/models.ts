import type { ModelInfo, VendorConfig } from "./types.js";

// ─── DeepSeek ────────────────────────────────────────────────────────────────

const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";

const DEEPSEEK_MODELS: ModelInfo[] = [
	{
		id: "deepseek-chat",
		name: "DeepSeek Chat",
		family: "deepseek",
		version: "chat",
		tooltip: "DeepSeek V3.2 — non-thinking mode, 128K context",
		maxInputTokens: 131072,
		maxOutputTokens: 8192,
		baseUrl: DEEPSEEK_BASE_URL,
		thinking: false,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
	},
	{
		id: "deepseek-reasoner",
		name: "DeepSeek Reasoner",
		family: "deepseek",
		version: "reasoner",
		tooltip: "DeepSeek V3.2 — thinking mode with chain-of-thought",
		maxInputTokens: 131072,
		maxOutputTokens: 65536,
		baseUrl: DEEPSEEK_BASE_URL,
		thinking: true,
		thinkingEffortSupport: true,
		capabilities: { imageInput: false, toolCalling: true },
	},
];

// ─── Zhipu / GLM ─────────────────────────────────────────────────────────────

const ZHIPU_BASE_URL = "https://open.bigmodel.cn/api/paas/v4";

const ZHIPU_MODELS: ModelInfo[] = [
	{
		id: "glm-5",
		name: "GLM-5",
		family: "glm",
		version: "5",
		tooltip: "GLM-5 — latest flagship, 200K context, Agentic planning",
		maxInputTokens: 204800,
		maxOutputTokens: 131072,
		baseUrl: ZHIPU_BASE_URL,
		thinking: false,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
	},
	{
		id: "glm-4.7",
		name: "GLM-4.7",
		family: "glm",
		version: "4.7",
		tooltip: "GLM-4.7 — high-intelligence, 200K context",
		maxInputTokens: 204800,
		maxOutputTokens: 131072,
		baseUrl: ZHIPU_BASE_URL,
		thinking: false,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
	},
	{
		id: "glm-4.7-flash",
		name: "GLM-4.7 Flash",
		family: "glm",
		version: "4.7-flash",
		tooltip: "GLM-4.7 Flash — free model, 200K context",
		maxInputTokens: 204800,
		maxOutputTokens: 131072,
		baseUrl: ZHIPU_BASE_URL,
		thinking: false,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
	},
	{
		id: "glm-4-long",
		name: "GLM-4 Long",
		family: "glm",
		version: "4-long",
		tooltip: "GLM-4 Long — 1M context window",
		maxInputTokens: 1048576,
		maxOutputTokens: 4096,
		baseUrl: ZHIPU_BASE_URL,
		thinking: false,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
	},
	{
		id: "glm-4.6v",
		name: "GLM-4.6V",
		family: "glm",
		version: "4.6v",
		tooltip: "GLM-4.6V — vision + reasoning, 128K context",
		maxInputTokens: 131072,
		maxOutputTokens: 32768,
		baseUrl: ZHIPU_BASE_URL,
		thinking: false,
		thinkingEffortSupport: false,
		capabilities: { imageInput: true, toolCalling: true },
	},
];

// ─── Moonshot / Kimi ─────────────────────────────────────────────────────────

const KIMI_CODING_BASE_URL = "https://api.kimi.com/coding/v1";

const MOONSHOT_MODELS: ModelInfo[] = [
	{
		id: "kimi-for-coding",
		name: "Kimi for Coding",
		family: "kimi",
		version: "for-coding",
		tooltip: "Kimi for Coding — optimized for coding tasks, vision support",
		maxInputTokens: 262144,
		maxOutputTokens: 32768,
		baseUrl: KIMI_CODING_BASE_URL,
		thinking: true,
		thinkingEffortSupport: false,
		capabilities: { imageInput: true, toolCalling: true },
	},
];

// ─── Qwen ────────────────────────────────────────────────────────────────────

const QWEN_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";

const QWEN_MODELS: ModelInfo[] = [
	{
		id: "qwen3.6-plus",
		name: "Qwen3.6 Plus",
		family: "qwen",
		version: "3.6-plus",
		tooltip: "Qwen3.6 Plus — balanced performance/cost, 1M context, vision support",
		maxInputTokens: 1000000,
		maxOutputTokens: 65536,
		baseUrl: QWEN_BASE_URL,
		thinking: true,
		thinkingEffortSupport: true,
		capabilities: { imageInput: true, toolCalling: true },
	},
	{
		id: "qwen3-max",
		name: "Qwen3 Max",
		family: "qwen",
		version: "3-max",
		tooltip: "Qwen3 Max — strongest model, 256K context",
		maxInputTokens: 262144,
		maxOutputTokens: 65536,
		baseUrl: QWEN_BASE_URL,
		thinking: true,
		thinkingEffortSupport: true,
		capabilities: { imageInput: false, toolCalling: true },
	},
	{
		id: "qwen3.5-flash",
		name: "Qwen3.5 Flash",
		family: "qwen",
		version: "3.5-flash",
		tooltip: "Qwen3.5 Flash — fastest & cheapest, 1M context",
		maxInputTokens: 1000000,
		maxOutputTokens: 65536,
		baseUrl: QWEN_BASE_URL,
		thinking: true,
		thinkingEffortSupport: true,
		capabilities: { imageInput: false, toolCalling: true },
	},
	{
		id: "qwen3-coder-plus",
		name: "Qwen3 Coder Plus",
		family: "qwen",
		version: "3-coder-plus",
		tooltip: "Qwen3 Coder Plus — coding agent, 1M context",
		maxInputTokens: 1000000,
		maxOutputTokens: 65536,
		baseUrl: QWEN_BASE_URL,
		thinking: false,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
	},
];

// ─── MiniMax ─────────────────────────────────────────────────────────────────

const MINIMAX_BASE_URL = "https://api.minimaxi.com/v1";

const MINIMAX_MODELS: ModelInfo[] = [
	{
		id: "MiniMax-M2.7",
		name: "MiniMax M2.7",
		family: "minimax",
		version: "m2.7",
		tooltip: "MiniMax M2.7 — interleaved thinking flagship model",
		maxInputTokens: 204800,
		maxOutputTokens: 131072,
		baseUrl: MINIMAX_BASE_URL,
		thinking: true,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
	},
	{
		id: "MiniMax-M2.7-highspeed",
		name: "MiniMax M2.7 HighSpeed",
		family: "minimax",
		version: "m2.7-highspeed",
		tooltip: "MiniMax M2.7 HighSpeed — fast interleaved thinking",
		maxInputTokens: 204800,
		maxOutputTokens: 131072,
		baseUrl: MINIMAX_BASE_URL,
		thinking: true,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
	},
	{
		id: "MiniMax-M2.5",
		name: "MiniMax M2.5",
		family: "minimax",
		version: "m2.5",
		tooltip: "MiniMax M2.5 — interleaved thinking balanced model",
		maxInputTokens: 196608,
		maxOutputTokens: 128000,
		baseUrl: MINIMAX_BASE_URL,
		thinking: true,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
	},
];

// ─── Doubao ──────────────────────────────────────────────────────────────────

const DOUBAO_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";

const DOUBAO_MODELS: ModelInfo[] = [
	{
		id: "doubao-seed-2-0-lite-260215",
		name: "Doubao Seed 2.0 Lite",
		family: "doubao",
		version: "seed-2.0-lite",
		tooltip: "Doubao Seed 2.0 Lite — lightweight model",
		maxInputTokens: 32768,
		maxOutputTokens: 4096,
		baseUrl: DOUBAO_BASE_URL,
		thinking: false,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
	},
	{
		id: "doubao-1-5-pro-32k-250115",
		name: "Doubao 1.5 Pro 32K",
		family: "doubao",
		version: "1.5-pro-32k",
		tooltip: "Doubao 1.5 Pro — 32K context",
		maxInputTokens: 32768,
		maxOutputTokens: 4096,
		baseUrl: DOUBAO_BASE_URL,
		thinking: false,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
	},
	{
		id: "doubao-1-5-pro-256k-250115",
		name: "Doubao 1.5 Pro 256K",
		family: "doubao",
		version: "1.5-pro-256k",
		tooltip: "Doubao 1.5 Pro — 256K long context",
		maxInputTokens: 262144,
		maxOutputTokens: 4096,
		baseUrl: DOUBAO_BASE_URL,
		thinking: false,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
	},
	{
		id: "doubao-1-5-thinking-pro-250415",
		name: "Doubao 1.5 Thinking Pro",
		family: "doubao",
		version: "1.5-thinking-pro",
		tooltip: "Doubao 1.5 Thinking — reasoning model",
		maxInputTokens: 131072,
		maxOutputTokens: 16384,
		baseUrl: DOUBAO_BASE_URL,
		thinking: true,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: false },
	},
	{
		id: "doubao-1-5-vision-pro-32k-250115",
		name: "Doubao 1.5 Vision Pro",
		family: "doubao",
		version: "1.5-vision-pro",
		tooltip: "Doubao 1.5 Vision — vision model",
		maxInputTokens: 32768,
		maxOutputTokens: 4096,
		baseUrl: DOUBAO_BASE_URL,
		thinking: false,
		thinkingEffortSupport: false,
		capabilities: { imageInput: true, toolCalling: false },
	},
];

// ─── All Vendors ─────────────────────────────────────────────────────────────

export const VENDOR_CONFIGS: VendorConfig[] = [
	{
		vendorId: "deepseek",
		displayName: "DeepSeek",
		defaultBaseUrl: DEEPSEEK_BASE_URL,
		settingsKey: "omniCopilot.deepseek.customModelIds",
		models: DEEPSEEK_MODELS,
		thinkingCapable: true,
	},
	{
		vendorId: "zhipu",
		displayName: "Zhipu (GLM)",
		defaultBaseUrl: ZHIPU_BASE_URL,
		settingsKey: "omniCopilot.zhipu.customModelIds",
		models: ZHIPU_MODELS,
		thinkingCapable: false,
	},
	{
		vendorId: "moonshot",
		displayName: "Moonshot (Kimi)",
		defaultBaseUrl: KIMI_CODING_BASE_URL,
		settingsKey: "omniCopilot.moonshot.customModelIds",
		models: MOONSHOT_MODELS,
		thinkingCapable: true,
	},
	{
		vendorId: "qwen",
		displayName: "Qwen",
		defaultBaseUrl: QWEN_BASE_URL,
		settingsKey: "omniCopilot.qwen.customModelIds",
		models: QWEN_MODELS,
		thinkingCapable: true,
	},
	{
		vendorId: "minimax",
		displayName: "MiniMax",
		defaultBaseUrl: MINIMAX_BASE_URL,
		settingsKey: "omniCopilot.minimax.customModelIds",
		models: MINIMAX_MODELS,
		thinkingCapable: false,
	},
	{
		vendorId: "doubao",
		displayName: "Doubao",
		defaultBaseUrl: DOUBAO_BASE_URL,
		settingsKey: "omniCopilot.doubao.customModelIds",
		models: DOUBAO_MODELS,
		thinkingCapable: true,
	},
];

export function getVendorConfig(vendorId: string): VendorConfig | undefined {
	return VENDOR_CONFIGS.find((v) => v.vendorId === vendorId);
}
