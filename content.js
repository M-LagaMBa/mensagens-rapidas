(function() {
  if (window.hasASCPlusLoaded) return;
  window.hasASCPlusLoaded = true;

  let messages = [];
  let recentIds = [];
  let currentFilter = "TODAS";
  let searchQuery = "";
  let editingId = null;
  let isProcessingClick = false; // Trava para evitar duplicação
  let draggedId = null;
  let lastDragOverTime = 0;

  const TAG_COLORS = ['#00d2ff', '#4ade80', '#fb923c', '#f472b6', '#a78bfa', '#facc15', '#22d3ee', '#f87171'];

  // Cor consistente por tag (mesma tag sempre gera a mesma cor)
  function colorForTag(tag) {
    let hash = 0;
    const str = String(tag || '');
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
  }

  // Evita que texto/tag do usuário quebrem o HTML dos cards
  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str == null ? '' : String(str);
    return d.innerHTML;
  }

  function generateId() {
    const maxId = messages.reduce((max, m) => Math.max(max, m.id || 0), 0);
    return Math.max(Date.now(), maxId + 1);
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #m-rapidas-widget {
        position: fixed; top: 20px; right: 20px; width: 380px; height: 650px;
        min-width: 280px; min-height: 300px; background: rgba(13, 17, 23, 0.98);
        border: 1px solid rgba(0, 210, 255, 0.3); border-radius: 24px;
        z-index: 2147483647; display: flex; flex-direction: column;
        box-shadow: 0 30px 60px rgba(0,0,0,0.8); font-family: 'Inter', sans-serif;
        color: #f0f6fc; backdrop-filter: blur(20px); overflow: visible;
      }
      .resizer { position: absolute; top: 0; width: 15px; height: 100%; cursor: ew-resize; z-index: 10001; }
      .resizer-left { left: 0; }
      .resizer-right { right: 0; }
      .resizer-vertical { position: absolute; left: 0; width: 100%; height: 15px; cursor: ns-resize; z-index: 10001; }
      .resizer-top { top: 0; }
      .resizer-bottom { bottom: 0; }
      #m-rapidas-widget.is-minimized { height: 55px !important; min-height: 55px !important; overflow: hidden; }
      #m-rapidas-widget.is-minimized .w-body, #m-rapidas-widget.is-minimized .w-footer { display: none !important; }
      #m-rapidas-widget.w-anim { transition: height 0.25s ease; }
      .w-header { padding: 0 20px; height: 55px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: move; flex-shrink: 0; border-radius: 24px 24px 0 0; }
      .w-header span { font-weight: 800; font-size: 11px; color: #00d2ff; text-transform: uppercase; pointer-events: none; }
      .h-btn-group { display: flex; gap: 12px; z-index: 10002; }
      .h-btn { cursor: pointer; font-size: 18px; opacity: 0.6; transition: 0.2s; }
      .w-body { flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; }
      .w-body::-webkit-scrollbar { width: 6px; }
      .w-body::-webkit-scrollbar-track { background: transparent; }
      .w-body::-webkit-scrollbar-thumb { background: rgba(0,210,255,0.3); border-radius: 10px; }
      .w-body::-webkit-scrollbar-thumb:hover { background: rgba(0,210,255,0.5); }
      .search-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 10px; padding: 8px 12px; font-size: 12px; margin-bottom: 10px; outline: none; flex-shrink: 0; box-sizing: border-box; }
      .search-input:focus { border-color: #00d2ff; }
      .filter-bar { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 10px; margin-bottom: 10px; flex-shrink: 0; align-items: center; scrollbar-width: thin; scrollbar-color: rgba(0,210,255,0.3) transparent; }
      .filter-bar::-webkit-scrollbar { height: 5px; }
      .filter-bar::-webkit-scrollbar-track { background: transparent; }
      .filter-bar::-webkit-scrollbar-thumb { background: rgba(0,210,255,0.3); border-radius: 10px; }
      .filter-bar::-webkit-scrollbar-thumb:hover { background: rgba(0,210,255,0.5); }
      .filter-tag { padding: 6px 10px; border-radius: 10px; background: rgba(255,255,255,0.05); font-size: 10px; cursor: pointer; white-space: nowrap; border: 1px solid transparent; display: flex; align-items: center; gap: 6px; }
      .filter-tag.active { background: rgba(0, 210, 255, 0.2); border-color: #00d2ff; color: #00d2ff; font-weight: bold; }
      .tag-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
      .tag-count { font-size: 9px; opacity: 0.55; background: rgba(255,255,255,0.08); padding: 1px 5px; border-radius: 8px; }
      .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px 20px; opacity: 0.6; gap: 6px; flex: 1; }
      .empty-icon { font-size: 28px; margin-bottom: 6px; }
      .empty-sub { font-size: 11px; opacity: 0.7; }
      .msg-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 16px; margin-bottom: 12px; cursor: pointer; transition: 0.2s; display: flex; flex-direction: column; gap: 10px; }
      .msg-card:hover { border-color: #00d2ff; background: rgba(255, 255, 255, 0.05); transform: scale(1.01); }
      .msg-card.card-inserted { border-color: #4ade80 !important; box-shadow: 0 0 0 2px rgba(74,222,128,0.3); }
      .is-fav { border-left: 4px solid #fbbf24 !important; }
      .tag-label { font-size: 9px; padding: 2px 8px; border-radius: 20px; text-transform: uppercase; font-weight: bold; align-self: flex-start; }
      .msg-text { font-size: 13.5px; line-height: 1.5; color: #d1d5db; word-break: break-word; }
      .card-actions-bottom-left { display: flex; gap: 18px; align-items: center; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05); }
      .tool-icon { font-size: 15px; opacity: 0.4; transition: 0.2s; cursor: pointer; }
      .tool-icon:hover { opacity: 1; color: #00d2ff; }
      .tool-icon.active { opacity: 1; color: #fbbf24; }
      .drag-handle { cursor: grab; }
      .drag-handle:active { cursor: grabbing; }
      .msg-card.dragging { opacity: 0.35; }
      .msg-card.drag-over { border-top: 2px solid #00d2ff; }
      .w-footer { padding: 15px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.05); flex-shrink: 0; }
      .add-form { display: none; flex-direction: column; gap: 8px; margin-bottom: 10px; }
      textarea { width: 100%; background: #000; color: #fff; border: 1px solid #333; border-radius: 12px; padding: 12px; resize: none; outline: none; font-size: 13px; box-sizing: border-box; }
      .btn-icon { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; background: rgba(0,0,0,0.15); font-size: 14px; line-height: 1; flex-shrink: 0; }
      .btn-add {
        display: flex; align-items: center; justify-content: center; gap: 7px; flex: 1;
        background: rgba(0, 210, 255, 0.06); color: #00d2ff;
        border: 1px solid rgba(0, 210, 255, 0.35); border-radius: 10px; padding: 9px 16px;
        font-weight: 700; cursor: pointer; text-transform: uppercase; letter-spacing: 0.6px;
        font-size: 11px; transition: 0.2s;
      }
      .btn-add:hover { background: rgba(0, 210, 255, 0.14); border-color: #00d2ff; box-shadow: 0 4px 14px rgba(0,210,255,0.15); }
      .btn-add:active { transform: scale(0.97); }
      .btn-add .btn-icon { width: 15px; height: 15px; font-size: 12px; background: rgba(0,210,255,0.15); color: #00d2ff; }
      .btn-add-full { width: 100%; flex: none; padding: 12px 16px; }
      .btn-cancel { background: transparent; color: #ff6b6b; border: none; font-size: 11px; cursor: pointer; margin-top: 5px; text-decoration: underline; text-align: center; width: 100%; display: block; }
      .dev-footer { text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 2px; }
      .dev-label { font-size: 8px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 2px; }
      .dev-name { color: #00d2ff; font-weight: 900; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; text-shadow: 0 0 10px rgba(0,210,255,0.3); }

      /* Estilo dos botões de Backup */
      .footer-actions-row { display: flex; gap: 8px; align-items: stretch; }
      .gear-wrap { position: relative; flex-shrink: 0; }
      .btn-gear {
        width: 38px; height: 100%; min-height: 38px; border-radius: 10px; background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.55); font-size: 16px;
        cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s;
      }
      .btn-gear:hover, .btn-gear.is-active { background: rgba(0,210,255,0.12); border-color: #00d2ff; color: #00d2ff; transform: rotate(20deg); }
      .backup-popover {
        position: absolute; bottom: calc(100% + 8px); right: 0; background: #10151c;
        border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 10px;
        display: flex; flex-direction: column; gap: 6px; min-width: 140px;
        box-shadow: 0 12px 30px rgba(0,0,0,0.5); opacity: 0; transform: translateY(6px) scale(0.97);
        pointer-events: none; transition: 0.18s ease; z-index: 20;
      }
      .backup-popover.is-open { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
      .backup-popover .btn-backup { width: 100%; }
      .popover-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 4px 0; }
      .delete-dropdown-wrap { position: relative; display: flex; flex-direction: column; }
      .dd-caret { font-size: 8px; margin-left: 4px; display: inline-block; transition: transform 0.2s; }
      .delete-dropdown-wrap.is-open .dd-caret { transform: rotate(180deg); }
      .delete-dropdown-list {
        display: none; flex-direction: column; gap: 3px; margin-top: 6px; max-height: 130px; overflow-y: auto;
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 5px;
        scrollbar-width: thin; scrollbar-color: rgba(248,113,113,0.35) transparent;
      }
      .delete-dropdown-wrap.is-open .delete-dropdown-list { display: flex; }
      .delete-dropdown-list::-webkit-scrollbar { width: 4px; }
      .delete-dropdown-list::-webkit-scrollbar-track { background: transparent; }
      .delete-dropdown-list::-webkit-scrollbar-thumb { background: rgba(248,113,113,0.35); border-radius: 10px; }
      .delete-dropdown-item {
        display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; border-radius: 6px;
        font-size: 9px; color: #f0b4b4; cursor: pointer; transition: 0.15s; background: transparent; border: none;
        text-align: left; width: 100%; font-family: inherit;
      }
      .delete-dropdown-item:hover { background: rgba(248,113,113,0.14); color: #f87171; }
      .dd-count { opacity: 0.55; font-size: 8px; }
      .delete-dropdown-empty { font-size: 9px; color: rgba(255,255,255,0.35); text-align: center; padding: 6px 0; }
      .btn-danger { background: rgba(248,113,113,0.08); color: #f87171; border: 1px solid rgba(248,113,113,0.35); }
      .btn-danger:hover { background: rgba(248,113,113,0.18); border-color: #f87171; box-shadow: 0 4px 14px rgba(248,113,113,0.15); }
      .btn-danger:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; }
      .btn-danger:disabled:hover { background: rgba(248,113,113,0.08); border-color: rgba(248,113,113,0.35); }
      .btn-backup { flex: 1; font-size: 9px; padding: 6px; background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; cursor: pointer; transition: 0.2s; text-transform: uppercase; font-weight: bold; }
      .btn-backup:hover { background: rgba(255,255,255,0.1); border-color: #00d2ff; }
    `;
    document.head.appendChild(style);
  }

  function buildWidgetDom() {
    const widget = document.createElement('div');
    widget.id = 'm-rapidas-widget';
    widget.innerHTML = `
      <div class="resizer resizer-left" id="res-l"></div>
      <div class="resizer resizer-right" id="res-r"></div>
      <div class="resizer-vertical resizer-top" id="res-t"></div>
      <div class="resizer-vertical resizer-bottom" id="res-b"></div>
      <div class="w-header" id="drag-h">
        <span>MENSAGENS RÁPIDAS</span>
        <div class="h-btn-group">
          <div class="h-btn" id="btn-min">-</div>
          <div class="h-btn" id="btn-close">✕</div>
        </div>
      </div>
      <div class="w-body">
        <input type="text" id="w-search" class="search-input" placeholder="Buscar mensagem...">
        <div class="filter-bar" id="tag-filters"></div>
        <div id="w-list"></div>
      </div>
      <div class="w-footer">
        <div id="add-form" class="add-form">
          <textarea id="w-input" rows="3" placeholder="Sua mensagem..."></textarea>
          <button id="w-save" class="btn-add btn-add-full">SALVAR</button>
          <div id="w-cancel" class="btn-cancel">Cancelar</div>
        </div>
        <div class="footer-actions-row">
          <button id="btn-open-add" class="btn-add"><span class="btn-icon">+</span>Incluir Mensagem</button>
          <div class="gear-wrap">
            <button id="btn-backup-gear" class="btn-gear" title="Backup" type="button">⚙</button>
            <div class="backup-popover" id="backup-popover">
              <button id="btn-export" class="btn-backup">Exportar</button>
              <button id="btn-import" class="btn-backup">Importar</button>
              <div class="popover-divider"></div>
              <div class="delete-dropdown-wrap" id="delete-dropdown-wrap">
                <button id="btn-delete-tag-toggle" class="btn-backup btn-danger" type="button">Apagar Categoria <span class="dd-caret">▾</span></button>
                <div class="delete-dropdown-list" id="delete-dropdown-list"></div>
              </div>
              <button id="btn-delete-all" class="btn-backup btn-danger">Apagar Tudo</button>
              <input type="file" id="import-file" style="display:none" accept=".json">
            </div>
          </div>
        </div>

        <div class="dev-footer">
          <span class="dev-label">Desenvolvido por</span>
          <span class="dev-name">Lagamba Tech</span>
        </div>
      </div>
    `;
    return widget;
  }

  // POSIÇÃO E TAMANHO PERSISTENTES
  function saveGeometry(widget) {
    const geom = {
      left: widget.offsetLeft,
      top: widget.offsetTop,
      width: widget.offsetWidth,
      height: widget.offsetHeight
    };
    chrome.storage.local.set({ widgetGeom: geom });
  }

  function applySavedGeometry(widget) {
    chrome.storage.local.get(['widgetGeom'], (res) => {
      const g = res.widgetGeom;
      if (!g) return;
      widget.style.left = g.left + 'px';
      widget.style.top = g.top + 'px';
      widget.style.right = 'auto';
      widget.style.width = g.width + 'px';
      widget.style.height = g.height + 'px';
    });
  }

  // REDIMENSIONAMENTO
  function setupResize(widget) {
    const startResizing = (e, side) => {
      e.preventDefault();
      const startX = e.clientX; const startY = e.clientY;
      const startWidth = widget.offsetWidth; const startHeight = widget.offsetHeight;
      const startLeft = widget.offsetLeft; const startTop = widget.offsetTop;
      const onMouseMove = (mE) => {
        if (side === 'left') {
          const newWidth = startWidth + (startX - mE.clientX);
          if (newWidth > 280) { widget.style.width = newWidth + 'px'; widget.style.left = (startLeft - (startX - mE.clientX)) + 'px'; }
        } else if (side === 'right') {
          const newWidth = startWidth + (mE.clientX - startX);
          if (newWidth > 280) widget.style.width = newWidth + 'px';
        } else if (side === 'top') {
          const newHeight = startHeight + (startY - mE.clientY);
          if (newHeight > 300) { widget.style.height = newHeight + 'px'; widget.style.top = (startTop - (startY - mE.clientY)) + 'px'; }
        } else if (side === 'bottom') {
          const newHeight = startHeight + (mE.clientY - startY);
          if (newHeight > 300) widget.style.height = newHeight + 'px';
        }
      };
      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        saveGeometry(widget);
      };
      window.addEventListener('mousemove', onMouseMove); window.addEventListener('mouseup', onMouseUp);
    };
    document.getElementById('res-l').onmousedown = (e) => startResizing(e, 'left');
    document.getElementById('res-r').onmousedown = (e) => startResizing(e, 'right');
    document.getElementById('res-t').onmousedown = (e) => startResizing(e, 'top');
    document.getElementById('res-b').onmousedown = (e) => startResizing(e, 'bottom');
  }

  // MOVIMENTAÇÃO (DRAG DO WIDGET)
  function setupDrag(widget) {
    let drag = false, oX, oY;
    document.getElementById('drag-h').onmousedown = (e) => {
      if (e.target.closest('.h-btn-group')) return;
      drag = true; oX = e.clientX - widget.offsetLeft; oY = e.clientY - widget.offsetTop;
    };
    document.addEventListener('mousemove', (e) => {
      if (drag) { widget.style.left = (e.clientX - oX) + 'px'; widget.style.top = (e.clientY - oY) + 'px'; widget.style.right = 'auto'; }
    });
    document.addEventListener('mouseup', () => {
      if (drag) { drag = false; saveGeometry(widget); }
    });
  }

  // MINIMIZAR / FECHAR
  function setupMinimize(widget) {
    document.getElementById('btn-min').onclick = (e) => {
      e.stopPropagation();
      widget.classList.add('w-anim');
      widget.classList.toggle('is-minimized');
      setTimeout(() => widget.classList.remove('w-anim'), 260);
    };
    document.getElementById('btn-close').onclick = () => widget.style.display = 'none';
  }

  // BUSCA DE CAMPO MELHORADA
  function findTargetField(doc = document) {
    const selectors = ['textarea:not(#w-input)', '[contenteditable="true"]:not(#w-input)', 'input[placeholder*="Buscar"]:not(#w-search)', '#textoMensagem', '.chat-input textarea'];
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

  async function smartFill(text, id, cardEl) {
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

      if (id != null) {
        recentIds = [id, ...recentIds.filter(rid => rid !== id)].slice(0, 5);
        chrome.storage.local.set({ recentIds });
      }
      if (cardEl) {
        cardEl.classList.add('card-inserted');
        setTimeout(() => cardEl.classList.remove('card-inserted'), 700);
      }
    } catch (e) { console.error(e); }
  }

  // FUNÇÕES DE BACKUP (EXPORTAR / IMPORTAR)
  function setupBackup() {
    document.getElementById('btn-export').onclick = () => {
      if (messages.length === 0) return alert("Não há mensagens para exportar.");
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(messages, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "backup_mensagens.json");
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
          const imported = JSON.parse(event.target.result);
          if (!Array.isArray(imported)) { alert("Arquivo de backup inválido."); e.target.value = ''; return; }

          const valid = imported.filter(item => item && typeof item.text === 'string' && item.text.trim() !== '');
          if (valid.length === 0) { alert("Nenhuma mensagem válida encontrada no arquivo."); e.target.value = ''; return; }

          let idCounter = Date.now();
          const normalized = valid.map(item => ({
            id: (typeof item.id === 'number' && !isNaN(item.id)) ? item.id : idCounter++,
            text: item.text,
            tag: (typeof item.tag === 'string' && item.tag.trim() !== '') ? item.tag.toUpperCase() : 'GERAL',
            fav: !!item.fav
          }));

          if (confirm(`Deseja importar ${normalized.length} mensagens? Isso substituirá as atuais.`)) {
            messages = normalized;
            save();
          }
        } catch (err) { alert("Erro ao ler o arquivo JSON."); }
        e.target.value = ''; // Limpa o input
      };
      reader.readAsText(file);
    };
  }

  // MENU FLUTUANTE DE BACKUP (ENGRENAGEM)
  function setupBackupPopover() {
    const gear = document.getElementById('btn-backup-gear');
    const popover = document.getElementById('backup-popover');
    const ddWrap = document.getElementById('delete-dropdown-wrap');
    const ddToggle = document.getElementById('btn-delete-tag-toggle');

    const closePopover = () => {
      popover.classList.remove('is-open');
      gear.classList.remove('is-active');
      ddWrap.classList.remove('is-open');
    };

    gear.onclick = (e) => {
      e.stopPropagation();
      const isOpen = popover.classList.toggle('is-open');
      gear.classList.toggle('is-active', isOpen);
      if (!isOpen) ddWrap.classList.remove('is-open');
    };

    ddToggle.onclick = (e) => {
      e.stopPropagation();
      ddWrap.classList.toggle('is-open');
    };

    document.addEventListener('click', (e) => {
      if (!popover.classList.contains('is-open')) return;
      if (e.target.closest('#backup-popover') || e.target.closest('#btn-backup-gear')) return;
      closePopover();
    });

    document.getElementById('btn-delete-all').onclick = (e) => {
      e.stopPropagation();
      if (messages.length === 0) return alert("Não há mensagens salvas para apagar.");
      const total = messages.length;
      if (confirm(`Atenção: essa ação vai apagar TODAS as ${total} mensagens salvas, de todas as categorias, e não pode ser desfeita.\n\nDeseja continuar?`)) {
        messages = [];
        recentIds = [];
        chrome.storage.local.set({ recentIds: [] });
        save();
        closePopover();
      }
    };
  }

  function renderDeleteDropdownItems() {
    const list = document.getElementById('delete-dropdown-list');
    const toggleBtn = document.getElementById('btn-delete-tag-toggle');
    if (!list || !toggleBtn) return;

    const tagCounts = {};
    messages.forEach(m => {
      const t = m.tag || 'GERAL';
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
    const tags = Object.keys(tagCounts);

    if (tags.length === 0) {
      toggleBtn.disabled = true;
      list.innerHTML = `<div class="delete-dropdown-empty">Nenhuma categoria</div>`;
      return;
    }
    toggleBtn.disabled = false;

    list.innerHTML = tags.map(t =>
      `<button class="delete-dropdown-item" data-tag="${escapeHtml(t)}"><span>${escapeHtml(t)}</span><span class="dd-count">${tagCounts[t]}</span></button>`
    ).join('');

    list.querySelectorAll('.delete-dropdown-item').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const tag = btn.dataset.tag;
        const count = tagCounts[tag] || 0;
        if (confirm(`Atenção: essa ação vai apagar todas as ${count} mensagens da categoria "${tag}", e não pode ser desfeita.\n\nDeseja continuar?`)) {
          messages = messages.filter(m => (m.tag || 'GERAL') !== tag);
          recentIds = recentIds.filter(id => messages.some(m => m.id === id));
          chrome.storage.local.set({ recentIds });
          save();
          const wrap = document.getElementById('delete-dropdown-wrap');
          if (wrap) wrap.classList.remove('is-open');
        }
      };
    });
  }

  // BUSCA POR TEXTO
  function setupSearch() {
    document.getElementById('w-search').addEventListener('input', (e) => {
      searchQuery = e.target.value;
      render();
    });
  }

  function commitOrder(newOrderIds) {
    const visibleSet = new Set(newOrderIds);
    const reordered = newOrderIds.map(id => messages.find(x => x.id === id)).filter(Boolean);
    let inserted = false;
    const result = [];
    messages.forEach(m => {
      if (visibleSet.has(m.id)) {
        if (!inserted) { result.push(...reordered); inserted = true; }
      } else {
        result.push(m);
      }
    });
    messages = result;
    save();
  }

  function renderFilterBar() {
    const filterBar = document.getElementById('tag-filters');
    filterBar.innerHTML = '';

    const uniqueTagsSet = new Set(messages.map(m => m.tag || "GERAL"));
    const uniqueTags = ["TODAS", "FAV", "RECENTES", ...uniqueTagsSet];

    uniqueTags.forEach(t => {
      let count;
      if (t === "TODAS") count = messages.length;
      else if (t === "FAV") count = messages.filter(m => m.fav).length;
      else if (t === "RECENTES") count = recentIds.length;
      else count = messages.filter(m => (m.tag || "GERAL") === t).length;

      const btn = document.createElement('div');
      btn.className = `filter-tag ${currentFilter === t ? 'active' : ''}`;

      const isSpecial = (t === "TODAS" || t === "FAV" || t === "RECENTES");
      const label = t === "FAV" ? "★" : t === "RECENTES" ? "🕐" : t;
      const dotHtml = isSpecial ? '' : `<span class="tag-dot" style="background:${colorForTag(t)}"></span>`;
      btn.innerHTML = `${dotHtml}<span>${escapeHtml(label)}</span><span class="tag-count">${count}</span>`;

      btn.onclick = () => { currentFilter = t; render(); };
      filterBar.appendChild(btn);
    });
  }

  function getFilteredMessages() {
    if (currentFilter === "RECENTES") {
      let filtered = recentIds.map(id => messages.find(m => m.id === id)).filter(Boolean);
      if (searchQuery) filtered = filtered.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()));
      return filtered;
    }

    let filtered = messages.filter(m => {
      if (currentFilter === "FAV" && !m.fav) return false;
      if (currentFilter !== "TODAS" && currentFilter !== "FAV" && (m.tag || "GERAL") !== currentFilter) return false;
      if (searchQuery && !m.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
    filtered.sort((a, b) => b.fav - a.fav);
    return filtered;
  }

  function renderEmptyState(list) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    if (messages.length === 0) {
      empty.innerHTML = `<div class="empty-icon">💬</div><div>Nenhuma mensagem cadastrada ainda.</div><div class="empty-sub">Clique em "+ INCLUIR MENSAGEM" para começar.</div>`;
    } else {
      empty.innerHTML = `<div class="empty-icon">🔍</div><div>Nenhuma mensagem encontrada.</div>`;
    }
    list.appendChild(empty);
  }

  function buildCard(m, list) {
    const card = document.createElement('div');
    card.className = `msg-card ${m.fav ? 'is-fav' : ''}`;
    card.dataset.id = m.id;
    const color = colorForTag(m.tag || 'GERAL');
    card.innerHTML = `
      <div class="tag-label" style="color:${color}; background:${color}1a; border:1px solid ${color}40;">${escapeHtml(m.tag || 'GERAL')}</div>
      <div class="msg-text"></div>
      <div class="card-actions-bottom-left">
        <span class="tool-icon drag-handle" title="Clique e arraste o card para reordenar">⠿</span>
        <span class="tool-icon fav-icon ${m.fav ? 'active' : ''}">★</span>
        <span class="tool-icon edit-txt">📝</span>
        <span class="tool-icon edit-tag">🏷️</span>
        <span class="tool-icon del-msg">🗑️</span>
      </div>
    `;
    // texto inserido via textContent para não interpretar HTML digitado pelo usuário
    card.querySelector('.msg-text').textContent = m.text;

    card.onclick = (e) => { if (!e.target.closest('.card-actions-bottom-left')) smartFill(m.text, m.id, card); };
    card.querySelector('.fav-icon').onclick = (e) => { e.stopPropagation(); m.fav = !m.fav; save(); };
    card.querySelector('.edit-txt').onclick = (e) => { e.stopPropagation(); editingId = m.id; document.getElementById('w-input').value = m.text; toggleAdd(true, true); };
    card.querySelector('.edit-tag').onclick = (e) => { e.stopPropagation(); const nt = prompt("Nova Tag:", m.tag); if (nt) { m.tag = nt.toUpperCase(); save(); } };
    card.querySelector('.del-msg').onclick = (e) => { e.stopPropagation(); if (confirm("Apagar?")) { messages = messages.filter(x => x.id !== m.id); save(); } };

    // REORDENAÇÃO (Drag and Drop)
    card.draggable = true;
    card.addEventListener('dragstart', (e) => {
      e.stopPropagation();
      draggedId = m.id;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (draggedId === null || m.id === draggedId) return;
      const now = Date.now();
      if (now - lastDragOverTime < 50) return; // debounce
      lastDragOverTime = now;
      const dragging = list.querySelector('.msg-card.dragging');
      if (!dragging) return;
      const rect = card.getBoundingClientRect();
      const after = (e.clientY - rect.top) / rect.height > 0.5;
      list.insertBefore(dragging, after ? card.nextSibling : card);
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      const newOrderIds = Array.from(list.querySelectorAll('.msg-card')).map(c => Number(c.dataset.id));
      commitOrder(newOrderIds);
      draggedId = null;
    });

    return card;
  }

  function render() {
    const list = document.getElementById('w-list');
    list.innerHTML = '';

    renderFilterBar();
    renderDeleteDropdownItems();

    const filtered = getFilteredMessages();
    if (filtered.length === 0) {
      renderEmptyState(list);
      return;
    }

    filtered.forEach(m => list.appendChild(buildCard(m, list)));
  }

  function toggleAdd(show, isEdit = false) {
    document.getElementById('add-form').style.display = show ? 'flex' : 'none';
    document.getElementById('btn-open-add').style.display = show ? 'none' : 'flex';
    document.getElementById('w-save').innerText = isEdit ? "ATUALIZAR" : "SALVAR";
    if (show) document.getElementById('w-input').focus(); else { document.getElementById('w-input').value = ''; editingId = null; }
  }

  function save() {
    chrome.storage.local.set({ myMsgs: messages }, render);
  }

  function setupFormHandlers() {
    document.getElementById('btn-open-add').onclick = () => toggleAdd(true);
    document.getElementById('w-cancel').onclick = () => toggleAdd(false);

    document.getElementById('w-save').onclick = () => {
      const txt = document.getElementById('w-input').value.trim();
      if (!txt) return;
      if (editingId) {
        const m = messages.find(x => x.id === editingId);
        if (m) m.text = txt;
      } else {
        const tag = prompt("Tag:", "GERAL") || "GERAL";
        messages.push({ id: generateId(), text: txt, tag: tag.toUpperCase(), fav: false });
      }
      toggleAdd(false); save();
    };
  }

  function initWidget() {
    const existing = document.getElementById('m-rapidas-widget');
    if (existing) {
      existing.style.display = (existing.style.display === 'none') ? 'flex' : 'none';
      return;
    }

    injectStyles();
    const widget = buildWidgetDom();
    document.body.appendChild(widget);

    applySavedGeometry(widget);
    setupResize(widget);
    setupDrag(widget);
    setupMinimize(widget);
    setupBackup();
    setupBackupPopover();
    setupSearch();
    setupFormHandlers();

    chrome.storage.local.get(['myMsgs', 'recentIds'], (res) => {
      messages = res.myMsgs || [];
      recentIds = res.recentIds || [];
      render();
    });
  }

  function ensureWidgetVisible() {
    let widget = document.getElementById('m-rapidas-widget');
    if (!widget) {
      initWidget();
      widget = document.getElementById('m-rapidas-widget');
    } else if (widget.style.display === 'none') {
      widget.style.display = 'flex';
    }
    return widget;
  }

  chrome.runtime.onMessage.addListener((msg) => { if (msg.action === "toggle_widget") initWidget(); });

  document.addEventListener('keydown', (e) => {
    if (!e.altKey) return;
    const key = e.key.toLowerCase();
    if (key === 'q') {
      initWidget();
    } else if (key === 'n') {
      const widget = ensureWidgetVisible();
      if (widget) {
        widget.classList.remove('is-minimized');
        const openBtn = document.getElementById('btn-open-add');
        if (openBtn) openBtn.click();
      }
    }
  });
})();
