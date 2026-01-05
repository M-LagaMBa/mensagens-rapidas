(function() {
  if (window.hasASCPlusLoaded) return;
  window.hasASCPlusLoaded = true;

  let messages = [];
  let currentFilter = "TODAS";
  let editingId = null;
  let isProcessingClick = false; // Trava para evitar duplicação

  function initWidget() {
    const existing = document.getElementById('m-rapidas-widget');
    if (existing) {
      existing.style.display = (existing.style.display === 'none') ? 'flex' : 'none';
      return;
    }

    const style = document.createElement('style');
    style.textContent = `
      #m-rapidas-widget {
        position: fixed; top: 20px; right: 20px; width: 380px; height: 650px;
        min-width: 280px; background: rgba(13, 17, 23, 0.98);
        border: 1px solid rgba(0, 210, 255, 0.3); border-radius: 24px;
        z-index: 2147483647; display: flex; flex-direction: column;
        box-shadow: 0 30px 60px rgba(0,0,0,0.8); font-family: 'Inter', sans-serif;
        color: #f0f6fc; backdrop-filter: blur(20px); overflow: visible;
      }
      .resizer { position: absolute; top: 0; width: 15px; height: 100%; cursor: ew-resize; z-index: 10001; }
      .resizer-left { left: 0; }
      .resizer-right { right: 0; }
      #m-rapidas-widget.is-minimized { height: 55px !important; width: 250px !important; overflow: hidden; }
      #m-rapidas-widget.is-minimized .w-body, #m-rapidas-widget.is-minimized .w-footer { display: none !important; }
      .w-header { padding: 0 20px; height: 55px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: move; flex-shrink: 0; border-radius: 24px 24px 0 0; }
      .w-header span { font-weight: 800; font-size: 11px; color: #00d2ff; text-transform: uppercase; pointer-events: none; }
      .h-btn-group { display: flex; gap: 12px; z-index: 10002; }
      .h-btn { cursor: pointer; font-size: 18px; opacity: 0.6; transition: 0.2s; }
      .w-body { flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; }
      .filter-bar { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 10px; flex-shrink: 0; align-items: center; }
      .filter-tag { padding: 6px 12px; border-radius: 10px; background: rgba(255,255,255,0.05); font-size: 10px; cursor: pointer; white-space: nowrap; border: 1px solid transparent; }
      .filter-tag.active { background: rgba(0, 210, 255, 0.2); border-color: #00d2ff; color: #00d2ff; font-weight: bold; }
      .msg-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 16px; margin-bottom: 12px; cursor: pointer; transition: 0.2s; display: flex; flex-direction: column; gap: 10px; }
      .msg-card:hover { border-color: #00d2ff; background: rgba(255, 255, 255, 0.05); transform: scale(1.01); }
      .is-fav { border-left: 4px solid #fbbf24 !important; }
      .tag-label { font-size: 9px; color: #00d2ff; background: rgba(0,210,255,0.1); padding: 2px 8px; border-radius: 20px; text-transform: uppercase; font-weight: bold; align-self: flex-start; }
      .msg-text { font-size: 13.5px; line-height: 1.5; color: #d1d5db; word-break: break-word; }
      .card-actions-bottom-left { display: flex; gap: 18px; align-items: center; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05); }
      .tool-icon { font-size: 15px; opacity: 0.4; transition: 0.2s; cursor: pointer; }
      .tool-icon:hover { opacity: 1; color: #00d2ff; }
      .tool-icon.active { opacity: 1; color: #fbbf24; }
      .w-footer { padding: 15px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.05); flex-shrink: 0; }
      .add-form { display: none; flex-direction: column; gap: 8px; margin-bottom: 10px; }
      textarea { width: 100%; background: #000; color: #fff; border: 1px solid #333; border-radius: 12px; padding: 12px; resize: none; outline: none; font-size: 13px; }
      .btn-main { width: 100%; background: #00d2ff; color: #000; border: none; border-radius: 12px; padding: 12px; font-weight: 800; cursor: pointer; text-transform: uppercase; }
      .btn-cancel { background: transparent; color: #ff6b6b; border: none; font-size: 11px; cursor: pointer; margin-top: 5px; text-decoration: underline; text-align: center; width: 100%; display: block; }
      .dev-footer { text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 2px; }
      .dev-label { font-size: 8px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 2px; }
      .dev-name { color: #00d2ff; font-weight: 900; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; text-shadow: 0 0 10px rgba(0,210,255,0.3); }
      
      /* Estilo dos botões de Backup */
      .backup-group { display: flex; gap: 8px; margin-top: 10px; }
      .btn-backup { flex: 1; font-size: 9px; padding: 6px; background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; cursor: pointer; transition: 0.2s; text-transform: uppercase; font-weight: bold; }
      .btn-backup:hover { background: rgba(255,255,255,0.1); border-color: #00d2ff; }
    `;
    document.head.appendChild(style);

    const widget = document.createElement('div');
    widget.id = 'm-rapidas-widget';
    widget.innerHTML = `
      <div class="resizer resizer-left" id="res-l"></div>
      <div class="resizer resizer-right" id="res-r"></div>
      <div class="w-header" id="drag-h">
        <span>MENSAGENS RÁPIDAS</span>
        <div class="h-btn-group">
          <div class="h-btn" id="btn-min">-</div>
          <div class="h-btn" id="btn-close">✕</div>
        </div>
      </div>
      <div class="w-body">
        <div class="filter-bar" id="tag-filters"></div>
        <div id="w-list"></div>
      </div>
      <div class="w-footer">
        <div id="add-form" class="add-form">
          <textarea id="w-input" rows="3" placeholder="Sua mensagem..."></textarea>
          <button id="w-save" class="btn-main">SALVAR</button>
          <div id="w-cancel" class="btn-cancel">Cancelar</div>
        </div>
        <button id="btn-open-add" class="btn-main">+ INCLUIR MENSAGEM</button>
        
        <div class="backup-group">
          <button id="btn-export" class="btn-backup">Exportar Backup</button>
          <button id="btn-import" class="btn-backup">Importar Backup</button>
          <input type="file" id="import-file" style="display:none" accept=".json">
        </div>

        <div class="dev-footer">
          <span class="dev-label">Desenvolvido por</span>
          <span class="dev-name">Lagamba Tech</span>
        </div>
      </div>
    `;
    document.body.appendChild(widget);

    // MOVIMENTAÇÃO E RESIZE
    const startResizing = (e, side) => {
      e.preventDefault();
      const startX = e.clientX; const startWidth = widget.offsetWidth; const startLeft = widget.offsetLeft;
      const onMouseMove = (mE) => {
        if (side === 'left') {
          const newWidth = startWidth + (startX - mE.clientX);
          if (newWidth > 280) { widget.style.width = newWidth + 'px'; widget.style.left = (startLeft - (startX - mE.clientX)) + 'px'; }
        } else {
          const newWidth = startWidth + (mE.clientX - startX);
          if (newWidth > 280) widget.style.width = newWidth + 'px';
        }
      };
      const onMouseUp = () => window.removeEventListener('mousemove', onMouseMove);
      window.addEventListener('mousemove', onMouseMove); window.addEventListener('mouseup', onMouseUp);
    };
    document.getElementById('res-l').onmousedown = (e) => startResizing(e, 'left');
    document.getElementById('res-r').onmousedown = (e) => startResizing(e, 'right');

    let drag = false, oX, oY;
    document.getElementById('drag-h').onmousedown = (e) => {
      if(e.target.closest('.h-btn-group')) return;
      drag = true; oX = e.clientX - widget.offsetLeft; oY = e.clientY - widget.offsetTop;
    };
    document.addEventListener('mousemove', (e) => {
      if (drag) { widget.style.left = (e.clientX - oX) + 'px'; widget.style.top = (e.clientY - oY) + 'px'; widget.style.right = 'auto'; }
    });
    document.addEventListener('mouseup', () => drag = false);

    // BUSCA DE CAMPO MELHORADA
    function findTargetField(doc = document) {
      const selectors = ['textarea:not(#w-input)', '[contenteditable="true"]:not(#w-input)', 'input[placeholder*="Buscar"]', '#textoMensagem', '.chat-input textarea'];
      for (let s of selectors) {
        let el = doc.querySelector(s);
        if (el && el.offsetParent !== null) return el;
      }
      let frames = doc.querySelectorAll('iframe, frame');
      for (let i = 0; i < frames.length; i++) {
        try {
          let inner = findTargetField(frames[i].contentDocument || frames[i].contentWindow.document);
          if (inner) return inner;
        } catch (e) {}
      }
      return null;
    }

    async function smartFill(text) {
      if (isProcessingClick) return;
      isProcessingClick = true;
      setTimeout(() => { isProcessingClick = false; }, 500);

      const target = findTargetField();
      if (!target) {
        alert("⚠️ Clique no campo do chat ou busca primeiro!");
        return;
      }

      target.focus();
      try {
        if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') { target.value = ''; } 
        else { target.innerHTML = ''; }

        if (!document.execCommand('insertText', false, text)) {
            if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') { target.value = text; } 
            else { target.innerHTML = text; }
        }
        
        ['input', 'change', 'blur', 'keyup'].forEach(ev => target.dispatchEvent(new Event(ev, { bubbles: true })));
      } catch (e) { console.error(e); }
    }

    // FUNÇÕES DE BACKUP (EXPORTAR / IMPORTAR)
    document.getElementById('btn-export').onclick = () => {
      if (messages.length === 0) return alert("Não há mensagens para exportar.");
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(messages, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "backup_mensagens_asc.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    };

    document.getElementById('btn-import').onclick = () => document.getElementById('import-file').click();

    document.getElementById('import-file').onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedMsgs = JSON.parse(event.target.result);
          if (Array.isArray(importedMsgs)) {
            if (confirm(`Deseja importar ${importedMsgs.length} mensagens? Isso substituirá as atuais.`)) {
              messages = importedMsgs;
              save();
            }
          } else { alert("Arquivo de backup inválido."); }
        } catch (err) { alert("Erro ao ler o arquivo JSON."); }
        e.target.value = ''; // Limpa o input
      };
      reader.readAsText(file);
    };

    const render = () => {
      const list = document.getElementById('w-list');
      const filterBar = document.getElementById('tag-filters');
      list.innerHTML = ''; filterBar.innerHTML = '';
      
      const uniqueTags = ["TODAS", "FAV", ...new Set(messages.map(m => m.tag || "GERAL"))];
      uniqueTags.forEach(t => {
        const btn = document.createElement('div');
        btn.className = `filter-tag ${currentFilter === t ? 'active' : ''}`;
        btn.innerText = t === "FAV" ? "★" : t;
        btn.onclick = () => { currentFilter = t; render(); };
        filterBar.appendChild(btn);
      });

      let filtered = messages.filter(m => {
        if (currentFilter === "FAV") return m.fav;
        if (currentFilter === "TODAS") return true;
        return (m.tag || "GERAL") === currentFilter;
      });
      
      filtered.sort((a,b) => b.fav - a.fav).forEach(m => {
        const card = document.createElement('div');
        card.className = `msg-card ${m.fav ? 'is-fav' : ''}`;
        card.innerHTML = `
          <div class="tag-label">${m.tag || 'GERAL'}</div>
          <div class="msg-text">${m.text}</div>
          <div class="card-actions-bottom-left">
            <span class="tool-icon fav-icon ${m.fav ? 'active' : ''}">★</span>
            <span class="tool-icon edit-txt">📝</span>
            <span class="tool-icon edit-tag">🏷️</span>
            <span class="tool-icon del-msg">🗑️</span>
          </div>
        `;
        card.onclick = (e) => { if(!e.target.closest('.card-actions-bottom-left')) smartFill(m.text); };
        card.querySelector('.fav-icon').onclick = (e) => { e.stopPropagation(); m.fav = !m.fav; save(); };
        card.querySelector('.edit-txt').onclick = (e) => { e.stopPropagation(); editingId = m.id; document.getElementById('w-input').value = m.text; toggleAdd(true, true); };
        card.querySelector('.edit-tag').onclick = (e) => { e.stopPropagation(); const nt = prompt("Nova Tag:", m.tag); if(nt) { m.tag = nt.toUpperCase(); save(); } };
        card.querySelector('.del-msg').onclick = (e) => { e.stopPropagation(); if(confirm("Apagar?")) { messages = messages.filter(x => x.id !== m.id); save(); } };
        list.appendChild(card);
      });
    };

    const toggleAdd = (show, isEdit = false) => {
      document.getElementById('add-form').style.display = show ? 'flex' : 'none';
      document.getElementById('btn-open-add').style.display = show ? 'none' : 'block';
      document.getElementById('w-save').innerText = isEdit ? "ATUALIZAR" : "SALVAR";
      if(show) document.getElementById('w-input').focus(); else { document.getElementById('w-input').value = ''; editingId = null; }
    };

    document.getElementById('btn-open-add').onclick = () => toggleAdd(true);
    document.getElementById('w-cancel').onclick = () => toggleAdd(false);
    document.getElementById('btn-min').onclick = (e) => { e.stopPropagation(); widget.classList.toggle('is-minimized'); };
    document.getElementById('btn-close').onclick = () => widget.style.display = 'none';

    const save = () => chrome.storage.local.set({ myMsgs: messages }, render);
    document.getElementById('w-save').onclick = () => {
      const txt = document.getElementById('w-input').value.trim();
      if (!txt) return;
      if (editingId) { 
        const m = messages.find(x => x.id === editingId);
        if(m) m.text = txt;
      } else { 
        const tag = prompt("Tag:", "GERAL") || "GERAL"; 
        messages.push({ id: Date.now(), text: txt, tag: tag.toUpperCase(), fav: false }); 
      }
      toggleAdd(false); save();
    };

    chrome.storage.local.get(['myMsgs'], (res) => { messages = res.myMsgs || []; render(); });
  }

  chrome.runtime.onMessage.addListener((msg) => { if (msg.action === "toggle_widget") initWidget(); });
  document.addEventListener('keydown', (e) => { if (e.altKey && e.key.toLowerCase() === 'q') initWidget(); });
})();