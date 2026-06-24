# WeChat Reader AI · Optimization Workflow

This project treats user chat feedback as product input, but does not automatically turn every comment into code.

## Trigger

When the user mentions:
- WeChat Reader / 阅读插件
- a WeChat article reading flow
- extension activation, side panel, article extraction, AI summary, chat, save note, export
- plugin errors or UX friction

Ask:

> 是否记录到阅读插件 log，并转成 backlog item？

If yes, record it before implementing.

## Flow

1. **Capture**
   - Append the original chat and interpretation to `INTERACTION_LOG.md`.
   - Keep the user's original wording.

2. **Classify**
   - `P0`: cannot use, broken installation, data loss, API completely blocked.
   - `P1`: repeated friction, confusing state, clear UX improvement.
   - `P2`: nice-to-have, workflow polish, future automation.

3. **Backlog**
   - Add or update an item in `BACKLOG.md`.
   - Each item should have evidence, proposed change, and status.

4. **Implement**
   - Keep changes small.
   - Prefer fixing one backlog item at a time.
   - Update status to `In Progress`.

5. **Verify**
   - Reload the unpacked extension in `chrome://extensions`.
   - Test on a real WeChat article.
   - Check:
     - side panel opens
     - article extraction works
     - active provider is configured
     - summary renders
     - chat works
     - note save/export path is clear

6. **Close**
   - Mark backlog item `Done`.
   - Add a short note to `INTERACTION_LOG.md` if the shipped behavior changes the user flow.

## Current Stable Paths

| Purpose | Path |
|---|---|
| Extension source | `/Users/didi/work/projects/wechat-reader-extension/extension` |
| Stable unpacked extension path | `/Users/didi/work/wechat-reader-extension` |
| Reading notes home | `/Users/didi/work/work-hub/personal/projects/reading-notes` |

## Implementation Order

1. WR-001 / WR-002: setup path and troubleshooting documentation.
2. WR-004 / WR-005: diagnostics and actionable errors.
3. WR-003: article-specific launch helper.
4. WR-006: better note export/import workflow.
