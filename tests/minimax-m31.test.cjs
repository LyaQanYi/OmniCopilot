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

async function captureRequest(t, vendorId, modelId, options) {
	const vendor = getVendorConfig(vendorId);
	const provider = new MultiModelChatProvider(vendor);
	const models = provider.provideLanguageModelChatInformation(
		{ configuration: { apiKey: "test-key" } }, token,
	);
	const model = models.find((entry) => entry.id === modelId);
	assert.ok(model, `${vendorId}/${modelId} must be available`);
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
	assert.equal(requests[0].url, `${vendor.defaultBaseUrl}/chat/completions`);
	assert.equal(requests[0].body.model, modelId);
	return { model, body: requests[0].body };
}

for (const vendorId of ["minimax", "minimax-intl"]) {
	for (const modelId of ["MiniMax-M3.1-Flash", "MiniMax-M3.1-Flash-Preview"]) {
		test(`${vendorId}/${modelId}: default picker effort reaches the API`, async (t) => {
			const { model, body } = await captureRequest(t, vendorId, modelId, {});
			const menu = model.configurationSchema.properties.reasoningEffort;
			assert.deepEqual(menu.enum, ["low", "medium", "high", "xhigh", "max"]);
			assert.equal(body.reasoning_effort, menu.default);
			assert.deepEqual(body.thinking, { type: "adaptive" });
		});
		for (const effort of ["low", "medium", "high", "xhigh", "max"]) {
			test(`${vendorId}/${modelId}: picker effort ${effort}`, async (t) => {
				const { body } = await captureRequest(t, vendorId, modelId, {
					modelConfiguration: { reasoningEffort: effort },
				});
				assert.equal(body.reasoning_effort, effort);
				assert.deepEqual(body.thinking, { type: "adaptive" });
			});
		}
		for (const legacy of [false, true]) {
			test(`${vendorId}/${modelId}: ${legacy ? "legacy" : "picker"} None cannot disable thinking`, async (t) => {
				const { body } = await captureRequest(t, vendorId, modelId, legacy
					? { modelOptions: { thinkingBudget: "none" } }
					: { modelConfiguration: { reasoningEffort: "none" } });
				assert.deepEqual(body.thinking, { type: "adaptive" });
				assert.equal("reasoning_effort" in body, false);
			});
		}
	}
	test(`${vendorId}/MiniMax-M3: None still disables thinking`, async (t) => {
		const { body } = await captureRequest(t, vendorId, "MiniMax-M3", {
			modelConfiguration: { reasoningEffort: "none" },
		});
		assert.deepEqual(body.thinking, { type: "disabled" });
		assert.equal("reasoning_effort" in body, false);
	});
}
