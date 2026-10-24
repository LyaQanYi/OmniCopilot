const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const Module = require("node:module");
const { join } = require("node:path");
const { test } = require("node:test");

// VS Code supplies this module in the extension host. Only configuration is
// needed here; requests run through the real provider and HTTP serializer.
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
const { OpenAICompatibleClient } = require("../out/api.js");
const { getVendorConfig } = require("../out/models.js");

const vendors = [
	["moonshot", "k3.1-pro", true],
	["kimi-code-plan-intl", "k3.1-pro", true],
	["moonshot-open", "kimi-k3.1-pro", false],
	["moonshot-intl", "kimi-k3.1-pro", false],
];
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
		await provider.provideLanguageModelChatResponse(
			model, [], options, { report() {} }, token,
		);
	} finally {
		fetch.mock.restore();
	}
	assert.equal(requests.length, 1);
	assert.equal(requests[0].url, `${vendor.defaultBaseUrl}/chat/completions`);
	assert.equal(requests[0].body.model, modelId);
	return { model, body: requests[0].body };
}

for (const [vendorId, modelId, codePlan] of vendors) {
	for (const suffix of ["", "-highspeed"]) {
		const id = modelId + suffix;
		test(`${vendorId}/${id}: picker and default request`, async (t) => {
			const { model, body } = await captureRequest(t, vendorId, id, {});
			const menu = model.configurationSchema.properties.reasoningEffort;
			assert.deepEqual(menu.enum, ["low", "high", "max"]);
			assert.equal(menu.default, "high");
			assert.equal(model.maxInputTokens, 1048576);
			assert.equal(model.maxOutputTokens, codePlan ? 131072 : 1048576);
			assert.equal(body.reasoning_effort, "high");
			assert.equal("max_tokens" in body, false);
			assert.equal("max_completion_tokens" in body, false);
		});
		for (const legacy of [false, true]) {
			for (const effort of ["low", "high", "max", "none", "medium"]) {
				test(`${vendorId}/${id}: ${legacy ? "legacy" : "picker"} ${effort}`, async (t) => {
					const options = legacy
						? { modelOptions: { thinkingBudget: effort, maxTokens: 4096 } }
						: { modelConfiguration: { reasoningEffort: effort }, modelOptions: { maxTokens: 4096 } };
					const { body } = await captureRequest(t, vendorId, id, options);
					assert.equal(body.reasoning_effort, effort === "none" ? undefined : effort === "medium" ? "high" : effort);
					assert.equal(body.max_completion_tokens, 4096);
					assert.equal("max_tokens" in body, false);
					assert.deepEqual(body.thinking, codePlan ? { type: "enabled" } : undefined);
				});
			}
		}
	}
	test(`${vendorId}: picker takes precedence over legacy None`, async (t) => {
		const { body } = await captureRequest(t, vendorId, modelId, {
			modelConfiguration: { reasoningEffort: "low" },
			modelOptions: { thinkingBudget: "none" },
		});
		assert.equal(body.reasoning_effort, "low");
	});
	test(`${vendorId}: older K3 retains effort and completion token fields`, async (t) => {
		const { body } = await captureRequest(t, vendorId, codePlan ? "k3" : "kimi-k3", {
			modelConfiguration: { reasoningEffort: "max" }, modelOptions: { maxTokens: 4096 },
		});
		assert.equal(body.reasoning_effort, "max");
		assert.equal(body.max_completion_tokens, 4096);
		assert.equal("max_tokens" in body, false);
	});
	test(`${vendorId}: older toggle models still allow None`, async (t) => {
		const { body } = await captureRequest(t, vendorId, codePlan ? "kimi-for-coding" : "kimi-k2.6", {
			modelConfiguration: { reasoningEffort: "none" }, modelOptions: { maxTokens: 4096 },
		});
		assert.deepEqual(body.thinking, { type: "disabled" });
		assert.equal("reasoning_effort" in body, false);
		assert.equal(body.max_tokens, 4096);
		assert.equal("max_completion_tokens" in body, false);
	});
}

test("third-party Kimi hosts keep max_tokens", async (t) => {
	let body;
	t.mock.method(globalThis, "fetch", async (_url, init) => {
		body = JSON.parse(init.body);
		return Response.json({ choices: [] });
	});
	await new OpenAICompatibleClient("test-key").chat("kimi-k3", [], "https://example.test", {
		vendorId: "volcengine", thinking: true, thinkingEffort: "high", maxTokens: 4096,
	});
	assert.equal(body.max_tokens, 4096);
	assert.equal("max_completion_tokens" in body, false);
});

test("both README provider tables list the new model IDs", () => {
	for (const file of ["README.md", "README.zh-CN.md"]) {
		const readme = readFileSync(join(__dirname, "..", file), "utf8");
		for (const [vendorId, modelId] of vendors) {
			const row = readme.split("\n").find((line) => line.includes(`| \`${vendorId}\` |`));
			assert.ok(row?.includes(modelId + ","), `${file}: missing ${vendorId}/${modelId}`);
			assert.ok(row?.includes(modelId + "-highspeed"), `${file}: missing ${vendorId}/${modelId}-highspeed`);
		}
	}
});
