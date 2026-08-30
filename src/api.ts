import type * as vscode from "vscode";
import { randomUUID } from "node:crypto";
import type {
	OpenAIMessage,
	OpenAITool,
	StreamChunk,
	ChatResponse,
	ChatOptions,
	ThinkingEffort,
} from "./types.js";

const CHAT_ENDPOINT = "/chat/completions";
const LIB_VERSION = "0.1.0";
const DEVICE_ID = randomUUID().replace(/-/g, "");

export function getKimiExtraHeaders(): Record<string, string> {
	return {
		"User-Agent": `KimiCLI/${LIB_VERSION}`,
		"X-Msh-Platform": "kimi_cli",
		"X-Msh-Version": LIB_VERSION,
		"X-Msh-Device-Name": "anonymous",
		"X-Msh-Device-Id": DEVICE_ID,
	};
}

export class ApiError extends Error {
	constructor(
		message: string,
		public readonly statusCode: number,
		public readonly response?: unknown,
	) {
		super(message);
		this.name = "ApiError";
	}
}

function* parseSSELines(lines: string[]): Generator<StreamChunk> {
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || !trimmed.startsWith("data:")) continue;

		const data = trimmed.slice(5).trim();
		if (data === "[DONE]") return;

		try {
			yield JSON.parse(data) as StreamChunk;
		} catch {
			// Malformed SSE chunks are non-fatal; skip and continue
		}
	}
}

export class OpenAICompatibleClient {
	private readonly apiKey: string;

	constructor(apiKey: string) {
		this.apiKey = apiKey;
	}

	async *streamChat(
		model: string,
		messages: OpenAIMessage[],
		baseUrl: string,
		options?: ChatOptions,
		cancellationToken?: vscode.CancellationToken,
	): AsyncGenerator<StreamChunk> {
		const abortController = new AbortController();
		const onCancel = cancellationToken?.onCancellationRequested(() => {
			abortController.abort();
		});

		try {
			const response = await this.sendRequest(
				model, messages, baseUrl, true, options, abortController.signal,
			);

			if (!response.body) {
				throw new ApiError("No response body", 0);
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";

			try {
				while (true) {
					if (cancellationToken?.isCancellationRequested) {
						reader.cancel();
						break;
					}

					const { done, value } = await reader.read();
					if (done) {
						// Flush remaining buffer
						buffer += decoder.decode();
						break;
					}

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");
					buffer = lines.pop() || "";
					yield* parseSSELines(lines);
				}

				// Flush any remaining data after the stream ends
				if (buffer.trim()) {
					yield* parseSSELines(buffer.split("\n"));
				}
			} finally {
				reader.releaseLock();
			}
		} finally {
			onCancel?.dispose();
		}
	}

	async chat(
		model: string,
		messages: OpenAIMessage[],
		baseUrl: string,
		options?: ChatOptions,
	): Promise<ChatResponse> {
		// Note: chat() has no AbortSignal — it's used only for short connection tests
		const response = await this.sendRequest(model, messages, baseUrl, false, options);
		return response.json() as Promise<ChatResponse>;
	}

	private buildRequestBody(
		model: string,
		messages: OpenAIMessage[],
		stream: boolean,
		options?: ChatOptions,
	): string {
		const body: Record<string, unknown> = {
			model,
			messages,
			stream,
		};

		if (options?.maxTokens !== undefined) {
			// MiniMax deprecates max_tokens in favor of max_completion_tokens
			// (per the MiniMax API reference; the China-facing guides still
			// only mention max_tokens, but the platform tolerates unknown
			// fields).
			if (options.vendorId === "minimax") {
				body.max_completion_tokens = options.maxTokens;
			} else {
				body.max_tokens = options.maxTokens;
			}
		}
		if (options?.tools !== undefined) {
			body.tools = options.tools;
		}

		// Zhipu only streams tool-call deltas when tool_stream is enabled
		// alongside stream:true (see the GLM-5.3 migration guide).
		if (options?.vendorId === "glm-coding-plan-cn" && stream && options.tools?.length) {
			body.tool_stream = true;
		}

		// Thinking / reasoning support — vendor-specific parameters.
		// Always called: applyThinkingParams handles both enable and disable cases.
		this.applyThinkingParams(
			body,
			options?.vendorId,
			model,
			options?.thinking ?? false,
			options?.thinkingEffort,
		);

		return JSON.stringify(body);
	}

	/**
	 * Map (thinking, effort) to vendor-specific request body fields.
	 *
	 * - `thinking=false` → user picked "None" (or model has no thinking support).
	 *   Most vendors omit thinking fields entirely; deepseek/moonshot send an
	 *   explicit disable signal where the API expects one.
	 * - `thinking=true, effort=undefined` → "On" (vendor has no effort knob).
	 * - `thinking=true, effort=low|medium|high` → fine-grained reasoning.
	 */
	private applyThinkingParams(
		body: Record<string, unknown>,
		vendorId: string | undefined,
		model: string,
		thinking: boolean,
		effort: ThinkingEffort | undefined,
	): void {
		switch (vendorId) {
			case "deepseek":
				// V4 defaults thinking ON with effort=high, so picking None
				// MUST send an explicit disable — merely omitting
				// reasoning_effort still spends (and bills) reasoning tokens
				// for output we then strip client-side.
				// Effort domain: low|medium|high|xhigh|max where medium/xhigh
				// alias "high"; legacy "medium" maps there too.
				// deepseek-v4-flash-vision-exp shares the flash thinking mode
				// exactly (same reasoning_effort domain and disable format).
				if (thinking) {
					body.reasoning_effort =
						effort === "max" ? "max" : effort === "low" ? "low" : "high";
				} else {
					body.thinking = { type: "disabled" };
				}
				break;

				case "qwen":
					// Qwen uses enable_thinking + optional thinking_budget
					// (tokens, range 1-32768). 3.5/3.6/3.7/3.8 series default
					// to thinking ON, qwen3-max defaults OFF; history
					// reasoning_content is ignored unless preserve_thinking is
					// set (not sent — a quality/cost tradeoff).
					//
					// DashScope-hosted GLM/DeepSeek models take the
					// vendor-native reasoning_effort knob instead of
					// thinking_budget: GLM-5.2 accepts low|medium|high|max;
					// DeepSeek V4 accepts low|high|max where low is
					// unsupported on the non-snapshot v4-pro and medium
					// aliases to high (default high).
					if (
						thinking &&
						effort &&
						(model === "glm-5.2" ||
							model === "deepseek-v4-pro" ||
							model === "deepseek-v4-pro-0813" ||
							model === "deepseek-v4-flash-0731")
					) {
						if (model === "glm-5.2") {
							body.reasoning_effort = effort;
						} else if (
							effort === "max" ||
							(effort === "low" && model !== "deepseek-v4-pro")
						) {
							body.reasoning_effort = effort;
						} else {
							body.reasoning_effort = "high";
						}
						break;
					}
					if (thinking) {
						body.enable_thinking = true;
						if (effort) {
							// DashScope thinking_budget range: 1-32768
							// (console default 4000); "max" uses the full
							// budget.
							const THINKING_BUDGET: Record<ThinkingEffort, number> = {
								low: 1024,
								medium: 4096,
								high: 16384,
								max: 32768,
							};
							body.thinking_budget = THINKING_BUDGET[effort];
						}
					} else {
						body.enable_thinking = false;
					}
					break;

			case "moonshot":
				// Kimi requires thinking object on every request, enabled or disabled.
				body.thinking = { type: thinking ? "enabled" : "disabled" };
				// k3 / k3-256k take top-level reasoning_effort (low | high | max,
				// endpoint default high); "medium" (legacy callers) coerces to
				// "high" per the endpoint's own mapping. Other Code Plan models
				// do not support effort.
				if ((model === "k3" || model === "k3-256k") && thinking && effort) {
					body.reasoning_effort = effort === "medium" ? "high" : effort;
				}
				break;

			case "moonshot-open":
				// Kimi Open Platform (api.moonshot.cn/v1) — per-model thinking
				// domains (see the platform's "thinking models" doc):
				// - kimi-k3: always thinks; top-level reasoning_effort =
				//   low|high|max; the thinking object must NOT be sent.
				//   "medium" (legacy callers) coerces to "high" so both K3
				//   endpoints behave identically.
				// - kimi-k2.7-code(-highspeed): always thinks; thinking.type
				//   accepts only "enabled" (sending "disabled" errors), so
				//   nothing is sent — "None" just strips output client-side.
				// - kimi-k2.6: thinking on by default; send an explicit
				//   disable when the user picks None. No reasoning_effort.
				if (model === "kimi-k3") {
					if (thinking && effort) {
						body.reasoning_effort = effort === "medium" ? "high" : effort;
					}
				} else if (model === "kimi-k2.6" && !thinking) {
					body.thinking = { type: "disabled" };
				}
				break;

				case "volcengine":
				case "volcengine-agent-plan":
					// Volcengine takes thinking: {type: "enabled" | "disabled"};
					// Doubao Seed 2.0/2.1 default thinking ON, so "None" must
					// send an explicit disable.
					body.thinking = { type: thinking ? "enabled" : "disabled" };
					break;

			case "glm-coding-plan-cn":
				// GLM-5.3 / 5.3-Flash always think — sending
				// thinking.type:"disabled" errors, so nothing is sent to turn
				// thinking off ("None" just strips output client-side).
				// reasoning_effort is low|high|max (API default max).
				// clear_thinking (preserved thinking) is enabled by default on
				// the Coding endpoint, so no thinking object is needed at all.
				// "medium" (the picker's fallback default) maps to "high" so
				// the request honors the menu's declared default instead of
				// silently falling back to the API default "max".
				if (thinking && effort) {
					body.reasoning_effort = effort === "medium" ? "high" : effort;
				}
				break;

				case "minimax":
					// MiniMax takes thinking: {type: "adaptive" | "disabled"}.
					// M3 can genuinely disable thinking; M2.x models accept
					// "disabled" but keep thinking on regardless, so they are
					// marked thinkingLocked upstream and the param is only
					// sent for M3. Thinking output arrives as interleaved
					// <think> tags inside content.
					if (model === "MiniMax-M3") {
						body.thinking = { type: thinking ? "adaptive" : "disabled" };
					}
					break;

			default:
				// Generic OpenAI-compatible: only send thinking when enabled.
				if (thinking) {
					body.thinking = { type: "enabled" };
				}
				break;
		}
	}

	private getHeaders(): Record<string, string> {
		return {
			"Content-Type": "application/json",
			Authorization: `Bearer ${this.apiKey}`,
		};
	}

	private async sendRequest(
		model: string,
		messages: OpenAIMessage[],
		baseUrl: string,
		stream: boolean,
		options?: ChatOptions,
		signal?: AbortSignal,
	): Promise<Response> {
		const url = `${baseUrl}${CHAT_ENDPOINT}`;
		const headers = { ...this.getHeaders(), ...options?.extraHeaders };
		const response = await fetch(url, {
			method: "POST",
			headers,
			body: this.buildRequestBody(model, messages, stream, options),
			signal,
		});

		if (response.ok) {
			return response;
		}

		const errorBody = await this.parseErrorBody(response);
		throw new ApiError(
			`API error: ${response.status} ${response.statusText}`,
			response.status,
			errorBody,
		);
	}

	private async parseErrorBody(response: Response): Promise<unknown> {
		const errorText = await response.text();
		try {
			return JSON.parse(errorText);
		} catch {
			return errorText;
		}
	}
}

export function mapApiError(error: ApiError, vendorName: string): Error {
	const detail = error.response
		? ` Response: ${JSON.stringify(error.response)}`
		: "";

	switch (error.statusCode) {
		case 401:
			return new Error(
				`Authentication failed (401). Check your ${vendorName} API key.${detail}`,
			);
		case 403:
			return new Error(
				`Forbidden (403). The ${vendorName} API rejected the request.${detail}`,
			);
		case 429:
			return new Error(
				`Rate limit exceeded (429). Please wait and try again.${detail}`,
			);
		default:
			return new Error(
				`${vendorName} API error ${error.statusCode}: ${error.message}${detail}`,
			);
	}
}
