/**
 * Incremental parser for thinking content that arrives inline inside the
 * answer stream as literal `<think>…</think>` tags (MiniMax's native API).
 *
 * This module is deliberately free of any `vscode` import so the state machine
 * can be unit-tested in plain Node — see thinking-tags.test.ts. Vendors that
 * deliver thinking via `reasoning_content` deltas never go through here: their
 * answer text may legitimately quote these tags (e.g. when reviewing this very
 * codebase), and scanning it would misroute answer text into thinking parts.
 * That gating lives in `vendorConfig.inlineThinkTags`.
 */

export interface ThinkingState {
	buffer: string;
	insideThinking: boolean;
}

export interface ThinkingParsedPart {
	type: "text" | "thinking";
	value: string;
}

export const THINK_OPEN = "<think>";
export const THINK_CLOSE = "</think>";

/**
 * Length of the longest suffix of `buffer` that is also a prefix of `tag`.
 * Lets the stream hold back a tag that was split across two chunks instead of
 * emitting half a delimiter as answer text.
 */
function findTrailingPartialMatch(buffer: string, tag: string): number {
	for (let i = Math.min(tag.length - 1, buffer.length); i >= 1; i--) {
		if (buffer.slice(-i) === tag.slice(0, i)) {
			return i;
		}
	}
	return 0;
}

/**
 * Parses content with <think>...</think> tags into structured parts.
 * When strip=true, thinking content is discarded.
 *
 * Any trailing partial tag is retained in `state.buffer` for the next chunk;
 * the caller is responsible for flushing it when the stream ends (see the
 * end-of-stream flush in provider.ts, which closes an unopened block).
 */
export function processThinkingContent(
	content: string,
	state: ThinkingState,
	strip: boolean,
): { parts: ThinkingParsedPart[]; state: ThinkingState } {
	const parts: ThinkingParsedPart[] = [];
	let buffer = state.buffer + content;
	let insideThinking = state.insideThinking;

	while (buffer.length > 0) {
		const tag = insideThinking ? THINK_CLOSE : THINK_OPEN;
		const tagIdx = buffer.indexOf(tag);

		if (tagIdx !== -1) {
			const before = buffer.slice(0, tagIdx);
			if (before) {
				if (insideThinking) {
					if (!strip) {
						parts.push({ type: "thinking", value: before });
					}
				} else {
					parts.push({ type: "text", value: before });
				}
			}
			buffer = buffer.slice(tagIdx + tag.length);
			insideThinking = !insideThinking;
			continue;
		}

		const partialMatch = findTrailingPartialMatch(buffer, tag);
		if (partialMatch > 0) {
			const emittable = buffer.slice(0, -partialMatch);
			if (emittable) {
				if (insideThinking) {
					if (!strip) {
						parts.push({ type: "thinking", value: emittable });
					}
				} else {
					parts.push({ type: "text", value: emittable });
				}
			}
			buffer = buffer.slice(-partialMatch);
		} else {
			if (insideThinking) {
				if (!strip) {
					parts.push({ type: "thinking", value: buffer });
				}
			} else {
				parts.push({ type: "text", value: buffer });
			}
			buffer = "";
		}
		break;
	}

	return { parts, state: { buffer, insideThinking } };
}
