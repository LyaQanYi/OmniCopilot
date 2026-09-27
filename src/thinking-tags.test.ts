import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	processThinkingContent,
	type ThinkingParsedPart,
	type ThinkingState,
} from "./thinking-tags.js";

const FRESH: ThinkingState = { buffer: "", insideThinking: false };

/** Feed a stream of chunks through the state machine and collect every part. */
function run(chunks: string[], strip = false) {
	let state: ThinkingState = FRESH;
	const parts: ThinkingParsedPart[] = [];
	for (const chunk of chunks) {
		const result = processThinkingContent(chunk, state, strip);
		parts.push(...result.parts);
		state = result.state;
	}
	return { parts, state };
}

describe("processThinkingContent", () => {
	it("passes plain answer text through untouched", () => {
		const { parts, state } = run(["just an answer"]);
		assert.deepEqual(parts, [{ type: "text", value: "just an answer" }]);
		assert.deepEqual(state, FRESH);
	});

	it("emits nothing for empty content", () => {
		const { parts, state } = run([""]);
		assert.deepEqual(parts, []);
		assert.deepEqual(state, FRESH);
	});

	it("splits a complete inline thinking block", () => {
		const { parts, state } = run(["<think>reasoning</think>answer"]);
		assert.deepEqual(parts, [
			{ type: "thinking", value: "reasoning" },
			{ type: "text", value: "answer" },
		]);
		assert.deepEqual(state, FRESH);
	});

	it("handles several thinking blocks inside one chunk", () => {
		const { parts } = run(["<think>a</think>mid<think>b</think>end"]);
		assert.deepEqual(parts, [
			{ type: "thinking", value: "a" },
			{ type: "text", value: "mid" },
			{ type: "thinking", value: "b" },
			{ type: "text", value: "end" },
		]);
	});

	/**
	 * A tag split across two chunks must be buffered rather than flushed as
	 * answer text — otherwise "<thi" leaks into the answer and the following
	 * reasoning block is misclassified.
	 */
	it("holds back an open tag that straddles a chunk boundary", () => {
		const first = processThinkingContent("hello <thi", FRESH, false);
		assert.deepEqual(first.parts, [{ type: "text", value: "hello " }]);
		assert.equal(first.state.buffer, "<thi", "partial open tag must be retained");
		assert.equal(first.state.insideThinking, false);

		const second = processThinkingContent("nk>secret</think>world", first.state, false);
		assert.deepEqual(second.parts, [
			{ type: "thinking", value: "secret" },
			{ type: "text", value: "world" },
		]);
		assert.deepEqual(second.state, FRESH);
	});

	it("holds back a close tag that straddles a chunk boundary", () => {
		const open = processThinkingContent("<think>secret", FRESH, false);
		assert.deepEqual(open.parts, [{ type: "thinking", value: "secret" }]);
		assert.equal(open.state.insideThinking, true);

		const split = processThinkingContent("</thi", open.state, false);
		assert.deepEqual(split.parts, [], "a partial close tag emits nothing");
		assert.equal(split.state.buffer, "</thi");

		const rest = processThinkingContent("nk>ok", split.state, false);
		assert.deepEqual(rest.parts, [{ type: "text", value: "ok" }]);
		assert.deepEqual(rest.state, FRESH);
	});

	it("reassembles a block delivered one character at a time", () => {
		const { parts, state } = run(["<", "t", "h", "i", "n", "k", ">", "hi", "</think>ok"]);
		assert.deepEqual(parts, [
			{ type: "thinking", value: "hi" },
			{ type: "text", value: "ok" },
		]);
		assert.deepEqual(state, FRESH);
	});

	/**
	 * The provider's end-of-stream flush appends a closing tag only when
	 * insideThinking is true, so this flag is part of that contract.
	 */
	it("leaves insideThinking set when the stream ends mid-block", () => {
		const { state } = run(["answer<think>tail"]);
		assert.equal(state.insideThinking, true);
		assert.equal(state.buffer, "");
	});

	it("drops thinking content when strip=true but keeps answer text", () => {
		const { parts } = run(["before<think>hidden</think>after"], true);
		assert.deepEqual(parts, [
			{ type: "text", value: "before" },
			{ type: "text", value: "after" },
		]);
	});

	it("drops thinking even when the open tag straddles chunks", () => {
		const { parts, state } = run(["a<thi", "nk>hidden</think>b"], true);
		assert.deepEqual(parts, [
			{ type: "text", value: "a" },
			{ type: "text", value: "b" },
		]);
		assert.deepEqual(state, FRESH);
	});

	it("drops an unterminated thinking block when strip=true", () => {
		const { parts } = run(["answer<think>reasoning"], true);
		assert.deepEqual(parts, [{ type: "text", value: "answer" }]);
	});

	/**
	 * The whole point of holding partial tags back is that the result must not
	 * depend on where the stream happened to be split. Sweeping every possible
	 * two-way split proves the buffering never loses, duplicates or misroutes
	 * a character. Part boundaries legitimately differ between splits (adjacent
	 * same-kind parts are not merged), so the invariant is checked on the
	 * reassembled text and thinking streams.
	 */
	it("reassembles the stream identically for every two-way chunk split", () => {
		const stream = "pre<think>alpha</think>mid<think>beta</think>post";
		const expectedText = "premidpost";
		const expectedThinking = "alphabeta";

		for (let i = 0; i <= stream.length; i++) {
			const splitAt = `${i} (${JSON.stringify(stream.slice(0, i))})`;
			const { parts, state } = run([stream.slice(0, i), stream.slice(i)]);

			const text = parts
				.filter((p) => p.type === "text")
				.map((p) => p.value)
				.join("");
			const thinking = parts
				.filter((p) => p.type === "thinking")
				.map((p) => p.value)
				.join("");

			assert.equal(text, expectedText, `answer text differs when split at ${splitAt}`);
			assert.equal(thinking, expectedThinking, `thinking differs when split at ${splitAt}`);
			assert.deepEqual(state, FRESH, `split at ${splitAt} left the state machine dirty`);
		}
	});
});
