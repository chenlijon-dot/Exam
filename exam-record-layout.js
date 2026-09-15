(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);

  function triggerLegacyButton(id) {
    const button = document.getElementById(id);
    if (!button) {
      alert('功能尚未就緒，請重新整理後再試。');
      return;
    }
    button.click();
  }

  function injectStyles() {
    if ($('#recordLayoutStyles')) return;
    const style = document.createElement('style');
    style.id = 'recordLayoutStyles';
    style.textContent = `
      #startScreen #recordTools{grid-template-columns:repeat(2,minmax(0,1fr))}
      #startScreen #syncBtn{display:none!important}

      .chapter-record-tools{
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:12px;
        margin-top:16px;
      }
      .chapter-record-tools .record-btn{
        width:100%;
        min-height:52px;
        font-size:1rem;
      }

      .main-sync-tools{
        display:flex;
        justify-content:center;
        margin-top:18px;
        padding-top:16px;
        border-top:1px solid #e2e8f0;
      }
      .main-sync-tools .record-btn{
        width:min(100%,360px);
        min-height:50px;
      }

      /* Do not depend on vh/dvh or flex centering in Android WebView. */
      .record-modal{
        position:fixed!important;
        top:0!important;
        left:0!important;
        right:0!important;
        bottom:0!important;
        width:auto!important;
        height:auto!important;
        margin:0!important;
        padding:0!important;
        overflow:hidden!important;
        background:rgba(15,23,42,.62)!important;
        z-index:2147483647!important;
      }
      .record-modal.show{display:block!important}

      .record-box{
        position:absolute!important;
        top:50%!important;
        left:50%!important;
        transform:translate(-50%,-50%)!important;
        width:calc(100% - 32px)!important;
        max-width:820px!important;
        max-height:calc(100% - 32px)!important;
        margin:0!important;
        box-sizing:border-box!important;
        overflow-y:auto!important;
        overflow-x:hidden!important;
        -webkit-overflow-scrolling:touch;
        background:#fff!important;
      }
      .record-content{min-width:0!important}
      .token-input{box-sizing:border-box!important;width:100%!important;max-width:100%!important}

      @media(max-width:620px){
        #startScreen #recordTools,
        .chapter-record-tools{grid-template-columns:1fr}
        .record-box{
          width:calc(100% - 20px)!important;
          max-height:calc(100% - 20px)!important;
          padding:16px!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function isMainSubjectMenu() {
    const title = $('#catalogContent .catalog-title');
    return !!title && title.textContent.trim() === '請選擇科目';
  }

  function ensureMainSyncButton() {
    const content = $('#catalogContent');
    if (!content || !isMainSubjectMenu()) return;
    if ($('#mainGithubSyncTools')) return;

    const row = document.createElement('div');
    row.id = 'mainGithubSyncTools';
    row.className = 'main-sync-tools';
    row.innerHTML = '<button class="record-btn" id="mainGithubSyncBtn">☁️ GitHub 同步設定</button>';
    content.appendChild(row);

    $('#mainGithubSyncBtn')?.addEventListener('click', () => triggerLegacyButton('syncBtn'));
  }

  function ensureScienceMethodRecordTools() {
    const schoolButton = $('#scienceMethodSchoolBankBtn');
    if (!schoolButton) return;
    if ($('#scienceMethodRecordTools')) return;

    const grid = schoolButton.closest('.catalog-grid');
    if (!grid) return;

    const row = document.createElement('div');
    row.id = 'scienceMethodRecordTools';
    row.className = 'chapter-record-tools';
    row.innerHTML = `
      <button class="record-btn" id="scienceMethodHistoryBtn">📊 作答紀錄</button>
      <button class="record-btn" id="scienceMethodWrongBtn">📝 錯題複習</button>
    `;
    grid.insertAdjacentElement('afterend', row);

    $('#scienceMethodHistoryBtn')?.addEventListener('click', () => triggerLegacyButton('historyBtn'));
    $('#scienceMethodWrongBtn')?.addEventListener('click', () => triggerLegacyButton('wrongBtn'));
  }

  function refreshLayout() {
    ensureMainSyncButton();
    ensureScienceMethodRecordTools();
  }

  function init() {
    injectStyles();
    refreshLayout();

    const observer = new MutationObserver(refreshLayout);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
