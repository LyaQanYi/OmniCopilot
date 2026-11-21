const assert = require("node:assert/strict");
const Module = require("node:module");
const { test } = require("node:test");

class MockLanguageModelThinkingPart {
	constructor(value, id) {
		this.value = value;
		this.id = id;
	}
}

class MockLanguageModelTextPart {
	constructor(value) {
		this.value = value;
	}
}

class MockLanguageModelToolCallPart {
	constructor(callId, name, input) {
		this.callId = callId;
		this.name = name;
		this.input = input;
	}
}

class MockLanguageModelToolResultPart {
	constructor(callId, content) {
		this.callId = callId;
		this.content = content;
	}
}

class MockLanguageModelDataPart {
	constructor(data, mimeType) {
		this.data = data;
		this.mimeType = mimeType;
	}
}

const mockVscode = {
	LanguageModelThinkingPart: MockLanguageModelThinkingPart,
	LanguageModelTextPart: MockLanguageModelTextPart,
	LanguageModelToolCallPart: MockLanguageModelToolCallPart,
	LanguageModelToolResultPart: MockLanguageModelToolResultPart,
	LanguageModelDataPart: MockLanguageModelDataPart,
	LanguageModelChatMessageRole: {
		User: 1,
		Assistant: 2,
	},
	window: {
		showWarningMessage: () => Promise.resolve(undefined),
	},
	workspace: {
		getConfiguration: () => ({ get: (_key, fallback) => fallback }),
	},
};

// provider.ts captures LanguageModelThinkingPart at module load time, so the
// mock must be installed before requiring ../out/provider.js.
const load = Module._load;
Module._load = function (id, ...args) {
	if (id === "vscode") {
		return mockVscode;
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

function makeSSEStream(chunks) {
	const encoder = new TextEncoder();
	return new ReadableStream({
		start(controller) {
			for (const chunk of chunks) {
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
			}
			controller.enqueue(encoder.encode("data: [DONE]\n\n"));
			controller.close();
		},
	});
}

function makeDeltaChunk(delta, finishReason = null) {
	return {
		id: "chunk-1",
		created: 0,
		model: "test",
		choices: [{ index: 0, delta, finish_reason: finishReason }],
	};
}

async function runStream(t, vendorId, modelId, chunks, options = {}, messages = []) {
	const vendor = getVendorConfig(vendorId);
	const provider = new MultiModelChatProvider(vendor);
	const models = provider.provideLanguageModelChatInformation(
		{ configuration: { apiKey: "test-key" } }, token,
	);
	const model = models.find((entry) => entry.id === modelId);
	assert.ok(model, `${vendorId}/${modelId} must be available`);

	const requests = [];
	const parts = [];
	const fetch = t.mock.method(globalThis, "fetch", async (url, init) => {
		requests.push({ url, body: JSON.parse(init.body) });
		return new Response(makeSSEStream(chunks), {
			status: 200,
			headers: { "Content-Type": "text/event-stream" },
		});
	});
	try {
		await provider.provideLanguageModelChatResponse(
			model,
			messages,
			options,
			{ report: (part) => parts.push(part) },
			token,
		);
	} finally {
		fetch.mock.restore();
	}
	return { requests, parts };
}

test("consecutive reasoning_content deltas (including empty content) share one non-empty id", async (t) => {
	const chunks = [
		makeDeltaChunk({ reasoning_content: "first ", content: "" }),
		makeDeltaChunk({ reasoning_content: "second ", content: "" }),
		makeDeltaChunk({ reasoning_content: "third" }),
	];
	const { parts } = await runStream(t, "qwen", "qwen4-max", chunks);
	assert.equal(parts.length, 3);
	for (const part of parts) {
		assert.ok(part instanceof MockLanguageModelThinkingPart);
	}
	assert.equal(typeof parts[0].id, "string");
	assert.ok(parts[0].id.length > 0);
	assert.equal(parts[1].id, parts[0].id);
	assert.equal(parts[2].id, parts[0].id);
	assert.deepEqual(parts.map((p) => p.value), ["first ", "second ", "third"]);
});

test("answer text ends thinking segment and separate requests use distinct ids", async (t) => {
	const chunks = [
		makeDeltaChunk({ reasoning_content: "thought A1 " }),
		makeDeltaChunk({ reasoning_content: "thought A2" }),
		makeDeltaChunk({ content: "answer text" }),
		makeDeltaChunk({ reasoning_content: "thought B1" }),
	];
	const firstRun = await runStream(t, "qwen", "qwen4-max", chunks);
	const thinking1 = firstRun.parts.filter((p) => p instanceof MockLanguageModelThinkingPart);
	const texts1 = firstRun.parts.filter((p) => p instanceof MockLanguageModelTextPart);

	assert.equal(thinking1.length, 3);
	assert.equal(texts1.length, 1);
	assert.equal(texts1[0].value, "answer text");
	assert.equal(thinking1[0].id, thinking1[1].id);
	assert.notEqual(thinking1[2].id, thinking1[0].id);

	const secondRun = await runStream(t, "qwen", "qwen4-max", [
		makeDeltaChunk({ reasoning_content: "next request thought" }),
	]);
	const thinking2 = secondRun.parts.filter((p) => p instanceof MockLanguageModelThinkingPart);
	assert.equal(thinking2.length, 1);
	assert.notEqual(thinking2[0].id, thinking1[0].id);
	assert.notEqual(thinking2[0].id, thinking1[2].id);
});

test("tool_calls finish_reason ends thinking segment and starts a new id afterward", async (t) => {
	const chunks = [
		makeDeltaChunk({ reasoning_content: "plan step 1 " }),
		makeDeltaChunk({ reasoning_content: "plan step 2" }),
		makeDeltaChunk({
			tool_calls: [{ index: 0, id: "call_1", type: "function", function: { name: "read", arguments: "{\"a\":" } }],
		}),
		makeDeltaChunk({
			tool_calls: [{ index: 0, function: { arguments: "1}" } }],
		}, "tool_calls"),
		makeDeltaChunk({ reasoning_content: "after tool thought" }),
	];
	const { parts } = await runStream(t, "qwen", "qwen4-max", chunks);
	const thinking = parts.filter((p) => p instanceof MockLanguageModelThinkingPart);
	const tools = parts.filter((p) => p instanceof MockLanguageModelToolCallPart);

	assert.equal(thinking.length, 3);
	assert.equal(tools.length, 1);
	assert.equal(tools[0].callId, "call_1");
	assert.equal(tools[0].name, "read");
	assert.deepEqual(tools[0].input, { a: 1 });
	assert.equal(thinking[0].id, thinking[1].id);
	assert.notEqual(thinking[2].id, thinking[0].id);
});

test("minimax inline <think> tags split across chunks keep segment id and reset after answer text", async (t) => {
	const chunks = [
		makeDeltaChunk({ content: "<thi" }),
		makeDeltaChunk({ content: "nk>first " }),
		makeDeltaChunk({ content: "thought</th" }),
		makeDeltaChunk({ content: "ink>answer<think>second</think>" }),
	];
	const { parts } = await runStream(t, "minimax", "MiniMax-M3", chunks);
	const thinking = parts.filter((p) => p instanceof MockLanguageModelThinkingPart);
	const texts = parts.filter((p) => p instanceof MockLanguageModelTextPart);

	assert.deepEqual(thinking.map((p) => p.value), ["first ", "thought", "second"]);
	assert.deepEqual(texts.map((p) => p.value), ["answer"]);
	assert.ok(thinking[0].id.length > 0);
	assert.equal(thinking[1].id, thinking[0].id);
	assert.notEqual(thinking[2].id, thinking[0].id);
});

test("reasoningEffort none suppresses thinking output for reasoning_content and inline <think> tags", async (t) => {
	const qwenRun = await runStream(
		t,
		"qwen",
		"qwen4-max",
		[
			makeDeltaChunk({ reasoning_content: "hidden reasoning" }),
			makeDeltaChunk({ content: "visible answer" }),
		],
		{ modelConfiguration: { reasoningEffort: "none" } },
	);
	assert.equal(qwenRun.parts.filter((p) => p instanceof MockLanguageModelThinkingPart).length, 0);
	assert.deepEqual(
		qwenRun.parts.filter((p) => p instanceof MockLanguageModelTextPart).map((p) => p.value),
		["visible answer"],
	);

	const minimaxRun = await runStream(
		t,
		"minimax",
		"MiniMax-M3",
		[
			makeDeltaChunk({ content: "<think>hidden</think>visible" }),
		],
		{ modelConfiguration: { reasoningEffort: "none" } },
	);
	assert.equal(minimaxRun.parts.filter((p) => p instanceof MockLanguageModelThinkingPart).length, 0);
	assert.deepEqual(
		minimaxRun.parts.filter((p) => p instanceof MockLanguageModelTextPart).map((p) => p.value),
		["visible"],
	);
});

test("history replay joins LanguageModelThinkingPart string[] without commas and preserves string", async (t) => {
	const history = [
		{
			role: mockVscode.LanguageModelChatMessageRole.Assistant,
			content: [
				new MockLanguageModelThinkingPart(["step 1 ", "step 2"], "seg-1"),
				new MockLanguageModelTextPart("done 1"),
			],
		},
		{
			role: mockVscode.LanguageModelChatMessageRole.User,
			content: [new MockLanguageModelTextPart("next?")],
		},
		{
			role: mockVscode.LanguageModelChatMessageRole.Assistant,
			content: [
				new MockLanguageModelThinkingPart("plain thinking", "seg-2"),
				new MockLanguageModelTextPart("done 2"),
			],
		},
	];

	const { requests } = await runStream(t, "qwen", "qwen4-max", [], {}, history);
	assert.equal(requests.length, 1);
	const sent = requests[0].body.messages;
	assert.equal(sent[0].role, "assistant");
	assert.equal(sent[0].reasoning_content, "step 1 step 2");
	assert.equal(sent[0].content, "done 1");
	assert.equal(sent[2].role, "assistant");
	assert.equal(sent[2].reasoning_content, "plain thinking");
	assert.equal(sent[2].content, "done 2");
});
