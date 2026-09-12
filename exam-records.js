(() => {
  'use strict';

  const RECORDS_KEY = 'examRecords.v1';
  const TOKEN_KEY = 'examRecords.githubToken.session';
  const RECORD_REPO = 'chenlijon-dot/Exam-Record';
  const LETTERS = ['A','B','C','D'];

  let examStartedAt = null;
  let lastRecordedSignature = '';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function nowIso() { return new Date().toISOString(); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function safeJsonParse(s, fallback) { try { return JSON.parse(s); } catch { return fallback; } }

  function loadRecords() {
    return safeJsonParse(localStorage.getItem(RECORDS_KEY) || '[]', []);
  }

  function saveRecords(records) {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  }

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  }

  function setToken(token) {
    if (token) sessionStorage.setItem(TOKEN_KEY, token.trim());
    else sessionStorage.removeItem(TOKEN_KEY);
  }

  function formatLocalTime(iso) {
    try {
      return new Intl.DateTimeFormat('zh-TW', {
        year:'numeric', month:'2-digit', day:'2-digit',
        hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false
      }).format(new Date(iso));
    } catch { return iso; }
  }

  function difficultyFromTitle() {
    const txt = $('#examTitle')?.textContent || '';
    if (txt.includes('簡易')) return { key:'easy', label:'簡易' };
    if (txt.includes('中等')) return { key:'medium', label:'中等' };
    if (txt.includes('困難')) return { key:'hard', label:'困難' };
    return { key:'unknown', label:'未分類' };
  }

  function captureAttempt() {
    const cards = $$('.card[data-q]');
    if (!cards.length) return null;

    const diff = difficultyFromTitle();
    let correct = 0, incorrect = 0, unanswered = 0;

    const answers = cards.map((card, idx) => {
      const question = $('.qtitle', card)?.textContent.replace(/^\s*\d+\s*/, '').trim() || `第${idx+1}題`;
      const selected = $('input[type=radio]:checked', card);
      const selectedIndex = selected ? Number(selected.value) : null;
      const correctLabel = $('.option.correct', card);
      const correctInput = correctLabel ? $('input[type=radio]', correctLabel) : null;
      const correctIndex = correctInput ? Number(correctInput.value) : null;
      const explanation = $('.explain', card)?.textContent.replace(/^答案：\s*[A-D]\s*/,'').trim() || '';
      const options = $$('.option', card).map(o => o.textContent.trim().replace(/^\([A-D]\)\s*/, ''));
      const isCorrect = selectedIndex !== null && correctIndex !== null && selectedIndex === correctIndex;

      if (selectedIndex === null) unanswered++;
      else if (isCorrect) correct++;
      else incorrect++;

      return {
        number: idx + 1,
        question,
        options,
        selectedIndex,
        selectedLetter: selectedIndex === null ? null : LETTERS[selectedIndex],
        selectedText: selectedIndex === null ? null : options[selectedIndex],
        correctIndex,
        correctLetter: correctIndex === null ? null : LETTERS[correctIndex],
        correctText: correctIndex === null ? null : options[correctIndex],
        isCorrect,
        explanation
      };
    });

    const submittedAt = nowIso();
    const durationSeconds = examStartedAt ? Math.max(0, Math.round((Date.now() - examStartedAt) / 1000)) : 0;
    const score = correct * 5;

    return {
      schemaVersion: 1,
      subject: '國一自然',
      unit: '科學方法',
      difficulty: diff.key,
      difficultyLabel: diff.label,
      submittedAt,
      durationSeconds,
      score,
      correct,
      incorrect,
      unanswered,
      total: answers.length,
      answers,
      wrongAnswers: answers.filter(a => !a.isCorrect)
    };
  }

  function makeSignature(attempt) {
    return `${attempt.difficulty}|${attempt.score}|${attempt.correct}|${attempt.incorrect}|${attempt.unanswered}|${attempt.answers.map(a => a.selectedIndex ?? 'x').join(',')}`;
  }

  function storeAttemptLocally(attempt) {
    const sig = makeSignature(attempt);
    if (sig === lastRecordedSignature) return false;
    lastRecordedSignature = sig;

    const records = loadRecords();
    records.unshift(attempt);
    saveRecords(records.slice(0, 300));
    return true;
  }

  function utf8ToBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
  }

  async function githubApi(path, options = {}) {
    const token = getToken();
    if (!token) throw new Error('尚未設定 GitHub Token');
    const response = await fetch(`https://api.github.com${path}`, {
      ...options,
      headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {})
      }
    });
    if (!response.ok) {
      let detail = '';
      try { detail = (await response.json()).message || ''; } catch {}
      throw new Error(`GitHub ${response.status}${detail ? `：${detail}` : ''}`);
    }
    return response.status === 204 ? null : response.json();
  }

  function recordPath(attempt) {
    const d = new Date(attempt.submittedAt);
    const ym = `${d.getFullYear()}-${pad(d.getMonth()+1)}`;
    const ts = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    const suffix = Math.random().toString(36).slice(2,7);
    return `records/${ym}/${ts}_${attempt.difficulty}_${suffix}.json`;
  }

  async function syncAttempt(attempt) {
    const path = recordPath(attempt);
    return githubApi(`/repos/${RECORD_REPO}/contents/${path}`, {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        message: `Record ${attempt.difficultyLabel} exam score ${attempt.score}`,
        content: utf8ToBase64(JSON.stringify(attempt, null, 2)),
        branch: 'main'
      })
    });
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .record-tools{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
      .record-btn{border:1px solid #dfe5ee;background:#fff;color:#172033;border-radius:12px;padding:12px 10px;font-weight:700;cursor:pointer}
      .record-btn:hover{background:#f8fbff;border-color:#93b4fb}
      .record-modal{position:fixed;inset:0;background:rgba(15,23,42,.62);display:none;align-items:center;justify-content:center;padding:14px;z-index:9999}
      .record-modal.show{display:flex}
      .record-box{background:#fff;width:min(760px,100%);max-height:88vh;overflow:auto;border-radius:18px;padding:18px;box-shadow:0 24px 60px rgba(0,0,0,.25)}
      .record-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}
      .record-close{background:#e2e8f0;color:#1e293b;padding:8px 12px;border-radius:10px}
      .record-table{width:100%;border-collapse:collapse;font-size:.94rem}
      .record-table th,.record-table td{border-bottom:1px solid #e5e7eb;padding:9px 7px;text-align:left;vertical-align:top}
      .record-chip{display:inline-block;padding:3px 8px;border-radius:999px;background:#eef4ff;color:#1d4ed8;font-size:.82rem}
      .wrong-item{border:1px solid #e5e7eb;border-radius:12px;padding:12px;margin:9px 0;background:#fff}
      .wrong-count{font-size:.82rem;background:#fef2f2;color:#b91c1c;padding:3px 7px;border-radius:999px}
      .sync-status{margin-top:8px;font-size:.9rem;color:#657089}
      .token-input{width:100%;padding:11px;border:1px solid #cbd5e1;border-radius:10px;font:inherit}
      .record-note{font-size:.88rem;color:#64748b;margin-top:8px}
      @media(max-width:620px){.record-tools{grid-template-columns:1fr}.record-table{font-size:.86rem}}
    `;
    document.head.appendChild(style);
  }

  function makeModal(id, title) {
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'record-modal';
    modal.innerHTML = `<div class="record-box"><div class="record-head"><h2 style="margin:0">${title}</h2><button class="record-close">關閉</button></div><div class="record-content"></div></div>`;
    $('.record-close', modal).addEventListener('click', () => modal.classList.remove('show'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });
    document.body.appendChild(modal);
    return modal;
  }

  function addStartMenuTools() {
    const panel = $('#startScreen .panel');
    if (!panel || $('#recordTools')) return;
    const tools = document.createElement('div');
    tools.id = 'recordTools';
    tools.className = 'record-tools';
    tools.innerHTML = `
      <button class="record-btn" id="historyBtn">📊 成績紀錄</button>
      <button class="record-btn" id="wrongBtn">📝 錯題複習</button>
      <button class="record-btn" id="syncBtn">☁️ GitHub 同步設定</button>
    `;
    panel.appendChild(tools);
    $('#historyBtn').addEventListener('click', showHistory);
    $('#wrongBtn').addEventListener('click', showWrongAnswers);
    $('#syncBtn').addEventListener('click', showSyncSettings);
  }

  function showHistory() {
    const records = loadRecords();
    const modal = $('#historyModal');
    const content = $('.record-content', modal);
    if (!records.length) {
      content.innerHTML = '<p>目前還沒有作答紀錄。完成一次考試後，成績會出現在這裡。</p>';
    } else {
      const avg = Math.round(records.reduce((s,r)=>s+r.score,0) / records.length);
      content.innerHTML = `<p><b>共 ${records.length} 次</b>｜平均 ${avg} 分</p><table class="record-table"><thead><tr><th>時間</th><th>難度</th><th>分數</th><th>錯題</th><th>時間</th></tr></thead><tbody>${records.map(r=>`<tr><td>${formatLocalTime(r.submittedAt)}</td><td><span class="record-chip">${r.difficultyLabel}</span></td><td><b>${r.score}</b></td><td>${r.incorrect + r.unanswered}</td><td>${Math.floor((r.durationSeconds||0)/60)}分${(r.durationSeconds||0)%60}秒</td></tr>`).join('')}</tbody></table>`;
    }
    modal.classList.add('show');
  }

  function aggregateWrongAnswers() {
    const map = new Map();
    loadRecords().forEach(r => {
      (r.wrongAnswers || []).forEach(a => {
        const key = `${r.difficulty}|${a.question}`;
        if (!map.has(key)) map.set(key, { ...a, difficultyLabel:r.difficultyLabel, count:0, last:r.submittedAt });
        const x = map.get(key); x.count++; if (r.submittedAt > x.last) x.last = r.submittedAt;
      });
    });
    return [...map.values()].sort((a,b) => b.count - a.count || b.last.localeCompare(a.last));
  }

  function showWrongAnswers() {
    const list = aggregateWrongAnswers();
    const modal = $('#wrongModal');
    const content = $('.record-content', modal);
    if (!list.length) content.innerHTML = '<p>目前沒有錯題紀錄。漂亮！</p>';
    else content.innerHTML = `<p>目前累積 <b>${list.length}</b> 個曾答錯題目，依錯誤次數排序。</p>${list.map(x=>`<div class="wrong-item"><div style="display:flex;justify-content:space-between;gap:8px"><b>${x.difficultyLabel}｜${x.question}</b><span class="wrong-count">錯 ${x.count} 次</span></div><div style="margin-top:6px">你最近選：${x.selectedLetter ? `${x.selectedLetter}. ${x.selectedText}` : '未作答'}</div><div>正解：<b>${x.correctLetter}. ${x.correctText}</b></div>${x.explanation ? `<div class="record-note">${x.explanation}</div>` : ''}</div>`).join('')}`;
    modal.classList.add('show');
  }

  function showSyncSettings() {
    const modal = $('#syncModal');
    const content = $('.record-content', modal);
    const hasToken = !!getToken();
    content.innerHTML = `
      <p>資料庫：<b>${RECORD_REPO}</b>（Private）</p>
      <p>請輸入只對這個 repo 有 <b>Contents: Read and write</b> 權限的 fine-grained token。</p>
      <input id="tokenInput" class="token-input" type="password" autocomplete="off" placeholder="github_pat_..." value="">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <button id="saveTokenBtn" class="record-btn">儲存到本次瀏覽工作階段</button>
        <button id="testTokenBtn" class="record-btn">測試連線</button>
        <button id="clearTokenBtn" class="record-btn">清除 Token</button>
      </div>
      <div class="sync-status" id="syncStatus">目前：${hasToken ? '已設定 Token' : '尚未設定 Token'}。本機成績仍會正常保存。</div>
      <div class="record-note">安全設計：Token 只放在 sessionStorage，關閉瀏覽器分頁／工作階段後會消失，不寫入 GitHub 程式碼。</div>
    `;
    $('#saveTokenBtn').onclick = () => {
      const v = $('#tokenInput').value.trim();
      setToken(v);
      $('#syncStatus').textContent = v ? '已儲存，本次瀏覽工作階段會自動同步交卷紀錄。' : '未輸入 Token。';
    };
    $('#clearTokenBtn').onclick = () => { setToken(''); $('#tokenInput').value=''; $('#syncStatus').textContent='Token 已清除。'; };
    $('#testTokenBtn').onclick = async () => {
      const v = $('#tokenInput').value.trim(); if (v) setToken(v);
      const status = $('#syncStatus'); status.textContent='測試中…';
      try {
        const data = await githubApi(`/repos/${RECORD_REPO}`);
        status.textContent = `連線成功：${data.full_name}，visibility=${data.visibility}`;
      } catch (e) { status.textContent = `連線失敗：${e.message}`; }
    };
    modal.classList.add('show');
  }

  function showSyncToast(message, ok = true) {
    let el = $('#examSyncToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'examSyncToast';
      el.style.cssText = 'margin:10px 0;padding:10px 12px;border-radius:10px;font-size:.92rem';
      const result = $('#result');
      if (result) result.insertAdjacentElement('afterend', el);
    }
    el.style.background = ok ? '#f0fdf4' : '#fff7ed';
    el.style.color = ok ? '#166534' : '#9a3412';
    el.textContent = message;
  }

  function hookExamStart() {
    $$('.difficulty').forEach(btn => btn.addEventListener('click', () => {
      examStartedAt = Date.now();
      lastRecordedSignature = '';
      const toast = $('#examSyncToast'); if (toast) toast.remove();
    }));
    $('#restartBtn')?.addEventListener('click', () => { examStartedAt = Date.now(); lastRecordedSignature=''; });
  }

  function hookSubmission() {
    const submit = $('#submitBtn');
    if (!submit) return;
    submit.addEventListener('click', async () => {
      await new Promise(r => setTimeout(r, 0));
      const attempt = captureAttempt();
      if (!attempt) return;
      const added = storeAttemptLocally(attempt);
      if (!added) return;

      if (!getToken()) {
        showSyncToast('成績與錯題已存到這台裝置。尚未設定 GitHub Token，所以這次未同步到雲端。', false);
        return;
      }
      showSyncToast('本機紀錄已保存，正在同步到 GitHub…');
      try {
        await syncAttempt(attempt);
        showSyncToast('✓ 成績與錯題已同步到私人 GitHub 資料庫。');
      } catch (e) {
        showSyncToast(`本機紀錄已保存，但 GitHub 同步失敗：${e.message}`, false);
      }
    });
  }

  function init() {
    injectStyles();
    makeModal('historyModal', '成績紀錄');
    makeModal('wrongModal', '錯題複習');
    makeModal('syncModal', 'GitHub 同步設定');
    addStartMenuTools();
    hookExamStart();
    hookSubmission();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
