const assert = require("node:assert/strict");
const Module = require("node:module");
const { test } = require("node:test");

// Run the real provider and HTTP serializer outside the VS Code host.
const load = Module._load;
Module._load = function (id, ...args) {
	if (id === "vscode") {
		return { workspace: { getConfiguration: () => ({ get: (_key, fallback) => fallback }) } };
	}
	return load.call(this, id, ...args);
};
let MultiModelChatProvider;
try {
	({ MultiModelChatProvider } = require("../out/provider.js"));
} finally {
	Module._load = load;
}
const { getVendorConfig } = require("../out/models.js");

const token = {
	isCancellationRequested: false,
	onCancellationRequested: () => ({ dispose() {} }),
};

async function captureRequest(t, modelId, options) {
	const vendor = getVendorConfig("qwen");
	const provider = new MultiModelChatProvider(vendor);
	const models = provider.provideLanguageModelChatInformation(
		{ configuration: { apiKey: "test-key" } }, token,
	);
	const model = models.find((entry) => entry.id === modelId);
	assert.ok(model, `qwen/${modelId} must be available`);
	const requests = [];
	const fetch = t.mock.method(globalThis, "fetch", async (url, init) => {
		requests.push({ url, body: JSON.parse(init.body) });
		return new Response("data: [DONE]\n\n", { headers: { "Content-Type": "text/event-stream" } });
	});
	try {
		await provider.provideLanguageModelChatResponse(model, [], options, { report() {} }, token);
	} finally {
		fetch.mock.restore();
	}
	assert.equal(requests.length, 1);
	assert.equal(requests[0].body.model, modelId);
	return { model, body: requests[0].body };
}

test("qwen/qwen4-max-preview: menu domain and default", async (t) => {
	const { model, body } = await captureRequest(t, "qwen4-max-preview", {});
	const menu = model.configurationSchema.properties.reasoningEffort;
	assert.deepEqual(menu.enum, ["none", "low", "medium", "xhigh"]);
	assert.equal(menu.default, "xhigh");
	// Default picker effort: hybrid toggle on + native effort, never a budget.
	assert.equal(body.enable_thinking, true);
	assert.equal(body.reasoning_effort, "xhigh");
	assert.equal("thinking_budget" in body, false);
});

for (const effort of ["low", "medium", "xhigh"]) {
	test(`qwen/qwen4-max-preview: picker effort ${effort}`, async (t) => {
		const { body } = await captureRequest(t, "qwen4-max-preview", {
			modelConfiguration: { reasoningEffort: effort },
		});
		assert.equal(body.enable_thinking, true);
		assert.equal(body.reasoning_effort, effort);
		assert.equal("thinking_budget" in body, false);
	});
}

for (const legacy of [false, true]) {
	test(`qwen/qwen4-max-preview: ${legacy ? "legacy" : "picker"} None disables thinking`, async (t) => {
		const { body } = await captureRequest(t, "qwen4-max-preview", legacy
			? { modelOptions: { thinkingBudget: "none" } }
			: { modelConfiguration: { reasoningEffort: "none" } });
		assert.equal(body.enable_thinking, false);
		assert.equal("reasoning_effort" in body, false);
		assert.equal("thinking_budget" in body, false);
	});
}

test("qwen/deepseek-v4.1-flash-1017: effort reaches the API like its sibling", async (t) => {
	const { model, body } = await captureRequest(t, "deepseek-v4.1-flash-1017", {
		modelConfiguration: { reasoningEffort: "max" },
	});
	const menu = model.configurationSchema.properties.reasoningEffort;
	assert.deepEqual(menu.enum, ["none", "low", "high", "max"]);
	assert.equal(body.reasoning_effort, "max");
	assert.equal("thinking_budget" in body, false);
});

test("qwen/deepseek-v4.1-flash-1017: None disables thinking", async (t) => {
	const { body } = await captureRequest(t, "deepseek-v4.1-flash-1017", {
		modelConfiguration: { reasoningEffort: "none" },
	});
	// The whitelist branch only fires with thinking && effort, so None falls
	// through to the qwen toggle path: enable_thinking=false, no effort sent.
	assert.equal(body.enable_thinking, false);
	assert.equal("reasoning_effort" in body, false);
});
