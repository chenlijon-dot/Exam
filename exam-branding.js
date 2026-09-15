(() => {
  'use strict';

  const BUILD_TIMESTAMP = '__BUILD_TIMESTAMP__';
  const HOME_TITLE = '國中全科學習題庫';
  const HOME_SUBTITLE = '章節練習・各校段考・歷屆試題';
  const AUTHOR = 'Chris醫師';

  const $ = (sel, root = document) => root.querySelector(sel);

  function injectStyles() {
    if ($('#examBrandingStyles')) return;
    const style = document.createElement('style');
    style.id = 'examBrandingStyles';
    style.textContent = `
      .catalog-brand-meta{
        display:flex;
        align-items:center;
        gap:8px 14px;
        flex-wrap:wrap;
        margin-top:13px;
        font-size:.82rem;
        color:rgba(255,255,255,.84);
      }
      .catalog-brand-meta span{
        display:inline-flex;
        align-items:center;
        gap:5px;
        padding:4px 9px;
        border:1px solid rgba(255,255,255,.18);
        background:rgba(255,255,255,.09);
        border-radius:999px;
        backdrop-filter:blur(4px);
      }
      @media(max-width:620px){
        .catalog-brand-meta{gap:7px;font-size:.76rem;margin-top:10px}
        .catalog-brand-meta span{padding:3px 8px}
      }
    `;
    document.head.appendChild(style);
  }

  function isHomeMenu() {
    const title = $('#catalogContent .catalog-title');
    const path = $('#catalogContent .catalog-path');
    return !!title && title.textContent.trim() === '請選擇科目' && !path;
  }

  function ensureMeta() {
    const header = $('#catalogShell .catalog-header');
    if (!header) return null;

    let meta = $('#catalogBrandMeta');
    if (!meta) {
      meta = document.createElement('div');
      meta.id = 'catalogBrandMeta';
      meta.className = 'catalog-brand-meta';
      header.appendChild(meta);
    }
    return meta;
  }

  function refreshBranding() {
    const title = $('#catalogHeaderTitle');
    const sub = $('#catalogHeaderSub');
    const meta = ensureMeta();
    if (!title || !sub || !meta) return;

    if (isHomeMenu()) {
      if (title.textContent !== HOME_TITLE) title.textContent = HOME_TITLE;
      if (sub.textContent !== HOME_SUBTITLE) sub.textContent = HOME_SUBTITLE;
      if (document.title !== HOME_TITLE) document.title = HOME_TITLE;

      const html = `<span>✍️ 作者：${AUTHOR}</span><span>🕒 版本：${BUILD_TIMESTAMP}</span>`;
      if (meta.innerHTML !== html) meta.innerHTML = html;
      meta.hidden = false;
    } else {
      meta.hidden = true;
    }
  }

  function init() {
    injectStyles();
    refreshBranding();

    const observer = new MutationObserver(refreshBranding);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
