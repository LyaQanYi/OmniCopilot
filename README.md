# OmniCopilot

[中文版](README.zh-CN.md)

A VS Code extension that lets you use models from multiple LLM platforms in GitHub Copilot Chat as language model providers.

## Supported Providers

| Provider | Vendor ID | Models |
|----------|-----------|--------|
| DeepSeek | `deepseek` | deepseek-v4-flash, deepseek-v4-pro, deepseek-v4-flash-vision-exp |
| GLM Coding Plan CN | `glm-coding-plan-cn` | GLM-5.3, GLM-5.3-Flash |
| Kimi Code Plan | `moonshot` | k3, k3-256k, kimi-for-coding, kimi-for-coding-highspeed |
| Moonshot (Open Platform) | `moonshot-open` | kimi-k3, kimi-k2.7-code, kimi-k2.7-code-highspeed, kimi-k2.6 |
| Qwen Token Plan | `qwen` | qwen3.8-max, qwen3.8-flash, qwen3.7-max, qwen3.7-plus, qwen3.6-flash, glm-5.2, deepseek-v4-pro(-0813), deepseek-v4-flash-0731 |
| MiniMax Token Plan CN | `minimax` | MiniMax-M3, MiniMax-M2.7, MiniMax-M2.7-highspeed, MiniMax-M2.5 |
| Volcengine Coding Plan CN | `volcengine` | doubao-seed-2.1-turbo, doubao-seed-evolving, doubao-seed-2.0-lite, kimi-k2.7-code, minimax-m3, deepseek-v4-flash, deepseek-v4-pro, glm-5.3, glm-5.3-flash |
| Volcengine Agent Plan CN | `volcengine-agent-plan` | the Coding Plan set plus doubao-seed-2.0-mini and kimi-k3 |

## Tested & Working

The following platforms have been tested and confirmed working:

- **DeepSeek Open Platform** (`platform.deepseek.com`)
- **Kimi Code** (Kimi coding model)
- **MiniMax Token Plan CN** (`platform.minimaxi.com`)
- **Qwen / DashScope** (`dashscope.aliyuncs.com` pay-as-you-go verified; Token Plan tier pending)
- **GLM Coding Plan CN** (`open.bigmodel.cn` Coding API — re-verification pending after the vendor ID change)

> [!NOTE]
> **GLM Coding Plan billing**: per Zhipu's docs, the Coding endpoint (`open.bigmodel.cn/api/coding/paas/v4`) only counts toward the Coding Plan quota when called from officially supported tools (Claude Code, Kilo Code, OpenCode, TRAE, CodeBuddy, etc.). VS Code Copilot Chat is not on that list — calls generally succeed, but usage may be billed at pay-as-you-go API rates instead of your plan's credits, and Zhipu's usage notes treat non-listed-tool calls as a violation that may lead to throttling or account restrictions. Keep an eye on your billing and account status.
<!---->

> [!WARNING]
> **Qwen Token Plan terms**: the Token Plan key is restricted to interactive coding/agent tools (Claude Code, Cursor, Qwen Code, Qoder, OpenClaw, etc.) — the docs explicitly forbid generic API usage and state that violations may suspend the subscription or ban the API key. VS Code Copilot Chat is not on the official tool list, so use at your own discretion and watch your account status.

## TODO

- [ ] Test Volcengine Coding Plan / Agent Plan
- [ ] Test Qwen Token Plan
- [ ] Test Kimi Open Platform
- [ ] Support SiliconFlow
- [ ] Support MiniMax International
- [ ] Support GLM International
- [ ] Support SiliconFlow International
- [ ] Verify thinking effort levels (DeepSeek None/High/Max; others None/Low/Medium/High or None/On) actually take effect across providers
- [ ] To be continued…

## Features

- **Multiple Providers**: Access models from major LLM platforms
- **Per-Model Thinking Effort**: Hover any thinking-capable model in the Copilot picker to pick the effort level for the next turn — no need to flip a global switch
  - **DeepSeek V4** menu: None / Low / High / Max (matches the V4 API's reasoning_effort domain; thinking is on by default, None disables it explicitly)
  - **Kimi K3** (Code Plan `k3` / `k3-256k`, Open Platform `kimi-k3`): Low / High / Max — no None option, thinking is always on; effort maps to reasoning_effort on both endpoints
  - **GLM-5.3 / GLM-5.3-Flash** menu: Low / High / Max — no None option, thinking is always on (the Coding endpoint routes old GLM IDs like glm-5.1 / glm-4.7 to these two models)
  - 4-level menu (None / Low / Medium / High) for Qwen reasoning models
  - 2-level menu (None / On) for models that only expose a thinking on/off knob (Kimi K2.6, MiniMax-M3, pre-5.3 GLM, Volcengine reasoning models) — MiniMax-M3's None genuinely disables thinking
  - Thinking-locked models expose no menu at all: K2.7 Code (Code Plan `kimi-for-coding`(-highspeed), Open Platform `kimi-k2.7-code`(-highspeed)) and MiniMax M2.x — their "None" would silently reroute the model or keep thinking on anyway
- **Thinking UI**: Models with reasoning capabilities show collapsible thinking sections via `LanguageModelThinkingPart`
- **Vision Support**: Vision-capable models (deepseek-v4-flash-vision-exp, glm-5.3-flash, kimi-for-coding, MiniMax-M3, qwen3.8-max, qwen3.8-flash, qwen3.7-plus, qwen3.6-flash) can read images attached in Copilot Chat
- **Tool Calling**: Function calling support for compatible models

## Usage

1. Install the extension
2. Open Copilot Chat → Manage Models → Add Model
3. Select a provider and enter your API key
4. Start chatting with the selected model

## Configuration

Thinking effort is now selected **per model, per turn** via the Copilot model picker's hover menu — there is no global thinking-effort setting.

| Setting | Description | Default |
|---------|-------------|---------|
| `omniCopilot.contextLength` | Max input context length (4K–1M presets, or `custom`) | `default` |
| `omniCopilot.customContextLength` | Custom max input context (used when `contextLength` is `custom`) | `131072` |
| `omniCopilot.enableVision` | Enable vision for supported models | `true` |

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [VS Code](https://code.visualstudio.com/) 1.108.0+
- [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) extension installed

### Setup

```bash
git clone https://github.com/LyaQanYi/OmniCopilot.git
cd OmniCopilot
npm install
```

### Build & Run

```bash
# Compile TypeScript
npm run compile

# Watch mode (auto-recompile on changes)
npm run watch
```

To debug the extension, press **F5** in VS Code to launch an Extension Development Host with the extension loaded.

### Package .vsix

```bash
npx @vscode/vsce package --no-dependencies
```

### Project Structure

```text
src/
├── extension.ts   # Extension entry point, activation & commands
├── provider.ts    # Language model provider implementation
├── api.ts         # API call logic (streaming, thinking, vision)
├── models.ts      # Preset model definitions per vendor
└── types.ts       # Shared TypeScript interfaces
```

## Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feat/my-feature`
3. **Commit** your changes: `git commit -m "feat: add my feature"`
4. **Push** to the branch: `git push origin feat/my-feature`
5. **Open** a Pull Request

### Guidelines

- Follow existing code style (TypeScript strict mode)
- Test with at least one provider before submitting
- Keep commit messages clear and descriptive
- One feature/fix per PR when possible

### Ways to Contribute

- **Test a provider** — Pick an untested platform from the TODO list, test it, and report results
- **Add a new provider** — Add model definitions in `models.ts` and register in `extension.ts`
- **Fix bugs** — Check Issues for reported problems
- **Improve docs** — Help with documentation or translations

## Requirements

- VS Code 1.108.0+
- GitHub Copilot extension

## Changelog

### 0.4.0 — 2026-08-30

Pre-release: every provider re-verified against official docs. **GLM API keys must be re-entered** (vendor ID changed).

- **Renames**: Bigmodel Plan → **GLM Coding Plan CN** (vendor ID now `glm-coding-plan-cn`), Qwen → **Qwen Token Plan**, MiniMax → **MiniMax Token Plan CN**
- **Kimi split** into Kimi Code Plan (`moonshot`) and Moonshot Open Platform (`moonshot-open`): k3, k3-256k, kimi-for-coding(-highspeed), kimi-k3, kimi-k2.7-code(-highspeed), kimi-k2.6
- **Volcengine split** into Volcengine Coding Plan CN (`volcengine`) and Volcengine Agent Plan CN (`volcengine-agent-plan`): Doubao Seed 2.1 Turbo / Seed Evolving / 2.0 Lite (plus 2.0 Mini and Kimi K3 on Agent Plan) hosted alongside kimi-k2.7-code, minimax-m3, deepseek-v4-flash/pro and glm-5.3(-flash); doubao-seed-2.0-pro, ark-code-latest and the stale third-party IDs are gone
- **New models**: deepseek-v4-flash-vision-exp, qwen3.7-max, qwen3.6-flash, glm-5.3 / glm-5.3-flash; lineups trimmed to what each platform actually serves (GLM Coding endpoint keeps only 5.3 / 5.3-Flash)
- **Thinking semantics overhauled**: new `thinkingLocked` (no picker menu) for K2.7 Code and MiniMax M2.x whose thinking cannot be disabled; three-level Low/High/Max menu for Kimi K3 and GLM-5.3(-Flash); Low added to DeepSeek where None genuinely disables; MiniMax-M3 and Volcengine "None" now send an explicit disable
- **Doc-verified effort knobs**: DeepSeek `reasoning_effort` (low/high/max), Qwen `thinking_budget` (max 32768), DashScope-hosted GLM/DeepSeek on `reasoning_effort`, Zhipu `tool_stream` for streaming tool calls, MiniMax `max_completion_tokens`
- **Reliability**: reasoning_content backfilled for tool loops on DeepSeek, GLM and Kimi Open Platform; vision lists refreshed (deepseek-v4-flash-vision-exp, glm-5.3-flash, MiniMax-M3, five Qwen models)
- **Custom model support removed**: the `custom-openai` provider, the per-vendor `customModelIds` settings and the Add Custom Model ID command are gone — VS Code's built-in custom model flow covers this

### 0.3.0 — 2026-05-08

- **Per-model Thinking Effort picker** in Copilot model selector — hover a thinking-capable model and choose effort for the next turn, no global setting needed
  - **DeepSeek V4** menu: None / High / Max (matches the V4 API's `reasoning_effort` domain)
  - 4-level menu (None / Low / Medium / High) for Qwen reasoning models
  - 2-level menu (None / On) for GLM, Kimi, MiniMax, and Volcengine reasoning models
- **DeepSeek model list updated** from `deepseek-chat` / `deepseek-reasoner` to `deepseek-v4-flash` / `deepseek-v4-pro` (1M input, 384K output, both reasoning-capable)
- **Removed** global `omniCopilot.enableThinking` and `omniCopilot.thinkingEffort` settings, the matching status-bar items, and `OmniCopilot: Toggle Thinking Mode` / `Set Thinking Effort` commands — picker covers all cases now
- Vendor-specific reasoning mapping reworked to handle the full None / On / Low / Medium / High / Max space:
  - DeepSeek: `reasoning_effort: high|max` when enabled, omitted when None
  - Qwen: `enable_thinking` + `thinking_budget` (1024 / 4096 / 16384 tokens; max → 16384)
  - Moonshot: explicit `thinking: { type: "enabled"|"disabled" }`
  - Volcengine: `thinking: { type: "enabled" }` only when enabled
  - Zhipu / MiniMax: no API knob, picker only controls output stripping

### 0.2.0 — 2026-04-30

- Add user-configurable max input context length cap (presets 4K–1M + custom 1K-2M tokens), shown in status bar

### 0.1.3 — 2026-04-12

- Add Volcengine Plan provider with 8 models (doubao-seed, minimax-m2.5, glm-4.7, deepseek-v3.2, kimi-k2.5)
- Gate `reasoning_content` field by vendor capability — only send it for DeepSeek, Qwen, Moonshot/Kimi, and Zhipu; avoids request rejection on strict backends (Volcengine, MiniMax, custom)
- Extract shared `buildOpenAIMessages` helper to deduplicate message-serialization logic between `MultiModelChatProvider` and `CustomOpenAIProvider`
- Add `reasoning_content` handling in `CustomOpenAIProvider`

### 0.1.2 — 2026-04-09

- Add Bigmodel Plan (Zhipu) provider with GLM-5.1, GLM-5-Turbo, GLM-4.7, GLM-4.5-Air models
- Enable thinking capability for Zhipu models
- Normalize Zhipu model IDs

### 0.1.1 — 2026-04-07

- Enable thinking capability for MiniMax vendor
- Enhance thinking support logic in both `MultiModelChatProvider` and `CustomOpenAIProvider`
- Fix: flush remaining thinking buffer and pending tool calls after stream ends
- Add MIT LICENSE file
- Fix repository URL in package.json

### 0.1.0 — 2026-04-06

- Initial release
- Multi-model provider architecture with DeepSeek, Moonshot (Kimi), Qwen, MiniMax support
- Custom OpenAI-compatible provider for any endpoint
- Thinking mode with `<think>` tag parsing and collapsible UI (via `LanguageModelThinkingPart`)
- Vision support for image-capable models
- Tool calling / function calling support
- Custom model ID management via settings and command palette
- Configurable thinking effort (low / medium / high)

## License

MIT
