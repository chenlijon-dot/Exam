(() => {
  'use strict';

  const SESSION_TOKEN_KEY = 'examRecords.githubToken.session';
  const DEVICE_TOKEN_KEY = 'examRecords.githubToken.device';

  function getGithubToken() {
    try {
      return localStorage.getItem(DEVICE_TOKEN_KEY)
        || sessionStorage.getItem(SESSION_TOKEN_KEY)
        || '';
    } catch {
      return '';
    }
  }

  function maskedToken(token) {
    const value = String(token || '');
    return value ? `••••${value.slice(-4)}` : '';
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  function setTextIfChanged(el, text) {
    if (el && el.textContent !== text) el.textContent = text;
  }

  function setTitleIfChanged(el, text) {
    if (el && el.title !== text) el.title = text;
  }

  function injectStyles() {
    if (document.getElementById('accountUiStyles')) return;
    const style = document.createElement('style');
    style.id = 'accountUiStyles';
    style.textContent = `
      #mainGithubSyncBtn{display:none!important}
      #mainAccountBtn{width:min(100%,360px);min-height:50px}
      #accountInfoModal{position:fixed;inset:0;z-index:2147483400;background:rgba(15,23,42,.62);display:none;padding:18px;overflow:auto}
      #accountInfoModal.show{display:block}
      #accountInfoModal .account-box{width:min(620px,100%);margin:40px auto;background:#fff;border-radius:20px;padding:20px;box-shadow:0 24px 60px rgba(0,0,0,.28)}
      #accountInfoModal .account-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
      #accountInfoModal .account-head h2{margin:0}
      #accountInfoModal .account-close{border:0;background:#e2e8f0;color:#1e293b;border-radius:10px;padding:9px 12px;font-weight:700;cursor:pointer}
      #accountInfoModal .account-card{border:1px solid #dfe5ee;border-radius:14px;padding:14px;margin-top:10px;background:#f8fafc}
      #accountInfoModal .account-row{display:grid;grid-template-columns:120px 1fr;gap:10px;padding:5px 0;align-items:start}
      #accountInfoModal .account-label{color:#64748b;font-size:.9rem}
      #accountInfoModal .account-value{font-weight:700;overflow-wrap:anywhere}
      #accountInfoModal .account-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
      #accountInfoModal .account-btn{border:1px solid #cbd5e1;background:#fff;color:#1e293b;border-radius:12px;padding:11px 12px;font-weight:800;cursor:pointer}
      #accountInfoModal .account-btn.primary{background:#2563eb;border-color:#2563eb;color:#fff}
      #accountInfoModal .account-btn.danger{background:#fff7ed;border-color:#fdba74;color:#9a3412}
      #accountInfoModal .account-note{font-size:.86rem;color:#64748b;line-height:1.55;margin-top:8px}
      @media(max-width:620px){#accountInfoModal .account-box{margin:12px auto;padding:16px}#accountInfoModal .account-row{grid-template-columns:1fr;gap:2px}#accountInfoModal .account-actions{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function ensureModal() {
    if (document.getElementById('accountInfoModal')) return;
    const modal = document.createElement('div');
    modal.id = 'accountInfoModal';
    modal.innerHTML = `
      <div class="account-box">
        <div class="account-head">
          <h2>👤 帳號資訊</h2>
          <button type="button" class="account-close">關閉</button>
        </div>
        <div id="accountInfoContent"></div>
      </div>`;
    modal.querySelector('.account-close').addEventListener('click', () => modal.classList.remove('show'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });
    document.body.appendChild(modal);
  }

  function openLegacyGithubSettings() {
    const hidden = document.getElementById('syncBtn');
    if (!hidden) {
      alert('GitHub Token 設定尚未就緒，請重新整理後再試。');
      return;
    }
    document.getElementById('accountInfoModal')?.classList.remove('show');
    hidden.click();
  }

  function openLearningHistory() {
    const button = document.getElementById('learningDashboardBtn');
    if (!button) {
      alert('學習歷程尚未就緒，請重新整理後再試。');
      return;
    }
    document.getElementById('accountInfoModal')?.classList.remove('show');
    button.click();
  }

  function renderAccountInfo() {
    const content = document.getElementById('accountInfoContent');
    if (!content) return;

    const auth = window.ChrisExamAuth;
    const token = getGithubToken();
    const authorized = !!auth?.authorized;

    content.innerHTML = `
      <div class="account-card">
        <div class="account-row"><div class="account-label">Google 帳號</div><div class="account-value">${esc(auth?.email || '尚未登入')}</div></div>
        <div class="account-row"><div class="account-label">Firebase UID</div><div class="account-value">${esc(auth?.uid || '—')}</div></div>
        <div class="account-row"><div class="account-label">系統授權</div><div class="account-value">${authorized ? '✓ 已授權' : '尚未授權'}</div></div>
        <div class="account-row"><div class="account-label">學習歷程</div><div class="account-value">${authorized ? '✓ Firebase 雲端同步' : '—'}</div></div>
      </div>

      <div class="account-card">
        <div class="account-row"><div class="account-label">GitHub Token</div><div class="account-value">${token ? `已設定（${esc(maskedToken(token))}）` : '未設定'}</div></div>
        <div class="account-note">GitHub Token 現在只保留給舊版 GitHub 備援同步與既有 Gemini 工作流程使用。學習歷程本身已改用 Firebase，不需要 GitHub Token。</div>
      </div>

      <div class="account-actions">
        <button type="button" class="account-btn primary" id="accountLearningBtn">📊 我的學習歷程</button>
        <button type="button" class="account-btn" id="accountGithubBtn">⚙ GitHub Token 設定</button>
        <button type="button" class="account-btn danger" id="accountLogoutBtn">登出 Google 帳號</button>
      </div>
    `;

    document.getElementById('accountLearningBtn')?.addEventListener('click', openLearningHistory);
    document.getElementById('accountGithubBtn')?.addEventListener('click', openLegacyGithubSettings);
    document.getElementById('accountLogoutBtn')?.addEventListener('click', async () => {
      const signOut = window.ChrisExamAuth?.signOut;
      if (typeof signOut === 'function') {
        document.getElementById('accountInfoModal')?.classList.remove('show');
        await signOut();
      }
    });
  }

  function openAccountModal() {
    ensureModal();
    renderAccountInfo();
    document.getElementById('accountInfoModal')?.classList.add('show');
  }

  function ensureAccountButton() {
    const tools = document.getElementById('mainGithubSyncTools');
    if (!tools) return;

    let button = document.getElementById('mainAccountBtn');
    if (!button) {
      button = document.createElement('button');
      button.id = 'mainAccountBtn';
      button.className = 'record-btn';
      button.type = 'button';
      button.addEventListener('click', openAccountModal);
      tools.appendChild(button);
    }

    const email = window.ChrisExamAuth?.email || '';
    const desiredText = email ? '👤 帳號資訊 ✓' : '👤 帳號資訊';
    const desiredTitle = email || 'Google 帳號與系統設定';
    setTextIfChanged(button, desiredText);
    setTitleIfChanged(button, desiredTitle);
  }

  function init() {
    injectStyles();
    ensureModal();
    ensureAccountButton();

    window.addEventListener('chrisexam-auth-ready', ensureAccountButton);
    window.addEventListener('chrisexam-auth-changed', ensureAccountButton);

    // Watch only DOM insertion/removal. More importantly, ensureAccountButton()
    // now changes text/title only when the value is actually different. The
    // previous unconditional textContent assignment retriggered this observer
    // forever and could leave the whole site spinning on startup.
    const observer = new MutationObserver(() => {
      ensureAccountButton();
    });
    observer.observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
