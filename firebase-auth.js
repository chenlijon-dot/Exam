(() => {
  'use strict';

  const FIREBASE_VERSION = '12.19.0';
  const ALLOWED_EMAILS = new Set([
    'chenlijon@gmail.com',
    'chenrody0320@gmail.com'
  ]);

  const firebaseConfig = {
    apiKey: 'AIzaSyDkZOlQjmoVnkIz3Q1ppg_EJnCp5W3qNFQ',
    authDomain: 'chrisexamplatform.firebaseapp.com',
    projectId: 'chrisexamplatform',
    storageBucket: 'chrisexamplatform.firebasestorage.app',
    messagingSenderId: '682858985440',
    appId: '1:682858985440:web:22dfbf5f0c635728675d85',
    measurementId: 'G-WHXW4FDXBB'
  };

  function isStudentExamWebView() {
    try {
      return !!window.StudentExamNative;
    } catch {
      return false;
    }
  }

  function buildGate() {
    if (document.getElementById('firebaseAuthGate')) return;

    const style = document.createElement('style');
    style.id = 'firebaseAuthGateStyle';
    style.textContent = `
      #firebaseAuthGate{position:fixed;inset:0;z-index:2147483646;background:#f6f8fb;display:grid;place-items:center;padding:20px;font-family:system-ui,-apple-system,"Segoe UI","Noto Sans TC",sans-serif;color:#172033}
      #firebaseAuthGate .fa-card{width:min(520px,100%);background:#fff;border:1px solid #dfe5ee;border-radius:22px;padding:28px;box-shadow:0 16px 44px rgba(15,23,42,.12)}
      #firebaseAuthGate h1{margin:0 0 8px;font-size:1.55rem}
      #firebaseAuthGate .fa-muted{color:#657089;margin-bottom:18px}
      #firebaseAuthGate .fa-status{padding:14px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;white-space:pre-wrap;line-height:1.55}
      #firebaseAuthGate .fa-ok{background:#f0fdf4;border-color:#86efac;color:#166534}
      #firebaseAuthGate .fa-bad{background:#fef2f2;border-color:#fca5a5;color:#991b1b}
      #firebaseAuthGate button{width:100%;border:0;border-radius:12px;padding:12px 16px;font-size:1rem;font-weight:700;cursor:pointer;margin-top:10px}
      #firebaseAuthGate .fa-primary{background:#2563eb;color:#fff}
      #firebaseAuthGate .fa-secondary{background:#e2e8f0;color:#1e293b}
      #firebaseAuthGate .fa-hidden{display:none!important}
      #firebaseUserChip{position:fixed;right:12px;bottom:12px;z-index:2147483000;display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.94);border:1px solid #dfe5ee;border-radius:999px;padding:7px 9px 7px 12px;box-shadow:0 6px 20px rgba(15,23,42,.10);font:600 12px/1.2 system-ui,-apple-system,"Segoe UI","Noto Sans TC",sans-serif;color:#334155}
      #firebaseUserChip button{border:0;background:#e2e8f0;border-radius:999px;padding:6px 9px;font-weight:700;cursor:pointer;color:#1e293b}
      @media(max-width:620px){#firebaseAuthGate .fa-card{padding:22px 18px}#firebaseUserChip{max-width:calc(100vw - 24px)}#firebaseUserChip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:210px}}
    `;
    document.head.appendChild(style);

    const gate = document.createElement('div');
    gate.id = 'firebaseAuthGate';
    gate.innerHTML = `
      <div class="fa-card">
        <h1>ChrisExamPlatform</h1>
        <div class="fa-muted">請先使用已授權的 Google 帳號登入</div>
        <div id="firebaseAuthStatus" class="fa-status">正在確認登入狀態…</div>
        <button id="firebaseLoginBtn" class="fa-primary fa-hidden">使用 Google 帳號登入</button>
        <button id="firebaseLogoutBtn" class="fa-secondary fa-hidden">登出</button>
      </div>
    `;
    document.body.appendChild(gate);
  }

  function setStatus(text, type = '') {
    const el = document.getElementById('firebaseAuthStatus');
    if (!el) return;
    el.textContent = text;
    el.className = 'fa-status' + (type ? ` fa-${type}` : '');
  }

  function friendlyError(error) {
    const code = error?.code || '';
    if (code.includes('popup-blocked')) return '瀏覽器阻擋了登入視窗，請再試一次。';
    if (code.includes('popup-closed-by-user')) return 'Google 登入視窗已關閉。';
    if (code.includes('unauthorized-domain')) return '目前網域尚未加入 Firebase 授權網域。';
    if (code.includes('operation-not-supported-in-this-environment')) return '目前環境不支援網頁 Google 登入。';
    return `${code || '登入失敗'}\n${error?.message || ''}`.trim();
  }

  function removeUserChip() {
    document.getElementById('firebaseUserChip')?.remove();
  }

  function showUserChip(user, signOutFn) {
    removeUserChip();
    const chip = document.createElement('div');
    chip.id = 'firebaseUserChip';
    chip.innerHTML = `<span>${user.email || 'Google 帳號'}</span><button type="button">登出</button>`;
    chip.querySelector('button').addEventListener('click', signOutFn);
    document.body.appendChild(chip);
  }

  async function initAuthGate() {
    buildGate();

    const loginBtn = document.getElementById('firebaseLoginBtn');
    const logoutBtn = document.getElementById('firebaseLogoutBtn');
    const gate = document.getElementById('firebaseAuthGate');

    try {
      const appMod = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`);
      const authMod = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`);

      const app = appMod.initializeApp(firebaseConfig);
      const auth = authMod.getAuth(app);
      const provider = new authMod.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const doSignOut = async () => {
        try {
          await authMod.signOut(auth);
        } catch (error) {
          console.error('[FirebaseAuth] signOut failed', error);
        }
      };

      loginBtn.addEventListener('click', async () => {
        loginBtn.disabled = true;
        setStatus('正在開啟 Google 登入…');
        try {
          if (isStudentExamWebView()) {
            await authMod.signInWithRedirect(auth, provider);
          } else {
            await authMod.signInWithPopup(auth, provider);
          }
        } catch (error) {
          console.error('[FirebaseAuth] login failed', error);
          setStatus(friendlyError(error), 'bad');
          loginBtn.disabled = false;
        }
      });

      logoutBtn.addEventListener('click', doSignOut);

      try {
        await authMod.getRedirectResult(auth);
      } catch (error) {
        console.error('[FirebaseAuth] redirect result failed', error);
        setStatus(friendlyError(error), 'bad');
      }

      authMod.onAuthStateChanged(auth, user => {
        loginBtn.disabled = false;

        if (!user) {
          removeUserChip();
          gate.style.display = 'grid';
          setStatus('尚未登入。\n請使用 Google 帳號登入。');
          loginBtn.classList.remove('fa-hidden');
          logoutBtn.classList.add('fa-hidden');
          return;
        }

        const email = (user.email || '').toLowerCase();
        const allowed = ALLOWED_EMAILS.has(email);

        loginBtn.classList.add('fa-hidden');
        logoutBtn.classList.remove('fa-hidden');

        if (!allowed) {
          removeUserChip();
          gate.style.display = 'grid';
          setStatus(`登入成功，但此帳號尚未授權。\n\n帳號：${user.email || '(無 email)'}`, 'bad');
          return;
        }

        setStatus(`✓ Google 登入成功\n✓ 白名單授權成功\n\n帳號：${user.email}`, 'ok');
        showUserChip(user, doSignOut);

        setTimeout(() => {
          gate.style.display = 'none';
        }, 250);

        window.ChrisExamAuth = {
          user,
          uid: user.uid,
          email: user.email,
          authorized: true
        };
        window.dispatchEvent(new CustomEvent('chrisexam-auth-ready', {
          detail: window.ChrisExamAuth
        }));
      });
    } catch (error) {
      console.error('[FirebaseAuth] init failed', error);
      setStatus('Firebase 登入模組載入失敗。\n請確認網路後重新整理。\n\n' + (error?.message || error), 'bad');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthGate, { once: true });
  } else {
    initAuthGate();
  }
})();
