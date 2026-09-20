(() => {
  'use strict';

  const FIREBASE_VERSION = '12.19.0';
  let firestore = null;
  let db = null;
  const ATTEMPT_PAGE_SIZE = 10;
  let visibleAttemptCount = ATTEMPT_PAGE_SIZE;

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  function fmtTime(value) {
    if (!value) return '';
    try {
      const d = value?.toDate ? value.toDate() : new Date(value);
      return new Intl.DateTimeFormat('zh-TW', {
        month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false
      }).format(d);
    } catch {
      return '';
    }
  }

  function resultText(r) {
    if (r.metricType === 'accuracy' || r.recordType === 'past-exam') {
      return `${Number(r.accuracyPercent ?? 0)}%`;
    }
    if (r.score !== null && r.score !== undefined) return `${Number(r.score)} 分`;
    return `${Number(r.correct || 0)}/${Number(r.total || 0)}`;
  }

  function titleText(r) {
    return r.unit || r.examTypeLabel || r.examKey || '測驗';
  }

  function subjectText(r) {
    return r.subjectLabel || r.subject || '未分類';
  }

  function buildStyles() {
    if (document.getElementById('learningDashboardStyle')) return;
    const style = document.createElement('style');
    style.id = 'learningDashboardStyle';
    style.textContent = `
      .learning-dashboard-entry{margin-top:18px;border-top:1px solid #dfe5ee;padding-top:16px}
      .learning-dashboard-btn{width:100%;border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;border-radius:14px;padding:14px 16px;font-size:1rem;font-weight:800;cursor:pointer}
      .learning-dashboard-btn:hover{background:#dbeafe}
      #learningDashboardModal{position:fixed;inset:0;z-index:2147483200;background:rgba(15,23,42,.62);display:none;padding:18px;overflow:auto}
      #learningDashboardModal.show{display:block}
      #learningDashboardModal .ld-box{width:min(980px,100%);margin:24px auto;background:#f8fafc;border-radius:20px;padding:18px;box-shadow:0 24px 60px rgba(0,0,0,.28)}
      #learningDashboardModal .ld-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}
      #learningDashboardModal .ld-head h2{margin:0}
      #learningDashboardModal .ld-close{border:0;background:#e2e8f0;border-radius:10px;padding:9px 12px;font-weight:700;cursor:pointer}
      .ld-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
      .ld-stat{background:#fff;border:1px solid #dfe5ee;border-radius:14px;padding:14px}
      .ld-stat .n{font-size:1.55rem;font-weight:800;color:#1d4ed8}.ld-stat .t{font-size:.84rem;color:#64748b;margin-top:3px}
      .ld-panel{background:#fff;border:1px solid #dfe5ee;border-radius:14px;padding:14px;margin-top:12px}
      .ld-panel h3{margin:0 0 10px;font-size:1.05rem}
      .ld-subjects{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
      .ld-subject{border:1px solid #e2e8f0;border-radius:11px;padding:10px;display:flex;justify-content:space-between;gap:10px}
      .ld-recent{width:100%;border-collapse:collapse;font-size:.9rem}.ld-recent th,.ld-recent td{padding:8px 6px;border-bottom:1px solid #e5e7eb;text-align:left;vertical-align:top}
      .ld-more-wrap{display:flex;flex-direction:column;align-items:center;gap:7px;margin-top:12px}
      .ld-more-btn{border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;border-radius:11px;padding:9px 16px;font-weight:800;cursor:pointer}
      .ld-more-btn:hover{background:#dbeafe}
      .ld-note{color:#64748b;font-size:.88rem}
      .ld-error{padding:14px;background:#fff7ed;color:#9a3412;border:1px solid #fed7aa;border-radius:12px}
      @media(max-width:700px){.ld-summary{grid-template-columns:repeat(2,1fr)}.ld-subjects{grid-template-columns:1fr}.ld-recent{font-size:.8rem}.ld-recent th:nth-child(2),.ld-recent td:nth-child(2){display:none}}
    `;
    document.head.appendChild(style);
  }

  function ensureModal() {
    if (document.getElementById('learningDashboardModal')) return;
    const modal = document.createElement('div');
    modal.id = 'learningDashboardModal';
    modal.innerHTML = `
      <div class="ld-box">
        <div class="ld-head">
          <div><h2>📊 我的學習歷程</h2><div class="ld-note" id="learningDashboardAccount"></div></div>
          <button class="ld-close" type="button">關閉</button>
        </div>
        <div id="learningDashboardContent"><div class="ld-note">載入中…</div></div>
      </div>`;
    modal.querySelector('.ld-close').addEventListener('click', () => modal.classList.remove('show'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });
    document.body.appendChild(modal);
  }

  function isHomeCatalog() {
    const shell = document.getElementById('catalogShell');
    const content = document.getElementById('catalogContent');
    if (!shell || shell.classList.contains('hidden') || !content) return false;
    const title = content.querySelector('.catalog-title')?.textContent?.trim() || '';
    return title === '請選擇科目';
  }

  function ensureHomeButton() {
    if (!isHomeCatalog()) return;
    const content = document.getElementById('catalogContent');
    if (!content || document.getElementById('learningDashboardHomeEntry')) return;

    const wrap = document.createElement('div');
    wrap.id = 'learningDashboardHomeEntry';
    wrap.className = 'learning-dashboard-entry';
    wrap.innerHTML = '<button id="learningDashboardBtn" class="learning-dashboard-btn" type="button">📊 我的學習歷程</button>';
    content.appendChild(wrap);
    wrap.querySelector('button').addEventListener('click', openDashboard);
  }

  function summarize(records) {
    const totalAttempts = records.length;
    const todayKey = new Date().toLocaleDateString('sv-SE');
    const todayAttempts = records.filter(r => {
      try { return new Date(r.submittedAt).toLocaleDateString('sv-SE') === todayKey; }
      catch { return false; }
    }).length;

    const accuracyValues = records.map(r => {
      if (Number.isFinite(Number(r.accuracyPercent))) return Number(r.accuracyPercent);
      if (Number(r.total) > 0) return Number(r.correct || 0) * 100 / Number(r.total);
      return null;
    }).filter(v => v !== null);
    const avgAccuracy = accuracyValues.length
      ? accuracyValues.reduce((a,b) => a + b, 0) / accuracyValues.length
      : 0;

    const wrongTotal = records.reduce((sum, r) => sum + Number(r.incorrect || 0), 0);

    const subjects = new Map();
    for (const r of records) {
      const key = subjectText(r);
      if (!subjects.has(key)) subjects.set(key, { count:0, acc:[] });
      const s = subjects.get(key);
      s.count++;
      if (Number.isFinite(Number(r.accuracyPercent))) s.acc.push(Number(r.accuracyPercent));
      else if (Number(r.total) > 0) s.acc.push(Number(r.correct || 0) * 100 / Number(r.total));
    }

    return { totalAttempts, todayAttempts, avgAccuracy, wrongTotal, subjects };
  }

  function render(records) {
    const content = document.getElementById('learningDashboardContent');
    if (!content) return;

    if (!records.length) {
      content.innerHTML = '<div class="ld-panel">目前還沒有雲端學習紀錄。完成一次測驗並交卷後，紀錄會出現在這裡。</div>';
      return;
    }

    records.sort((a,b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')));
    const s = summarize(records);
    const subjectRows = [...s.subjects.entries()].sort((a,b) => b[1].count - a[1].count).map(([name, x]) => {
      const avg = x.acc.length ? x.acc.reduce((a,b)=>a+b,0)/x.acc.length : 0;
      return `<div class="ld-subject"><span><b>${esc(name)}</b><br><span class="ld-note">${x.count} 次作答</span></span><strong>${avg.toFixed(1)}%</strong></div>`;
    }).join('');

    const shownCount = Math.min(visibleAttemptCount, records.length);
    const recentRows = records.slice(0, shownCount).map(r => `
      <tr>
        <td>${esc(fmtTime(r.submittedAt))}</td>
        <td>${esc(subjectText(r))}</td>
        <td>${esc(titleText(r))}</td>
        <td><b>${esc(resultText(r))}</b></td>
        <td>${Number(r.incorrect || 0)}</td>
      </tr>`).join('');

    const hasMore = shownCount < records.length;
    const remaining = Math.max(0, records.length - shownCount);
    const moreBlock = hasMore
      ? `<div class="ld-more-wrap">
          <button type="button" class="ld-more-btn" id="learningDashboardMoreBtn">再顯示 10 次作答</button>
          <div class="ld-note">目前顯示 ${shownCount} / ${records.length} 次，尚有 ${remaining} 次</div>
        </div>`
      : `<div class="ld-more-wrap"><div class="ld-note">已顯示全部 ${records.length} 次作答紀錄</div></div>`;

    content.innerHTML = `
      <div class="ld-summary">
        <div class="ld-stat"><div class="n">${s.todayAttempts}</div><div class="t">今天完成</div></div>
        <div class="ld-stat"><div class="n">${s.totalAttempts}</div><div class="t">累積作答</div></div>
        <div class="ld-stat"><div class="n">${s.avgAccuracy.toFixed(1)}%</div><div class="t">平均正確率</div></div>
        <div class="ld-stat"><div class="n">${s.wrongTotal}</div><div class="t">累積答錯題數</div></div>
      </div>
      <div class="ld-panel">
        <h3>各科學習概況</h3>
        <div class="ld-subjects">${subjectRows || '<div class="ld-note">尚無資料</div>'}</div>
      </div>
      <div class="ld-panel">
        <h3>最近 ${shownCount} 次作答</h3>
        <table class="ld-recent">
          <thead><tr><th>時間</th><th>科目</th><th>測驗</th><th>結果</th><th>答錯</th></tr></thead>
          <tbody>${recentRows}</tbody>
        </table>
        ${moreBlock}
      </div>`;

    document.getElementById('learningDashboardMoreBtn')?.addEventListener('click', () => {
      visibleAttemptCount += ATTEMPT_PAGE_SIZE;
      render(records);
    });
  }

  async function openDashboard() {
    ensureModal();
    const modal = document.getElementById('learningDashboardModal');
    const content = document.getElementById('learningDashboardContent');
    const account = document.getElementById('learningDashboardAccount');
    modal.classList.add('show');
    visibleAttemptCount = ATTEMPT_PAGE_SIZE;
    content.innerHTML = '<div class="ld-note">正在讀取 Firebase 學習歷程…</div>';

    const auth = window.ChrisExamAuth;
    if (!auth?.authorized || !auth.uid) {
      content.innerHTML = '<div class="ld-error">目前尚未取得已授權的 Google 登入身分，請重新整理頁面後再試。</div>';
      return;
    }
    account.textContent = auth.email || '';

    try {
      if (!firestore || !db) {
        const appMod = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`);
        firestore = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`);
        const app = appMod.getApps().length ? appMod.getApp() : null;
        if (!app) throw new Error('Firebase app 尚未初始化');
        db = firestore.getFirestore(app);
      }

      const ref = firestore.collection(db, 'users', auth.uid, 'attempts');
      const q = firestore.query(ref, firestore.orderBy('submittedAt', 'desc'));
      const snap = await firestore.getDocs(q);
      const records = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      render(records);
    } catch (error) {
      console.error('[LearningDashboard] load failed', error);
      content.innerHTML = `<div class="ld-error">學習歷程載入失敗：${esc(error?.message || error)}</div>`;
    }
  }

  function observeHome() {
    const root = document.getElementById('catalogShell') || document.body;
    const observer = new MutationObserver(() => ensureHomeButton());
    observer.observe(root, { childList:true, subtree:true });
    ensureHomeButton();
  }

  function init() {
    buildStyles();
    ensureModal();
    observeHome();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
