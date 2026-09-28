# OmniCopilot

[English](README.md)

一个 VS Code 扩展，允许你在 GitHub Copilot Chat 中使用来自多个大模型平台的模型作为语言模型提供方。

## 支持的提供方

| 提供方 | Vendor ID | 模型 |
|--------|-----------|------|
| DeepSeek | `deepseek` | deepseek-flash, deepseek-v4-pro |
| GLM Coding Plan CN | `glm-coding-plan-cn` | GLM-5.3, GLM-5.3-Flash |
| GLM Coding Plan | `glm-coding-plan` | GLM-5.3, GLM-5.3-Flash |
| Kimi Code Plan | `moonshot` | k3, k3-256k, kimi-for-coding, kimi-for-coding-highspeed |
| Moonshot (Open Platform) | `moonshot-open` | kimi-k3, kimi-k2.7-code, kimi-k2.7-code-highspeed, kimi-k2.6 |
| Qwen Token Plan | `qwen` | auto、qwen3.8-max、qwen3.8-flash、qwen3.7-max、qwen3.7-plus、qwen3.6-flash、glm-5.3、glm-5.2、deepseek-v4-pro(-0813)、deepseek-v4-flash-0731、deepseek-v4.1-flash |
| MiniMax Token Plan CN | `minimax` | MiniMax-M3, MiniMax-M2.7, MiniMax-M2.7-highspeed, MiniMax-M2.5 |
| 火山引擎编程计划 Coding Plan | `volcengine` | doubao-seed-2.1-pro, doubao-seed-2.1-lite, doubao-seed-2.0-mini, doubao-seed-evolving, minimax-m3, kimi-k2.7-code, kimi-k2.8-preview, kimi-k3, glm-5.3, glm-5.3-flash, deepseek-v4-flash, deepseek-v4-pro, deepseek-v4.1-flash |
| 火山引擎智能体计划 Agent Plan | `volcengine-agent-plan` | 与 Coding Plan 相同的 13 个模型（kimi-k3 需 Medium 及以上套餐） |
| MiMo Token Plan CN | `mimo-token-plan-cn` | mimo-v2.6-pro、mimo-v2.6-flash |

## 已测试且可用

以下平台已经过测试并确认可用：

- **DeepSeek 开放平台** (`platform.deepseek.com`)
- **Kimi Code Plan**（`kimi.com/code`）
- **MiniMax Token Plan CN** (`platform.minimaxi.com`)
- **GLM Coding Plan CN**（智谱，`open.bigmodel.cn` Coding API——vendor ID 变更后待复测）
- **火山引擎 Coding Plan / Agent Plan**（`console.volcengine.com`）
- **Qwen Token Plan**（`platform.qianwenai.com`）
- **MiMo Token Plan CN**（`platform.xiaomimimo.com`）

> [!NOTE]
> **GLM Coding Plan 计费说明**：根据智谱官方文档，Coding 端点（`open.bigmodel.cn/api/coding/paas/v4`）只有在官方指定工具（Claude Code、Kilo Code、OpenCode、TRAE、CodeBuddy 等）中调用才计入套餐额度。VS Code Copilot Chat 不在列表中——调用不保证成功，消耗可能按 API 按量计费而非套餐积分；且智谱《使用须知》将非指定工具中的调用视为违规，存在限流或账号受限的风险。请留意账单与账号状态。国际版 **GLM Coding Plan**（Z.AI，`api.z.ai/api/coding/paas/v4`）同样仅限官方指定工具使用，非指定工具（含 VS Code Copilot Chat）调用不保证计入套餐额度、可能按 API 按量计费；Team Plan 成员必须使用团队计划专属 Key（与其他 Z.AI API Key 不通用）。
<!---->

> [!WARNING]
> **Qwen Token Plan 条款与端点**：本扩展指向 Token Plan 专用端点（`token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`），需使用 platform.qianwenai.com 签发的订阅 Key（`sk-sp-` 开头）——Token Plan 与按量计费的 Key/端点完全隔离、不可混用（按量 Key 为 `sk-ws-` 开头，属 `dashscope.aliyuncs.com/compatible-mode/v1`）。Key 亦仅限在交互式编程/智能体工具（Claude Code、Cursor、Qwen Code、Qoder、OpenClaw 等）中使用——官方文档明确禁止通用 API 调用，违规可能导致订阅暂停或 API Key 被封禁。VS Code Copilot Chat 不在官方工具列表中，请自行斟酌使用并留意账号状态。
<!---->

> [!WARNING]
> **MiMo Token Plan CN 条款与端点**：本扩展指向 Token Plan 中国集群（`token-plan-cn.xiaomimimo.com/v1`，另有新加坡/欧洲集群 `token-plan-sgp/ams.xiaomimimo.com/v1`），需使用 platform.xiaomimimo.com 套餐专属 Key（个人版 `tp-` / 团队版 `ttp-` 开头）——与按量计费 Key（`sk-` 开头，属 `api.xiaomimimo.com/v1`）完全隔离、不可混用。套餐额度仅限在编程工具（OpenCode、OpenClaw、Claude Code 等）中使用，官方文档将非 Coding 场景的 API 调用视为违规滥用，可能导致订阅暂停或 Key 被封。VS Code Copilot Chat 不在官方工具列表中，请自行斟酌使用并留意账号状态。

## 待办事项

- [ ] 测试 Kimi 开放平台
- [ ] 将 vendor 专属序列化开关（outputLimitField、acceptsReasoningContent）下沉到 VendorConfig，替代按 vendor ID 的分支判断
- [ ] 为 MiMo 工具循环历史添加请求序列化自动化测试（thinking 开/关，含 VS Code 丢弃思考 part 的历史）
- [ ] 支持硅基流动
- [ ] 支持 MiniMax 国际版
- [ ] 测试 GLM Coding Plan（Z.AI 国际版）
- [ ] 支持硅基流动国际版
- [ ] 验证思考力度（DeepSeek None/High/Max；其他 None/Low/Medium/High 或 None/On）在各提供方上是否真实生效
- [ ] 未完待续……

## 功能

- **多平台支持**：接入多个主流大模型平台
- **每模型独立的思考力度选择**：在 Copilot 模型选择器里 hover 任一支持思考的模型，**就地**为这一轮对话选思考等级——不再需要切全局开关
  - **DeepSeek V4** 菜单：None / Low / High / Max（对齐 V4 API 的 reasoning_effort 取值；思考默认开启，None 显式关闭）
  - **Kimi K3**（Code Plan 的 k3 / k3-256k、开放平台的 kimi-k3）：Low / High / Max——无 None 档，思考始终开启；两端都映射到 reasoning_effort
  - **GLM-5.3 / GLM-5.3-Flash** 菜单：Low / High / Max——无 None 档，思考始终开启（Coding 端点会把 glm-5.1、glm-4.7 等旧 ID 自动路由到这两个模型；Token Plan 托管的 `glm-5.3` 同样使用恒开菜单）
  - 4 档菜单（None / Low / Medium / High）：通义千问推理款
  - 2 档菜单（None / On）：仅支持思考开关、无 effort 等级的模型（Kimi K2.6、MiniMax-M3、5.3 之前的 GLM、火山引擎推理款、MiMo v2.6）——MiniMax-M3 与 MiMo 的 None 是真关闭思考
  - 思考锁定的模型不提供菜单：K2.7 Code（Code Plan 的 kimi-for-coding(-highspeed)、开放平台的 kimi-k2.7-code(-highspeed)）与 MiniMax M2.x——它们的"None"要么被静默换模型、要么思考照样运行
- **思考 UI**：支持推理的模型会通过 `LanguageModelThinkingPart` 展示可折叠的思考过程
- **上下文用量显示**：请求携带 `stream_options: { include_usage: true }` 并把真实 token 用量回报给 Copilot Chat，上下文指示条显示实际用量而不是 0；首轮拿到真实用量前以 CJK 感知估算兜底（中文 ≈ 1 token/字）
- **视觉支持**：支持视觉的模型（deepseek-flash、glm-5.3-flash、kimi-for-coding、MiniMax-M3、qwen3.8-max、qwen3.8-flash、qwen3.7-plus、qwen3.6-flash、Token Plan 托管的 deepseek-v4.1-flash、mimo-v2.6-pro、mimo-v2.6-flash，及火山托管的 doubao-seed-2.1-pro/lite、doubao-seed-2.0-mini、doubao-seed-evolving、kimi-k2.7-code、kimi-k2.8-preview、kimi-k3、minimax-m3、glm-5.3-flash、deepseek-v4.1-flash）可以读取 Copilot Chat 中附加的图片
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

> 完整历史版本日志见 [Releases](https://github.com/LyaQanYi/OmniCopilot/releases) 页面。

### 0.4.5 — 2026-09-29

- **新增提供方：MiMo Token Plan CN**（`mimo-token-plan-cn`，小米）——首个遵循新命名约定的 vendor：ID = 显示名称的 kebab-case 全小写（存量 vendor ID 保持不变）——`mimo-v2.6-pro`（万亿参数旗舰）与 `mimo-v2.6-flash`，均 1M 上下文 / 128K 输出、全模态（视觉）输入，走套餐 OpenAI 兼容中国集群端点（`token-plan-cn.xiaomimimo.com/v1`）。套餐 Key 为 `tp-`/`ttp-` 前缀，与按量 `sk-` Key 完全隔离。mimo-v2.5 / mimo-v2.5-pro 将于 2026-10-21 下线，不予收录；ASR/TTS 非对话模型不在范围；mimo-v2.6-pro-ultraspeed 为定制服务、不在套餐清单
- **思考与参数对齐官方「深度思考」文档**：`thinking: {type: enabled|disabled}`（默认开启——选 None 会显式发送关闭；无 effort 分档，picker 呈现 None/On 两档菜单）；输出经 `max_completion_tokens` 限制（思考+回答共享额度）；思考以 `reasoning_content` 流式返回并计入 completion tokens
- **工具循环可靠性**：思考开启时带 `tool_calls` 的历史 assistant 消息必须回传 `reasoning_content`，否则 API 返回 400——由模型目录声明的 `needsReasoningBackfillWhenThinking` 标记覆盖，`mimo-token-plan-cn` vendor 现已序列化历史 `reasoning_content` 字段

## License

MIT
