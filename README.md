# WeChat Reader AI

A local Chrome extension for reading WeChat public-account articles with AI assistance.

It is designed for a personal reading workflow:

- extract article title, author, publish time, and body text from `mp.weixin.qq.com`
- summarize long articles with an LLM provider
- ask follow-up questions about the current article
- save useful notes locally
- export reading notes into a personal knowledge folder
- convert real usage friction into a product backlog for continuous improvement

## Current Status

This is a local unpacked Chrome extension, not a Chrome Web Store package.

Stable local paths:

| Purpose | Path |
|---|---|
| Source repository | `/Users/didi/work/projects/wechat-reader-extension` |
| Stable Chrome unpacked-extension path | `/Users/didi/work/wechat-reader-extension` |
| Personal reading notes home | `/Users/didi/work/work-hub/personal/projects/reading-notes` |

The stable unpacked-extension path matters because Chrome remembers the folder path. If the source folder moves, Chrome may show `ERR_FILE_NOT_FOUND`.

## Features

- Side panel reading assistant
- WeChat article extraction through content script
- Multi-provider LLM settings
- Local storage for API configuration and notes
- Product feedback log:
  - `INTERACTION_LOG.md`
  - `BACKLOG.md`
  - `OPTIMIZATION_WORKFLOW.md`

## Install Locally

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Enable `Developer mode`.
4. Click `Load unpacked`.
5. Select:

```text
/Users/didi/work/wechat-reader-extension
```

6. Pin or open the extension side panel.
7. Open a WeChat article under `https://mp.weixin.qq.com/`.
8. Click the extension and run analysis.

## Configure API Provider

1. Open the extension options page.
2. Choose a provider.
3. Add the corresponding API key.
4. Save settings.

Supported host permissions currently include:

- Anthropic
- OpenAI
- DeepSeek
- Moonshot
- Zhipu

## Usage Flow

1. Open a WeChat article.
2. Open the WeChat Reader AI side panel.
3. Extract article content.
4. Generate summary or ask questions.
5. Save useful notes.
6. Export notes into the reading-notes folder when needed.

## Product Workflow

This extension treats chat feedback as product input.

When a user reports friction or asks for an improvement:

1. Record the original feedback in `INTERACTION_LOG.md`.
2. Convert it into a backlog item in `BACKLOG.md`.
3. Implement a small scoped change.
4. Reload the unpacked extension.
5. Verify on a real WeChat article.

See:

- [Optimization Workflow](./OPTIMIZATION_WORKFLOW.md)
- [Backlog](./BACKLOG.md)
- [Interaction Log](./INTERACTION_LOG.md)

## Troubleshooting

### Chrome shows `ERR_FILE_NOT_FOUND`

The unpacked extension folder path probably moved.

Fix:

1. Confirm the stable path exists:

```bash
ls -la /Users/didi/work/wechat-reader-extension
```

2. If needed, recreate the symlink:

```bash
ln -sfn /Users/didi/work/projects/wechat-reader-extension /Users/didi/work/wechat-reader-extension
```

3. Open `chrome://extensions`.
4. Remove the broken extension entry or reload it.
5. Load unpacked from `/Users/didi/work/wechat-reader-extension`.

### The extension says the current page is unsupported

Open a real WeChat public-account article whose URL starts with:

```text
https://mp.weixin.qq.com/
```

### Article extraction is empty

Reload the article page, then reopen the side panel. Some WeChat pages delay-render content.

### AI request fails

Check:

- provider selected
- API key saved
- network/proxy status
- provider quota or auth errors

## GitHub

Remote:

```text
https://github.com/AustenS26/wechat-reader-extension.git
```

Recommended publish flow:

```bash
git status
git add README.md SETUP.md BACKLOG.md INTERACTION_LOG.md OPTIMIZATION_WORKFLOW.md REBUILD_PROMPT.md
git commit -m "Document WeChat Reader extension workflow"
git push origin main
```

