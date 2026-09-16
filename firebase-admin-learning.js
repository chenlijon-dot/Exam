(() => {
  'use strict';

  const FIREBASE_VERSION = '12.19.0';
  const ADMIN_EMAIL = 'chenlijon@gmail.com';
  let firestore = null;
  let db = null;

  const $ = (sel, root = document) => root.querySelector(sel);

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  function isAdmin() {
    const auth = window.ChrisExamAuth;
    return !!(auth?.authorized && String(auth.email || '').toLowerCase() === ADMIN_EMAIL);
  }

  function isHomeCatalog() {
    const shell = $('#catalogShell');
    const content = $('#catalogContent');
    if (!shell || shell.classList.contains('hidden') || !content) return false;
    return (content.querySelector('.catalog-title')?.textContent || '').trim() === '請選擇科目';
  }

  function fmtTime(value) {
    if (!value) return '';
    try {
      const d = value?.toDate ? value.toDate() : new Date(value);
      return new Intl.DateTimeFormat('zh-TW', {
        year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false
      }).format(d);
    } catch { return ''; }
  }

  function subjectText(r) {
    return r.subjectLabel || r.subject || '未分類';
  }

  function titleText(r) {
    return r.unit || r.examTypeLabel || r.examKey || '測驗';
  }

  function resultText(r) {
    if (r.metricType === 'accuracy' || r.recordType === 'past-exam') {
      return `${Number(r.accuracyPercent ?? 0)}%`;
    }
    if (r.score !== null && r.score !== undefined) return `${Number(r.score)} 分`;
    return `${Number(r.correct || 0)}/${Number(r.total || 0)}`;
  }

  function accuracyOf(r) {
    if (Number.isFinite(Number(r.accuracyPercent))) return Number(r.accuracyPercent);
    if (Number(r.total) > 0) return Number(r.correct || 0) * 100 / Number(r.total);
    return null;
  }

  function buildStyles() {
    if ($('#adminLearningStyle')) return;
    const style = document.createElement('style');
    style.id = 'adminLearningStyle';
    style.textContent = `
      .admin-learning-entry{margin-top:10px}
      .admin-learning-btn{width:100%;border:1px solid #c4b5fd;background:#f5f3ff;color:#6d28d9;border-radius:14px;padding:14px 16px;font-size:1rem;font-weight:850;cursor:pointer}
      .admin-learning-btn:hover{background:#ede9fe}
      #adminLearningModal{position:fixed;inset:0;z-index:2147483300;background:rgba(15,23,42,.66);display:none;padding:18px;overflow:auto}
      #adminLearningModal.show{display:block}
      #adminLearningModal .al-box{width:min(1100px,100%);margin:20px auto;background:#f8fafc;border-radius:20px;padding:18px;box-shadow:0 24px 70px rgba(0,0,0,.3)}
      .al-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:14px}.al-head h2{margin:0}.al-close{border:0;background:#e2e8f0;border-radius:10px;padding:9px 12px;font-weight:750;cursor:pointer}
      .al-note{font-size:.86rem;color:#64748b}.al-error{padding:13px;border:1px solid #fed7aa;background:#fff7ed;color:#9a3412;border-radius:12px;white-space:pre-wrap}
      .al-grid{display:grid;grid-template-columns:280px 1fr;gap:14px}.al-panel{background:#fff;border:1px solid #dfe5ee;border-radius:14px;padding:14px}
      .al-panel h3{margin:0 0 10px;font-size:1.02rem}.al-student-list{display:flex;flex-direction:column;gap:7px;max-height:70vh;overflow:auto}
      .al-student{border:1px solid #e2e8f0;background:#fff;border-radius:11px;padding:10px;text-align:left;cursor:pointer}.al-student:hover,.al-student.active{background:#eef2ff;border-color:#a5b4fc}.al-student strong{display:block;overflow-wrap:anywhere}.al-student span{font-size:.8rem;color:#64748b}
      .al-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:12px}.al-stat{border:1px solid #e2e8f0;border-radius:12px;padding:12px;background:#f8fafc}.al-stat .n{font-size:1.35rem;font-weight:850;color:#6d28d9}.al-stat .t{font-size:.79rem;color:#64748b;margin-top:2px}
      .al-subjects{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.al-subject{border:1px solid #e2e8f0;border-radius:10px;padding:9px;display:flex;justify-content:space-between;gap:8px}
      .al-table{width:100%;border-collapse:collapse;font-size:.88rem}.al-table th,.al-table td{padding:8px 6px;border-bottom:1px solid #e5e7eb;text-align:left;vertical-align:top}
      @media(max-width:760px){.al-grid{grid-template-columns:1fr}.al-student-list{max-height:230px}.al-summary{grid-template-columns:repeat(2,1fr)}.al-subjects{grid-template-columns:1fr}.al-table{font-size:.79rem}.al-table th:nth-child(2),.al-table td:nth-child(2){display:none}}
    `;
    document.head.appendChild(style);
  }

  function ensureModal() {
    let modal = $('#adminLearningModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'adminLearningModal';
    modal.innerHTML = `
      <div class="al-box">
        <div class="al-head">
          <div><h2>🧑‍🏫 管理學員歷程</h2><div class="al-note">管理者：${esc(ADMIN_EMAIL)}</div></div>
          <button class="al-close" type="button">關閉</button>
        </div>
        <div id="adminLearningContent"><div class="al-note">載入中…</div></div>
      </div>`;
    modal.querySelector('.al-close').addEventListener('click', () => modal.classList.remove('show'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });
    document.body.appendChild(modal);
    return modal;
  }

  function ensureHomeButton() {
    const old = $('#adminLearningHomeEntry');
    if (!isAdmin() || !isHomeCatalog()) {
      old?.remove();
      return;
    }
    if (old) return;
    const content = $('#catalogContent');
    if (!content) return;
    const wrap = document.createElement('div');
    wrap.id = 'adminLearningHomeEntry';
    wrap.className = 'admin-learning-entry';
    wrap.innerHTML = '<button class="admin-learning-btn" type="button">🧑‍🏫 管理學員歷程</button>';
    content.appendChild(wrap);
    wrap.querySelector('button').addEventListener('click', openAdminDashboard);
  }

  async function ensureFirestore() {
    if (firestore && db) return;
    const appMod = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`);
    firestore = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`);
    const app = appMod.getApps().length ? appMod.getApp() : null;
    if (!app) throw new Error('Firebase app 尚未初始化');
    db = firestore.getFirestore(app);
  }

  function groupStudents(records) {
    const map = new Map();
    for (const r of records) {
      const uid = r.firebaseUid || r.__uid || 'unknown';
      const email = r.userEmail || uid;
      if (!map.has(uid)) map.set(uid, { uid, email, records:[] });
      const s = map.get(uid);
      if (r.userEmail) s.email = r.userEmail;
      s.records.push(r);
    }
    return [...map.values()].sort((a,b) => String(a.email).localeCompare(String(b.email)));
  }

  function summarize(records) {
    const acc = records.map(accuracyOf).filter(v => v !== null);
    const avg = acc.length ? acc.reduce((a,b)=>a+b,0)/acc.length : 0;
    const wrong = records.reduce((sum,r)=>sum+Number(r.incorrect || 0),0);
    const latest = records.reduce((best,r) => String(r.submittedAt || '') > String(best || '') ? r.submittedAt : best, '');
    const subjects = new Map();
    records.forEach(r => {
      const key = subjectText(r);
      if (!subjects.has(key)) subjects.set(key,{count:0,acc:[]});
      const s=subjects.get(key); s.count++;
      const a=accuracyOf(r); if(a!==null) s.acc.push(a);
    });
    return { attempts:records.length, avg, wrong, latest, subjects };
  }

  function renderStudent(student) {
    const detail = $('#adminLearningDetail');
    if (!detail) return;
    const records = [...student.records].sort((a,b)=>String(b.submittedAt||'').localeCompare(String(a.submittedAt||'')));
    const s = summarize(records);
    const subjects = [...s.subjects.entries()].map(([name,x]) => {
      const avg=x.acc.length?x.acc.reduce((a,b)=>a+b,0)/x.acc.length:0;
      return `<div class="al-subject"><span><b>${esc(name)}</b><br><span class="al-note">${x.count} 次</span></span><strong>${avg.toFixed(1)}%</strong></div>`;
    }).join('');
    const rows = records.slice(0,50).map(r=>`<tr><td>${esc(fmtTime(r.submittedAt))}</td><td>${esc(subjectText(r))}</td><td>${esc(titleText(r))}</td><td><b>${esc(resultText(r))}</b></td><td>${Number(r.incorrect||0)}</td></tr>`).join('');
    detail.innerHTML = `
      <h3>${esc(student.email)}</h3><div class="al-note" style="margin-bottom:10px">UID：${esc(student.uid)}</div>
      <div class="al-summary">
        <div class="al-stat"><div class="n">${s.attempts}</div><div class="t">累積作答</div></div>
        <div class="al-stat"><div class="n">${s.avg.toFixed(1)}%</div><div class="t">平均正確率</div></div>
        <div class="al-stat"><div class="n">${s.wrong}</div><div class="t">累積答錯</div></div>
        <div class="al-stat"><div class="n" style="font-size:.94rem">${esc(fmtTime(s.latest)) || '—'}</div><div class="t">最近作答</div></div>
      </div>
      <div style="margin:12px 0"><h3>各科概況</h3><div class="al-subjects">${subjects || '<div class="al-note">尚無資料</div>'}</div></div>
      <div style="margin-top:14px"><h3>最近 50 次作答</h3><div style="overflow:auto"><table class="al-table"><thead><tr><th>時間</th><th>科目</th><th>測驗</th><th>結果</th><th>答錯</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }

  function renderAll(records) {
    const content = $('#adminLearningContent');
    const students = groupStudents(records);
    if (!students.length) {
      content.innerHTML = '<div class="al-panel">目前還沒有任何學員的雲端作答紀錄。</div>';
      return;
    }
    content.innerHTML = `<div class="al-grid"><div class="al-panel"><h3>學員 (${students.length})</h3><div class="al-student-list" id="adminStudentList"></div></div><div class="al-panel" id="adminLearningDetail"></div></div>`;
    const list = $('#adminStudentList');
    students.forEach((student,index) => {
      const s=summarize(student.records);
      const btn=document.createElement('button');
      btn.className='al-student'+(index===0?' active':'');
      btn.type='button';
      btn.innerHTML=`<strong>${esc(student.email)}</strong><span>${s.attempts} 次作答 · 平均 ${s.avg.toFixed(1)}%</span>`;
      btn.addEventListener('click',()=>{
        list.querySelectorAll('.al-student').forEach(x=>x.classList.remove('active'));
        btn.classList.add('active');
        renderStudent(student);
      });
      list.appendChild(btn);
    });
    renderStudent(students[0]);
  }

  async function openAdminDashboard() {
    const modal=ensureModal();
    const content=$('#adminLearningContent');
    modal.classList.add('show');
    if (!isAdmin()) {
      content.innerHTML='<div class="al-error">此功能僅限管理者帳號使用。</div>';
      return;
    }
    content.innerHTML='<div class="al-note">正在讀取所有學員的 Firebase 學習歷程…</div>';
    try {
      await ensureFirestore();
      const ref=firestore.collectionGroup(db,'attempts');
      const q=firestore.query(ref,firestore.orderBy('submittedAt','desc'),firestore.limit(500));
      const snap=await firestore.getDocs(q);
      const records=snap.docs.map(doc=>{
        const data=doc.data();
        const parentUser=doc.ref.parent.parent?.id || '';
        return {__uid:parentUser,id:doc.id,...data};
      });
      renderAll(records);
    } catch(error) {
      console.error('[AdminLearning] load failed',error);
      const code=String(error?.code||'');
      const hint=code.includes('permission-denied')
        ? '\n\n目前 Firestore 規則尚未開放管理者跨學員讀取；請套用管理者讀取規則後再試。'
        : '';
      content.innerHTML=`<div class="al-error">管理學員歷程載入失敗：${esc(error?.message||error)}${esc(hint)}</div>`;
    }
  }

  function init() {
    buildStyles();
    ensureModal();
    const root=$('#catalogShell')||document.body;
    const observer=new MutationObserver(ensureHomeButton);
    observer.observe(root,{childList:true,subtree:true});
    window.addEventListener('chrisexam-auth-ready',ensureHomeButton);
    window.addEventListener('chrisexam-auth-changed',ensureHomeButton);
    ensureHomeButton();
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
