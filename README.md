# OmniCopilot

[中文版](README.zh-CN.md)

A VS Code extension that lets you use models from multiple LLM platforms in GitHub Copilot Chat as language model providers.

## Supported Providers

| Provider | Vendor ID | Models |
|----------|-----------|--------|
| DeepSeek | `deepseek` | deepseek-chat, deepseek-reasoner |
| Bigmodel Plan (GLM) | `zhipu` | GLM-5.1, GLM-5-Turbo, GLM-4.7, GLM-4.5-Air |
| Moonshot (Kimi) | `moonshot` | kimi-for-coding |
| Qwen | `qwen` | qwen3.6-plus, qwen3-max, qwen3.5-flash, qwen3-coder-plus |
| MiniMax | `minimax` | MiniMax-M2.7, MiniMax-M2.7-highspeed, MiniMax-M2.5 |
| Volcengine Plan | `volcengine` | doubao-seed-2.0-code, doubao-seed-2.0-pro, doubao-seed-2.0-lite, doubao-seed-code, minimax-m2.5, glm-4.7, deepseek-v3.2, kimi-k2.5 |
| Custom | `custom-openai` | Any OpenAI-compatible model |

## Tested & Working

The following platforms have been tested and confirmed working:

- **DeepSeek Open Platform** (`platform.deepseek.com`)
- **Kimi Code** (Kimi coding model)
- **MiniMax Token Plan (China)** (`platform.minimaxi.com`)
- **Qwen / Alibaba DashScope** (`dashscope.aliyuncs.com`)
- **Bigmodel Plan** (`open.bigmodel.cn` Coding API)

## TODO

- [ ] Test Volcengine Plan
- [ ] Test Qwen Coding Plan
- [ ] Test Kimi Open Platform
- [ ] Support SiliconFlow
- [ ] Support MiniMax International
- [ ] Support GLM International
- [ ] Support SiliconFlow International
- [ ] Verify thinking effort levels (low/medium/high) actually take effect across providers
- [ ] To be continued…

## Features

- **Multiple Providers**: Access models from major LLM platforms plus any OpenAI-compatible endpoint
- **Thinking Support**: Models with reasoning capabilities show collapsible thinking sections
- **Vision Support**: Vision-capable models (kimi-for-coding, qwen3.6-plus) can read images attached in Copilot Chat
- **Tool Calling**: Function calling support for compatible models
- **Custom Model IDs**: Add custom model IDs to any provider via Settings or command palette
- **Configurable Thinking Effort**: Low / Medium / High thinking effort levels

## Usage

1. Install the extension
2. Open Copilot Chat → Manage Models → Add Model
3. Select a provider and enter your API key
4. Start chatting with the selected model

## Custom Model IDs

You can add custom model IDs to any provider:

- **Command Palette**: Run `OmniCopilot: Add Custom Model ID`
- **Settings**: Edit `omniCopilot.<vendor>.customModelIds` array in settings.json

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `omniCopilot.enableThinking` | Thinking mode (auto/always/never) | `auto` |
| `omniCopilot.thinkingEffort` | Thinking effort level (low/medium/high) | `medium` |
| `omniCopilot.enableVision` | Enable vision for supported models | `true` |
| `omniCopilot.<vendor>.customModelIds` | Custom model IDs for each vendor | `[]` |

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
