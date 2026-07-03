const PROVIDER_DEFS = {
  anthropic: { name: 'Anthropic (Claude)', placeholder: 'sk-ant-…', modelPlaceholder: 'claude-haiku-4-5-20251001', showUrl: false },
  openai:    { name: 'OpenAI',             placeholder: 'sk-…',     modelPlaceholder: 'gpt-4o-mini',              showUrl: false },
  deepseek:  { name: 'DeepSeek',           placeholder: 'sk-…',     modelPlaceholder: 'deepseek-chat',            showUrl: false },
  moonshot:  { name: 'Moonshot (Kimi)',     placeholder: 'sk-…',     modelPlaceholder: 'moonshot-v1-8k',          showUrl: false },
  zhipu:     { name: '智谱 GLM',           placeholder: '…',        modelPlaceholder: 'glm-4-flash',             showUrl: false },
  custom:    { name: 'Custom',             placeholder: 'API Key',  modelPlaceholder: 'model name',              showUrl: true  }
};

let state = { providers: {}, activeProvider: 'anthropic' };
let autoSaveTimers = {};
let statusClearTimers = {};

const DEFAULT_READER_PROFILE = 'DiDi 拉美金融产品 PM，负责 BNPL（先买后付）、支付流程与跨端引导，主战场墨西哥，辐射巴西及拉美新兴市场；日常工作是 BRD、产品策略、数据分析、跨团队协作。正在亲手搭建 AI-native 个人工作流（agent、skill、知识资产系统），长期目标是成为表达者、建立个人 IP，经营三条内容线：自我成长反思、生活与旅行见闻、工作方法论沉淀。阅读目的：① 提炼可迁移的判断框架，用于产品与组织决策；② 收集可转化为内容创作的洞察与素材。偏好：结论先行、具体可落地、直接映射到上述场景；反感泛化的顾问式建议和空洞术语。';

async function loadState() {
  const stored = await chrome.storage.sync.get(['providers', 'activeProvider']);
  state.providers = stored.providers || {};
  state.activeProvider = stored.activeProvider || 'anthropic';
}

async function saveProviderKey(id, label = 'Saved ✓') {
  // Cancel any pending debounced save so blur + input never double-write the status
  clearTimeout(autoSaveTimers[id]);
  const keyInput = document.getElementById(`key-${id}`);
  const modelInput = document.getElementById(`model-${id}`);
  const urlInput = document.getElementById(`url-${id}`);
  const status = document.getElementById(`status-${id}`);

  const entry = {
    apiKey: keyInput?.value.trim() || '',
    model: modelInput?.value.trim() || '',
  };
  if (urlInput) entry.baseUrl = urlInput.value.trim();

  state.providers[id] = entry;
  await chrome.storage.sync.set({ providers: state.providers });

  if (!status) return;
  clearTimeout(statusClearTimers[id]);
  status.textContent = label;
  statusClearTimers[id] = setTimeout(() => { status.textContent = ''; }, 2000);
}

function scheduleAutoSave(id) {
  clearTimeout(autoSaveTimers[id]);
  clearTimeout(statusClearTimers[id]);
  const status = document.getElementById(`status-${id}`);
  if (status) status.textContent = 'Saving…';
  autoSaveTimers[id] = setTimeout(() => {
    saveProviderKey(id, 'Auto-saved ✓').catch(() => {});
  }, 500);
}

async function setActive(id) {
  state.activeProvider = id;
  await chrome.storage.sync.set({ activeProvider: id });
  renderCards();
}

function renderCards() {
  const container = document.getElementById('providers-container');
  container.innerHTML = '';

  for (const [id, def] of Object.entries(PROVIDER_DEFS)) {
    const saved = state.providers[id] || {};
    const isActive = state.activeProvider === id;

    const card = document.createElement('div');
    card.className = `provider-card${isActive ? ' active' : ''}`;
    card.id = `card-${id}`;

    card.innerHTML = `
      <div class="card-header">
        <span class="provider-name">${def.name}</span>
        <span class="active-badge">Using</span>
      </div>

      ${def.showUrl ? `
      <div class="field">
        <label>Base URL</label>
        <input type="text" id="url-${id}" placeholder="https://your-api.com" value="${saved.baseUrl || ''}">
      </div>` : ''}

      <div class="field">
        <label>API Key</label>
        <input type="password" id="key-${id}" placeholder="${def.placeholder}" value="${saved.apiKey || ''}">
      </div>

      <div class="field">
        <label>Model</label>
        <input type="text" id="model-${id}" placeholder="${def.modelPlaceholder}" value="${saved.model || ''}">
      </div>

      <div class="card-footer">
        <button class="btn-use" id="use-${id}" ${isActive ? 'disabled' : ''}>${isActive ? 'Active' : 'Use this'}</button>
        <button class="btn-save-key" id="save-${id}">Save</button>
        <span class="save-status" id="status-${id}"></span>
      </div>
    `;

    container.appendChild(card);

    const keyField = card.querySelector(`#key-${id}`);
    const modelField = card.querySelector(`#model-${id}`);
    const urlField = card.querySelector(`#url-${id}`);

    card.querySelector(`#save-${id}`).addEventListener('click', () => saveProviderKey(id));
    [keyField, modelField, urlField].filter(Boolean).forEach(field => {
      field.addEventListener('input', () => scheduleAutoSave(id));
      field.addEventListener('blur', () => saveProviderKey(id, 'Auto-saved ✓'));
    });
    if (!isActive) {
      card.querySelector(`#use-${id}`).addEventListener('click', () => setActive(id));
    }
  }
}

// Reader profile — injected into every analysis so output speaks to THIS reader
function initReaderProfile() {
  const profileEl = document.getElementById('reader-profile');
  const statusEl = document.getElementById('profile-status');
  if (!profileEl) return;
  let saveTimer = null;
  let clearTimer = null;

  chrome.storage.sync.get(['readerProfile'], ({ readerProfile }) => {
    const value = (readerProfile || '').trim() || DEFAULT_READER_PROFILE;
    profileEl.value = value;
    if (!readerProfile) chrome.storage.sync.set({ readerProfile: value });
  });

  const save = () => {
    clearTimeout(saveTimer);
    const value = profileEl.value.trim() || DEFAULT_READER_PROFILE;
    chrome.storage.sync.set({ readerProfile: value }).then(() => {
      if (!statusEl) return;
      clearTimeout(clearTimer);
      statusEl.textContent = 'Auto-saved ✓';
      clearTimer = setTimeout(() => { statusEl.textContent = ''; }, 2000);
    });
  };

  profileEl.addEventListener('input', () => {
    clearTimeout(saveTimer);
    if (statusEl) statusEl.textContent = 'Saving…';
    saveTimer = setTimeout(save, 600);
  });
  profileEl.addEventListener('blur', save);

  document.getElementById('profile-reset')?.addEventListener('click', () => {
    profileEl.value = DEFAULT_READER_PROFILE;
    save();
  });
}

// Notes
chrome.storage.local.get(['notes'], ({ notes = [] }) => {
  document.getElementById('notes-count').textContent =
    `${notes.length} note${notes.length !== 1 ? 's' : ''} saved`;
});

document.getElementById('btn-export').addEventListener('click', () => {
  chrome.storage.local.get(['notes'], ({ notes = [] }) => {
    if (!notes.length) { alert('No notes saved yet.'); return; }

    const md = notes.map(n => [
      `## ${n.title}`,
      `> ${n.date}${n.author ? ' · ' + n.author : ''}`,
      n.url ? `> ${n.url}` : '',
      n.language ? `> Language: ${n.language === 'en' ? 'English' : 'Chinese'}` : '',
      '',
      '### Summary',
      n.summary,
      (n.corePoints || n.structure) ? `\n### Core Points\n${n.corePoints || n.structure}` : '',
      '',
      '### Key Insights',
      n.insights,
      n.excerpts ? `\n### Core Excerpts\n${n.excerpts}` : '',
      n.readerValue ? `\n### Reader Value\n${n.readerValue}` : '',
      n.actionIdeas ? `\n### Action Ideas\n${n.actionIdeas}` : '',
      n.conclusion ? `\n### Core Conclusion\n${n.conclusion}` : '',
      n.authorIntent ? `\n### Author Intent\n${n.authorIntent}` : '',
      n.myNotes ? `\n### My Notes\n${n.myNotes}` : '',
      '\n---'
    ].filter(l => l !== null).join('\n')).join('\n\n');

    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `reading-notes_${new Date().toISOString().slice(0, 10)}-wechat-notes.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
});

// Init
loadState().then(renderCards);
initReaderProfile();
