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

// ─── Bigmodel Plan ─────────────────────────────────────────────────────────────

const ZHIPU_BASE_URL = "https://open.bigmodel.cn/api/coding/paas/v4";

const ZHIPU_MODELS: ModelInfo[] = [
	{
		id: "glm-5.1",
		name: "GLM-5.1",
		family: "glm",
		version: "5.1",
		tooltip: "GLM-5.1 — latest flagship model",
		maxInputTokens: 204800,
		maxOutputTokens: 131072,
		baseUrl: ZHIPU_BASE_URL,
		thinking: true,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
	},
	{
		id: "glm-5-turbo",
		name: "GLM-5 Turbo",
		family: "glm",
		version: "5-turbo",
		tooltip: "GLM-5 Turbo — fast flagship model",
		maxInputTokens: 204800,
		maxOutputTokens: 131072,
		baseUrl: ZHIPU_BASE_URL,
		thinking: true,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
	},
	{
		id: "glm-4.7",
		name: "GLM-4.7",
		family: "glm",
		version: "4.7",
		tooltip: "GLM-4.7 — high-intelligence model",
		maxInputTokens: 204800,
		maxOutputTokens: 131072,
		baseUrl: ZHIPU_BASE_URL,
		thinking: true,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
	},
	{
		id: "glm-4.5-air",
		name: "GLM-4.5 Air",
		family: "glm",
		version: "4.5-air",
		tooltip: "GLM-4.5 Air — lightweight model",
		maxInputTokens: 204800,
		maxOutputTokens: 131072,
		baseUrl: ZHIPU_BASE_URL,
		thinking: true,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
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

// ─── Volcengine ──────────────────────────────────────────────────────────────

const VOLCENGINE_BASE_URL = "https://ark.cn-beijing.volces.com/api/coding/v3";

const VOLCENGINE_MODELS: ModelInfo[] = [
	{
		id: "doubao-seed-2.0-code",
		name: "Doubao Seed 2.0 Code",
		family: "volcengine",
		version: "seed-2.0-code",
		tooltip: "Doubao Seed 2.0 Code — optimized for coding tasks",
		maxInputTokens: 131072,
		maxOutputTokens: 65536,
		baseUrl: VOLCENGINE_BASE_URL,
		thinking: false,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
	},
	{
		id: "doubao-seed-2.0-pro",
		name: "Doubao Seed 2.0 Pro",
		family: "volcengine",
		version: "seed-2.0-pro",
		tooltip: "Doubao Seed 2.0 Pro — flagship model",
		maxInputTokens: 131072,
		maxOutputTokens: 65536,
		baseUrl: VOLCENGINE_BASE_URL,
		thinking: false,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
	},
	{
		id: "doubao-seed-2.0-lite",
		name: "Doubao Seed 2.0 Lite",
		family: "volcengine",
		version: "seed-2.0-lite",
		tooltip: "Doubao Seed 2.0 Lite — lightweight model",
		maxInputTokens: 131072,
		maxOutputTokens: 65536,
		baseUrl: VOLCENGINE_BASE_URL,
		thinking: false,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
	},
	{
		id: "doubao-seed-code",
		name: "Doubao Seed Code",
		family: "volcengine",
		version: "seed-code",
		tooltip: "Doubao Seed Code — coding model",
		maxInputTokens: 131072,
		maxOutputTokens: 65536,
		baseUrl: VOLCENGINE_BASE_URL,
		thinking: false,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
	},
	{
		id: "minimax-m2.5",
		name: "MiniMax M2.5",
		family: "volcengine",
		version: "minimax-m2.5",
		tooltip: "MiniMax M2.5 — via Volcengine ARK",
		maxInputTokens: 196608,
		maxOutputTokens: 128000,
		baseUrl: VOLCENGINE_BASE_URL,
		thinking: true,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
	},
	{
		id: "glm-4.7",
		name: "GLM-4.7",
		family: "volcengine",
		version: "glm-4.7",
		tooltip: "GLM-4.7 — via Volcengine ARK",
		maxInputTokens: 131072,
		maxOutputTokens: 65536,
		baseUrl: VOLCENGINE_BASE_URL,
		thinking: true,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
	},
	{
		id: "deepseek-v3.2",
		name: "DeepSeek V3.2",
		family: "volcengine",
		version: "deepseek-v3.2",
		tooltip: "DeepSeek V3.2 — via Volcengine ARK",
		maxInputTokens: 131072,
		maxOutputTokens: 65536,
		baseUrl: VOLCENGINE_BASE_URL,
		thinking: false,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
	},
	{
		id: "kimi-k2.5",
		name: "Kimi K2.5",
		family: "volcengine",
		version: "kimi-k2.5",
		tooltip: "Kimi K2.5 — via Volcengine ARK",
		maxInputTokens: 131072,
		maxOutputTokens: 65536,
		baseUrl: VOLCENGINE_BASE_URL,
		thinking: true,
		thinkingEffortSupport: false,
		capabilities: { imageInput: false, toolCalling: true },
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
		displayName: "Bigmodel Plan",
		defaultBaseUrl: ZHIPU_BASE_URL,
		settingsKey: "omniCopilot.zhipu.customModelIds",
		models: ZHIPU_MODELS,
		thinkingCapable: true,
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
		thinkingCapable: true,
	},
	{
		vendorId: "volcengine",
		displayName: "Volcengine Plan",
		defaultBaseUrl: VOLCENGINE_BASE_URL,
		settingsKey: "omniCopilot.volcengine.customModelIds",
		models: VOLCENGINE_MODELS,
		thinkingCapable: true,
	},
];

export function getVendorConfig(vendorId: string): VendorConfig | undefined {
	return VENDOR_CONFIGS.find((v) => v.vendorId === vendorId);
}
