# WeChat Reader AI · Backlog

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
| WR-001 | P0 | Stabilize local extension install path | “打开这个extension显示无法访问您的文件…ERR_FILE_NOT_FOUND” | Keep stable symlink `/Users/didi/work/wechat-reader-extension` and document it in setup instructions. | Ready |
| WR-002 | P1 | Add setup and troubleshooting guide | Repeated manual steps were needed to reload / re-enable the extension. | Add `SETUP.md`; update `REBUILD_PROMPT.md`; add troubleshooting section to options page later. | Ready |
| WR-003 | P1 | Improve first-use and article-specific launch | User gave a WeChat article URL and expected direct plugin activation. | Add clearer unsupported-page state and “Analyze current tab” / URL helper. | Proposed |
| WR-004 | P1 | Add diagnostics panel | Current errors are browser-level or generic extension errors. | Show current tab URL, supported page status, extraction status, active provider, API key configured status, and last error. | Proposed |
| WR-005 | P1 | Improve actionable error messages | “Open a WeChat article first” and API errors are not enough for recovery. | Map common failures to specific next steps. | Proposed |
| WR-006 | P2 | Integrate notes with personal reading-notes folder | User placed reading-notes under `personal/projects` as a side project. | Improve export naming; add helper/import workflow for `/Users/didi/work/work-hub/personal/projects/reading-notes`. | Proposed |
| WR-007 | P1 | Keep chat feedback as product backlog | User asked whether chat expectations can be captured. | Maintain `INTERACTION_LOG.md`; update this backlog when user confirms logging. | Ready |
| WR-008 | P1 | Publish repository documentation to GitHub | “链接到我的GitHub仓库…沉淀read_me和实际这个小插件怎么做” | Add README and setup guide; commit and push docs to GitHub remote. | In Progress |

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
