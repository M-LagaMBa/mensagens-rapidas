const ALLOWED_DOMAINS = ["ascbrazil.com.br", "blip.ai"];

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url) return;
  const url = new URL(tab.url);
  if (!['http:', 'https:'].includes(url.protocol) || !ALLOWED_DOMAINS.some(domain => url.hostname === domain || url.hostname.endsWith('.' + domain))) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'toggle_widget' });
  } catch (_) {
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
      await chrome.tabs.sendMessage(tab.id, { action: 'toggle_widget' });
    } catch (error) { console.error('Não foi possível abrir o widget:', error); }
  }
});

// Serializa leitura e escrita para preservar alterações de outras abas.
let writeQueue = Promise.resolve();
chrome.runtime.onMessage.addListener((request, sender, respond) => {
  if (request.action !== 'save_messages') return;
  if (sender.id !== chrome.runtime.id) { respond({ ok: false, error: 'Origem inválida' }); return; }
  const operation = writeQueue.then(async () => {
    const stored = await chrome.storage.local.get(['myMsgs', 'recentIds']);
    let messages = stored.myMsgs || [];
    if (Array.isArray(request.replace)) {
      messages = request.replace;
    } else {
      const removed = new Set(request.deleted || []);
      messages = messages.filter(m => !removed.has(m.id));
      for (const change of request.upserts || []) {
        const index = messages.findIndex(m => m.id === change.id);
        if (change.create) {
          const message = { ...change.create };
          if (messages.some(m => m.id === message.id)) {
            message.id = Date.now();
            while (messages.some(m => m.id === message.id)) message.id++;
          }
          messages.push(message);
        } else if (index >= 0) {
          messages[index] = { ...messages[index], ...change.fields, id: change.id };
        } else {
          throw new Error('Uma mensagem editada foi removida em outra aba.');
        }
      }
      const positions = new Map((request.order || []).map((id, i) => [id, i]));
      messages.sort((a, b) => (positions.get(a.id) ?? Infinity) - (positions.get(b.id) ?? Infinity));
    }
    const ids = new Set(messages.map(m => m.id));
    if (ids.size !== messages.length || messages.some(m => !Number.isSafeInteger(m.id) || m.id <= 0 || typeof m.text !== 'string' || !m.text.trim() || typeof m.tag !== 'string')) {
      throw new Error('Mensagens inválidas ou IDs duplicados.');
    }
    const recentIds = (stored.recentIds || []).filter(id => ids.has(id));
    await chrome.storage.local.set({ myMsgs: messages, recentIds });
    return { ok: true, messages };
  });
  writeQueue = operation.catch(() => {});
  operation.then(respond, error => respond({ ok: false, error: error.message }));
  return true;
});
