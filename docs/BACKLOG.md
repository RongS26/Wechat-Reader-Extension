# Reader AI · Backlog

> Workflow: chat feedback → interaction log → backlog → implementation → reload extension → verify on a real WeChat article.

## Status Legend

| Status | Meaning |
|---|---|
| Proposed | Captured from chat/log, not implemented |
| Ready | Clear enough to implement |
| In Progress | Being implemented |
| Verify | Code changed, needs Chrome reload and article test |
| Done | Verified on a real WeChat article |

---

## Items

| ID | Priority | Title | Evidence From Chat | Proposed Change | Status |
|---|---|---|---|---|---|
| WR-001 | P0 | Stabilize local extension install path | “打开这个extension显示无法访问您的文件…ERR_FILE_NOT_FOUND” | Keep stable symlink `~/workspace/reader-ai-extension` and document it in setup instructions. | Ready |
| WR-002 | P1 | Add setup and troubleshooting guide | Repeated manual steps were needed to reload / re-enable the extension. | Add `SETUP.md`; update `REBUILD_PROMPT.md`; add troubleshooting section to options page later. | Ready |
| WR-003 | P1 | Improve first-use and article-specific launch | User gave a WeChat article URL and expected direct plugin activation. | Add clearer unsupported-page state and explicit “detect current article → start analysis” flow. | Done |
| WR-004 | P1 | Add diagnostics panel | Current errors are browser-level or generic extension errors. | Show supported page status, extraction status, API HTTP status, and recovery guidance. | Verify |
| WR-005 | P1 | Improve actionable error messages | “Open a WeChat article first” and API errors are not enough for recovery. | Map common failures to specific next steps. | Verify |
| WR-006 | P2 | Integrate notes with personal reading-notes folder | User placed reading-notes under `personal/projects` as a side project. | Improve export naming to `reading-notes_YYYY-MM-DD-title.md`; add helper/import workflow for `~/workspace/reading-notes` later. | Done |
| WR-007 | P1 | Keep chat feedback as product backlog | User asked whether chat expectations can be captured. | Maintain `INTERACTION_LOG.md`; update this backlog when user confirms logging. | Ready |
| WR-008 | P1 | Publish repository documentation to GitHub | “链接到我的GitHub仓库…沉淀read_me和实际这个小插件怎么做” | Add bilingual README and setup guide; move process docs into `docs/`; commit and push docs to GitHub remote. | Done |
| WR-009 | P1 | Comment-driven output revision | User referenced `html-comment-skill` and asked how comments can improve extension output. | Add `Optimize with Comment`: store applied comments per article and regenerate the seven-section analysis from article + current output + user comment. Also persist reusable standing rules for future runs. | Done |
| WR-010 | P0 | Shift output from structure recap to reader-useful insights | “更讲清楚核心要点，insight而不是输出结构…思考读者的视角，这个文章对什么样的人分别有什么样的价值” | Replace Article Structure with Core Points; add Reader Value; make insights synthesized and less scattered by default. | Done |
| WR-011 | P1 | Add source-linked core excerpts | “有没有可能有一些核心摘录和能针对性指向文章某个部分的能力” | Extract paragraph ids, add Core Excerpts with `[P#]` references, and click refs to scroll the original article. | Done |
| WR-012 | P1 | Auto-save provider API keys | “帮我自动保存，不要每次都重新输入一次key” | Auto-save API key/model/base URL edits in the settings page so the provider state persists without manual Save clicks. | Done |
| WR-013 | P1 | Language-aware output rules | “中文文章输出中文，英文文章输出中英双文” | Detect article language and switch analysis/chat prompts accordingly; keep bilingual output for English articles. | Done |
| WR-014 | P1 | Persist click-selected core excerpts | “Core Excerpts 支持在页面上点选一段内容，直接沉淀为一条摘录” | Store selected text per article in `selectedExcerpts:<url>`, auto-merge into Core Excerpts, and reload it on future opens without duplication. | Done |
| WR-015 | P1 | Add notes, edit, and delete for core excerpts | “在add excerpt的时候我能不能直接加note…”，“把这个也坐上” | Let users attach a note when saving an excerpt, edit the saved note later, and delete the excerpt from the side panel without affecting AI excerpts. | Done |
| WR-016 | P2 | Fix auto-save status text glitch | “显示auto-saveuto-save” | Debounce/serialize the Saving…/Auto-saved ✓ status writes in options.js (lines 34–43) so the indicator never renders overlapped text. | Verify |
| WR-017 | P1 | Comment-driven regeneration should respect section semantics | “把洞察延伸成一些补充建议…结果有点一般” | Extension-type comments create a dedicated Action Ideas section with [P#] anchors and reader-profile awareness, instead of mutating Key Insights; add style constraint to reduce generic consultant tone. | Verify |
| WR-018 | P1 | Cache analysis per article URL | 验收发现重开同文会重新调用 API | Store analysis结果 keyed by URL in chrome.storage; on reopen, load cache instantly with a Refresh action to re-run. | Verify |
| WR-019 | P1 | Xiaohongshu adapter + 图文抽取 | “有可能做这个extension囊括…小红书内容吗” | Site-adapter refactor (wechat/xhs); XHS note title/author/desc/images extraction with selector fallbacks + og: meta fallback; video-note detection; platform-aware UI copy; images carried in note export as [IMG#] list. | Verify |
| WR-020 | P1 | Multimodal image analysis (Phase 2) | “不能只做文字的，要做图文的，之前对微信文章其实也有这个需求” | Feed images (base64, capped/compressed) to multimodal providers; [IMG#] citation system alongside [P#]; per-platform default toggle (xhs on, wechat off). | Verify |
| WR-021 | P2 | Link inbox + auto-analyze (Phase 3) | “真实流程一般是手机端看帖子然后发给自己的微信” | Paste multiple links into side panel; queue open→analyze→save; auto-analyze toggle on supported pages. | Proposed |
| WR-022 | P2 | Content library asset pipeline (Phase 4) | “输出不一定直接变成小红书，还是有个内容库” | Notes with image assets land in content-os; ties to work-hub T066. | Proposed |

---

## Intake Template

Use this when the user confirms “record to reading plugin log”.

```md
### YYYY-MM-DD · Short Title

**User original words**
> ...

**Observed problem**
- ...

**Product implication**
- ...

**Proposed change**
- ...

**Backlog item**
- WR-...
```
