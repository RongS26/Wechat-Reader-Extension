chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

// Provider definitions
const PROVIDERS = {
  anthropic: {
    name: 'Anthropic (Claude)',
    baseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-haiku-4-5-20251001',
    type: 'anthropic'
  },
  // baseUrl 含完整版本段（各家不同：OpenAI/DeepSeek/Moonshot 用 /v1，智谱用 /v4，
  // Gemini 用 /v1beta/openai）。callOpenAICompat 只追加 /chat/completions。
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    type: 'openai'
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    type: 'openai'
  },
  moonshot: {
    name: 'Moonshot (Kimi)',
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    type: 'openai'
  },
  zhipu: {
    name: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4v-flash',
    type: 'openai'
  },
  qwen: {
    name: '通义千问 Qwen-VL',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-vl-plus',  // 视觉，单次可容更多图；DashScope 有免费额度
    type: 'openai'
  },
  gemini: {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.5-flash-lite',
    type: 'openai'
  },
  custom: {
    name: 'Custom',
    baseUrl: '',  // 自定义 provider 请填含版本段的完整 base，如 https://host/v1
    defaultModel: '',
    type: 'openai'
  }
};

// Messages may carry multimodal content: an array of blocks
// { type: 'text', text } | { type: 'image', mediaType, data(base64) }.
// Each provider path converts to its own wire format; plain strings pass through.
function toAnthropicContent(content) {
  if (typeof content === 'string') return content;
  return content.map(block => block.type === 'image'
    ? { type: 'image', source: { type: 'base64', media_type: block.mediaType, data: block.data } }
    : { type: 'text', text: block.text }
  );
}

function toOpenAIContent(content) {
  if (typeof content === 'string') return content;
  return content.map(block => block.type === 'image'
    ? { type: 'image_url', image_url: { url: `data:${block.mediaType};base64,${block.data}` } }
    : { type: 'text', text: block.text }
  );
}

// 各模型对 max_tokens 上限不同：glm-4v-flash 硬顶 1024，多数模型可 2048+。
// 取值过高会被 400 拒绝（如智谱 "max_tokens参数非法：限制数值范围[1,1024]"）。
function maxTokensFor(model) {
  const m = String(model || '').toLowerCase();
  if (/glm-4v-flash|glm-4-flash|glm-4v/.test(m)) return 1024;
  if (/qwen-vl|qwen2.*vl/.test(m)) return 1500;  // DashScope qwen-vl 输出上限 ~2000
  return 2048;
}

async function callAnthropic({ baseUrl, apiKey, model, system, messages }) {
  const res = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model, max_tokens: maxTokensFor(model), system,
      messages: messages.map(m => ({ role: m.role, content: toAnthropicContent(m.content) }))
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${data.error?.message || res.statusText}`);
  if (data.error) throw new Error(data.error.message);
  return data.content[0].text;
}

async function callOpenAICompat({ baseUrl, apiKey, model, system, messages }) {
  const converted = messages.map(m => ({ role: m.role, content: toOpenAIContent(m.content) }));
  const oaiMessages = system
    ? [{ role: 'system', content: system }, ...converted]
    : converted;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, max_tokens: maxTokensFor(model), messages: oaiMessages })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`AI API ${res.status}: ${data.error?.message || data.message || res.statusText}`);
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.choices[0].message.content;
}

// Vision capability by provider/model. DeepSeek's chat API has no image input;
// Moonshot/Zhipu only in their -vision / glm-4v variants; model-name patterns win.
function supportsVision(providerId, model) {
  const m = String(model || '').toLowerCase();
  if (/vision|-vl|glm-4v|gpt-4o|gpt-4\.1|gpt-5|o[34]|claude|gemini|qwen-vl/.test(m)) return true;
  if (providerId === 'anthropic') return true;
  if (providerId === 'openai') return true;
  return false;
}

async function callAI({ system, messages }) {
  const { providers = {}, activeProvider = 'anthropic' } = await chrome.storage.sync.get(['providers', 'activeProvider']);

  const providerConfig = providers[activeProvider];
  if (!providerConfig?.apiKey) {
    throw new Error(`No API key for "${PROVIDERS[activeProvider]?.name || activeProvider}". Configure in ⚙ Settings.`);
  }

  const def = PROVIDERS[activeProvider] || {};
  const baseUrl = (activeProvider === 'custom' ? providerConfig.baseUrl : def.baseUrl) || '';
  const model = providerConfig.model || def.defaultModel;
  const type = def.type || 'openai';

  if (type === 'anthropic') {
    return callAnthropic({ baseUrl, apiKey: providerConfig.apiKey, model, system, messages });
  } else {
    return callOpenAICompat({ baseUrl, apiKey: providerConfig.apiKey, model, system, messages });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'userExcerpt') {
    (async () => {
      const articleUrl = message.url || sender?.tab?.url || '';
      if (!articleUrl) {
        sendResponse({ error: 'Missing article URL for excerpt storage.' });
        return;
      }

      const key = `selectedExcerpts:${articleUrl}`;
      const { [key]: selectedExcerpts = [] } = await chrome.storage.local.get([key]);
      const nextItem = {
        text: message.text || '',
        note: String(message.note || '').trim(),
        paragraphId: String(message.paragraphId || '').replace(/\D/g, ''),
        ts: new Date().toISOString()
      };

      const normalized = nextItem.text.trim();
      const exists = selectedExcerpts.some(item =>
        item.text?.trim() === normalized && String(item.paragraphId || '') === nextItem.paragraphId
      );
      let nextList = selectedExcerpts;
      let changed = false;

      if (exists) {
        nextList = selectedExcerpts.map(item => {
          const sameItem = item.text?.trim() === normalized && String(item.paragraphId || '') === nextItem.paragraphId;
          if (!sameItem) return item;
          const shouldUpdateNote = nextItem.note && !String(item.note || '').trim();
          if (!shouldUpdateNote) return item;
          changed = true;
          return { ...item, note: nextItem.note, ts: nextItem.ts };
        });
      } else {
        changed = true;
        nextList = [nextItem, ...selectedExcerpts].slice(0, 30);
      }

      if (changed) {
        await chrome.storage.local.set({ [key]: nextList });

        chrome.runtime.sendMessage({
          type: 'selectedExcerptUpdated',
          url: articleUrl,
          excerpt: nextItem,
          list: nextList
        });
      }

      sendResponse({ ok: true, count: nextList.length, duplicate: exists && !changed });
    })().catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (message.type === 'updateExcerptNote') {
    (async () => {
      const articleUrl = message.url || sender?.tab?.url || '';
      if (!articleUrl) {
        sendResponse({ error: 'Missing article URL for excerpt update.' });
        return;
      }

      const key = `selectedExcerpts:${articleUrl}`;
      const { [key]: selectedExcerpts = [] } = await chrome.storage.local.get([key]);
      const text = String(message.text || '').trim();
      const paragraphId = String(message.paragraphId || '').replace(/\D/g, '');
      const note = String(message.note || '').trim();

      const nextList = selectedExcerpts.map(item => {
        const sameItem = item.text?.trim() === text && String(item.paragraphId || '') === paragraphId;
        if (!sameItem) return item;
        return { ...item, note, ts: new Date().toISOString() };
      });

      await chrome.storage.local.set({ [key]: nextList });
      chrome.runtime.sendMessage({ type: 'selectedExcerptUpdated', url: articleUrl, list: nextList });
      sendResponse({ ok: true, count: nextList.length });
    })().catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (message.type === 'deleteExcerpt') {
    (async () => {
      const articleUrl = message.url || sender?.tab?.url || '';
      if (!articleUrl) {
        sendResponse({ error: 'Missing article URL for excerpt deletion.' });
        return;
      }

      const key = `selectedExcerpts:${articleUrl}`;
      const { [key]: selectedExcerpts = [] } = await chrome.storage.local.get([key]);
      const text = String(message.text || '').trim();
      const paragraphId = String(message.paragraphId || '').replace(/\D/g, '');

      const nextList = selectedExcerpts.filter(item =>
        !(item.text?.trim() === text && String(item.paragraphId || '') === paragraphId)
      );

      await chrome.storage.local.set({ [key]: nextList });
      chrome.runtime.sendMessage({ type: 'selectedExcerptUpdated', url: articleUrl, list: nextList });
      sendResponse({ ok: true, count: nextList.length });
    })().catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (message.type === 'getArticle') {
    const SUPPORTED_URL = /^https:\/\/(mp\.weixin\.qq\.com|www\.xiaohongshu\.com)\//;
    const UNSUPPORTED_MSG = 'Open a WeChat article (mp.weixin.qq.com) or a Xiaohongshu note (xiaohongshu.com) first.';
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) { sendResponse({ error: 'No active tab' }); return; }
      if (!SUPPORTED_URL.test(tabs[0].url || '')) {
        sendResponse({ error: UNSUPPORTED_MSG });
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, { type: 'extractArticle' }, (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({ error: UNSUPPORTED_MSG });
        } else {
          sendResponse(response);
        }
      });
    });
    return true;
  }

  if (message.type === 'callAI') {
    callAI({ system: message.system, messages: message.messages })
      .then(result => sendResponse({ result }))
      .catch(e => sendResponse({ error: e.message }));
    return true;
  }

  if (message.type === 'scrollToParagraph' || message.type === 'scrollToImage') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) { sendResponse({ error: 'No active tab' }); return; }
      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: message.type, paragraphId: message.paragraphId, imageId: message.imageId },
        (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({ error: chrome.runtime.lastError.message });
          } else {
            sendResponse(response);
          }
        }
      );
    });
    return true;
  }

  if (message.type === 'getProviders') {
    sendResponse({ PROVIDERS });
    return false;
  }

  if (message.type === 'getActiveProvider') {
    (async () => {
      const { providers = {}, activeProvider = 'anthropic' } = await chrome.storage.sync.get(['providers', 'activeProvider']);
      const def = PROVIDERS[activeProvider] || {};
      const model = providers[activeProvider]?.model || def.defaultModel || '';
      sendResponse({
        id: activeProvider,
        name: def.name || activeProvider,
        model,
        vision: supportsVision(activeProvider, model)
      });
    })().catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (message.type === 'saveNote') {
    (async () => {
      const { notes = [] } = await chrome.storage.local.get(['notes']);
      notes.unshift(message.note);
      await chrome.storage.local.set({ notes });
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (message.type === 'getNotes') {
    chrome.storage.local.get(['notes'], ({ notes = [] }) => sendResponse({ notes }));
    return true;
  }
});
