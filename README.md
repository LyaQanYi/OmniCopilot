# OmniCopilot

[中文版](README.zh-CN.md)

A VS Code extension that lets you use models from multiple LLM platforms in GitHub Copilot Chat as language model providers.

## Supported Providers

| Provider | Vendor ID | Models |
|----------|-----------|--------|
| DeepSeek | `deepseek` | deepseek-flash, deepseek-v4-pro |
| GLM Coding Plan CN | `glm-coding-plan-cn` | GLM-5.3, GLM-5.3-Flash, GLM-5.3-Highspeed, GLM-4.6V |
| GLM Coding Plan | `glm-coding-plan` | GLM-5.3, GLM-5.3-Flash, GLM-5.3-Highspeed, GLM-5.2(-highspeed), GLM-5-Turbo, GLM-4.7 |
| Kimi Code Plan | `moonshot` | k3, k3-256k, kimi-for-coding, kimi-for-coding-highspeed |
| Kimi Code Plan (kimi.ai) | `kimi-code-plan-intl` | k3, k3-256k, kimi-for-coding, kimi-for-coding-highspeed |
| Moonshot (Open Platform) | `moonshot-open` | kimi-k3, kimi-k2.7-code, kimi-k2.7-code-highspeed, kimi-k2.6 |
| Moonshot AI (International) | `moonshot-intl` | kimi-k3, kimi-k2.7-code, kimi-k2.7-code-highspeed, kimi-k2.6 |
| Alibaba Token Plan | `qwen` | auto, qwen3.8-max, qwen3.8-flash, qwen3.7-max, qwen3.7-plus, qwen3.6-flash, glm-5.3, glm-5.2, deepseek-v4-pro(-0813), deepseek-v4-flash-0731, deepseek-v4.1-flash |
| Alibaba Coding Plan (China) | `alibaba-coding-plan-cn` | qwen3.7-plus, qwen3.6-plus, qwen3-coder-plus, qwen3-coder-next, qwen3-max, glm-5, kimi-k2.5, MiniMax-M2.5 |
| Alibaba Coding Plan | `alibaba-coding-plan` | the same 8-model set (international endpoint) |
| MiniMax Token Plan CN | `minimax` | MiniMax-M3.1-Flash-Preview, MiniMax-M3, MiniMax-M2.7, MiniMax-M2.7-highspeed, MiniMax-M2.5 |
| MiniMax International | `minimax-intl` | MiniMax-M3.1-Flash-Preview, MiniMax-M3, MiniMax-M2.7, MiniMax-M2.7-highspeed, MiniMax-M2.5 |
| Volcengine Coding Plan CN | `volcengine` | doubao-seed-2.1-pro, doubao-seed-2.1-turbo, doubao-seed-2.1-lite, doubao-seed-2.0-mini, doubao-seed-2.0-lite, doubao-seed-evolving, minimax-m3, kimi-k2.7-code, kimi-k2.8-preview, kimi-k3, glm-5.3, glm-5.3-flash, deepseek-v4-flash, deepseek-v4-pro, deepseek-v4.1-flash |
| Volcengine Agent Plan CN | `volcengine-agent-plan` | the same base 13-model set (kimi-k3 requires Medium+ plans) |
| Volcengine Ark (Pay-as-you-go) | `volcengine-ark` | dated snapshot IDs: doubao-seed-2-1-pro/turbo, 2-0-pro/mini/lite/code, seed-evolving, glm-5-2, glm-5-3-flash, deepseek-v4 ga snapshots |
| Tencent Hunyuan Coding Plan | `tencent-coding-plan` | hunyuan-2.0-thinking, hunyuan-2.0-instruct, hunyuan-t1, hunyuan-turbos, tc-code-latest, glm-5, kimi-k2.5, minimax-m2.5 |
| Tencent Hunyuan Token Plan | `tencent-token-plan` | hy4-preview, hy3 |
| Tencent TokenHub | `tencent-tokenhub` | hy4-preview, hy3 |
| StepFun Step Plan | `stepfun-step-plan-cn` | step-5-preview, step-3.7-flash, step-3.5-flash |
| StepFun Step Plan (Global) | `stepfun-step-plan` | step-5-preview, step-3.7-flash, step-3.5-flash |
| SCNet Token Plan (China Telecom) | `scnet-token-plan` | DeepSeek-V4.1-Flash, DeepSeek-V4-Pro, DeepSeek-V4-Flash, GLM-5.3(-Flash), GLM-5.2, Kimi-K3, Kimi-K2.7-Code, MiniMax-M3, Qwen3.8-Max, Qwen3.8-Flash |
| SiliconFlow CN | `siliconflow-cn` | zai-org/GLM-5.2, Pro/Kimi-K2.6, DeepSeek-V4-Pro/Flash, Qwen3.5-397B-A17B, Step-3.5-Flash |
| SiliconFlow | `siliconflow` | zai-org/GLM-5.3(-Flash), GLM-5.2, Kimi-K3, Kimi-K2.7-Code, DeepSeek-V4-Pro/Flash, Qwen3.8-2.4T-A95B, MiniMax-M3, LongCat-2.0, Hy3, gpt-oss-120b |
| Zhipu AI (Pay-as-you-go) | `zhipu` | glm-5.3, glm-5.3-flash, glm-5.3-flashx, glm-5.2, glm-5v-turbo |
| Z.AI (Pay-as-you-go) | `zai` | glm-5.3, glm-5.3-flash, glm-5.3-flashx, glm-5.2, glm-5-turbo, glm-5v-turbo |
| MiMo Token Plan CN | `mimo-token-plan-cn` | mimo-v2.6-pro, mimo-v2.6-flash |
| MiMo Token Plan SGP | `mimo-token-plan-sgp` | mimo-v2.6-pro, mimo-v2.6-flash |
| MiMo Token Plan AMS | `mimo-token-plan-ams` | mimo-v2.6-pro, mimo-v2.6-flash |
| Xiaomi MiMo (Pay-as-you-go) | `mimo` | mimo-v2.6-pro, mimo-v2.6-flash, mimo-v2.6-pro-ultraspeed |
| Umans AI Coding Plan | `umans-ai-coding-plan` | umans-coder, umans-flash, umans-kimi-k3, umans-glm-5.3-flash, umans-deepseek-v4.1-flash, umans-qwen3.6-35b-a3b |
| LongCat (Meituan) | `longcat` | LongCat-2.0 |
| SenseNova (SenseTime) | `sensenova` | kimi-k3, glm-5.2, deepseek-v4-pro, deepseek-v4-flash, sensenova-6.8-flash-lite |
| KUAE Cloud Coding Plan | `kuae` | GLM-4.7 |

> [!NOTE]
> The 22 providers added in 0.5.0 (SiliconFlow, Tencent Hunyuan, StepFun, SCNet, Alibaba Coding Plan, MiniMax International, Moonshot international, Kimi kimi.ai, MiMo SGP/AMS/pay-as-you-go, Umans, LongCat, SenseNova, KUAE, Zhipu/Z.AI/Ark pay-as-you-go, …) source their model line-ups, context/output limits and thinking domains from [models.dev](https://models.dev) (community-maintained catalog, data as of 2026-10-01) and are **not individually tested yet**; endpoints and key regimes follow each vendor's official docs — file an issue if you hit 4xx/parameter errors.

## Tested & Working

The following platforms have been tested and confirmed working:

- **DeepSeek Open Platform** (`platform.deepseek.com`)
- **Kimi Code Plan** (`kimi.com/code`)
- **MiniMax Token Plan CN** (`platform.minimaxi.com`)
- **GLM Coding Plan CN** (`open.bigmodel.cn` Coding API)
- **Volcengine Coding Plan / Agent Plan** (`console.volcengine.com`)
- **Alibaba Token Plan** (`platform.qianwenai.com`)
- **MiMo Token Plan CN** (`platform.xiaomimimo.com`)

> [!NOTE]
> **GLM Coding Plan billing**: per Zhipu's docs, the Coding endpoint (`open.bigmodel.cn/api/coding/paas/v4`) only counts toward the Coding Plan quota when called from officially supported tools (Claude Code, Kilo Code, OpenCode, TRAE, CodeBuddy, etc.). VS Code Copilot Chat is not on that list — success is not guaranteed, usage may be billed at pay-as-you-go API rates instead of your plan's credits, and Zhipu's usage notes treat non-listed-tool calls as a violation that may lead to throttling or account restrictions. Keep an eye on your billing and account status. The same caveat applies to the international **GLM Coding Plan** on Z.AI (`api.z.ai/api/coding/paas/v4`): it is strictly limited to officially supported tools, and team plan members must use the team plan key (not interchangeable with other Z.AI API keys).
<!---->

> [!WARNING]
> **Alibaba Token Plan terms and endpoint**: the extension points at the Token Plan endpoint (`token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`) and expects the subscription key (`sk-sp-…`) from platform.qianwenai.com — Token Plan and pay-as-you-go credentials/endpoints are fully isolated and must not be mixed (pay-as-you-go keys (`sk-ws-…`) belong to `dashscope.aliyuncs.com/compatible-mode/v1`). The key is also restricted to interactive coding/agent tools (Claude Code, Cursor, Qwen Code, Qoder, OpenClaw, etc.) — the docs explicitly forbid generic API usage and state that violations may suspend the subscription or ban the API key. VS Code Copilot Chat is not on the official tool list, so use at your own discretion and watch your account status.
<!---->

> [!WARNING]
> **MiMo Token Plan CN terms and endpoint**: the extension points at the Token Plan CN cluster (`token-plan-cn.xiaomimimo.com/v1`; Singapore/Europe clusters exist at `token-plan-sgp/ams.xiaomimimo.com/v1`) and expects the plan's dedicated key (`tp-…` personal / `ttp-…` team) from platform.xiaomimimo.com — plan keys and pay-as-you-go keys (`sk-…` on `api.xiaomimimo.com/v1`) are fully isolated and must not be mixed. The plan's quota may only be used inside coding tools (OpenCode, OpenClaw, Claude Code, etc.); the docs classify non-coding API usage as abuse that may suspend the subscription or ban the key. VS Code Copilot Chat is not on the official tool list, so use at your own discretion and watch your account status.
<!---->

> [!WARNING]
> **Terms risk on the newly added plan providers**: the new Coding/Token Plan subscriptions (Alibaba Coding Plan on `coding.dashscope.aliyuncs.com`, Tencent Hunyuan plans, StepFun Step Plan, SCNet, KUAE, Umans, Kimi international on kimi.ai, …) generally mirror the Qwen/GLM/MiMo Token Plans — quota is restricted to officially listed coding tools, VS Code Copilot Chat is not on those lists, and calls from unlisted tools may be billed pay-as-you-go, throttled, or treated as a violation. Plan keys and pay-as-you-go keys are not interchangeable (the Zhipu/Z.AI/Ark pay-as-you-go vendors need each platform's pay-as-you-go key). Read each vendor's terms before use.
<!---->

> [!NOTE]
> Model catalog data for the providers added in 0.5.0 comes from [models.dev](https://models.dev) and is not individually verified against every vendor's official docs yet.

## TODO

- [ ] Test Kimi Open Platform
- [ ] Individually test the 22 providers added in 0.5.0 (models.dev-sourced, not yet cross-checked against official docs)
- [ ] Sink vendor-specific serialization knobs (outputLimitField, acceptsReasoningContent) into VendorConfig instead of vendor-ID switches
- [ ] Add request-serialization tests for MiMo tool-call history (thinking On/None, including history where VS Code dropped the thinking part)
- [ ] Test GLM Coding Plan (Z.AI international)
- [ ] Verify thinking effort levels (DeepSeek None/High/Max; others None/Low/Medium/High or None/On) actually take effect across providers
- [ ] To be continued…

## Features

- **Multiple Providers**: 30+ platforms/endpoints, 186 models in total
- **Per-Model Thinking Effort**: Hover any thinking-capable model in the Copilot picker to pick the effort level for the next turn — no need to flip a global switch
  - **DeepSeek V4** menu: None / Low / High / Max (matches the V4 API's reasoning_effort domain; thinking is on by default, None disables it explicitly)
  - **Kimi K3** (Code Plan `k3` / `k3-256k` / `kimi-for-coding`, Open Platform & international `kimi-k3`, Volcengine-hosted `kimi-k3`): Low / High / Max — no None option, thinking is always on; effort maps to reasoning_effort
  - **GLM-5.3 family** menu: Low / High / Max — thinking always on (covers GLM-5.3-Highspeed / FlashX and the GLM-5.3 hosting on SiliconFlow, SCNet, Umans, SenseNova; the Coding endpoint auto-routes legacy GLM IDs like glm-5.1 / glm-4.7 to the 5.3 line)
  - **GLM-5.2 family** menu: High / Max — always-on thinking with a native high|max domain (Z.AI Coding Plan, Zhipu/Z.AI pay-as-you-go, SiliconFlow hosting)
  - **MiniMax M3.1** menu: Low / Medium / High / XHigh / Max — always-on thinking over the full native reasoning_effort domain
  - **SiliconFlow-hosted Kimi/DeepSeek/Qwen/MiniMax/LongCat/Hy3/gpt-oss**: None / Low / High / Max — mapped to enable_thinking + thinking_budget (128–32768)
  - **SCNet / SenseNova-hosted DeepSeek V4 Pro**: None / High / Max (native high|max; low/medium clamp to high)
  - 4-level menu (None / Low / Medium / High) for Qwen reasoning models, StepFun Step models, Ark/Volcengine doubao models, and the Umans/SenseNova effort-capable entries
  - 2-level menu (None / On) for models that only expose a thinking on/off knob (Kimi K2.6, MiniMax-M3, pre-5.3 GLM, GLM-5V-Turbo / 5-Turbo / 4.7, Tencent hy3/hy4 and hosted entries, Alibaba Coding Plan reasoning models, the whole MiMo v2.6 line) — MiniMax-M3's and MiMo's None genuinely disables thinking
  - Thinking-locked models expose no menu at all: the K2.7 Code high-speed variants (`kimi-for-coding-highspeed`, `kimi-k2.7-code`(-highspeed)), MiniMax M2.x, and some SiliconFlow CN snapshots — their "None" would silently reroute the model or keep thinking on anyway
- **Thinking UI**: Models with reasoning capabilities show collapsible thinking sections via `LanguageModelThinkingPart`
- **Context Gauge**: Streams `stream_options: { include_usage: true }` and reports the real token usage back to Copilot Chat, so the context-window indicator shows actual usage instead of 0; falls back to CJK-aware token estimation (Chinese ≈ 1 token/char) before the first real usage arrives
- **Vision Support**: Every model flagged image-capable in the catalog (deepseek-flash, the GLM-5.3-Flash/FlashX/4.6V/5V-Turbo line, Kimi K2.5+/K3, MiniMax-M3/M3.1, the Qwen vision models, all doubao models, the MiMo v2.6 line, step-5/3.7, the Umans line-up, SenseNova 6.8, …) can read images attached in Copilot Chat
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

> Full release history lives on the [Releases](https://github.com/LyaQanYi/OmniCopilot/releases) page.

### 0.4.5 — 2026-09-29

- **New provider: MiMo Token Plan CN** (`mimo-token-plan-cn`, Xiaomi) — the first vendor to follow the new ID convention: kebab-case lowercase of the display name (existing vendor IDs stay unchanged) — `mimo-v2.6-pro` (trillion-param flagship) and `mimo-v2.6-flash`, both 1M context / 128K output with omni (vision) input, via the plan's OpenAI-compatible CN cluster endpoint (`token-plan-cn.xiaomimimo.com/v1`). Plan keys are `tp-`/`ttp-`-prefixed and isolated from pay-as-you-go `sk-` keys. mimo-v2.5 / mimo-v2.5-pro retire 2026-10-21 and are not included; ASR/TTS models stay out of scope; mimo-v2.6-pro-ultraspeed is a custom-service offering outside the plan
- **MiMo thinking & params per the deep-thinking doc**: `thinking: {type: enabled|disabled}` (default on — None sends an explicit disable; no effort knob, so the picker shows the None/On menu); output capped via `max_completion_tokens` (thinking + answer share it); reasoning streams via `reasoning_content` and counts into completion tokens
- **MiMo tool-loop reliability**: with thinking on, assistant turns carrying `tool_calls` must echo `reasoning_content` back or the API returns 400 — covered by the catalog-declared `needsReasoningBackfillWhenThinking` flag, and `reasoning_content` on history is now serialized for the `mimo-token-plan-cn` vendor

## License

MIT
