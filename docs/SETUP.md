# Local Setup

## Why This Setup Exists

Chrome unpacked extensions are path-sensitive. If the extension folder is moved after being loaded into Chrome, Chrome may show:

```text
ERR_FILE_NOT_FOUND
```

To avoid this, keep Chrome pointed at a stable path:

```text
/Users/didi/work/wechat-reader-extension
```

That path should point to the real extension source directory:

```text
/Users/didi/work/projects/wechat-reader-extension/extension
```

## Recreate Stable Symlink

```bash
ln -sfn /Users/didi/work/projects/wechat-reader-extension/extension /Users/didi/work/wechat-reader-extension
```

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select `/Users/didi/work/wechat-reader-extension`.
5. Open a WeChat article.
6. Open the extension side panel.

## Verify

Use a real article:

```text
https://mp.weixin.qq.com/s/YZgBZW6589GIjsOvYUZ1fg
```

Check:

- side panel opens
- article title is detected
- summary can be generated
- chat can answer article-specific questions
- note save/export behavior is clear
