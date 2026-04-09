# OmniCopilot

[English](README.md)

一个 VS Code 扩展，允许你在 GitHub Copilot Chat 中使用来自多个大模型平台的模型作为语言模型提供方。

## 支持的提供方

| 提供方 | Vendor ID | 模型 |
|--------|-----------|------|
| DeepSeek | `deepseek` | deepseek-chat, deepseek-reasoner |
| Bigmodel Plan (GLM) | `zhipu` | GLM-5.1, GLM-5-Turbo, GLM-4.7, GLM-4.5-Air |
| Moonshot (Kimi) | `moonshot` | kimi-for-coding |
| 通义千问 | `qwen` | qwen3.6-plus, qwen3-max, qwen3.5-flash, qwen3-coder-plus |
| MiniMax | `minimax` | MiniMax-M2.7, MiniMax-M2.7-highspeed, MiniMax-M2.5 |
| 豆包 | `doubao` | doubao-seed-2-0-lite-260215, doubao-1-5-pro-32k-250115, doubao-1-5-pro-256k-250115, doubao-1-5-thinking-pro-250415, doubao-1-5-vision-pro-32k-250115 |
| 自定义 | `custom-openai` | 任意 OpenAI 兼容模型 |

## 已测试且可用

以下平台已经过测试并确认可用：

- **DeepSeek 开放平台** (`platform.deepseek.com`)
- **Kimi Code**（Kimi 编程模型）
- **MiniMax Token Plan 国内版** (`platform.minimaxi.com`)
- **通义千问 / 阿里百炼平台** (`dashscope.aliyuncs.com`)
- **智谱编程计划 Bigmodel Plan** (`open.bigmodel.cn` Coding API)

## 待办事项

- [ ] 测试火山引擎（豆包）
- [ ] 测试 Qwen Coding Plan
- [ ] 测试 Kimi 开放平台
- [ ] 支持硅基流动
- [ ] 支持 MiniMax 国际版
- [ ] 支持 GLM 国际版
- [ ] 支持硅基流动国际版
- [ ] 验证思考力度（低 / 中 / 高）配置在各提供方上是否真实生效
- [ ] 未完待续……

## 功能

- **多平台支持**：接入多个主流大模型平台，以及任意 OpenAI 兼容端点
- **思考模式**：支持推理能力的模型会展示可折叠的思考过程
- **视觉支持**：支持视觉的模型（kimi-for-coding、qwen3.6-plus、doubao-1.5-vision-pro）可以读取 Copilot Chat 中附加的图片
- **工具调用**：兼容模型的函数调用支持
- **自定义模型 ID**：可通过设置或命令面板为任意提供方添加自定义模型 ID
- **可配置思考力度**：低 / 中 / 高三档思考力度

## 使用方法

1. 安装扩展
2. 打开 Copilot Chat → 管理模型 → 添加模型
3. 选择提供方并输入 API 密钥
4. 开始与所选模型对话

## 自定义模型 ID

可以为任意提供方添加自定义模型 ID：

- **命令面板**：执行 `OmniCopilot: Add Custom Model ID`
- **设置**：编辑 settings.json 中的 `omniCopilot.<vendor>.customModelIds` 数组

## 配置项

| 设置 | 说明 | 默认值 |
|------|------|--------|
| `omniCopilot.enableThinking` | 思考模式（auto/always/never） | `auto` |
| `omniCopilot.thinkingEffort` | 思考力度（low/medium/high） | `medium` |
| `omniCopilot.enableVision` | 启用视觉/图片输入 | `true` |
| `omniCopilot.<vendor>.customModelIds` | 各提供方的自定义模型 ID | `[]` |

## 开发

### 前置条件

- [Node.js](https://nodejs.org/)（推荐 LTS 版本）
- [VS Code](https://code.visualstudio.com/) 1.108.0+
- 已安装 [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) 扩展

### 初始化

```bash
git clone https://github.com/LyaQanYi/OmniCopilot.git
cd OmniCopilot
npm install
```

### 编译与运行

```bash
# 编译 TypeScript
npm run compile

# 监听模式（修改后自动重新编译）
npm run watch
```

调试扩展时，在 VS Code 中按 **F5** 即可启动扩展开发宿主（Extension Development Host），扩展会自动加载。

### 打包 .vsix

```bash
npx @vscode/vsce package --no-dependencies
```

### 项目结构

```text
src/
├── extension.ts   # 扩展入口，激活逻辑与命令注册
├── provider.ts    # 语言模型提供方实现
├── api.ts         # API 调用逻辑（流式、思考、视觉）
├── models.ts      # 各提供方的预设模型定义
└── types.ts       # 共享 TypeScript 接口
```

## 贡献

欢迎贡献！以下是参与方式：

1. **Fork** 本仓库
2. **创建**功能分支：`git checkout -b feat/my-feature`
3. **提交**更改：`git commit -m "feat: add my feature"`
4. **推送**到分支：`git push origin feat/my-feature`
5. **发起** Pull Request

### 贡献指南

- 遵循现有代码风格（TypeScript 严格模式）
- 提交前至少用一个提供方测试通过
- 保持 commit message 清晰、有描述性
- 尽量一个 PR 对应一个功能/修复

### 贡献方向

- **测试提供方** — 从待办事项中选一个未测试的平台，测试并反馈结果
- **添加新提供方** — 在 `models.ts` 中添加模型定义，在 `extension.ts` 中注册
- **修复 Bug** — 查看 Issues 中报告的问题
- **完善文档** — 帮助改进文档或翻译

## 环境要求

- VS Code 1.108.0+
- GitHub Copilot 扩展

## License

MIT
