# More Models Copilot Provider

[中文版](#中文说明)

A VS Code extension that lets you use models from multiple LLM platforms in GitHub Copilot Chat as language model providers.

## Supported Providers

| Provider | Vendor ID | Models |
|----------|-----------|--------|
| DeepSeek | `deepseek` | deepseek-chat, deepseek-reasoner |
| Zhipu (GLM) | `zhipu` | glm-5, glm-4.7, glm-4.7-flash, glm-4-long, glm-4.6v |
| Moonshot (Kimi) | `moonshot` | kimi-for-coding |
| Qwen | `qwen` | qwen3.6-plus, qwen3-max, qwen3.5-flash, qwen3-coder-plus |
| MiniMax | `minimax` | MiniMax-M2.7, MiniMax-M2.7-highspeed, MiniMax-M2.5 |
| Doubao | `doubao` | doubao-seed-2.0-lite, doubao-1.5-pro-32k, doubao-1.5-pro-256k, doubao-1.5-thinking-pro, doubao-1.5-vision-pro |
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
| `moreModels.thinkingEffort` | Thinking effort level (low/medium/high) | `medium` |
| `moreModels.enableVision` | Enable vision for supported models | `true` |
| `moreModels.<vendor>.customModelIds` | Custom model IDs for each vendor | `[]` |

## Requirements

- VS Code 1.108.0+
- GitHub Copilot extension

---

## 中文说明

一个 VS Code 扩展，允许你在 GitHub Copilot Chat 中使用来自多个大模型平台的模型作为语言模型提供方。

### 支持的提供方

| 提供方 | Vendor ID | 模型 |
|--------|-----------|------|
| DeepSeek | `deepseek` | deepseek-chat, deepseek-reasoner |
| 智谱 (GLM) | `zhipu` | glm-5, glm-4.7, glm-4.7-flash, glm-4-long, glm-4.6v |
| Moonshot (Kimi) | `moonshot` | kimi-for-coding |
| 通义千问 | `qwen` | qwen3.6-plus, qwen3-max, qwen3.5-flash, qwen3-coder-plus |
| MiniMax | `minimax` | MiniMax-M2.7, MiniMax-M2.7-highspeed, MiniMax-M2.5 |
| 豆包 | `doubao` | doubao-seed-2.0-lite, doubao-1.5-pro-32k, doubao-1.5-pro-256k, doubao-1.5-thinking-pro, doubao-1.5-vision-pro |
| 自定义 | `custom-openai` | 任意 OpenAI 兼容模型 |

### 已测试且可用

以下平台已经过测试并确认可用：

- **DeepSeek 开放平台** (`platform.deepseek.com`)
- **Kimi Code**（Kimi 编程模型）
- **MiniMax Token Plan 国内版** (`platform.minimaxi.com`)
- **通义千问 / 阿里百炼平台** (`dashscope.aliyuncs.com`)

### 待办事项

- [ ] 测试火山引擎（豆包）
- [ ] 测试 GLM 开放平台
- [ ] 测试 Qwen Coding Plan
- [ ] 测试 GLM Coding Plan
- [ ] 测试 Kimi 开放平台
- [ ] 支持硅基流动
- [ ] 支持 MiniMax 国际版
- [ ] 支持 GLM 国际版
- [ ] 支持硅基流动国际版
- [ ] 验证思考力度（低 / 中 / 高）配置在各提供方上是否真实生效
- [ ] 未完待续……

### 功能

- **多平台支持**：接入多个主流大模型平台，以及任意 OpenAI 兼容端点
- **思考模式**：支持推理能力的模型会展示可折叠的思考过程
- **视觉支持**：支持视觉的模型（kimi-for-coding、qwen3.6-plus、glm-4.6v、doubao-1.5-vision-pro）可以读取 Copilot Chat 中附加的图片
- **工具调用**：兼容模型的函数调用支持
- **自定义模型 ID**：可通过设置或命令面板为任意提供方添加自定义模型 ID
- **可配置思考力度**：低 / 中 / 高三档思考力度

### 使用方法

1. 安装扩展
2. 打开 Copilot Chat → 管理模型 → 添加模型
3. 选择提供方并输入 API 密钥
4. 开始与所选模型对话

### 环境要求

- VS Code 1.108.0+
- GitHub Copilot 扩展

## License

MIT
