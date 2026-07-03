// --- Site adapters: one extractor per supported platform ---
// Adding a platform = adding an adapter object + a manifest content_scripts match.
const SITE_ADAPTERS = {
  wechat: {
    id: 'wechat',
    label: '微信公众号',
    matches: () => location.hostname === 'mp.weixin.qq.com',
    contentEl: () =>
      document.querySelector('#js_content') ||
      document.querySelector('.rich_media_content'),
    title: () => (
      document.querySelector('#activity-name') ||
      document.querySelector('.rich_media_title')
    )?.innerText?.trim() || document.title,
    author: () => (
      document.querySelector('#js_name') ||
      document.querySelector('.profile_nickname')
    )?.innerText?.trim() || '',
    date: () => (
      document.querySelector('#publish_time') ||
      document.querySelector('.rich_media_meta_text')
    )?.innerText?.trim() || '',
    paragraphSelector: 'p, section, blockquote, li',
    minContentLength: 80,
    images(contentEl) {
      if (!contentEl) return [];
      return Array.from(contentEl.querySelectorAll('img'))
        .map(img => img.dataset?.src || img.currentSrc || img.src || '')
        .filter(src => /^https?:/.test(src));
    },
    isVideo: () => false
  },
  xhs: {
    id: 'xhs',
    label: '小红书',
    matches: () => /(^|\.)xiaohongshu\.com$/.test(location.hostname),
    // XHS is a SPA and its DOM shifts often — every selector has fallbacks,
    // and meta tags are the last resort.
    contentEl: () =>
      document.querySelector('#detail-desc') ||
      document.querySelector('.note-content .desc') ||
      document.querySelector('.note-content') ||
      document.querySelector('.desc'),
    title: () =>
      document.querySelector('#detail-title')?.innerText?.trim() ||
      document.querySelector('.note-content .title')?.innerText?.trim() ||
      document.querySelector('meta[property="og:title"]')?.content?.trim() ||
      document.title,
    author: () =>
      document.querySelector('.author-wrapper .username')?.innerText?.trim() ||
      document.querySelector('.author .name')?.innerText?.trim() ||
      document.querySelector('.info .name')?.innerText?.trim() || '',
    date: () =>
      document.querySelector('.bottom-container .date')?.innerText?.trim() ||
      document.querySelector('.date')?.innerText?.trim() || '',
    paragraphSelector: 'p, .note-text > span, .desc > span',
    minContentLength: 20,
    images() {
      const urls = [];
      const push = src => {
        if (!src || !/^https?:/.test(src)) return;
        const clean = src.split('?')[0]; // CDN params differ across duplicated slides
        if (!urls.some(u => u.split('?')[0] === clean)) urls.push(src);
      };
      document.querySelectorAll(
        '.media-container img, .swiper-slide img, .img-container img, .carousel img'
      ).forEach(img => push(img.currentSrc || img.src || img.dataset?.src));
      if (!urls.length) {
        document.querySelectorAll('meta[name="og:image"], meta[property="og:image"]')
          .forEach(meta => push(meta.content));
      }
      return urls;
    },
    isVideo: () => Boolean(
      document.querySelector('meta[name="og:video"], meta[property="og:video"]') ||
      document.querySelector('.player-container video, xg-video-container video')
    )
  }
};

function activeAdapter() {
  for (const adapter of Object.values(SITE_ADAPTERS)) {
    try { if (adapter.matches()) return adapter; } catch (_) { /* try next */ }
  }
  return null;
}

// --- Click-to-excerpt: floating button on text selection ---
(function setupExcerptSelection() {
  let excerptSetupDone = false;

  function findContentEl() {
    try { return activeAdapter()?.contentEl() || null; } catch (_) { return null; }
  }

  function bootWhenReady() {
    if (excerptSetupDone) return;
    const contentEl = findContentEl();
    if (!contentEl) return;
    excerptSetupDone = true;

  let excerptBtn = null;
  let excerptTimer = null;

  function removeBtn() {
    if (excerptBtn) { excerptBtn.remove(); excerptBtn = null; }
  }

  function getSelectedExcerptState() {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text || text.length < 8) return null;
    const anchorNode = sel?.anchorNode || sel?.focusNode || null;
    if (!anchorNode || !contentEl.contains(anchorNode)) return null;

    const para = (anchorNode.parentElement || anchorNode.parentNode)?.closest?.('[data-wrai-paragraph]');
    const paragraphId = para?.dataset.wraiParagraph || '';
    const range = sel.rangeCount ? sel.getRangeAt(0) : null;
    const rect = range?.getBoundingClientRect?.() || null;
    if (!rect || (rect.width === 0 && rect.height === 0)) return null;

    return { text, paragraphId, rect, sel };
  }

  function placeButton(rect) {
    removeBtn();
    excerptBtn = document.createElement('button');
    excerptBtn.textContent = '✦ Add Excerpt';
    excerptBtn.type = 'button';
    excerptBtn.title = 'Save selected text as a Core Excerpt';
    Object.assign(excerptBtn.style, {
      position: 'fixed', zIndex: '99999',
      background: '#07c160', color: '#fff',
      border: 'none', borderRadius: '6px',
      padding: '5px 14px', fontSize: '13px',
      cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.2)',
      fontFamily: 'system-ui, sans-serif',
      lineHeight: '1.2', whiteSpace: 'nowrap'
    });

    const left = Math.min(
      window.innerWidth - 110,
      Math.max(8, rect.left + rect.width / 2 - 64)
    );
    const aboveTop = rect.top - 42;
    const belowTop = rect.bottom + 10;
    excerptBtn.style.left = `${left}px`;
    excerptBtn.style.top = `${aboveTop >= 8 ? aboveTop : belowTop}px`;

    document.body.appendChild(excerptBtn);

    excerptBtn.addEventListener('mousedown', e => {
      e.preventDefault();
      const sel = window.getSelection();
      const text = sel?.toString().trim();
      const anchorNode = sel?.anchorNode || sel?.focusNode || null;
      const para = (anchorNode?.parentElement || anchorNode?.parentNode)?.closest?.('[data-wrai-paragraph]');
      const paragraphId = para?.dataset.wraiParagraph || '';
      if (!text) return;
      const note = window.prompt('Add a note for this excerpt (optional):', '') || '';
      chrome.runtime.sendMessage({
        type: 'userExcerpt',
        text,
        note,
        paragraphId,
        url: location.href
      });
      removeBtn();
      sel.removeAllRanges();
    });
  }

  function scheduleExcerptButton() {
    clearTimeout(excerptTimer);
    excerptTimer = setTimeout(() => {
      const state = getSelectedExcerptState();
      if (!state) { removeBtn(); return; }
      placeButton(state.rect);
    }, 30);
  }

  document.addEventListener('mouseup', scheduleExcerptButton);
  document.addEventListener('keyup', scheduleExcerptButton);
  document.addEventListener('selectionchange', scheduleExcerptButton);

  document.addEventListener('mousedown', e => {
    if (excerptBtn && e.target !== excerptBtn) removeBtn();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') removeBtn();
  });
  }

  bootWhenReady();
  if (!excerptSetupDone) {
    const observer = new MutationObserver(() => {
      if (excerptSetupDone) {
        observer.disconnect();
        return;
      }
      const contentEl = findContentEl();
      if (contentEl) {
        observer.disconnect();
        bootWhenReady();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 15000);
  }
})();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'extractArticle') {
    const adapter = activeAdapter();
    if (!adapter) {
      sendResponse({ error: 'Open a WeChat article (mp.weixin.qq.com) or a Xiaohongshu note (xiaohongshu.com) first.' });
      return true;
    }

    const read = fn => { try { return fn ? fn.call(adapter) : ''; } catch (_) { return ''; } };

    const title = read(adapter.title) || document.title;
    const author = read(adapter.author);
    const date = read(adapter.date);
    let contentEl = null;
    try { contentEl = adapter.contentEl() || null; } catch (_) { contentEl = null; }

    let content = '';
    let paragraphs = [];
    if (contentEl) {
      const clone = contentEl.cloneNode(true);
      clone.querySelectorAll('img, video, iframe, script, style').forEach(el => el.remove());
      content = clone.innerText.trim();

      paragraphs = Array.from(contentEl.querySelectorAll(adapter.paragraphSelector))
        .map((el, index) => {
          const text = el.innerText?.replace(/\s+/g, ' ').trim() || '';
          if (!text || text.length < 12) return null;
          el.dataset.wraiParagraph = String(index + 1);
          return { id: index + 1, text };
        })
        .filter(Boolean)
        .slice(0, 180);

      if (!paragraphs.length) {
        paragraphs = content
          .split(/\n{2,}/)
          .map(text => text.replace(/\s+/g, ' ').trim())
          .filter(text => text.length >= 12)
          .map((text, index) => ({ id: index + 1, text }))
          .slice(0, 180);
      }
    }

    let images = [];
    try { images = adapter.images(contentEl) || []; } catch (_) { images = []; }
    images = images.slice(0, 20).map((src, index) => ({ id: index + 1, src }));
    const isVideo = Boolean(read(adapter.isVideo));

    const languageBase = `${title}\n${content}`;
    const cjk = (languageBase.match(/[一-鿿]/g) || []).length;
    const latin = (languageBase.match(/[A-Za-z]/g) || []).length;
    const language = cjk >= latin ? 'zh' : 'en';

    const minLength = adapter.minContentLength ?? 80;
    if (!content || content.length < minLength) {
      // Image- or video-first note (common on XHS): proceed with whatever text exists
      const mediaOnlyOk = adapter.id === 'xhs' && (images.length || isVideo) && title;
      if (!mediaOnlyOk) {
        sendResponse({
          error: 'Could not read the main content. The page may still be loading or it may not be a supported article/note body.'
        });
        return true;
      }
      content = content || title;
    }

    sendResponse({
      title, author, date, content, paragraphs, language,
      url: window.location.href,
      platform: adapter.id,
      platformLabel: adapter.label,
      images,
      isVideo
    });
  }

  if (message.type === 'scrollToParagraph') {
    const id = String(message.paragraphId || '').replace(/\D/g, '');
    const target = document.querySelector(`[data-wrai-paragraph="${id}"]`);
    if (!target) {
      sendResponse({ error: `Paragraph P${id} was not found on the page.` });
      return true;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.style.transition = 'background 0.2s ease';
    target.style.background = 'rgba(7, 193, 96, 0.16)';
    setTimeout(() => {
      target.style.background = '';
    }, 1800);
    sendResponse({ ok: true });
  }
  return true;
});
