# Local Setup / 本地安装

[English](#english) | [中文](#中文)

## English

### Why This Setup Exists

Chrome unpacked extensions are path-sensitive. If the extension folder is moved after being loaded into Chrome, Chrome may show:

```text
ERR_FILE_NOT_FOUND
```

To avoid this, keep Chrome pointed at a stable path:

```text
~/work/reader-ai-extension
```

That path should point to the real extension source directory:

```text
~/work/projects/reader-ai-extension/extension
```

### Recreate Stable Symlink

```bash
ln -sfn ~/work/projects/reader-ai-extension/extension ~/work/reader-ai-extension
```

If Chrome was previously loaded from the old `~/work/wechat-reader-extension` path, keep that path as a compatibility alias:

```bash
ln -sfn ~/work/projects/reader-ai-extension/extension ~/work/wechat-reader-extension
```

### Load in Chrome

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select `~/work/reader-ai-extension`.
5. Open a WeChat article or Xiaohongshu note.
6. Open the Reader AI side panel.

### Verify

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

## 中文

### 为什么需要这个设置

Chrome 的 unpacked extension 对路径很敏感。如果插件加载到 Chrome 之后，源码目录被移动，Chrome 可能会显示：

```text
ERR_FILE_NOT_FOUND
```

为了避免这个问题，让 Chrome 始终指向一个稳定路径：

```text
/Users/didi/work/reader-ai-extension
```

这个稳定路径应该指向真实插件源码目录：

```text
/Users/didi/work/projects/reader-ai-extension/extension
```

### 重新创建稳定软链

```bash
ln -sfn /Users/didi/work/projects/reader-ai-extension/extension /Users/didi/work/reader-ai-extension
```

如果 Chrome 之前加载的是旧路径 `/Users/didi/work/wechat-reader-extension`，可以保留这个兼容软链：

```bash
ln -sfn /Users/didi/work/projects/reader-ai-extension/extension /Users/didi/work/wechat-reader-extension
```

### 在 Chrome 中加载

1. 打开 `chrome://extensions`。
2. 启用 `Developer mode`。
3. 点击 `Load unpacked`。
4. 选择 `/Users/didi/work/reader-ai-extension`。
5. 打开一篇微信公众号文章或小红书笔记。
6. 打开 Reader AI 侧边栏。

### 验证

使用一篇真实文章：

```text
https://mp.weixin.qq.com/s/YZgBZW6589GIjsOvYUZ1fg
```

检查：

- 侧边栏可以打开
- 能识别文章标题
- 能生成 summary
- chat 能回答与文章相关的问题
- note 保存和导出行为清楚
