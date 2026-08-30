# OmniCopilot

[English](README.md)

一个 VS Code 扩展，允许你在 GitHub Copilot Chat 中使用来自多个大模型平台的模型作为语言模型提供方。

## 支持的提供方

| 提供方 | Vendor ID | 模型 |
|--------|-----------|------|
| DeepSeek | `deepseek` | deepseek-v4-flash, deepseek-v4-pro, deepseek-v4-flash-vision-exp |
| GLM Coding Plan CN | `glm-coding-plan-cn` | GLM-5.3, GLM-5.3-Flash |
| Kimi Code Plan | `moonshot` | k3, k3-256k, kimi-for-coding, kimi-for-coding-highspeed |
| Moonshot (Open Platform) | `moonshot-open` | kimi-k3, kimi-k2.7-code, kimi-k2.7-code-highspeed, kimi-k2.6 |
| Qwen Token Plan | `qwen` | qwen3.8-max, qwen3.8-flash, qwen3.7-max, qwen3.7-plus, qwen3.6-flash, glm-5.2, deepseek-v4-pro(-0813), deepseek-v4-flash-0731 |
| MiniMax Token Plan CN | `minimax` | MiniMax-M3, MiniMax-M2.7, MiniMax-M2.7-highspeed, MiniMax-M2.5 |
| 火山引擎编程计划 Coding Plan | `volcengine` | doubao-seed-2.1-turbo, doubao-seed-evolving, doubao-seed-2.0-lite, kimi-k2.7-code, minimax-m3, deepseek-v4-flash, deepseek-v4-pro, glm-5.3, glm-5.3-flash |
| 火山引擎智能体计划 Agent Plan | `volcengine-agent-plan` | Coding Plan 全部模型，另加 doubao-seed-2.0-mini 与 kimi-k3 |

## 已测试且可用

以下平台已经过测试并确认可用：

- **DeepSeek 开放平台** (`platform.deepseek.com`)
- **Kimi Code**（Kimi 编程模型）
- **MiniMax Token Plan CN** (`platform.minimaxi.com`)
- **GLM Coding Plan CN**（智谱，`open.bigmodel.cn` Coding API——vendor ID 变更后待复测）

> [!NOTE]
> **GLM Coding Plan 计费说明**：根据智谱官方文档，Coding 端点（`open.bigmodel.cn/api/coding/paas/v4`）只有在官方指定工具（Claude Code、Kilo Code、OpenCode、TRAE、CodeBuddy 等）中调用才计入套餐额度。VS Code Copilot Chat 不在列表中——调用不保证成功，消耗可能按 API 按量计费而非套餐积分；且智谱《使用须知》将非指定工具中的调用视为违规，存在限流或账号受限的风险。请留意账单与账号状态。
<!---->

> [!WARNING]
> **Qwen Token Plan 条款与端点**：本扩展指向 Token Plan 专用端点（`token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`），需使用 platform.qianwenai.com 签发的订阅 Key（`sk-sp-` 开头）——Token Plan 与按量计费的 Key/端点完全隔离、不可混用（按量 Key 为 `sk-ws-` 开头，属 `dashscope.aliyuncs.com/compatible-mode/v1`）。Key 亦仅限在交互式编程/智能体工具（Claude Code、Cursor、Qwen Code、Qoder、OpenClaw 等）中使用——官方文档明确禁止通用 API 调用，违规可能导致订阅暂停或 API Key 被封禁。VS Code Copilot Chat 不在官方工具列表中，请自行斟酌使用并留意账号状态。

## 待办事项

- [ ] 测试火山引擎 Coding Plan / Agent Plan
- [ ] 测试 Qwen Token Plan
- [ ] 测试 Kimi 开放平台
- [ ] 支持硅基流动
- [ ] 支持 MiniMax 国际版
- [ ] 支持 GLM 国际版
- [ ] 支持硅基流动国际版
- [ ] 验证思考力度（DeepSeek None/High/Max；其他 None/Low/Medium/High 或 None/On）在各提供方上是否真实生效
- [ ] 未完待续……

## 功能

- **多平台支持**：接入多个主流大模型平台
- **每模型独立的思考力度选择**：在 Copilot 模型选择器里 hover 任一支持思考的模型，**就地**为这一轮对话选思考等级——不再需要切全局开关
  - **DeepSeek V4** 菜单：None / Low / High / Max（对齐 V4 API 的 reasoning_effort 取值；思考默认开启，None 显式关闭）
  - **Kimi K3**（Code Plan 的 k3 / k3-256k、开放平台的 kimi-k3）：Low / High / Max——无 None 档，思考始终开启；两端都映射到 reasoning_effort
  - **GLM-5.3 / GLM-5.3-Flash** 菜单：Low / High / Max——无 None 档，思考始终开启（Coding 端点会把 glm-5.1、glm-4.7 等旧 ID 自动路由到这两个模型）
  - 4 档菜单（None / Low / Medium / High）：通义千问推理款
  - 2 档菜单（None / On）：仅支持思考开关、无 effort 等级的模型（Kimi K2.6、MiniMax-M3、5.3 之前的 GLM、火山引擎推理款）——MiniMax-M3 的 None 是真关闭思考
  - 思考锁定的模型不提供菜单：K2.7 Code（Code Plan 的 kimi-for-coding(-highspeed)、开放平台的 kimi-k2.7-code(-highspeed)）与 MiniMax M2.x——它们的"None"要么被静默换模型、要么思考照样运行
- **思考 UI**：支持推理的模型会通过 `LanguageModelThinkingPart` 展示可折叠的思考过程
- **视觉支持**：支持视觉的模型（deepseek-v4-flash-vision-exp、glm-5.3-flash、kimi-for-coding、MiniMax-M3、qwen3.8-max、qwen3.8-flash、qwen3.7-plus、qwen3.6-flash）可以读取 Copilot Chat 中附加的图片
- **工具调用**：兼容模型的函数调用支持

## 使用方法

1. 安装扩展
2. 打开 Copilot Chat → 管理模型 → 添加模型
3. 选择提供方并输入 API 密钥
4. 开始与所选模型对话

## 配置项

思考力度现已改为**每模型、每轮**通过 Copilot 模型选择器 hover 出的菜单当场选择，不再有全局思考力度设置。

| 设置 | 说明 | 默认值 |
|------|------|--------|
| `omniCopilot.contextLength` | 最大输入上下文长度（4K–1M 预设，或 `custom`） | `default` |
| `omniCopilot.customContextLength` | 自定义最大输入上下文（仅当 `contextLength` 为 `custom` 时生效） | `131072` |
| `omniCopilot.enableVision` | 启用视觉/图片输入 | `true` |

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

## 更新日志

### 0.4.0 — 2026-08-30

预发布版本：全部提供方已逐项对照官方文档核验。**GLM 的 API Key 需要重新填写**（vendor ID 已变更）。

- **更名**：Bigmodel Plan → **GLM Coding Plan CN**（vendor ID 变更为 `glm-coding-plan-cn`）、Qwen → **Qwen Token Plan**、MiniMax → **MiniMax Token Plan CN**
- **Kimi 拆分**为 Kimi Code Plan（`moonshot`）与 Moonshot 开放平台（`moonshot-open`）：k3、k3-256k、kimi-for-coding(-highspeed)、kimi-k3、kimi-k2.7-code(-highspeed)、kimi-k2.6
- **火山引擎拆分**为火山引擎 Coding Plan CN（`volcengine`）与 Agent Plan CN（`volcengine-agent-plan`）：Doubao Seed 2.1 Turbo / Seed Evolving / 2.0 Lite（Agent Plan 另有 2.0 Mini 与 Kimi K3），托管 kimi-k2.7-code、minimax-m3、deepseek-v4-flash/pro 与 glm-5.3(-flash)；doubao-seed-2.0-pro、ark-code-latest 及过时的第三方 ID 已移除
- **新增模型**：deepseek-v4-flash-vision-exp、qwen3.7-max、qwen3.6-flash、glm-5.3 / glm-5.3-flash；各平台模型列表按实际在售清理（GLM Coding 端点仅保留 5.3 / 5.3-Flash）
- **思考语义重构**：新增 `thinkingLocked`（不渲染菜单）用于 K2.7 Code 与 MiniMax M2.x 等思考无法关闭的模型；Kimi K3 与 GLM-5.3(-Flash) 使用三档 Low/High/Max 菜单；DeepSeek 增加 Low 档（None 真关闭）；MiniMax-M3 与火山引擎的 None 现在会显式发送关闭参数
- **思考参数逐项对齐官方文档**：DeepSeek `reasoning_effort`（low/high/max）、Qwen `thinking_budget`（上限 32768）、千问托管的 GLM/DeepSeek 走 `reasoning_effort`、智谱流式工具调用 `tool_stream`、MiniMax `max_completion_tokens`
- **可靠性**：DeepSeek、GLM、Kimi 开放平台的工具调用循环会自动补齐 reasoning_content；视觉支持列表刷新（deepseek-v4-flash-vision-exp、glm-5.3-flash、MiniMax-M3 及五个千问模型）
- **移除自定义模型支持**：`custom-openai` 提供方、各提供方的 `customModelIds` 设置与 Add Custom Model ID 命令已移除——VS Code 内置的自定义模型功能已覆盖该场景

### 0.3.0 — 2026-05-08

- **Copilot 模型选择器二级菜单**：hover 任一支持思考的模型，可就地为本轮对话选思考等级，无需全局设置
  - **DeepSeek V4** 专属菜单：None / High / Max（对齐 V4 API 的 `reasoning_effort` 取值）
  - 4 档菜单（None / Low / Medium / High）：通义千问推理款
  - 2 档菜单（None / On）：GLM、Kimi、MiniMax、火山引擎推理款
- **DeepSeek 模型表更新**：`deepseek-chat` / `deepseek-reasoner` → `deepseek-v4-flash` / `deepseek-v4-pro`（1M 输入、384K 输出，均支持推理）
- **彻底移除**全局 `omniCopilot.enableThinking` 与 `omniCopilot.thinkingEffort` 设置、对应状态栏项、`OmniCopilot: Toggle Thinking Mode` / `Set Thinking Effort` 命令——picker 已覆盖所有用法
- vendor 推理参数映射重做，覆盖 None / On / Low / Medium / High / Max 全集：
  - DeepSeek：启用时发 `reasoning_effort: high|max`，None 时不发
  - 通义千问：`enable_thinking` + `thinking_budget`（1024 / 4096 / 16384 tokens；max → 16384）
  - Moonshot：显式 `thinking: { type: "enabled"|"disabled" }`
  - 火山引擎：仅启用时发 `thinking: { type: "enabled" }`
  - 智谱 / MiniMax：无 API 旋钮，picker 仅控制是否剥离输出中的思考标签

### 0.2.0 — 2026-04-30

- 新增可配置的最大输入上下文长度上限（4K–1M 预设 + 自定义 1K-2M tokens），状态栏可实时切换

### 0.1.3 — 2026-04-12

- 新增火山引擎编程计划提供方，包含 8 个模型（doubao-seed、minimax-m2.5、glm-4.7、deepseek-v3.2、kimi-k2.5）
- `reasoning_content` 字段按厂商能力门控 — 仅对 DeepSeek、通义千问、Moonshot/Kimi、智谱发送；避免严格后端（火山引擎、MiniMax、自定义）拒绝请求
- 提取共享 `buildOpenAIMessages` 辅助函数，消除 `MultiModelChatProvider` 与 `CustomOpenAIProvider` 之间的消息序列化重复逻辑
- 在 `CustomOpenAIProvider` 中增加 `reasoning_content` 处理

### 0.1.2 — 2026-04-09

- 新增智谱 Bigmodel Plan 提供方，包含 GLM-5.1、GLM-5-Turbo、GLM-4.7、GLM-4.5-Air 模型
- 启用智谱模型的思考能力
- 规范化智谱模型 ID

### 0.1.1 — 2026-04-07

- 启用 MiniMax 厂商的思考能力
- 增强 `MultiModelChatProvider` 和 `CustomOpenAIProvider` 的思考支持逻辑
- 修复：流结束后刷新剩余思考缓冲区和未发送的工具调用
- 添加 MIT 许可证文件
- 修复 package.json 中的仓库 URL

### 0.1.0 — 2026-04-06

- 首次发布
- 多模型提供方架构，支持 DeepSeek、Moonshot（Kimi）、通义千问、MiniMax
- 自定义 OpenAI 兼容提供方，可接入任意端点
- 思考模式，解析 `<think>` 标签并以可折叠 UI 展示（通过 `LanguageModelThinkingPart`）
- 视觉支持，图片输入能力
- 工具调用 / 函数调用支持
- 通过设置和命令面板管理自定义模型 ID
- 可配置思考力度（低 / 中 / 高）

## License

MIT
