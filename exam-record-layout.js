(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const SESSION_TOKEN_KEY = 'examRecords.githubToken.session';
  const DEVICE_TOKEN_KEY = 'examRecords.githubToken.device';

  function isStudentExamApp() {
    try {
      return !!(
        window.StudentExamNative &&
        typeof window.StudentExamNative.scanGithubToken === 'function'
      );
    } catch {
      return false;
    }
  }

  function triggerLegacyButton(id) {
    const button = document.getElementById(id);
    if (!button) {
      alert('功能尚未就緒，請重新整理後再試。');
      return;
    }
    button.click();
  }

  function getEffectiveToken() {
    try {
      const sessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY) || '';

      if (!isStudentExamApp()) {
        return sessionToken;
      }

      const deviceToken = localStorage.getItem(DEVICE_TOKEN_KEY) || '';

      // StudentExam 專用 App：第一次升級時，把目前還活著的 session Token 搬到裝置儲存。
      if (!deviceToken && sessionToken) {
        localStorage.setItem(DEVICE_TOKEN_KEY, sessionToken);
        return sessionToken;
      }

      // App / WebView 重啟後，將裝置 Token 還原到 exam-records.js 使用的 sessionStorage。
      if (deviceToken && sessionToken !== deviceToken) {
        sessionStorage.setItem(SESSION_TOKEN_KEY, deviceToken);
      }

      return deviceToken || sessionToken;
    } catch (e) {
      console.warn('Unable to read GitHub token:', e);
      return '';
    }
  }

  function persistToken(token) {
    try {
      const value = String(token || '').trim();
      if (!value) return false;

      sessionStorage.setItem(SESSION_TOKEN_KEY, value);

      // 只有 StudentExam 專用 App 永久保存。
      if (isStudentExamApp()) {
        localStorage.setItem(DEVICE_TOKEN_KEY, value);
      }

      return true;
    } catch (e) {
      console.warn('Unable to persist GitHub token:', e);
      return false;
    }
  }

  function clearTokenStorage() {
    try {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);

      // 一併清除舊版本可能留下的裝置 Token。
      localStorage.removeItem(DEVICE_TOKEN_KEY);
    } catch (e) {
      console.warn('Unable to clear GitHub token:', e);
    }
  }

  function maskedToken(token) {
    const value = String(token || '');
    if (!value) return '';
    const tail = value.slice(-4);
    return `••••${tail}`;
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

      .device-token-status{
        display:flex;
        align-items:center;
        gap:8px;
        margin:10px 0 12px;
        padding:10px 12px;
        border-radius:12px;
        font-weight:700;
      }
      .device-token-status.configured{
        background:#f0fdf4;
        color:#166534;
        border:1px solid #bbf7d0;
      }
      .device-token-status.missing{
        background:#fff7ed;
        color:#9a3412;
        border:1px solid #fed7aa;
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

  function updateMainSyncButton() {
    const button = $('#mainGithubSyncBtn');
    if (!button) return;
    const token = getEffectiveToken();
    button.textContent = token ? '☁️ GitHub 同步設定 ✓' : '☁️ GitHub 同步設定';
  }

  function ensureMainSyncButton() {
    const content = $('#catalogContent');
    if (!content || !isMainSubjectMenu()) return;
    if ($('#mainGithubSyncTools')) {
      updateMainSyncButton();
      return;
    }

    const row = document.createElement('div');
    row.id = 'mainGithubSyncTools';
    row.className = 'main-sync-tools';
    row.innerHTML = '<button class="record-btn" id="mainGithubSyncBtn">☁️ GitHub 同步設定</button>';
    content.appendChild(row);

    $('#mainGithubSyncBtn')?.addEventListener('click', () => {
      getEffectiveToken();
      triggerLegacyButton('syncBtn');
      setTimeout(decorateSyncSettings, 0);
    });
    updateMainSyncButton();
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

  function updateTokenStatus() {
    const content = $('#syncModal .record-content');
    if (!content) return;

    const appMode = isStudentExamApp();
    const token = getEffectiveToken();
    let status = $('#deviceTokenStatus');

    if (!status) {
      status = document.createElement('div');
      status.id = 'deviceTokenStatus';
      const repoLine = content.querySelector('p');
      if (repoLine) repoLine.insertAdjacentElement('afterend', status);
      else content.prepend(status);
    }

    status.className = `device-token-status ${token ? 'configured' : 'missing'}`;

    if (appMode) {
      status.textContent = token
        ? `✓ 本學生機已設定 Token（${maskedToken(token)}）`
        : '⚠ 本學生機尚未設定 Token';
    } else {
      status.textContent = token
        ? `✓ 此瀏覽器工作階段已設定 Token（${maskedToken(token)}）`
        : '⚠ 此瀏覽器工作階段尚未設定 Token';
    }

    const syncStatus = $('#syncStatus');
    if (syncStatus && token && !/成功|失敗|測試中/.test(syncStatus.textContent || '')) {
      syncStatus.textContent = appMode
        ? '目前：本學生機已設定 Token。交卷後會自動同步到 GitHub。'
        : '目前：此瀏覽器工作階段已設定 Token。交卷後會自動同步到 GitHub。';
    }

    const saveBtn = $('#saveTokenBtn');
    if (saveBtn) {
      saveBtn.textContent = appMode ? '儲存到本學生機' : '儲存到本次瀏覽工作階段';
    }

    const notes = [...content.querySelectorAll('.record-note')];
    const securityNote = notes.find(el => /sessionStorage|工作階段|關閉瀏覽器|專用學生機模式/.test(el.textContent || ''));
    if (securityNote) {
      securityNote.textContent = appMode
        ? '專用學生機模式：Token 會保存在這台學生機，休眠、關閉 App 或重新啟動後仍可使用；按「清除 Token」才會移除。畫面不會顯示完整 Token。'
        : '一般瀏覽器模式：Token 只保留在本次瀏覽工作階段，不永久保存；關閉分頁／瀏覽器工作階段後可能消失。請勿在公用電腦長期保留 Token。';
    }

    updateMainSyncButton();
  }

  function decorateSyncSettings() {
    const modal = $('#syncModal');
    const content = $('#syncModal .record-content');
    if (!modal || !content) return;

    getEffectiveToken();
    updateTokenStatus();

    const saveBtn = $('#saveTokenBtn');
    if (saveBtn && saveBtn.dataset.devicePersistBound !== '1') {
      saveBtn.dataset.devicePersistBound = '1';
      saveBtn.addEventListener('click', () => {
        const value = $('#tokenInput')?.value?.trim() || '';
        if (value) {
          persistToken(value);
          setTimeout(updateTokenStatus, 0);
        }
      });
    }

    const testBtn = $('#testTokenBtn');
    if (testBtn && testBtn.dataset.devicePersistBound !== '1') {
      testBtn.dataset.devicePersistBound = '1';
      testBtn.addEventListener('click', () => {
        const value = $('#tokenInput')?.value?.trim() || '';
        if (value) persistToken(value);
        else getEffectiveToken();
        setTimeout(updateTokenStatus, 0);
      }, true);
    }

    const clearBtn = $('#clearTokenBtn');
    if (clearBtn && clearBtn.dataset.devicePersistBound !== '1') {
      clearBtn.dataset.devicePersistBound = '1';
      clearBtn.addEventListener('click', () => {
        clearTokenStorage();
        setTimeout(updateTokenStatus, 0);
      });
    }
  }

  function refreshLayout() {
    getEffectiveToken();
    ensureMainSyncButton();
    ensureScienceMethodRecordTools();
    if ($('#syncModal.show')) decorateSyncSettings();
  }

  function init() {
    getEffectiveToken();
    injectStyles();
    refreshLayout();

    const observer = new MutationObserver(refreshLayout);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
