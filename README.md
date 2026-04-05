# More Models Copilot Provider

[中文版](README.zh-CN.md)

A VS Code extension that lets you use models from multiple LLM platforms in GitHub Copilot Chat as language model providers.

## Supported Providers

| Provider | Vendor ID | Models |
|----------|-----------|--------|
| DeepSeek | `deepseek` | deepseek-chat, deepseek-reasoner |
| Zhipu (GLM) | `zhipu` | glm-5, glm-4.7, glm-4.7-flash, glm-4-long, glm-4.6v |
| Moonshot (Kimi) | `moonshot` | kimi-for-coding |
| Qwen | `qwen` | qwen3.6-plus, qwen3-max, qwen3.5-flash, qwen3-coder-plus |
| MiniMax | `minimax` | MiniMax-M2.7, MiniMax-M2.7-highspeed, MiniMax-M2.5 |
| Doubao | `doubao` | doubao-seed-2-0-lite-260215, doubao-1-5-pro-32k-250115, doubao-1-5-pro-256k-250115, doubao-1-5-thinking-pro-250415, doubao-1-5-vision-pro-32k-250115 |
| Custom | `custom-openai` | Any OpenAI-compatible model |

## Tested & Working

The following platforms have been tested and confirmed working:

- **DeepSeek Open Platform** (`platform.deepseek.com`)
- **Kimi Code** (Kimi coding model)
- **MiniMax Token Plan (China)** (`platform.minimaxi.com`)
- **Qwen / Alibaba DashScope** (`dashscope.aliyuncs.com`)

## TODO

- [ ] Test Volcengine (Doubao)
- [ ] Test GLM Open Platform
- [ ] Test Qwen Coding Plan
- [ ] Test GLM Coding Plan
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
- **Vision Support**: Vision-capable models (kimi-for-coding, qwen3.6-plus, glm-4.6v, doubao-1.5-vision-pro) can read images attached in Copilot Chat
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

- **Command Palette**: Run `More Models: Add Custom Model ID`
- **Settings**: Edit `moreModels.<vendor>.customModelIds` array in settings.json

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `moreModels.enableThinking` | Thinking mode (auto/always/never) | `auto` |
| `moreModels.thinkingEffort` | Thinking effort level (low/medium/high) | `medium` |
| `moreModels.enableVision` | Enable vision for supported models | `true` |
| `moreModels.<vendor>.customModelIds` | Custom model IDs for each vendor | `[]` |

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [VS Code](https://code.visualstudio.com/) 1.108.0+
- [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) extension installed

### Setup

```bash
git clone https://github.com/LyaQanYi/More-Models-Copilot-Provider.git
cd More-Models-Copilot-Provider
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

## License

MIT
