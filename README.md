# Reader AI / 阅读助手

> 图文内容的捕获与分析入口 —— 微信公众号 + 小红书，读进来的每一篇都变成可沉淀、可引用、可再创作的结构化笔记。
> Capture & analyze WeChat articles and Xiaohongshu notes into structured, source-linked, reusable reading assets.

## 中文

### 定位

Reader AI 是一个本地 Chrome 插件，是个人内容管线的**输入端**：

```text
手机看到好内容 → 转发微信（发给自己） → 电脑点开链接 → Reader AI 分析
       → 结构化笔记（带原文锚点） → 导出 → 阅读笔记库 → 再创作
```

它不是 Chrome Web Store 上架插件，用于个人阅读、学习沉淀和内容资产积累。

### 支持平台

| 平台 | 内容 | 说明 |
|---|---|---|
| 微信公众号 `mp.weixin.qq.com` | 图文文章 | 全功能 |
| 小红书 `xiaohongshu.com` | 图文/视频笔记 | v1.1.0 起；需在浏览器中登录小红书；微信里的 `xhslink` 短链点开会自动跳转；视频笔记提取文字与封面 |

架构为**站点适配器**模式（`content.js` 的 `SITE_ADAPTERS`），新平台 = 一个 adapter + 一行 manifest match。

### 它能做什么

**结构化分析**（7+1 模块，句句锚定原文段落 `[P#]`，点击跳回原文）：
Summary / Core Points / Key Insights / Core Excerpts / Reader Value / Core Conclusion / Author Intent，以及由批注延伸生成的 **Action Ideas**（行动建议独立区块，不污染洞察区）。

**读者画像（Reader Profile）**：在设置页描述"你是谁、为什么读"，所有分析写给这个具体的你——Reader Value 和 Action Ideas 不再是给抽象读者的顾问腔。

**摘录与笔记**：正文划词 → ✦ Add Excerpt 保存并附 note；侧边栏内可编辑、删除；与 AI 摘录合并去重展示。

**批注优化（Optimize with Comment）**：对输出提意见，AI 分类处理——修正类原地改、延伸类生成 Action Ideas、风格类调语气；反复出现的偏好自动沉淀为长期规则。

**分析缓存**：结果按 URL 缓存，重开同一篇秒出、零 API 消耗；文章栏 ⟳ 强制重新分析。

**追问**：基于文章内容继续 Chat。

**导出**：结构化 Markdown（`reading-notes_YYYY-MM-DD-标题.md`），含图片索引（`[IMG#]` + URL）；配合本地同步脚本自动归集到阅读笔记库并刷新索引。

**多 Provider**：Anthropic / OpenAI / DeepSeek / Moonshot / 智谱 GLM / 通义 Qwen-VL / Google Gemini / Custom，key 各自保存、随时切换主 provider。

### API 分工合作

一次「分析」不是一个模型包办，而是**文字**和**识图**两条链路分工：

| 链路 | 用谁 | 说明 |
|---|---|---|
| **文字分析（主链路）** | 你选的**主 Provider**（如 DeepSeek `deepseek-chat`） | 决定分析质量与语气，是产出的主笔 |
| **图片识别（`mode:'vision'`）** | 自动挑一个**支持视觉**的 Provider | 只借它的「眼睛」；主 provider 本身支持视觉就直接用它，否则按 `智谱GLM → Qwen-VL → Anthropic → OpenAI → Gemini → Moonshot → Custom` 挑第一个已配 key 的 |

- **融合而非并列**：识图结果带标题上下文喂回主模型，由主模型统一成文，不是把图注贴在文字旁边。典型组合是「**DeepSeek 写文字 + GLM/Qwen 识图**」。
- **接口差异内建**：各家 `baseUrl` 含正确版本段（OpenAI/DeepSeek/Moonshot=`/v1`、智谱=`/v4`、Gemini=`/v1beta/openai`），`callOpenAICompat` 只追加 `/chat/completions`；Anthropic 走独立 `/v1/messages` 协议。
- **健壮性三板斧**：① 图片**分批识别**，绕开免费视觉模型的单次图片数上限（小红书 8–12 张不超限）；② `max_tokens` 按模型自适应（glm-4v-flash 硬顶 1024、Qwen-VL ~1500、其余 2048+），不再被 400 拒；③ 识图失败**自动降级**为纯文本分析——绝不因为图片让整篇停摆。

### 适配与依赖（含 OCR）

- **站点适配**：`content.js` 的 `SITE_ADAPTERS` 模式，当前公众号 + 小红书；新平台 = 1 个 adapter + 1 行 manifest match。
- **视觉能力是可选依赖**：识图需要至少配置一个视觉 Provider 的 key——推荐**智谱 `glm-4v-flash`**（有免费额度）或 **Qwen-VL**（DashScope 免费额度）。纯 DeepSeek **无图片输入能力**，只配 DeepSeek 时图片会自动降级为纯文本。
- **OCR 能力**：目前「读图」由**多模态视觉模型（VLM）**完成——它本身能识别图中文字、图表与排版语义，对小红书这类图重文轻的笔记已够用，相当于**内建了轻量 OCR**。尚未接入独立 OCR 引擎；若未来遇到**文字极密的长截图**（VLM 易漏字/截断），可加一层专用 OCR（本地 PaddleOCR / 云 OCR）先抽文字再喂主模型——权衡是多一个依赖与延迟，换长文字图的完整率。**当前判断**：非高频场景，VLM 够用，列入 backlog 而非现在做。
- **host_permissions**：每个 Provider 的 API 域名 + 内容站点域名都在 `manifest.json` 显式声明；**新增 Provider 记得同步加域名**，否则请求会被 MV3 拦截。

### 本地安装

1. 打开 `chrome://extensions`，开启 `Developer mode`
2. `Load unpacked` → 选择稳定软链路径：

```text
~/work/reader-ai-extension
```

该软链指向真实源码目录：

```text
~/work/projects/reader-ai-extension/extension
```

如果 Chrome 显示 `ERR_FILE_NOT_FOUND`，通常是目录移动导致，重建软链即可：

```bash
ln -sfn ~/work/projects/reader-ai-extension/extension ~/work/reader-ai-extension
```

如果 Chrome 之前已经加载过旧路径 `~/work/wechat-reader-extension`，可以保留旧软链作为兼容别名，但新的文档和仓库路径统一使用 `reader-ai-extension`。

3. 打开一篇公众号文章或小红书笔记 → 点工具栏图标打开侧边栏
4. ⚙ 设置里配置任一 Provider 的 API Key，并按需修改 Reader Profile

详细排错见 [docs/SETUP.md](./docs/SETUP.md)。

### 推荐使用流

手机刷到好内容 → 分享到微信发给自己 → 电脑微信点开链接 → Chrome 打开侧边栏 →（已分析过则秒出缓存）分析 → 划词摘录 + 批注优化 → 导出入库。

### 版本迭代

从公众号单篇分析，一步步长成「多站点 + 多模态识图分工」的内容管线输入端。每个版本核心解决了什么：

| 版本 | 日期 | 做了啥 | 核心解决 / 升级 |
|---|---|---|---|
| **v0.1 初版** | 2026-05-14 | 公众号文章分析、多 Provider、5 段结构化 | **0→1**：把「读文章」变成可结构化分析的对象 |
| **v0.5 阅读工作流** | 2026-06-24 | source-linked 摘录、划词 excerpt、偏好持久化 | 解决「**读完就忘**」——每条洞察锚定原文段落、可沉淀可引用 |
| **v0.8 质量 + 缓存** | 2026-06-30 → 07-02 | per-URL 缓存、评论区语义 + Reader Profile、状态竞态修复 | 解决**重复消耗与状态错乱**；分析写给「具体的你」而非泛读者（WR-016/17/18） |
| **v1.1.0 站点适配器** | 2026-07-02 | `SITE_ADAPTERS` 架构、小红书接入 | 从**单平台到可扩展多平台**：新站 = 1 个 adapter + 1 行 match（WR-019） |
| **v1.2 多模态识图** | 2026-07-03 | 图片分析 + `[IMG#]` 引用、新增 Gemini、glm-4v-flash | 解决「**图重文轻读不懂**」——图片真正进入分析链路（WR-020） |
| **v1.3 识图健壮性 + 分工** | 2026-07-04 | 视觉/文字分工、图片分批、失败降级、`max_tokens` 自适应 | 解决**识图稳定性**：绝不因图片让整篇停摆；文字质量归主模型、识图只借「眼睛」 |

> `manifest.json` 当前版本 **1.1.0**；v1.2 / v1.3 为其后的功能里程碑（未再 bump manifest 版本号）。

### Roadmap

- **链接收件箱**（WR-021）：批量粘贴链接，排队自动分析入库
- **内容库对接**（WR-022）：图片资产随笔记入库，接入个人 content-os
- **独立 OCR 兜底**（候选）：文字极密长截图场景，VLM 之外加专用 OCR 预抽文字（详见「适配与依赖」）

### 文档

- [本地安装与故障排查](./docs/SETUP.md)
- [产品迭代流程](./docs/OPTIMIZATION_WORKFLOW.md)（chat feedback → log → backlog → implement → verify 闭环）
- [需求 Backlog](./docs/BACKLOG.md)
- [真实交互日志](./docs/INTERACTION_LOG.md)
- [从零重建插件的 Prompt](./docs/REBUILD_PROMPT.md)

### 项目结构

```text
reader-ai-extension/
├── README.md              # 项目入口，中英双语
├── extension/             # Chrome Load unpacked 指向的插件目录
│   ├── manifest.json
│   ├── background.js      # provider 调用与消息路由
│   ├── content.js         # SITE_ADAPTERS 站点适配器 + 划词摘录
│   ├── sidepanel.*        # 分析界面
│   └── options.*          # Provider / Reader Profile / 笔记导出
└── docs/                  # 安装、backlog、交互日志、重建 prompt
```

---

## English

Reader AI is a local Chrome extension — the **capture end** of a personal content pipeline. It reads WeChat official-account articles and Xiaohongshu notes and produces a structured 7+1-section analysis (Summary, Core Points, Key Insights, source-linked Core Excerpts, Reader Value, Core Conclusion, Author Intent, plus comment-driven **Action Ideas**), with every claim anchored to original paragraphs (`[P#]`, click to jump back).

Key ideas:

- **Reader Profile** — analyses are written for one specific reader described in settings, never a generic audience.
- **Site-adapter architecture** — adding a platform is one adapter plus one manifest match; WeChat and Xiaohongshu ship today.
- **Per-URL analysis cache** — reopening an analyzed page renders instantly at zero API cost; ⟳ forces re-analysis.
- **Select-to-excerpt** with notes, inline edit/delete, deduped against AI excerpts.
- **Comment loop** — feedback is classified (correction / style / extension); extensions land in a dedicated Action Ideas section instead of polluting insights; recurring preferences become standing rules.
- **Markdown export** with an `[IMG#]` image index, auto-collected into a local reading-notes library.
- Providers: Anthropic / OpenAI / DeepSeek / Moonshot / Zhipu GLM / Qwen-VL / Gemini / custom endpoint; keys auto-saved.
- **Text/vision division of labor** — text analysis runs on your main provider (e.g. DeepSeek) while image reading auto-routes to a vision-capable one (GLM/Qwen fallback chain); results are *fused* by the main model, not juxtaposed. Images are batched, `max_tokens` is per-model adaptive, and vision failure silently degrades to text-only. Image reading uses multimodal VLMs (a built-in light OCR); a dedicated OCR pass is a backlog item for text-dense screenshots.

Not on the Chrome Web Store; built for personal reading and knowledge-asset accumulation. Installation & troubleshooting: [docs/SETUP.md](./docs/SETUP.md). See **版本迭代 / version history** for what each release solved on the way from a single-article analyzer to a multi-site multimodal pipeline. Roadmap: link inbox (WR-021), content-library asset pipeline (WR-022), optional dedicated-OCR fallback.
