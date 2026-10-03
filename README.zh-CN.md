# OmniCopilot

[English](README.md) | 中文

一个 VS Code 扩展，允许你在 GitHub Copilot Chat 中使用来自多个大模型平台的模型作为语言模型提供方。

## 支持的提供方

| 提供方 | Vendor ID | 模型 |
|--------|-----------|------|
| DeepSeek | `deepseek` | deepseek-flash, deepseek-v4-pro |
| GLM Coding Plan CN | `glm-coding-plan-cn` | GLM-5.3, GLM-5.3-Flash, GLM-5.3-Highspeed, GLM-4.6V |
| GLM Coding Plan | `glm-coding-plan` | GLM-5.3, GLM-5.3-Flash, GLM-5.3-Highspeed, GLM-5.2(-highspeed), GLM-5-Turbo, GLM-4.7 |
| Kimi Code Plan | `moonshot` | k3, k3-256k, kimi-for-coding, kimi-for-coding-highspeed |
| Kimi Code Plan (kimi.ai) | `kimi-code-plan-intl` | k3, k3-256k, kimi-for-coding, kimi-for-coding-highspeed |
| Moonshot (Open Platform) | `moonshot-open` | kimi-k3, kimi-k2.7-code, kimi-k2.7-code-highspeed, kimi-k2.6 |
| Moonshot (国际平台) | `moonshot-intl` | kimi-k3, kimi-k2.7-code, kimi-k2.7-code-highspeed, kimi-k2.6 |
| Alibaba Token Plan | `qwen` | auto、qwen3.8-max、qwen3.8-flash、qwen3.7-max、qwen3.7-plus、qwen3.6-flash、glm-5.3、glm-5.2、deepseek-v4-pro(-0813)、deepseek-v4-flash-0731、deepseek-v4.1-flash |
| Alibaba Coding Plan（通义编程方案） | `alibaba-coding-plan-cn` | qwen3.7-plus、qwen3.6-plus、qwen3-coder-plus、qwen3-coder-next、qwen3-max、glm-5、kimi-k2.5、MiniMax-M2.5 |
| Alibaba Coding Plan（国际） | `alibaba-coding-plan` | 同上 8 款模型（国际端点） |
| MiniMax Token Plan CN | `minimax` | MiniMax-M3.1-Flash-Preview, MiniMax-M3, MiniMax-M2.7, MiniMax-M2.7-highspeed, MiniMax-M2.5 |
| MiniMax International | `minimax-intl` | MiniMax-M3.1-Flash-Preview, MiniMax-M3, MiniMax-M2.7, MiniMax-M2.7-highspeed, MiniMax-M2.5 |
| 火山引擎编程计划 Coding Plan | `volcengine` | doubao-seed-2.1-pro, doubao-seed-2.1-turbo, doubao-seed-2.1-lite, doubao-seed-2.0-mini, doubao-seed-2.0-lite, doubao-seed-evolving, minimax-m3, kimi-k2.7-code, kimi-k2.8-preview, kimi-k3, glm-5.3, glm-5.3-flash, deepseek-v4-flash, deepseek-v4-pro, deepseek-v4.1-flash |
| 火山引擎智能体计划 Agent Plan | `volcengine-agent-plan` | 与 Coding Plan 相同的 13 个基础模型（kimi-k3 需 Medium 及以上套餐） |
| 火山引擎 Ark（按量） | `volcengine-ark` | doubao-seed-2-1-pro/turbo、2-0-pro/mini/lite/code、seed-evolving（带日期快照 ID）、glm-5-2、glm-5-3-flash、deepseek-v4 ga 快照 |
| 腾讯混元编程计划 | `tencent-coding-plan` | hunyuan-2.0-thinking、hunyuan-2.0-instruct、hunyuan-t1、hunyuan-turbos、tc-code-latest、glm-5、kimi-k2.5、minimax-m2.5 |
| 腾讯混元 Token Plan | `tencent-token-plan` | hy4-preview、hy3 |
| 腾讯 TokenHub | `tencent-tokenhub` | hy4-preview、hy3 |
| 阶跃星辰 Step Plan | `stepfun-step-plan-cn` | step-5-preview、step-3.7-flash、step-3.5-flash |
| 阶跃星辰 Step Plan（国际） | `stepfun-step-plan` | step-5-preview、step-3.7-flash、step-3.5-flash |
| 中电信 SCNet Token Plan | `scnet-token-plan` | DeepSeek-V4.1-Flash、DeepSeek-V4-Pro、DeepSeek-V4-Flash、GLM-5.3(-Flash)、GLM-5.2、Kimi-K3、Kimi-K2.7-Code、MiniMax-M3、Qwen3.8-Max、Qwen3.8-Flash |
| 硅基流动 | `siliconflow-cn` | zai-org/GLM-5.2、Pro/Kimi-K2.6、DeepSeek-V4-Pro/Flash、Qwen3.5-397B-A17B、Step-3.5-Flash |
| 硅基流动（国际） | `siliconflow` | zai-org/GLM-5.3(-Flash)、GLM-5.2、Kimi-K3、Kimi-K2.7-Code、DeepSeek-V4-Pro/Flash、Qwen3.8-2.4T-A95B、MiniMax-M3、LongCat-2.0、Hy3、gpt-oss-120b |
| 智谱开放平台（按量） | `zhipu` | glm-5.3, glm-5.3-flash, glm-5.3-flashx, glm-5.2, glm-5v-turbo |
| Z.AI（按量） | `zai` | glm-5.3, glm-5.3-flash, glm-5.3-flashx, glm-5.2, glm-5-turbo, glm-5v-turbo |
| MiMo Token Plan CN | `mimo-token-plan-cn` | mimo-v2.6-pro, mimo-v2.6-flash |
| MiMo Token Plan SGP | `mimo-token-plan-sgp` | mimo-v2.6-pro, mimo-v2.6-flash |
| MiMo Token Plan AMS | `mimo-token-plan-ams` | mimo-v2.6-pro, mimo-v2.6-flash |
| 小米 MiMo（按量） | `mimo` | mimo-v2.6-pro, mimo-v2.6-flash, mimo-v2.6-pro-ultraspeed |
| Umans AI Coding Plan | `umans-ai-coding-plan` | umans-coder、umans-flash、umans-kimi-k3、umans-glm-5.3-flash、umans-deepseek-v4.1-flash、umans-qwen3.6-35b-a3b |
| 美团 LongCat | `longcat` | LongCat-2.0 |
| 商汤 SenseNova | `sensenova` | kimi-k3、glm-5.2、deepseek-v4-pro、deepseek-v4-flash、sensenova-6.8-flash-lite |
| 夸娥 KUAE Coding Plan | `kuae` | GLM-4.7 |

> [!NOTE]
> 0.5.0 新增的 23 个提供方（硅基流动×2、腾讯混元×3、阶跃×2、SCNet、阿里 Coding Plan×2、MiniMax 国际版、Moonshot 国际版、Kimi 国际版、MiMo SGP/AMS/按量、Umans、LongCat、商汤、夸娥、智谱/Z.AI/Ark 按量）的模型阵容、上下文/输出上限与思考参数域均取自 [models.dev](https://models.dev)（社区维护的模型目录，数据截至 2026-10-01）。其中 13 家已经实测（见上方「已测试且可用」）；其余 10 家——**腾讯混元 Coding/Token Plan/TokenHub、阶跃 Step Plan（国际+CN）、SCNet、Umans、LongCat、夸娥、火山 Ark 按量**——为 models.dev 口径、遵循同一套 OpenAI 兼容契约但未实测，端点协议与 Key 体系以各官方文档为准，遇到 4xx/参数错误欢迎提 issue。

## 已测试且可用

以下提供方已经过测试并确认可用：

- **DeepSeek 开放平台** (`platform.deepseek.com`)
- **Kimi Code Plan**（`kimi.com/code`）
- **MiniMax Token Plan CN** (`platform.minimaxi.com`)
- **GLM Coding Plan CN**（智谱，`open.bigmodel.cn` Coding API）
- **火山引擎 Coding Plan / Agent Plan**（`console.volcengine.com`）
- **Alibaba Token Plan**（`platform.qianwenai.com`）
- **MiMo Token Plan CN**（`platform.xiaomimimo.com`）
- **Moonshot AI 国际平台**（`platform.moonshot.ai`）
- **Kimi Code Plan 国际版**（`kimi.ai/code`）
- **硅基流动 / 硅基流动 CN**（`siliconflow.com` / `siliconflow.cn`）
- **MiniMax 国际版**（`minimax.io`）
- **Alibaba Coding Plan / CN**（`coding-intl.dashscope.aliyuncs.com` / `coding.dashscope.aliyuncs.com`）
- **MiMo Token Plan SGP / AMS 及按量**（`token-plan-sgp/ams.xiaomimimo.com`、`api.xiaomimimo.com`）
- **商汤 SenseNova**（`token.sensenova.cn`）
- **智谱按量**（`open.bigmodel.cn`）
- **Z.AI 按量**（`api.z.ai`）

> [!NOTE]
> **GLM Coding Plan 计费说明**：根据智谱官方文档，Coding 端点（`open.bigmodel.cn/api/coding/paas/v4`）只有在官方指定工具（Claude Code、Kilo Code、OpenCode、TRAE、CodeBuddy 等）中调用才计入套餐额度。VS Code Copilot Chat 不在列表中——调用不保证成功，消耗可能按 API 按量计费而非套餐积分；且智谱《使用须知》将非指定工具中的调用视为违规，存在限流或账号受限的风险。请留意账单与账号状态。国际版 **GLM Coding Plan**（Z.AI，`api.z.ai/api/coding/paas/v4`）同样仅限官方指定工具使用，非指定工具（含 VS Code Copilot Chat）调用不保证计入套餐额度、可能按 API 按量计费；Team Plan 成员必须使用团队计划专属 Key（与其他 Z.AI API Key 不通用）。
<!---->

> [!WARNING]
> **Alibaba Token Plan 条款与端点**：本扩展指向 Token Plan 专用端点（`token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`），需使用 platform.qianwenai.com 签发的订阅 Key（`sk-sp-` 开头）——Token Plan 与按量计费的 Key/端点完全隔离、不可混用（按量 Key 为 `sk-ws-` 开头，属 `dashscope.aliyuncs.com/compatible-mode/v1`）。Key 亦仅限在交互式编程/智能体工具（Claude Code、Cursor、Qwen Code、Qoder、OpenClaw 等）中使用——官方文档明确禁止通用 API 调用，违规可能导致订阅暂停或 API Key 被封禁。VS Code Copilot Chat 不在官方工具列表中，请自行斟酌使用并留意账号状态。
<!---->

> [!WARNING]
> **MiMo Token Plan CN 条款与端点**：本扩展指向 Token Plan 中国集群（`token-plan-cn.xiaomimimo.com/v1`，另有新加坡/欧洲集群 `token-plan-sgp/ams.xiaomimimo.com/v1`），需使用 platform.xiaomimimo.com 套餐专属 Key（个人版 `tp-` / 团队版 `ttp-` 开头）——与按量计费 Key（`sk-` 开头，属 `api.xiaomimimo.com/v1`）完全隔离、不可混用。套餐额度仅限在编程工具（OpenCode、OpenClaw、Claude Code 等）中使用，官方文档将非 Coding 场景的 API 调用视为违规滥用，可能导致订阅暂停或 Key 被封。VS Code Copilot Chat 不在官方工具列表中，请自行斟酌使用并留意账号状态。
<!---->

> [!WARNING]
> **新增 Coding/Token Plan 类提供方的条款风险**：Alibaba Coding Plan（`coding.dashscope.aliyuncs.com`）、腾讯混元编程/Token 计划、阶跃 Step Plan、SCNet、夸娥、Umans、Kimi 国际版（kimi.ai）等订阅套餐大多与 Qwen/GLM/MiMo Token Plan 类似——额度仅限官方指定的编程工具使用，VS Code Copilot Chat 不在列表内，非指定工具调用可能被按量计费、限流或视为违规；各套餐 Key 与按量 Key 互不通用（如智谱/Z.AI/Ark 的按量 vendor 需用对应平台的按量 Key）。接入前请阅读对应官方条款，自行斟酌使用。

## 待办事项

- [ ] 测试 Kimi 开放平台（`moonshot-open`）
- [ ] 测试 GLM Coding Plan（Z.AI 国际版，`glm-coding-plan`）
- [ ] 测试未实测的 models.dev 口径提供方：腾讯混元 Coding/Token Plan/TokenHub、阶跃 Step Plan（国际+CN）、SCNet、Umans、LongCat、夸娥、火山 Ark 按量
- [ ] 将 vendor 专属序列化开关下沉为 `VendorConfig` 标志位（`outputLimitField`、`acceptsReasoningContent`、`kimiHeaders`、`mimoReasoningContract`、`maxCompletionTokens`、`toolStream`），替代目前散落在 api.ts / provider.ts / extension.ts 的按 vendor ID 的 OR 判断链（review #24，0.5.0 延后）
- [ ] 把临时序列化验证圆化为自动化测试（`node --test`）：MiMo 工具循环历史回填（thinking 开/关，含 VS Code 丢弃思考 part 的历史）、THINKING_BUDGET 映射、按模型菜单的 effort 钳制、186 模型菜单目录断言
- [ ] 验证思考力度（DeepSeek None/High/Max；其他 None/Low/Medium/High 或 None/On）在各提供方上是否真实生效
- [ ] 决定 0.5.0 是否走 marketplace pre-release 通道发布（尚有 10 家提供方未实测）
- [ ] 未完待续……

## 功能

- **多平台支持**：接入 30+ 个大模型平台/端点，共 186 款模型
- **每模型独立的思考力度选择**：在 Copilot 模型选择器里 hover 任一支持思考的模型，**就地**为这一轮对话选思考等级——不再需要切全局开关
  - **DeepSeek V4** 菜单：None / Low / High / Max（对齐 V4 API 的 reasoning_effort 取值；思考默认开启，None 显式关闭）
  - **Kimi K3**（Code Plan 的 k3 / k3-256k、开放平台及国际版的 kimi-k3、火山托管的 kimi-k3）：Low / High / Max——无 None 档，思考始终开启；两端都映射到 reasoning_effort
  - **Kimi for Coding**（Code Plan 的 kimi-for-coding，当前为 K2.8 Preview）：None / Low / High / Max——None 显式关闭思考
  - **GLM-5.3 家族**菜单：Low / High / Max——无 None 档，思考始终开启（含 GLM-5.3-Highspeed / FlashX、硅基流动与 SCNet/Umans/商汤等托管的 GLM-5.3；Coding 端点会把 glm-5.1、glm-4.7 等旧 ID 自动路由到 5.3 系）
  - **GLM-5.2 家族**菜单：High / Max——思考恒开且原生域只有 high|max（Z.AI Coding Plan、智谱/Z.AI 按量、硅基流动托管）
  - **MiniMax M3.1** 菜单：Low / Medium / High / XHigh / Max 五档（思考恒开，原生 reasoning_effort 全域）
  - **硅基流动托管的 Kimi/DeepSeek/Qwen/MiniMax/LongCat/Hy3/gpt-oss**：None / Low / High / Max——映射到 enable_thinking + thinking_budget（128–32768）
  - **SCNet / 商汤托管的 DeepSeek V4 Pro**：None / High / Max（原生域 high|max，low/medium 自动收敛到 high）
  - 4 档菜单（None / Low / Medium / High）：通义千问推理款、阶跃 Step 5 Preview / Step 3.7 Flash、Ark/火山 doubao 系、Ark 托管的 GLM-5.2、Umans 与商汤的 Qwen/effort 款
  - **阶跃 Step 3.5 Flash**：None / Low / High——原生域没有 medium 档
  - 2 档菜单（None / On）：仅支持思考开关、无 effort 等级的模型（Kimi K2.6、MiniMax-M3、5.3 之前的 GLM、GLM-5V/5-Turbo、GLM-4.7、腾讯混元 hy3/hy4 与托管款、Alibaba Coding Plan 推理款、MiMo v2.6 全系）——MiniMax-M3 与 MiMo 的 None 是真关闭思考
  - 思考锁定的模型不提供菜单：K2.7 Code 高速档（Code Plan 的 kimi-for-coding-highspeed、开放平台/国际版的 kimi-k2.7-code(-highspeed)）、MiniMax M2.x、硅基流动 CN 的部分快照款——它们的"None"要么被静默换模型、要么思考照样运行
- **思考 UI**：支持推理的模型会通过 `LanguageModelThinkingPart` 展示可折叠的思考过程
- **上下文用量显示**：请求携带 `stream_options: { include_usage: true }` 并把真实 token 用量回报给 Copilot Chat，上下文指示条显示实际用量而不是 0；首轮拿到真实用量前以 CJK 感知估算兜底（中文 ≈ 1 token/字）
- **视觉支持**：目录中标注 `imageInput` 的模型（deepseek-flash、GLM-5.3-Flash/FlashX/4.6V/5V-Turbo、Kimi K2.5+/K3、MiniMax-M3/M3.1、Qwen 视觉款、doubao 全系、MiMo v2.6 全系、step-5/3.7、Umans 系、商汤 6.8 等）可以读取 Copilot Chat 中附加的图片
- **工具调用**：兼容模型的函数调用支持

## 使用方法

1. 安装扩展
2. 打开 Copilot Chat → 管理模型 → 添加模型
3. 选择提供方并输入 API 密钥
4. 开始与所选模型对话

### 添加的模型不显示在选择器里？

这些模型运行在 Copilot Chat 会话内，是否显示由 VS Code/Copilot 本体控制，与本扩展无关。不过也先自查扩展侧——提供方 API Key 缺失或为空时会返回**空模型列表**（通过 管理模型 → 提供方齿轮图标重新录入 Key）：

- **登录了 GitHub 但无 Copilot 权益**（无订阅/已过期/企业版没有席位）：这是 VS Code 的已知 bug——存在「有 GitHub 会话但无 Copilot token」时 BYOK/扩展模型会被封锁（[microsoft/vscode#324310](https://github.com/microsoft/vscode/issues/324310)、[#327078](https://github.com/microsoft/vscode/issues/327078)）。**临时解法：完全退出 GitHub 登录并重载窗口**，模型即可恢复。
- **完全未登录**：官方口径 BYOK 模型无需 GitHub 账号/订阅，但聊天视图会停在登录/BYOK 对话框，需要选择「使用自己的 Key」路径继续。
- Copilot（Agent Host）会话默认隐藏 BYOK/扩展模型——开启 `chat.agentHost.byokModels.enabled` 设置。
- **受限模式（Restricted Mode）**的工作区在选择器里只显示 `Auto`——先信任工作区。
- 刚添加的模型未出现时，重载窗口。
- 未登录状态下，标题生成、commit message 等工具性功能需把 `chat.utilityModel` / `chat.utilitySmallModel` 指向其中一个模型。

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

### 0.5.0 — 2026-10-03

- **20 个新提供方，共 33 个 vendor / 186 个模型** — Moonshot AI 国际版、Kimi Code Plan (kimi.ai)、SiliconFlow 国际版 + 国内版、MiniMax 国际版、阿里巴巴 Coding Plan 国际版 + 国内版、腾讯 Coding Plan / Token Plan / Tokenhub、StepFun Step Plan 国际版 + 国内版、SCNet Token Plan、MiMo Token Plan 新加坡 + 阿姆斯特丹节点、MiMo 开放平台、Umans AI Coding Plan、LongCat、商汤 SenseNova、KUAE Cloud、智谱 AI 直连、Z.AI 直连、火山引擎 Ark 按量付费
- **架构重构：`effortMenu` 驱动的 catalog** — 每个模型直接声明 picker 菜单和 effort 域；per-turn effort 钳制从分散的 vendor 分支收敛到上游统一处理（`resolveRequestedEffort`），各 vendor 分支只负责字段名和形状
- **新增菜单类型** — `none-high`（SenseNova）、`none-low-high`（StepFun step-3.5-flash）、`high-max`（GLM-5.2 系）、`low-medium-high-xhigh-max`（MiniMax M3.1-Flash-Preview）
- **按 models.dev 实测修正** — SenseNova `glm-5.2` / `deepseek-v4-flash` 域折叠为 `none|high`（低中高档实测无差异）；Volcengine plan / agent / ark DeepSeek 系列修正为 `minimal|low|medium|high`（无 max），移除 max→high 钳制；StepFun `step-5-preview` / `step-3.7-flash` 补 `effortMenu` 标注
- **VSIX 打包** — `.vscodeignore` 补充排除 `.claude/` 工作树目录（53 KB，此前因漏排 3.8 MB）

### 0.4.5 — 2026-09-29

- **新增提供方：MiMo Token Plan CN**（`mimo-token-plan-cn`，小米）——首个遵循新命名约定的 vendor：ID = 显示名称的 kebab-case 全小写（存量 vendor ID 保持不变）——`mimo-v2.6-pro`（万亿参数旗舰）与 `mimo-v2.6-flash`，均 1M 上下文 / 128K 输出、全模态（视觉）输入，走套餐 OpenAI 兼容中国集群端点（`token-plan-cn.xiaomimimo.com/v1`）。套餐 Key 为 `tp-`/`ttp-` 前缀，与按量 `sk-` Key 完全隔离。mimo-v2.5 / mimo-v2.5-pro 将于 2026-10-21 下线，不予收录；ASR/TTS 非对话模型不在范围；mimo-v2.6-pro-ultraspeed 为定制服务、不在套餐清单
- **思考与参数对齐官方「深度思考」文档**：`thinking: {type: enabled|disabled}`（默认开启——选 None 会显式发送关闭；无 effort 分档，picker 呈现 None/On 两档菜单）；输出经 `max_completion_tokens` 限制（思考+回答共享额度）；思考以 `reasoning_content` 流式返回并计入 completion tokens
- **工具循环可靠性**：思考开启时带 `tool_calls` 的历史 assistant 消息必须回传 `reasoning_content`，否则 API 返回 400——由模型目录声明的 `needsReasoningBackfillWhenThinking` 标记覆盖，`mimo-token-plan-cn` vendor 现已序列化历史 `reasoning_content` 字段

## License

MIT
