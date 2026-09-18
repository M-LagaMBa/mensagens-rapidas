(function() {
  if (window.hasASCPlusLoaded) return;
  window.hasASCPlusLoaded = true;

  let messages = [];
  let savedMessages = [];
  let lastTarget = null;
  let saving = false;
  let recentIds = [];
  let currentFilter = "TODAS";
  let searchQuery = "";
  let editingId = null;
  let isProcessingClick = false; // Trava para evitar duplicação
  let draggedId = null;
  let lastDragOverTime = 0;
  let selectMode = false;
  let selectedIds = new Set();
  let pendingUndo = null; // { items: [{ message, index }], timer }

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

  // Escapa o texto e envolve o trecho buscado em <mark> para destaque visual
  function highlightMatch(text, query) {
    const q = query || '';
    if (!q) return escapeHtml(text);
    const escQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!escQuery) return escapeHtml(text);
    const regex = new RegExp(escQuery, 'ig');
    let result = '', offset = 0;
    for (const match of String(text).matchAll(regex)) {
      result += escapeHtml(text.slice(offset, match.index)) + `<mark class="msg-highlight">${escapeHtml(match[0])}</mark>`;
      offset = match.index + match[0].length;
    }
    return result + escapeHtml(text.slice(offset));
  }

  function generateId() {
    const maxId = messages.reduce((max, m) => Math.max(max, m.id || 0), 0);
    return Math.max(Date.now(), maxId + 1);
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #m-rapidas-widget {
        box-sizing: border-box; position: fixed; top: 20px; right: 20px; width: 380px; height: 650px;
        min-width: 280px; min-height: 300px; background: rgba(13, 17, 23, 0.98);
        border: 1px solid rgba(0, 210, 255, 0.3); border-radius: 24px;
        z-index: 2147483647; display: flex; flex-direction: column;
        box-shadow: 0 30px 60px rgba(0,0,0,0.8); font-family: 'Inter', sans-serif;
        color: #f0f6fc; backdrop-filter: blur(20px); overflow: visible;
      }
      #m-rapidas-widget .resizer { position: absolute; top: 0; width: 15px; height: 100%; cursor: ew-resize; z-index: 10001; }
      #m-rapidas-widget .resizer-left { left: 0; }
      #m-rapidas-widget .resizer-right { right: 0; }
      #m-rapidas-widget .resizer-vertical { position: absolute; left: 0; width: 100%; height: 15px; cursor: ns-resize; z-index: 10001; }
      #m-rapidas-widget .resizer-top { top: 0; }
      #m-rapidas-widget .resizer-bottom { bottom: 0; }
      #m-rapidas-widget.is-minimized { height: 55px !important; min-height: 55px !important; overflow: hidden; }
      #m-rapidas-widget.is-minimized .w-body, #m-rapidas-widget.is-minimized .w-footer { display: none !important; }
      #m-rapidas-widget.w-anim { transition: height 0.25s ease; }
      #m-rapidas-widget .w-header { padding: 0 20px; height: 55px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: move; flex-shrink: 0; border-radius: 24px 24px 0 0; }
      #m-rapidas-widget .w-header span { font-weight: 800; font-size: 11px; color: #00d2ff; text-transform: uppercase; pointer-events: none; }
      #m-rapidas-widget .h-btn-group { display: flex; gap: 12px; z-index: 10002; }
      #m-rapidas-widget .h-btn, #m-rapidas-widget .tool-icon { background: transparent; border: 0; color: inherit; padding: 0; }
      #m-rapidas-widget button:focus-visible, #m-rapidas-widget .msg-card:focus-visible { outline: 2px solid #00d2ff; outline-offset: 2px; }
      #m-rapidas-widget .h-btn { cursor: pointer; font-size: 18px; opacity: 0.6; transition: 0.2s; }
      #m-rapidas-widget .w-body { flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; }
      #m-rapidas-widget .w-body::-webkit-scrollbar { width: 6px; }
      #m-rapidas-widget .w-body::-webkit-scrollbar-track { background: transparent; }
      #m-rapidas-widget .w-body::-webkit-scrollbar-thumb { background: rgba(0,210,255,0.3); border-radius: 10px; }
      #m-rapidas-widget .w-body::-webkit-scrollbar-thumb:hover { background: rgba(0,210,255,0.5); }
      #m-rapidas-widget .search-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 10px; padding: 8px 12px; font-size: 12px; margin-bottom: 10px; outline: none; flex-shrink: 0; box-sizing: border-box; }
      #m-rapidas-widget .search-input:focus { border-color: #00d2ff; }
      #m-rapidas-widget .filter-bar { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 10px; margin-bottom: 10px; flex-shrink: 0; align-items: center; scrollbar-width: thin; scrollbar-color: rgba(0,210,255,0.3) transparent; }
      #m-rapidas-widget .filter-bar::-webkit-scrollbar { height: 5px; }
      #m-rapidas-widget .filter-bar::-webkit-scrollbar-track { background: transparent; }
      #m-rapidas-widget .filter-bar::-webkit-scrollbar-thumb { background: rgba(0,210,255,0.3); border-radius: 10px; }
      #m-rapidas-widget .filter-bar::-webkit-scrollbar-thumb:hover { background: rgba(0,210,255,0.5); }
      #m-rapidas-widget .filter-tag { color: inherit; font-family: inherit; padding: 6px 10px; border-radius: 10px; background: rgba(255,255,255,0.05); font-size: 10px; cursor: pointer; white-space: nowrap; border: 1px solid transparent; display: flex; align-items: center; gap: 6px; }
      #m-rapidas-widget .filter-tag.active { background: rgba(0, 210, 255, 0.2); border-color: #00d2ff; color: #00d2ff; font-weight: bold; }
      #m-rapidas-widget .tag-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
      #m-rapidas-widget .tag-count { font-size: 9px; opacity: 0.55; background: rgba(255,255,255,0.08); padding: 1px 5px; border-radius: 8px; }
      #m-rapidas-widget .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px 20px; opacity: 0.6; gap: 6px; flex: 1; }
      #m-rapidas-widget .empty-icon { font-size: 28px; margin-bottom: 6px; }
      #m-rapidas-widget .empty-sub { font-size: 11px; opacity: 0.7; }
      #m-rapidas-widget .msg-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 16px; margin-bottom: 12px; cursor: pointer; transition: 0.2s; display: flex; flex-direction: column; gap: 10px; }
      #m-rapidas-widget .msg-card:hover { border-color: #00d2ff; background: rgba(255, 255, 255, 0.05); transform: scale(1.01); }
      #m-rapidas-widget .msg-card.card-inserted { border-color: #4ade80 !important; box-shadow: 0 0 0 2px rgba(74,222,128,0.3); }
      #m-rapidas-widget .is-fav { border-left: 4px solid #fbbf24 !important; }
      #m-rapidas-widget .tag-label { font-size: 9px; padding: 2px 8px; border-radius: 20px; text-transform: uppercase; font-weight: bold; align-self: flex-start; }
      #m-rapidas-widget .msg-text { font-size: 13.5px; line-height: 1.5; color: #d1d5db; word-break: break-word; }
      #m-rapidas-widget .card-actions-bottom-left { display: flex; gap: 18px; align-items: center; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05); }
      #m-rapidas-widget .tool-icon { font-size: 15px; opacity: 0.55; transition: 0.2s; cursor: pointer; }
      #m-rapidas-widget .tool-icon:hover { opacity: 1; color: #00d2ff; }
      #m-rapidas-widget .tool-icon.active { opacity: 1; color: #fbbf24; }
      #m-rapidas-widget .fav-icon:hover { color: #fbbf24; }
      #m-rapidas-widget .msg-card.is-editing { border-color: #00d2ff !important; box-shadow: 0 0 0 2px rgba(0,210,255,0.25); }
      #m-rapidas-widget .msg-highlight { background: rgba(0,210,255,0.35); color: #fff; border-radius: 3px; padding: 0 1px; }
      #m-rapidas-widget .drag-handle { cursor: grab; }
      #m-rapidas-widget .drag-handle:active { cursor: grabbing; }
      #m-rapidas-widget .msg-card.dragging { opacity: 0.35; }
      #m-rapidas-widget .msg-card.drag-over { border-top: 2px solid #00d2ff; }
      #m-rapidas-widget .w-footer { padding: 15px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.05); flex-shrink: 0; }
      #m-rapidas-widget .tag-step { display: none; flex-direction: column; gap: 8px; }
      #m-rapidas-widget .tag-step-help { margin: 0; font-size: 11px; line-height: 1.5; color: #9ca3af; }
      #m-rapidas-widget .tag-options { max-height: 130px; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; padding-right: 4px; scrollbar-width: thin; scrollbar-color: rgba(0,210,255,0.3) transparent; }
      #m-rapidas-widget .tag-options::-webkit-scrollbar { width: 6px; }
      #m-rapidas-widget .tag-options::-webkit-scrollbar-track { background: transparent; }
      #m-rapidas-widget .tag-options::-webkit-scrollbar-thumb { background: rgba(0,210,255,0.3); border-radius: 10px; }
      #m-rapidas-widget .tag-options::-webkit-scrollbar-thumb:hover { background: rgba(0,210,255,0.5); }
      #m-rapidas-widget .tag-option { flex-shrink: 0; display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(255,255,255,0.03); color: #d1d5db; font: inherit; font-size: 11px; text-align: left; overflow-wrap: anywhere; cursor: pointer; }
      #m-rapidas-widget .tag-option:hover, #m-rapidas-widget .tag-option[aria-pressed="true"] { background: rgba(0,210,255,0.12); border-color: #00d2ff; }
      #m-rapidas-widget .w-footer.choosing-tag .footer-actions-row, #m-rapidas-widget .w-footer.choosing-tag .dev-footer { display: none; }
      #m-rapidas-widget .w-footer.choosing-tag { max-height: calc(100% - 55px); overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(0,210,255,0.3) transparent; }
      #m-rapidas-widget .tag-field-label { font-size: 11px; color: #d1d5db; }
      #m-rapidas-widget .tag-input { width: 100%; box-sizing: border-box; background: #000; color: #fff; border: 1px solid #333; border-radius: 10px; padding: 9px 12px; font: inherit; font-size: 12px; }
      #m-rapidas-widget .tag-input:focus { outline: 2px solid #00d2ff; outline-offset: 1px; }
      #m-rapidas-widget .add-form { display: none; flex-direction: column; gap: 8px; margin-bottom: 10px; }
      #m-rapidas-widget textarea { width: 100%; background: #000; color: #fff; border: 1px solid #333; border-radius: 12px; padding: 12px; resize: none; outline: none; font-size: 13px; box-sizing: border-box; }
      #m-rapidas-widget .btn-icon { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; background: rgba(0,0,0,0.15); font-size: 14px; line-height: 1; flex-shrink: 0; }
      #m-rapidas-widget .btn-add {
        display: flex; align-items: center; justify-content: center; gap: 7px; flex: 1;
        background: rgba(0, 210, 255, 0.06); color: #00d2ff;
        border: 1px solid rgba(0, 210, 255, 0.35); border-radius: 10px; padding: 9px 16px;
        font-weight: 700; cursor: pointer; text-transform: uppercase; letter-spacing: 0.6px;
        font-size: 11px; transition: 0.2s;
      }
      #m-rapidas-widget .btn-add:hover { background: rgba(0, 210, 255, 0.14); border-color: #00d2ff; box-shadow: 0 4px 14px rgba(0,210,255,0.15); }
      #m-rapidas-widget .btn-add:active { transform: scale(0.97); }
      #m-rapidas-widget .btn-add .btn-icon { width: 15px; height: 15px; font-size: 12px; background: rgba(0,210,255,0.15); color: #00d2ff; }
      #m-rapidas-widget .btn-add-full { width: 100%; flex: none; padding: 12px 16px; }
      #m-rapidas-widget .btn-cancel { background: transparent; color: #ff6b6b; border: none; font-size: 11px; cursor: pointer; margin-top: 5px; text-decoration: underline; text-align: center; width: 100%; display: block; }
      #m-rapidas-widget .dev-footer { text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 2px; }
      #m-rapidas-widget .dev-label { font-size: 8px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 2px; }
      #m-rapidas-widget .dev-name { color: #00d2ff; font-weight: 900; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; text-shadow: 0 0 10px rgba(0,210,255,0.3); }

      /* Estilo dos botões de Backup */
      #m-rapidas-widget .footer-actions-row { display: flex; gap: 8px; align-items: stretch; }
      #m-rapidas-widget .gear-wrap { position: relative; flex-shrink: 0; }
      #m-rapidas-widget .btn-gear {
        width: 38px; height: 100%; min-height: 38px; border-radius: 10px; background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.55); font-size: 16px;
        cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s;
      }
      #m-rapidas-widget .btn-gear:hover, #m-rapidas-widget .btn-gear.is-active { background: rgba(0,210,255,0.12); border-color: #00d2ff; color: #00d2ff; transform: rotate(20deg); }
      #m-rapidas-widget .backup-popover {
        position: absolute; bottom: calc(100% + 8px); right: 0; background: #10151c;
        border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 10px;
        display: flex; flex-direction: column; gap: 6px; min-width: 140px;
        box-shadow: 0 12px 30px rgba(0,0,0,0.5); opacity: 0; transform: translateY(6px) scale(0.97);
        pointer-events: none; transition: 0.18s ease; z-index: 20;
      }
      #m-rapidas-widget .backup-popover.is-open { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
      #m-rapidas-widget .backup-popover .btn-backup { width: 100%; }
      #m-rapidas-widget .popover-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 4px 0; }
      #m-rapidas-widget .delete-dropdown-wrap { position: relative; display: flex; flex-direction: column; }
      #m-rapidas-widget .dd-caret { font-size: 8px; margin-left: 4px; display: inline-block; transition: transform 0.2s; }
      #m-rapidas-widget .delete-dropdown-wrap.is-open .dd-caret { transform: rotate(180deg); }
      #m-rapidas-widget .delete-dropdown-list {
        display: none; flex-direction: column; gap: 3px; margin-top: 6px; max-height: 130px; overflow-y: auto;
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 5px;
        scrollbar-width: thin; scrollbar-color: rgba(248,113,113,0.35) transparent;
      }
      #m-rapidas-widget .delete-dropdown-wrap.is-open .delete-dropdown-list { display: flex; }
      #m-rapidas-widget .delete-dropdown-list::-webkit-scrollbar { width: 4px; }
      #m-rapidas-widget .delete-dropdown-list::-webkit-scrollbar-track { background: transparent; }
      #m-rapidas-widget .delete-dropdown-list::-webkit-scrollbar-thumb { background: rgba(248,113,113,0.35); border-radius: 10px; }
      #m-rapidas-widget .delete-dropdown-item {
        display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; border-radius: 6px;
        font-size: 9px; color: #f0b4b4; cursor: pointer; transition: 0.15s; background: transparent; border: none;
        text-align: left; width: 100%; font-family: inherit;
      }
      #m-rapidas-widget .delete-dropdown-item:hover { background: rgba(248,113,113,0.14); color: #f87171; }
      #m-rapidas-widget .dd-count { opacity: 0.55; font-size: 8px; }
      #m-rapidas-widget .delete-dropdown-empty { font-size: 9px; color: rgba(255,255,255,0.35); text-align: center; padding: 6px 0; }
      #m-rapidas-widget .btn-danger { background: rgba(248,113,113,0.08); color: #f87171; border: 1px solid rgba(248,113,113,0.35); }
      #m-rapidas-widget .btn-danger:hover { background: rgba(248,113,113,0.18); border-color: #f87171; box-shadow: 0 4px 14px rgba(248,113,113,0.15); }
      #m-rapidas-widget .btn-danger:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; }
      #m-rapidas-widget .btn-danger:disabled:hover { background: rgba(248,113,113,0.08); border-color: rgba(248,113,113,0.35); }
      #m-rapidas-widget .btn-backup { flex: 1; font-size: 9px; padding: 6px; background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; cursor: pointer; transition: 0.2s; text-transform: uppercase; font-weight: bold; }
      #m-rapidas-widget .btn-backup:hover { background: rgba(255,255,255,0.1); border-color: #00d2ff; }
      #m-rapidas-widget .selection-toolbar {
        display: none; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px;
        background: rgba(0,210,255,0.06); border: 1px solid rgba(0,210,255,0.25); border-radius: 10px;
        padding: 8px 10px; margin-bottom: 10px; font-size: 10px; color: #00d2ff; flex-shrink: 0;
      }
      #m-rapidas-widget .selection-toolbar.is-visible { display: flex; }
      #m-rapidas-widget .selection-actions { display: flex; gap: 6px; flex-wrap: wrap; }
      #m-rapidas-widget .selection-actions button {
        font-size: 9px; padding: 5px 8px; background: rgba(255,255,255,0.06); color: #fff;
        border: 1px solid rgba(255,255,255,0.12); border-radius: 7px; cursor: pointer; text-transform: uppercase; font-weight: bold;
      }
      #m-rapidas-widget .selection-actions button:hover { border-color: #00d2ff; }
      #m-rapidas-widget .selection-actions .btn-danger-inline { color: #f87171; border-color: rgba(248,113,113,0.35); }
      #m-rapidas-widget .selection-actions .btn-danger-inline:hover { border-color: #f87171; }

      #m-rapidas-widget .import-modal-overlay {
        position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;
        z-index: 50; opacity: 0; pointer-events: none; transition: 0.15s; border-radius: 24px;
      }
      #m-rapidas-widget .import-modal-overlay.is-visible { opacity: 1; pointer-events: auto; }
      #m-rapidas-widget .import-modal {
        background: #10151c; border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; padding: 18px;
        width: 85%; max-width: 280px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.6);
      }
      #m-rapidas-widget .import-modal-title { font-size: 12px; font-weight: 800; color: #00d2ff; text-transform: uppercase; letter-spacing: 0.5px; }
      #m-rapidas-widget .import-modal-text { font-size: 11.5px; color: #d1d5db; line-height: 1.5; }
      #m-rapidas-widget .import-modal-actions { display: flex; flex-direction: column; gap: 8px; }
      #m-rapidas-widget .import-modal-actions .btn-backup { padding: 9px 16px; font-size: 11px; border-radius: 10px; letter-spacing: 0.6px; }

      #m-rapidas-widget .card-header-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      #m-rapidas-widget .msg-checkbox-wrap { display: none; }
      #m-rapidas-widget .msg-card.select-mode-active .msg-checkbox-wrap { display: flex; }
      #m-rapidas-widget .msg-card.select-mode-active .card-actions-bottom-left { display: none; }
      #m-rapidas-widget .msg-checkbox { width: 16px; height: 16px; accent-color: #00d2ff; cursor: pointer; }
      #m-rapidas-widget .msg-card.select-mode-active.is-selected { border-color: #00d2ff; background: rgba(0,210,255,0.06); }

      #m-rapidas-widget .undo-toast {
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
        background: #10151c; border: 1px solid rgba(255,255,255,0.12); border-radius: 10px;
        padding: 0 12px; font-size: 11px; color: #d1d5db; overflow: hidden;
        max-height: 0; opacity: 0; margin-bottom: 0; flex-shrink: 0;
        transition: max-height 0.2s ease, opacity 0.2s ease, margin-bottom 0.2s ease, padding 0.2s ease;
      }
      #m-rapidas-widget .undo-toast.is-visible { max-height: 40px; opacity: 1; margin-bottom: 10px; padding: 9px 12px; }
      #m-rapidas-widget .undo-toast button { background: none; border: none; color: #00d2ff; font-weight: 800; cursor: pointer; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; flex-shrink: 0; }
      #m-rapidas-widget .undo-toast button:hover { text-decoration: underline; }

      #m-rapidas-widget .skeleton-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 16px; margin-bottom: 12px; }
      #m-rapidas-widget .skeleton-line { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 37%, rgba(255,255,255,0.04) 63%); background-size: 400% 100%; animation: skeleton-shimmer 1.4s ease infinite; border-radius: 6px; }
      #m-rapidas-widget .skeleton-tag { width: 60px; height: 14px; margin-bottom: 12px; border-radius: 20px; }
      #m-rapidas-widget .skeleton-text-1 { width: 90%; height: 12px; margin-bottom: 8px; }
      #m-rapidas-widget .skeleton-text-2 { width: 65%; height: 12px; }
      @keyframes skeleton-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
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
          <button type="button" class="h-btn" id="btn-min">-</button>
          <button type="button" class="h-btn" id="btn-close">✕</button>
        </div>
      </div>
      <div class="w-body">
        <input type="text" id="w-search" class="search-input" placeholder="Buscar mensagem...">
        <div class="undo-toast" id="undo-toast">
          <span id="undo-toast-text">Mensagem apagada</span>
          <button id="undo-toast-btn" type="button">Desfazer</button>
        </div>
        <div class="selection-toolbar" id="selection-toolbar">
          <span id="selection-count">0 selecionadas</span>
          <div class="selection-actions">
            <button id="btn-select-all-visible" type="button">Selecionar Tudo</button>
            <button id="btn-selection-export" type="button">Exportar</button>
            <button id="btn-selection-delete" type="button" class="btn-danger-inline">Apagar</button>
            <button id="btn-selection-cancel" type="button">Cancelar</button>
          </div>
        </div>
        <div class="filter-bar" id="tag-filters"></div>
        <div id="w-list"></div>
      </div>
      <div class="w-footer">
        <div id="add-form" class="add-form">
          <textarea id="w-input" rows="3" placeholder="Sua mensagem..."></textarea>
          <div id="tag-step" class="tag-step">
            <label for="w-tag" class="tag-field-label">Escolha ou crie uma tag</label>
            <p class="tag-step-help">Selecione uma tag cadastrada abaixo ou digite uma nova. Se deixar vazio, usaremos GERAL.</p>
            <input type="text" id="w-tag" class="tag-input" value="GERAL" placeholder="Nome da tag" autocomplete="off">
            <div id="tag-options" class="tag-options" role="group" aria-label="Tags cadastradas"></div>
            <button type="button" id="w-tag-confirm" class="btn-add btn-add-full">SALVAR MENSAGEM</button>
            <button type="button" id="w-tag-back" class="btn-cancel">Voltar ao texto</button>
          </div>
          <button id="w-save" class="btn-add btn-add-full">SALVAR</button>
          <button type="button" id="w-cancel" class="btn-cancel">Cancelar</button>
        </div>
        <div class="footer-actions-row">
          <button id="btn-open-add" class="btn-add"><span class="btn-icon">+</span>Incluir Mensagem</button>
          <div class="gear-wrap">
            <button id="btn-backup-gear" class="btn-gear" title="Backup" type="button">⚙</button>
            <div class="backup-popover" id="backup-popover">
              <button id="btn-select-mode" class="btn-backup" type="button">Selecionar Mensagens</button>
              <div class="popover-divider"></div>
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

      <div class="import-modal-overlay" id="import-modal-overlay">
        <div class="import-modal" role="dialog" aria-modal="true" aria-labelledby="import-modal-title">
          <div class="import-modal-title" id="import-modal-title">Importar mensagens</div>
          <div class="import-modal-text" id="import-modal-text"></div>
          <div class="import-modal-actions">
            <button id="import-modal-merge" class="btn-add">Mesclar</button>
            <button id="import-modal-replace" class="btn-backup btn-danger">Substituir Tudo</button>
          </div>
          <button type="button" id="import-modal-cancel" class="btn-cancel">Cancelar</button>
        </div>
      </div>
    `;
    return widget;
  }

  // POSIÇÃO E TAMANHO PERSISTENTES
  function saveGeometry(widget) {
    constrainGeometry(widget);
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
      constrainGeometry(widget);
    });
  }

  function constrainGeometry(widget) {
    widget.style.maxWidth = '100vw';
    widget.style.maxHeight = '100vh';
    widget.style.minWidth = Math.min(280, window.innerWidth) + 'px';
    widget.style.minHeight = Math.min(300, window.innerHeight) + 'px';
    widget.style.left = Math.max(0, Math.min(widget.offsetLeft, window.innerWidth - widget.offsetWidth)) + 'px';
    widget.style.top = Math.max(0, Math.min(widget.offsetTop, window.innerHeight - widget.offsetHeight)) + 'px';
    widget.style.right = 'auto';
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
  function setMinimized(widget, minimized) {
    widget.classList.add('w-anim');
    widget.classList.toggle('is-minimized', minimized);
    setTimeout(() => widget.classList.remove('w-anim'), 260);
  }

  function setupMinimize(widget) {
    document.getElementById('btn-min').onclick = (e) => {
      e.stopPropagation();
      setMinimized(widget, !widget.classList.contains('is-minimized'));
    };
    document.getElementById('btn-close').onclick = () => widget.style.display = 'none';
  }

  // BUSCA DE CAMPO MELHORADA
  function isTarget(el) {
    return el && el.isConnected && !el.closest('#m-rapidas-widget') &&
      el.matches('textarea, input[type="text"], input:not([type]), input[type="search"], [contenteditable="true"]') &&
      !el.disabled && !el.readOnly && el.getClientRects().length > 0;
  }

  function trackDocument(doc) {
    if (trackedDocuments.has(doc)) return;
    trackedDocuments.add(doc);
    doc.addEventListener('focusin', event => { if (isTarget(event.target)) lastTarget = event.target; });
    const scanFrames = () => doc.querySelectorAll('iframe, frame').forEach(frame => {
      const trackFrame = () => { try { if (frame.contentDocument) trackDocument(frame.contentDocument); } catch (_) {} };
      if (!trackedFrames.has(frame)) { trackedFrames.add(frame); frame.addEventListener('load', trackFrame); }
      trackFrame();
    });
    scanFrames();
    new MutationObserver(records => {
      if (records.some(record => Array.from(record.addedNodes).some(node => node.nodeType === 1 && (node.matches('iframe, frame') || node.querySelector('iframe, frame'))))) scanFrames();
    }).observe(doc, { childList: true, subtree: true });
  }
  const trackedDocuments = new WeakSet();
  const trackedFrames = new WeakSet();
  function findTargetField(doc = document, candidates = []) {
    trackDocument(doc);
    if (doc.hasFocus() && isTarget(doc.activeElement)) lastTarget = doc.activeElement;
    doc.querySelectorAll('textarea, [contenteditable="true"], input[placeholder*="Buscar"], #textoMensagem, input[type="search"]')
      .forEach(el => { if (isTarget(el)) candidates.push(el); });
    doc.querySelectorAll('iframe, frame').forEach(frame => {
      try { if (frame.contentDocument) findTargetField(frame.contentDocument, candidates); } catch (_) {}
    });
    return isTarget(lastTarget) ? lastTarget : candidates.length === 1 ? candidates[0] : null;
  }
  trackDocument(document);

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

      if (!target.ownerDocument.execCommand('insertText', false, text)) {
        if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') { target.value = text; }
        else { target.textContent = text; }
      }

      ['input', 'change', 'blur', 'keyup'].forEach(ev => target.dispatchEvent(new target.ownerDocument.defaultView.Event(ev, { bubbles: true })));

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

  // APAGAR COM DESFAZER (mensagem individual)
  async function deleteMessageWithUndo(id) {
    const index = messages.findIndex(x => x.id === id);
    if (index === -1) return;
    const [removed] = messages.splice(index, 1);
    if (await save()) showUndoToast([{ message: removed, index }], 'Mensagem apagada');
  }

  // APAGAR COM DESFAZER (várias mensagens de uma vez, usadas pela seleção em lote)
  async function deleteMessagesWithUndo(ids) {
    const idSet = new Set(ids);
    const items = [];
    messages.forEach((m, i) => { if (idSet.has(m.id)) items.push({ message: m, index: i }); });
    if (items.length === 0) return;
    messages = messages.filter(m => !idSet.has(m.id));
    if (!await save()) return;
    const label = items.length === 1 ? 'Mensagem apagada' : `${items.length} mensagens apagadas`;
    showUndoToast(items, label);
  }

  function showUndoToast(items, label) {
    if (pendingUndo) clearTimeout(pendingUndo.timer);
    const toast = document.getElementById('undo-toast');
    if (!toast) { pendingUndo = null; return; }
    const textEl = document.getElementById('undo-toast-text');
    if (textEl) textEl.textContent = label;
    toast.classList.add('is-visible');
    const timer = setTimeout(() => {
      toast.classList.remove('is-visible');
      pendingUndo = null;
    }, 20000);
    pendingUndo = { items, timer };
  }

  async function undoDelete() {
    if (!pendingUndo) return;
    clearTimeout(pendingUndo.timer);
    const { items } = pendingUndo;
    items
      .slice()
      .sort((a, b) => a.index - b.index)
      .forEach(({ message, index }) => {
        const insertAt = Math.min(index, messages.length);
        messages.splice(insertAt, 0, message);
      });
    if (await save()) {
      pendingUndo = null;
      const toast = document.getElementById('undo-toast');
      if (toast) toast.classList.remove('is-visible');
    } else { showUndoToast(items, 'Não foi possível restaurar. Tente novamente'); }
  }

  function setupUndoToast() {
    document.getElementById('undo-toast-btn').onclick = () => undoDelete();
  }

  // SELEÇÃO EM LOTE (apagar/exportar várias mensagens de uma vez)
  function toggleSelect(id) {
    if (selectedIds.has(id)) selectedIds.delete(id); else selectedIds.add(id);
    render();
  }

  function updateSelectionUI() {
    const countEl = document.getElementById('selection-count');
    if (countEl) countEl.textContent = `${selectedIds.size} selecionada${selectedIds.size === 1 ? '' : 's'}`;
  }

  function updateSelectModeButtonLabel() {
    const btn = document.getElementById('btn-select-mode');
    if (btn) btn.textContent = selectMode ? 'Sair da Seleção' : 'Selecionar Mensagens';
  }

  function exitSelectMode() {
    selectMode = false;
    selectedIds.clear();
    const toolbar = document.getElementById('selection-toolbar');
    if (toolbar) toolbar.classList.remove('is-visible');
    updateSelectModeButtonLabel();
    render();
  }

  function setupSelectionMode() {
    document.getElementById('btn-select-mode').onclick = () => {
      selectMode = !selectMode;
      selectedIds.clear();
      document.getElementById('selection-toolbar').classList.toggle('is-visible', selectMode);
      updateSelectModeButtonLabel();
      closeBackupPopover();
      render();
    };

    document.getElementById('btn-selection-cancel').onclick = () => exitSelectMode();

    document.getElementById('btn-select-all-visible').onclick = () => {
      const visible = getFilteredMessages();
      const allSelected = visible.length > 0 && visible.every(m => selectedIds.has(m.id));
      if (allSelected) visible.forEach(m => selectedIds.delete(m.id));
      else visible.forEach(m => selectedIds.add(m.id));
      render();
    };

    document.getElementById('btn-selection-export').onclick = () => {
      if (selectedIds.size === 0) return alert("Nenhuma mensagem selecionada.");
      const toExport = messages.filter(m => selectedIds.has(m.id));
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(toExport, null, 2));
      const a = document.createElement('a');
      a.setAttribute("href", dataStr);
      a.setAttribute("download", "mensagens_selecionadas.json");
      document.body.appendChild(a);
      a.click();
      a.remove();
    };

    document.getElementById('btn-selection-delete').onclick = () => {
      if (selectedIds.size === 0) return alert("Nenhuma mensagem selecionada.");
      const count = selectedIds.size;
      if (confirm(`Apagar as ${count} mensagens selecionadas?`)) {
        deleteMessagesWithUndo(Array.from(selectedIds));
        selectedIds.clear();
        selectMode = false;
        document.getElementById('selection-toolbar').classList.remove('is-visible');
        updateSelectModeButtonLabel();
      }
    };
  }

  // SINCRONIZAÇÃO ENTRE ABAS
  function setupStorageSync() {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      let shouldRender = false;
      if (changes.myMsgs && !saving) { messages = changes.myMsgs.newValue || []; savedMessages = structuredClone(messages); shouldRender = true; }
      if (changes.recentIds) { recentIds = changes.recentIds.newValue || []; shouldRender = true; }
      if (shouldRender && document.getElementById('w-list')) render();
    });
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
      closeBackupPopover();
    };

    document.getElementById('btn-import').onclick = () => {
      document.getElementById('import-file').click();
      scheduleBackupAutoClose(); // reinicia a contagem enquanto o usuário escolhe o arquivo
    };

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
          const importedIds = new Set();
          const normalized = valid.map(item => ({
            id: (() => {
              let id = item.id;
              if (!Number.isSafeInteger(id) || id <= 0 || importedIds.has(id)) {
                while (importedIds.has(idCounter)) idCounter++;
                id = idCounter++;
              }
              importedIds.add(id);
              return id;
            })(),
            text: item.text,
            tag: (typeof item.tag === 'string' && item.tag.trim() !== '') ? item.tag.toUpperCase() : 'GERAL',
            fav: !!item.fav
          }));

          showImportChoice(normalized.length).then(async (choice) => {
            if (choice === 'replace') {
              if (!canDiscardDraft()) return;
              messages = normalized;
              if (await save(true)) { toggleAdd(false); if (pendingUndo) clearTimeout(pendingUndo.timer); pendingUndo = null; document.getElementById('undo-toast').classList.remove('is-visible'); closeBackupPopover(); }
            } else if (choice === 'merge') {
              const existingIds = new Set(messages.map(m => m.id));
              let mergeCounter = Date.now();
              const merged = normalized.map(item => {
                if (existingIds.has(item.id)) {
                  let newId = mergeCounter++;
                  while (existingIds.has(newId)) newId++;
                  existingIds.add(newId);
                  return { ...item, id: newId };
                }
                existingIds.add(item.id);
                return item;
              });
              messages = [...messages, ...merged];
              if (await save()) closeBackupPopover();
            }
            // choice === null → usuário cancelou, não faz nada
          });
        } catch (err) { alert("Erro ao ler o arquivo JSON."); }
        e.target.value = ''; // Limpa o input
      };
      reader.readAsText(file);
    };
  }

  // Modal de escolha ao importar (substituir ou mesclar), com botões em vez de prompt()
  function showImportChoice(count) {
    return new Promise((resolve) => {
      const overlay = document.getElementById('import-modal-overlay');
      const text = document.getElementById('import-modal-text');
      const mergeBtn = document.getElementById('import-modal-merge');
      const replaceBtn = document.getElementById('import-modal-replace');
      const cancelBtn = document.getElementById('import-modal-cancel');
      if (!overlay || !text || !mergeBtn || !replaceBtn || !cancelBtn) { resolve(null); return; }

      text.textContent = `Encontradas ${count} mensagens no arquivo. O que deseja fazer?`;
      const previousFocus = document.activeElement;
      overlay.classList.add('is-visible');
      mergeBtn.focus();
      const onKey = e => {
        if (e.key === 'Escape') { e.preventDefault(); cleanup(null); }
        if (e.key === 'Tab') {
          const buttons = [mergeBtn, replaceBtn, cancelBtn];
          e.preventDefault();
          buttons[(buttons.indexOf(document.activeElement) + (e.shiftKey ? 2 : 1)) % 3].focus();
        }
      };
      overlay.addEventListener('keydown', onKey);

      const cleanup = (result) => {
        overlay.classList.remove('is-visible');
        overlay.removeEventListener('keydown', onKey);
        previousFocus?.focus();
        mergeBtn.onclick = null;
        replaceBtn.onclick = null;
        cancelBtn.onclick = null;
        resolve(result);
      };

      mergeBtn.onclick = () => cleanup('merge');
      replaceBtn.onclick = () => cleanup('replace');
      cancelBtn.onclick = () => cleanup(null);
    });
  }

  // MENU FLUTUANTE DE BACKUP (ENGRENAGEM)
  // Compartilhado entre setupBackup(), setupBackupPopover() e renderDeleteDropdownItems()
  let backupCloseTimer = null;

  function clearBackupAutoClose() {
    if (backupCloseTimer) {
      clearTimeout(backupCloseTimer);
      backupCloseTimer = null;
    }
  }

  function scheduleBackupAutoClose() {
    clearBackupAutoClose();
    backupCloseTimer = setTimeout(() => { closeBackupPopover(); }, 15000);
  }

  function closeBackupPopover() {
    clearBackupAutoClose();
    const popover = document.getElementById('backup-popover');
    const gear = document.getElementById('btn-backup-gear');
    const ddWrap = document.getElementById('delete-dropdown-wrap');
    if (popover) popover.classList.remove('is-open');
    if (gear) gear.classList.remove('is-active');
    if (ddWrap) ddWrap.classList.remove('is-open');
  }

  function setupBackupPopover() {
    const gear = document.getElementById('btn-backup-gear');
    const popover = document.getElementById('backup-popover');
    const ddWrap = document.getElementById('delete-dropdown-wrap');
    const ddToggle = document.getElementById('btn-delete-tag-toggle');

    gear.onclick = (e) => {
      e.stopPropagation();
      const isOpen = popover.classList.toggle('is-open');
      gear.classList.toggle('is-active', isOpen);
      if (isOpen) {
        scheduleBackupAutoClose();
      } else {
        ddWrap.classList.remove('is-open');
        clearBackupAutoClose();
      }
    };

    ddToggle.onclick = (e) => {
      e.stopPropagation();
      ddWrap.classList.toggle('is-open');
      scheduleBackupAutoClose();
    };

    document.addEventListener('click', (e) => {
      if (!popover.classList.contains('is-open')) return;
      if (e.target.closest('#backup-popover') || e.target.closest('#btn-backup-gear')) return;
      closeBackupPopover();
    });

    // Pausa a contagem de fechamento automático enquanto o mouse está sobre as opções
    popover.addEventListener('mouseenter', () => {
      if (popover.classList.contains('is-open')) clearBackupAutoClose();
    });
    popover.addEventListener('mouseleave', () => {
      if (popover.classList.contains('is-open')) scheduleBackupAutoClose();
    });

    document.getElementById('btn-delete-all').onclick = (e) => {
      e.stopPropagation();
      if (messages.length === 0) return alert("Não há mensagens salvas para apagar.");
      const total = messages.length;
      if (confirm(`Apagar TODAS as ${total} mensagens salvas, de todas as categorias?`)) {
        deleteMessagesWithUndo(messages.map(m => m.id));
        closeBackupPopover();
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
      `<button class="delete-dropdown-item"><span>${escapeHtml(t)}</span><span class="dd-count">${tagCounts[t]}</span></button>`
    ).join('');

    list.querySelectorAll('.delete-dropdown-item').forEach((btn, index) => {
      btn.dataset.tag = tags[index];
      btn.onclick = (e) => {
        e.stopPropagation();
        const tag = btn.dataset.tag;
        const count = tagCounts[tag] || 0;
        if (confirm(`Apagar todas as ${count} mensagens da categoria "${tag}"?`)) {
          const ids = messages.filter(m => (m.tag || 'GERAL') === tag).map(m => m.id);
          deleteMessagesWithUndo(ids);
          closeBackupPopover();
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
    const uniqueTags = ["TODAS", "FAV", "RECENTES", ...Array.from(uniqueTagsSet, tag => 'tag:' + tag)];

    uniqueTags.forEach(t => {
      let count;
      if (t === "TODAS") count = messages.length;
      else if (t === "FAV") count = messages.filter(m => m.fav).length;
      else if (t === "RECENTES") count = recentIds.length;
      else count = messages.filter(m => (m.tag || "GERAL") === t.slice(4)).length;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `filter-tag ${currentFilter === t ? 'active' : ''}`;

      const isSpecial = (t === "TODAS" || t === "FAV" || t === "RECENTES");
      const label = t === 'TODAS' ? 'TODAS' : t === 'FAV' ? '★' : t === 'RECENTES' ? '🕐' : t.slice(4);
      const dotHtml = isSpecial ? '' : `<span class="tag-dot" style="background:${colorForTag(t.slice(4))}"></span>`;
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
      if (currentFilter !== "TODAS" && currentFilter !== "FAV" && (m.tag || "GERAL") !== currentFilter.slice(4)) return false;
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
    card.className = [
      'msg-card',
      m.fav ? 'is-fav' : '',
      m.id === editingId ? 'is-editing' : '',
      selectMode ? 'select-mode-active' : '',
      selectMode && selectedIds.has(m.id) ? 'is-selected' : ''
    ].filter(Boolean).join(' ');
    card.dataset.id = m.id;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Inserir mensagem: ' + m.text);
    card.onkeydown = e => { if (e.target === card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); card.click(); } };
    const color = colorForTag(m.tag || 'GERAL');
    card.innerHTML = `
      <div class="card-header-row">
        <div class="tag-label" style="color:${color}; background:${color}1a; border:1px solid ${color}40;">${escapeHtml(m.tag || 'GERAL')}</div>
        <label class="msg-checkbox-wrap"><input type="checkbox" class="msg-checkbox" ${selectedIds.has(m.id) ? 'checked' : ''}></label>
      </div>
      <div class="msg-text"></div>
      <div class="card-actions-bottom-left">
        <span class="tool-icon drag-handle" title="Clique e arraste o card para reordenar">⠿</span>
        <button type="button" class="tool-icon fav-icon ${m.fav ? 'active' : ''}" title="${m.fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">★</button>
        <button type="button" class="tool-icon edit-txt" title="Editar o texto da mensagem">📝</button>
        <button type="button" class="tool-icon edit-tag" title="Editar a categoria (tag)">🏷️</button>
        <button type="button" class="tool-icon del-msg" title="Apagar esta mensagem">🗑️</button>
      </div>
    `;
    // texto inserido com destaque do termo buscado (já escapado, seguro contra HTML do usuário)
    card.querySelector('.msg-text').innerHTML = highlightMatch(m.text, searchQuery);

    card.onclick = (e) => {
      if (selectMode) {
        e.stopPropagation();
        toggleSelect(m.id);
        return;
      }
      if (!e.target.closest('.card-actions-bottom-left')) smartFill(m.text, m.id, card);
    };
    card.querySelector('.msg-checkbox').onclick = (e) => { e.stopPropagation(); toggleSelect(m.id); };
    card.querySelector('.fav-icon').onclick = (e) => { e.stopPropagation(); m.fav = !m.fav; save(); };
    const openEditor = (e, focusTag = false) => {
      e.stopPropagation();
      if (!canDiscardDraft()) return;
      editingId = m.id;
      render();
      document.getElementById('w-input').value = m.text;
      document.getElementById('w-tag').value = m.tag || 'GERAL';
      toggleAdd(true, true);
      if (focusTag) setTagStep(true);
    };
    card.querySelector('.edit-txt').onclick = e => openEditor(e);
    card.querySelector('.edit-tag').onclick = e => openEditor(e, true);
    card.querySelector('.del-msg').onclick = (e) => { e.stopPropagation(); deleteMessageWithUndo(m.id); };

    // REORDENAÇÃO (Drag and Drop)
    card.draggable = !selectMode;
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

  function pruneSelection() {
    if (selectedIds.size === 0) return;
    const existingIds = new Set(messages.map(m => m.id));
    selectedIds.forEach(id => { if (!existingIds.has(id)) selectedIds.delete(id); });
  }

  function render() {
    const list = document.getElementById('w-list');
    list.innerHTML = '';

    pruneSelection();
    renderFilterBar();
    renderDeleteDropdownItems();
    if (document.getElementById('tag-step').style.display === 'flex') renderTagOptions();
    updateSelectionUI();

    const filtered = getFilteredMessages();
    if (filtered.length === 0) {
      renderEmptyState(list);
      return;
    }

    filtered.forEach(m => list.appendChild(buildCard(m, list)));
  }

  function renderSkeleton() {
    const list = document.getElementById('w-list');
    if (!list) return;
    list.innerHTML = Array.from({ length: 4 }).map(() => `
      <div class="skeleton-card">
        <div class="skeleton-line skeleton-tag"></div>
        <div class="skeleton-line skeleton-text-1"></div>
        <div class="skeleton-line skeleton-text-2"></div>
      </div>
    `).join('');
  }

  function renderTagOptions() {
    const list = document.getElementById('tag-options');
    list.replaceChildren();
    const selected = document.getElementById('w-tag').value.trim().toUpperCase() || 'GERAL';
    const tags = [...new Set(messages.map(m => (m.tag || 'GERAL').trim().toUpperCase() || 'GERAL'))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    if (!tags.length) {
      const empty = document.createElement('p');
      empty.className = 'tag-step-help';
      empty.textContent = 'Nenhuma tag cadastrada. Digite o nome da primeira tag.';
      list.appendChild(empty);
    }
    tags.forEach(tag => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tag-option';
      button.textContent = tag;
      button.setAttribute('aria-pressed', String(tag === selected));
      button.onclick = () => {
        document.getElementById('w-tag').value = tag;
        renderTagOptions();
        document.getElementById('w-tag-confirm').focus();
      };
      list.appendChild(button);
    });
    document.getElementById('w-tag-confirm').textContent = tags.includes(selected) ? 'SALVAR MENSAGEM' : 'CRIAR TAG E SALVAR';
  }

  function setTagStep(show) {
    document.getElementById('add-form').parentElement.classList.toggle('choosing-tag', show);
    document.getElementById('tag-step').style.display = show ? 'flex' : 'none';
    document.getElementById('w-input').style.display = show ? 'none' : '';
    document.getElementById('w-save').style.display = show ? 'none' : '';
    if (show) { renderTagOptions(); document.getElementById('w-tag').focus(); }
    else document.getElementById('w-input').focus();
  }

  function toggleAdd(show, isEdit = false) {
    setTagStep(false);
    document.getElementById('add-form').style.display = show ? 'flex' : 'none';
    document.getElementById('btn-open-add').style.display = show ? 'none' : 'flex';
    document.getElementById('w-save').innerText = isEdit ? "ATUALIZAR" : "SALVAR";
    if (show) document.getElementById('w-input').focus(); else { document.getElementById('w-input').value = ''; document.getElementById('w-tag').value = 'GERAL'; editingId = null; }
  }

  async function save(replace = false) {
    if (saving) return false;
    const before = savedMessages;
    const next = structuredClone(messages);
    const upserts = next.flatMap(m => {
      const old = before.find(x => x.id === m.id);
      if (!old) return [{ id: m.id, create: m }];
      const fields = Object.fromEntries(['text', 'tag', 'fav'].filter(k => m[k] !== old[k]).map(k => [k, m[k]]));
      return Object.keys(fields).length ? [{ id: m.id, fields }] : [];
    });
    saving = true;
    const widget = document.getElementById('m-rapidas-widget');
    widget.inert = true;
    try {
      const result = await chrome.runtime.sendMessage({ action: 'save_messages', replace: replace ? next : null,
        upserts, deleted: before.filter(m => !next.some(x => x.id === m.id)).map(m => m.id),
        order: before.filter(m => next.some(n => n.id === m.id)).map(m => m.id).join(',') !== next.filter(m => before.some(n => n.id === m.id)).map(m => m.id).join(',') ? next.map(m => m.id) : null });
      if (!result?.ok) throw new Error(result?.error || 'Sem resposta da extensão');
      const latest = await chrome.storage.local.get(['myMsgs', 'recentIds']);
      messages = latest.myMsgs || result.messages;
      recentIds = latest.recentIds || [];
      savedMessages = structuredClone(messages);
      render();
      return true;
    } catch (error) {
      messages = structuredClone(before);
      render();
      alert('Não foi possível salvar. Tente novamente. ' + error.message);
      return false;
    } finally { saving = false; widget.inert = false; }
  }

  function canDiscardDraft() {
    const input = document.getElementById('w-input');
    if (!input || document.getElementById('add-form').style.display === 'none') return true;
    const original = editingId !== null ? savedMessages.find(m => m.id === editingId) : null;
    const unchanged = input.value === (original?.text || '') && document.getElementById('w-tag').value === (original?.tag || 'GERAL');
    return unchanged || confirm('Tem certeza? As alterações de texto e tag serão perdidas.');
  }

  function setupFormHandlers() {
    document.getElementById('btn-open-add').onclick = () => { if (canDiscardDraft()) { toggleAdd(false); toggleAdd(true); } };
    document.getElementById('w-cancel').onclick = () => {
      if (!canDiscardDraft()) return;
      toggleAdd(false);
      render();
    };

    document.getElementById('w-save').onclick = () => {
      if (document.getElementById('w-input').value.trim()) setTagStep(true);
    };
    document.getElementById('w-tag-back').onclick = () => setTagStep(false);
    document.getElementById('w-tag').oninput = renderTagOptions;
    document.getElementById('w-tag').onkeydown = e => {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('w-tag-confirm').click(); }
      else if (e.key === 'Escape') { e.preventDefault(); setTagStep(false); }
    };
    document.getElementById('w-tag-confirm').onclick = async () => {
      const txt = document.getElementById('w-input').value.trim();
      if (!txt) return;
      const tag = document.getElementById('w-tag').value.trim().toUpperCase() || 'GERAL';
      if (editingId !== null) {
        const m = messages.find(x => x.id === editingId);
        if (!m) { alert('Esta mensagem foi removida em outra aba. Copie o texto antes de cancelar.'); return; }
        m.text = txt;
        m.tag = tag;
      } else {
        messages.push({ id: generateId(), text: txt, tag, fav: false });
      }
      if (await save()) { toggleAdd(false); render(); }
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
    renderSkeleton();
    widget.inert = true;

    constrainGeometry(widget);
    window.addEventListener('resize', () => constrainGeometry(widget));
    applySavedGeometry(widget);
    setupResize(widget);
    setupDrag(widget);
    setupMinimize(widget);
    setupBackup();
    setupBackupPopover();
    setupSearch();
    setupFormHandlers();
    setupUndoToast();
    setupSelectionMode();
    setupStorageSync();

    chrome.storage.local.get(['myMsgs', 'recentIds'], (res) => {
      if (chrome.runtime.lastError) { alert('Não foi possível carregar as mensagens. Recarregue a página.'); return; }
      widget.inert = false;
      messages = res.myMsgs || [];
      savedMessages = structuredClone(messages);
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
    if (!e.altKey || saving) return;
    const key = e.key.toLowerCase();
    if (key === 'w') {
      e.preventDefault();
      if (e.repeat) return;
      initWidget();
    } else if (key === 'q') {
      e.preventDefault();
      if (e.repeat) return;
      const existing = document.getElementById('m-rapidas-widget');
      const wasVisible = existing && existing.style.display !== 'none';
      const widget = ensureWidgetVisible();
      if (widget) setMinimized(widget, wasVisible && !widget.classList.contains('is-minimized'));
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
