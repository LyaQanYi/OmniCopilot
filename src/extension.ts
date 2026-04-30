import * as vscode from "vscode";
import { OpenAICompatibleClient, ApiError, getKimiExtraHeaders } from "./api.js";
import { MultiModelChatProvider, CustomOpenAIProvider } from "./provider.js";
import { VENDOR_CONFIGS, getVendorConfig } from "./models.js";
import { CONTEXT_LENGTH_LIMITS, DEFAULT_CONTEXT_LENGTH, type ContextLength } from "./types.js";

// ─── Test Connection Command ─────────────────────────────────────────────────

function formatConnectionError(err: unknown, vendorName: string): string {
	const detail =
		err instanceof ApiError && err.response
			? ` ${JSON.stringify(err.response)}`
			: "";
	return `${vendorName} test failed: ${err instanceof Error ? err.message : String(err)}${detail}`;
}

async function runConnectionTest(): Promise<void> {
	const items = VENDOR_CONFIGS.map((v) => ({
		label: v.displayName,
		vendorId: v.vendorId,
		baseUrl: v.defaultBaseUrl,
	}));

	const picked = await vscode.window.showQuickPick(items, {
		placeHolder: "Select a provider to test",
	});
	if (!picked) return;

	const key = await vscode.window.showInputBox({
		prompt: `Enter your ${picked.label} API key`,
		password: true,
		placeHolder: "sk-...",
	});
	if (!key) return;

	const vendor = getVendorConfig(picked.vendorId);
	const firstModel = vendor?.models[0];
	if (!firstModel) {
		vscode.window.showErrorMessage("No models available for this vendor.");
		return;
	}

	const client = new OpenAICompatibleClient(key.trim());
	const extraHeaders =
		picked.vendorId === "moonshot" ? getKimiExtraHeaders() : undefined;
	try {
		await client.chat(
			firstModel.id,
			[{ role: "user", content: "Ping" }],
			firstModel.baseUrl,
			{ maxTokens: 1, extraHeaders },
		);
		vscode.window.showInformationMessage(
			`${picked.label} connection test succeeded.`,
		);
	} catch (err) {
		vscode.window.showErrorMessage(
			formatConnectionError(err, picked.label),
		);
	}
}

// ─── Set Thinking Effort Command ─────────────────────────────────────────────

const THINKING_EFFORT_OPTIONS = [
	{ label: "$(zap) Low", description: "快速响应", value: "low" },
	{ label: "$(symbol-event) Medium", description: "平衡模式", value: "medium" },
	{ label: "$(flame) High", description: "深度推理", value: "high" },
] as const;

const EFFORT_ICONS: Record<string, string> = {
	low: "$(zap)",
	medium: "$(symbol-event)",
	high: "$(flame)",
};

let thinkingEffortStatusBar: vscode.StatusBarItem;
let enableThinkingStatusBar: vscode.StatusBarItem;
let contextLengthStatusBar: vscode.StatusBarItem;

const CONTEXT_LENGTH_OPTIONS: {
	label: string;
	description: string;
	value: ContextLength;
}[] = [
	{ label: "$(history) Default", description: "使用模型默认上下文长度", value: "default" },
	{ label: "$(debug-breakpoint-log) 4K", description: "4,096 tokens", value: "4k" },
	{ label: "$(debug-breakpoint-log) 8K", description: "8,192 tokens", value: "8k" },
	{ label: "$(debug-breakpoint-log) 16K", description: "16,384 tokens", value: "16k" },
	{ label: "$(debug-breakpoint-log) 32K", description: "32,768 tokens", value: "32k" },
	{ label: "$(debug-breakpoint-log) 64K", description: "65,536 tokens", value: "64k" },
	{ label: "$(debug-breakpoint-log) 128K", description: "131,072 tokens", value: "128k" },
	{ label: "$(debug-breakpoint-log) 256K", description: "262,144 tokens", value: "256k" },
	{ label: "$(debug-breakpoint-log) 512K", description: "524,288 tokens", value: "512k" },
	{ label: "$(debug-breakpoint-log) 1M", description: "1,048,576 tokens", value: "1m" },
	{ label: "$(edit) Custom", description: "使用自定义上下文长度", value: "custom" },
];

const CONTEXT_LENGTH_ICONS: Record<string, string> = {
	default: "$(history)",
	"4k": "$(debug-breakpoint-log)",
	"8k": "$(debug-breakpoint-log)",
	"16k": "$(debug-breakpoint-log)",
	"32k": "$(debug-breakpoint-log)",
	"64k": "$(debug-breakpoint-log)",
	"128k": "$(debug-breakpoint-log)",
	"256k": "$(debug-breakpoint-log)",
	"512k": "$(debug-breakpoint-log)",
	"1m": "$(debug-breakpoint-log)",
	custom: "$(edit)",
};

const ENABLE_THINKING_OPTIONS = [
	{ label: "$(light-bulb) Auto", description: "根据模型默认设置", value: "auto" },
	{ label: "$(check) Always", description: "强制开启思考模式", value: "always" },
	{ label: "$(close) Never", description: "禁用思考模式", value: "never" },
] as const;

const ENABLE_THINKING_ICONS: Record<string, string> = {
	auto: "$(light-bulb)",
	always: "$(check)",
	never: "$(close)",
};

const ENABLE_THINKING_LABELS: Record<string, string> = {
	auto: "Auto",
	always: "On",
	never: "Off",
};

function updateStatusBar(): void {
	const config = vscode.workspace.getConfiguration("omniCopilot");
	const effort = config.get<string>("thinkingEffort", "medium");
	const enableThinking = config.get<string>("enableThinking", "auto");
	const contextLength = config.get<string>("contextLength", "default");

	// Effort status bar
	const effortIcon = EFFORT_ICONS[effort] || "$(symbol-event)";
	thinkingEffortStatusBar.text = `${effortIcon} ${effort}`;
	thinkingEffortStatusBar.tooltip = `Thinking Effort: ${effort}\nClick to change`;

	// Enable thinking status bar
	const thinkingIcon = ENABLE_THINKING_ICONS[enableThinking] || "$(light-bulb)";
	const thinkingLabel = ENABLE_THINKING_LABELS[enableThinking] || enableThinking;
	enableThinkingStatusBar.text = `${thinkingIcon} Thinking: ${thinkingLabel}`;
	enableThinkingStatusBar.tooltip = `Thinking Mode: ${enableThinking}\nClick to change`;

	// Context length status bar
	const ctxIcon = CONTEXT_LENGTH_ICONS[contextLength] || "$(history)";
	let ctxDisplay = contextLength;
	if (contextLength === "custom") {
		const custom = config.get<number>("customContextLength", DEFAULT_CONTEXT_LENGTH);
		ctxDisplay = `${custom.toLocaleString()} tokens`;
	} else if (contextLength !== "default") {
		const limit = CONTEXT_LENGTH_LIMITS[contextLength as Exclude<ContextLength, "default" | "custom">];
		ctxDisplay = limit ? `${limit.toLocaleString()} tokens` : contextLength;
	}
	contextLengthStatusBar.text = `${ctxIcon} Input: ${ctxDisplay}`;
	contextLengthStatusBar.tooltip = `Max Input Context Length: ${ctxDisplay}\nClick to change`;
}

async function setThinkingEffort(): Promise<void> {
	const config = vscode.workspace.getConfiguration("omniCopilot");
	const current = config.get<string>("thinkingEffort", "medium");

	const items = THINKING_EFFORT_OPTIONS.map((opt) => ({
		...opt,
		picked: opt.value === current,
	}));

	const picked = await vscode.window.showQuickPick(items, {
		placeHolder: `Current: ${current} — Select thinking effort level`,
	});
	if (!picked) return;

	await config.update("thinkingEffort", picked.value, vscode.ConfigurationTarget.Global);
	updateStatusBar();
}

async function toggleThinking(): Promise<void> {
	const config = vscode.workspace.getConfiguration("omniCopilot");
	const current = config.get<string>("enableThinking", "auto");

	const items = ENABLE_THINKING_OPTIONS.map((opt) => ({
		...opt,
		picked: opt.value === current,
	}));

	const picked = await vscode.window.showQuickPick(items, {
		placeHolder: `Current: ${current} — Select thinking mode`,
	});
	if (!picked) return;

	await config.update("enableThinking", picked.value, vscode.ConfigurationTarget.Global);
	updateStatusBar();
}

// ─── Set Context Length Command ──────────────────────────────────────────────

async function setContextLength(): Promise<void> {
	const config = vscode.workspace.getConfiguration("omniCopilot");
	const current = config.get<string>("contextLength", "default");

	const items = CONTEXT_LENGTH_OPTIONS.map((opt) => ({
		...opt,
		picked: opt.value === current,
	}));

	const picked = await vscode.window.showQuickPick(items, {
		placeHolder: `Current: ${current} — Select context length limit`,
	});
	if (!picked) return;

	if (picked.value === "custom") {
		const currentCustom = config.get<number>("customContextLength", DEFAULT_CONTEXT_LENGTH);
		const input = await vscode.window.showInputBox({
			prompt: "Enter custom context length (tokens)",
			placeHolder: "e.g. 131072",
			value: String(currentCustom),
			validateInput: (value) => {
				const num = Number(value);
				if (!Number.isInteger(num) || num < 1024 || num > 2097152) {
					return "Must be an integer between 1024 and 2,097,152";
				}
				return null;
			},
		});
		if (!input) return;
		await config.update("customContextLength", Number(input), vscode.ConfigurationTarget.Global);
	}

	await config.update("contextLength", picked.value, vscode.ConfigurationTarget.Global);
	updateStatusBar();
}

// ─── Add Custom Model ID Command ─────────────────────────────────────────────

async function addCustomModelId(): Promise<void> {
	// Step 1: Pick vendor
	const vendorItems = VENDOR_CONFIGS.map((v) => ({
		label: v.displayName,
		description: `${v.models.length} preset models`,
		vendorId: v.vendorId,
		settingsKey: v.settingsKey,
		models: v.models,
	}));

	const vendorPick = await vscode.window.showQuickPick(vendorItems, {
		placeHolder: "Select a provider to add a custom model ID",
	});
	if (!vendorPick) return;

	// Step 2: Show preset models + custom input option
	const modelItems: vscode.QuickPickItem[] = vendorPick.models.map((m) => ({
		label: m.id,
		description: m.name,
		detail: m.tooltip,
	}));

	modelItems.push({
		label: "$(edit) Custom Input...",
		description: "Enter a custom model ID",
		alwaysShow: true,
	});

	const modelPick = await vscode.window.showQuickPick(modelItems, {
		placeHolder: "Select a preset model or choose custom input",
	});
	if (!modelPick) return;

	let modelId: string;

	if (modelPick.label === "$(edit) Custom Input...") {
		// Step 3: Input box for custom model ID
		const input = await vscode.window.showInputBox({
			prompt: `Enter a custom model ID for ${vendorPick.label}`,
			placeHolder: "e.g. my-custom-model-v2",
			validateInput: (value) => {
				if (!value.trim()) return "Model ID cannot be empty";
				return null;
			},
		});
		if (!input) return;
		modelId = input.trim();
	} else {
		modelId = modelPick.label;
	}

	// Step 4: Write to settings
	const config = vscode.workspace.getConfiguration();
	const existing = config.get<string[]>(vendorPick.settingsKey, []);

	if (existing.includes(modelId)) {
		vscode.window.showInformationMessage(
			`Model ID "${modelId}" already exists for ${vendorPick.label}.`,
		);
		return;
	}

	// Check if it's a preset model
	const isPreset = vendorPick.models.some((m) => m.id === modelId);
	if (isPreset) {
		vscode.window.showInformationMessage(
			`"${modelId}" is already a preset model for ${vendorPick.label}.`,
		);
		return;
	}

	await config.update(
		vendorPick.settingsKey,
		[...existing, modelId],
		vscode.ConfigurationTarget.Global,
	);

	vscode.window.showInformationMessage(
		`Added custom model ID "${modelId}" to ${vendorPick.label}.`,
	);
}

// ─── Extension Activation ────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext): void {
	// Register all vendor providers
	for (const vendorConfig of VENDOR_CONFIGS) {
		const provider = new MultiModelChatProvider(vendorConfig);
		context.subscriptions.push(
			vscode.lm.registerLanguageModelChatProvider(
				vendorConfig.vendorId,
				provider,
			),
		);
	}

	// Register custom OpenAI compatible provider
	const customProvider = new CustomOpenAIProvider();
	context.subscriptions.push(
		vscode.lm.registerLanguageModelChatProvider(
			"custom-openai",
			customProvider,
		),
	);

	// Register commands
	context.subscriptions.push(
		vscode.commands.registerCommand(
			"omniCopilot.testConnection",
			runConnectionTest,
		),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			"omniCopilot.addCustomModelId",
			addCustomModelId,
		),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			"omniCopilot.setThinkingEffort",
			setThinkingEffort,
		),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			"omniCopilot.toggleThinking",
			toggleThinking,
		),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			"omniCopilot.setContextLength",
			setContextLength,
		),
	);

	// Status bar: enable thinking indicator (left)
	enableThinkingStatusBar = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right,
		52,
	);
	enableThinkingStatusBar.command = "omniCopilot.toggleThinking";
	context.subscriptions.push(enableThinkingStatusBar);

	// Status bar: thinking effort indicator (right of thinking toggle)
	thinkingEffortStatusBar = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right,
		51,
	);
	thinkingEffortStatusBar.command = "omniCopilot.setThinkingEffort";
	context.subscriptions.push(thinkingEffortStatusBar);

	// Status bar: context length indicator
	contextLengthStatusBar = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right,
		50,
	);
	contextLengthStatusBar.command = "omniCopilot.setContextLength";
	context.subscriptions.push(contextLengthStatusBar);

	updateStatusBar();
	enableThinkingStatusBar.show();
	thinkingEffortStatusBar.show();
	contextLengthStatusBar.show();

	// Update status bar on configuration change
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (
				e.affectsConfiguration("omniCopilot.thinkingEffort") ||
				e.affectsConfiguration("omniCopilot.enableThinking") ||
				e.affectsConfiguration("omniCopilot.contextLength") ||
				e.affectsConfiguration("omniCopilot.customContextLength")
			) {
				updateStatusBar();
			}
		}),
	);
}

export function deactivate(): void {}
