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
			body.max_tokens = options.maxTokens;
		}
		if (options?.tools !== undefined) {
			body.tools = options.tools;
		}

		// Thinking / reasoning support — vendor-specific parameters
		if (options?.vendorId === "moonshot") {
			// Kimi always requires thinking object
			body.thinking = { type: options?.thinking ? "enabled" : "disabled" };
		} else if (options?.thinking) {
			this.applyThinkingParams(body, options.vendorId, options.thinkingEffort);
		}

		return JSON.stringify(body);
	}

	private applyThinkingParams(
		body: Record<string, unknown>,
		vendorId?: string,
		effort?: ThinkingEffort,
	): void {
		switch (vendorId) {
			case "deepseek":
				// DeepSeek Reasoner uses reasoning_effort parameter
				if (effort) {
					body.reasoning_effort = effort;
				}
				break;

			case "qwen":
				// Qwen uses enable_thinking + thinking_budget (token counts).
				// Values sourced from Alibaba DashScope docs; units are tokens.
				// low=1024 (fast/cheap), medium=4096 (balanced), high=16384 (deep reasoning)
				body.enable_thinking = true;
				if (effort) {
					const THINKING_BUDGET: Record<ThinkingEffort, number> = {
						low: 1024,
						medium: 4096,
						high: 16384,
					};
					body.thinking_budget = THINKING_BUDGET[effort];
				}
				break;

			case "doubao":
				// Doubao uses thinking object { type: "enabled" }
				body.thinking = { type: "enabled" };
				break;

			case "zhipu":
				// Zhipu/GLM: no special thinking params needed
				break;

			case "minimax":
				// MiniMax M2 is an interleaved thinking model — always outputs <think> tags
				// in content, no API parameter needed to enable thinking
				break;

			default:
				// Generic: use thinking object (compatible with many providers)
				body.thinking = { type: "enabled" };
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
