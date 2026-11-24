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
	assert.equal(requests[0].body.model, modelId);
	return { model, body: requests[0].body };
}

for (const vendorId of ["glm-coding-plan-cn", "glm-coding-plan"]) {
	test(`${vendorId}/glm-5.4: menu domain and picker default effort`, async (t) => {
		const { model, body } = await captureRequest(t, vendorId, "glm-5.4", {});
		const menu = model.configurationSchema.properties.reasoningEffort;
		assert.deepEqual(menu.enum, ["low", "high", "max"]);
		// Menu default follows the shared always-thinking schema (High);
		// the server-side default when nothing is sent is max.
		assert.equal(menu.default, "high");
		assert.equal(body.reasoning_effort, "high");
	});

	for (const effort of ["low", "high", "max"]) {
		test(`${vendorId}/glm-5.4: picker effort ${effort}`, async (t) => {
			const { body } = await captureRequest(t, vendorId, "glm-5.4", {
				modelConfiguration: { reasoningEffort: effort },
			});
			assert.equal(body.reasoning_effort, effort);
		});
	}

	for (const legacy of [false, true]) {
		test(`${vendorId}/glm-5.4: ${legacy ? "legacy" : "picker"} None cannot disable thinking`, async (t) => {
			const { body } = await captureRequest(t, vendorId, "glm-5.4", legacy
				? { modelOptions: { thinkingBudget: "none" } }
				: { modelConfiguration: { reasoningEffort: "none" } });
			// Always-on guard: thinking stays true, the requested "none"
			// yields no effort field, and no thinking object is serialized —
			// the endpoint then runs its server-side default (max). Only an
			// explicit disable (never sent here) would map to low.
			assert.equal("thinking" in body, false);
			assert.equal("reasoning_effort" in body, false);
		});
	}
}
