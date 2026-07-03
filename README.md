# Reader AI / 阅读助手

> 图文内容的捕获与分析入口 —— 微信公众号 + 小红书，读进来的每一篇都变成可沉淀、可引用、可再创作的结构化笔记。
> Capture & analyze WeChat articles and Xiaohongshu notes into structured, source-linked, reusable reading assets.

（仓库名 `Wechat-Reader-Extension` 为历史沿用；插件自 v1.1.0 起更名 **Reader AI**，支持多平台。）

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

**多 Provider**：Anthropic / OpenAI / DeepSeek / Moonshot / 智谱 / Custom，key 自动保存、随时切换。

### 本地安装

1. 打开 `chrome://extensions`，开启 `Developer mode`
2. `Load unpacked` → 选择稳定软链路径：

```text
~/work/wechat-reader-extension
```

该软链指向真实源码目录：

```text
~/work/projects/wechat-reader-extension/extension
```

如果 Chrome 显示 `ERR_FILE_NOT_FOUND`，通常是目录移动导致，重建软链即可：

```bash
ln -sfn ~/work/projects/wechat-reader-extension/extension ~/work/wechat-reader-extension
```

3. 打开一篇公众号文章或小红书笔记 → 点工具栏图标打开侧边栏
4. ⚙ 设置里配置任一 Provider 的 API Key，并按需修改 Reader Profile

详细排错见 [docs/SETUP.md](./docs/SETUP.md)。

### 推荐使用流

手机刷到好内容 → 分享到微信发给自己 → 电脑微信点开链接 → Chrome 打开侧边栏 →（已分析过则秒出缓存）分析 → 划词摘录 + 批注优化 → 导出入库。

### Roadmap

- **图片理解**（WR-020）：图片喂给多模态模型，`[IMG#]` 引用体系——小红书图重文轻的笔记真正"读得懂"
- **链接收件箱**（WR-021）：批量粘贴链接，排队自动分析入库
- **内容库对接**（WR-022）：图片资产随笔记入库，接入个人 content-os

### 文档

- [本地安装与故障排查](./docs/SETUP.md)
- [产品迭代流程](./docs/OPTIMIZATION_WORKFLOW.md)（chat feedback → log → backlog → implement → verify 闭环）
- [需求 Backlog](./docs/BACKLOG.md)
- [真实交互日志](./docs/INTERACTION_LOG.md)
- [从零重建插件的 Prompt](./docs/REBUILD_PROMPT.md)

### 项目结构

```text
wechat-reader-extension/
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
- Providers: Anthropic / OpenAI / DeepSeek / Moonshot / Zhipu / custom endpoint; keys auto-saved.

Not on the Chrome Web Store; built for personal reading and knowledge-asset accumulation. Installation & troubleshooting: [docs/SETUP.md](./docs/SETUP.md). Roadmap: multimodal image understanding (WR-020), link inbox (WR-021), content-library asset pipeline (WR-022).
