(() => {
  'use strict';

  const RECORDS_KEY = 'examRecords.v1';
  const TOKEN_KEY = 'examRecords.githubToken.session';
  const RECORD_REPO = 'chenlijon-dot/Exam-Record';

  const $ = (sel, root = document) => root.querySelector(sel);

  function loadRecords() {
    try { return JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]'); }
    catch { return []; }
  }

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  }

  function aggregateWrongAnswers() {
    const map = new Map();
    loadRecords().forEach(r => {
      (r.wrongAnswers || [])
        .filter(a => a && a.selectedIndex !== null && a.selectedIndex !== undefined && a.selectedLetter)
        .forEach(a => {
          const key = `${r.difficulty}|${a.question}`;
          if (!map.has(key)) {
            map.set(key, {
              difficulty: r.difficultyLabel || r.difficulty,
              question: a.question,
              selectedLetter: a.selectedLetter,
              selectedText: a.selectedText,
              correctLetter: a.correctLetter,
              correctText: a.correctText,
              explanation: a.explanation,
              count: 0,
              last: r.submittedAt
            });
          }
          const x = map.get(key);
          x.count++;
          if (r.submittedAt > x.last) {
            x.last = r.submittedAt;
            x.selectedLetter = a.selectedLetter;
            x.selectedText = a.selectedText;
          }
        });
    });
    return [...map.values()].sort((a,b) => b.count - a.count || b.last.localeCompare(a.last));
  }

  function utf8ToBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
  }

  function base64ToUtf8(text) {
    const binary = atob(text.replace(/\n/g,''));
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  async function githubApi(path, options = {}) {
    const token = getToken();
    if (!token) throw new Error('請先到「GitHub 同步設定」輸入 Token。');
    const res = await fetch(`https://api.github.com${path}`, {
      ...options,
      headers: {
        'Accept':'application/vnd.github+json',
        'X-GitHub-Api-Version':'2022-11-28',
        'Authorization':`Bearer ${token}`,
        ...(options.headers || {})
      }
    });
    if (!res.ok) {
      let detail='';
      try { detail=(await res.json()).message || ''; } catch {}
      const err = new Error(`GitHub ${res.status}${detail ? `：${detail}` : ''}`);
      err.status = res.status;
      throw err;
    }
    return res.status === 204 ? null : res.json();
  }

  function requestId() {
    const d = new Date();
    const pad = n => String(n).padStart(2,'0');
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${Math.random().toString(36).slice(2,7)}`;
  }

  async function createAnalysisRequest(wrongAnswers) {
    const id = requestId();
    const payload = {
      schemaVersion: 1,
      id,
      requestedAt: new Date().toISOString(),
      subject: '國一自然',
      unit: '科學方法',
      wrongAnswers
    };
    const path = `analysis-requests/${id}.json`;
    await githubApi(`/repos/${RECORD_REPO}/contents/${path}`, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        message:`Request GPT wrong-answer analysis ${id}`,
        content:utf8ToBase64(JSON.stringify(payload,null,2)),
        branch:'main'
      })
    });
    return id;
  }

  async function fetchAnalysisResult(id) {
    try {
      const data = await githubApi(`/repos/${RECORD_REPO}/contents/analysis-results/${id}.json?ref=main`);
      const text = base64ToUtf8(data.content || '');
      return JSON.parse(text);
    } catch (e) {
      if (e.status === 404) return null;
      throw e;
    }
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function waitForAnalysis(id, statusEl) {
    for (let i=0; i<36; i++) {
      statusEl.textContent = `GPT 正在分析錯題… ${i ? `(${i*5} 秒)` : ''}`;
      const result = await fetchAnalysisResult(id);
      if (result) return result;
      await sleep(5000);
    }
    throw new Error('分析還沒完成。GitHub Actions 可能仍在執行，請稍後再按一次。');
  }

  function renderAnalysis(result, box) {
    if (result.status === 'completed') {
      box.innerHTML = `
        <div style="border:1px solid #bfdbfe;background:#eff6ff;border-radius:14px;padding:14px;margin-top:12px">
          <div style="font-weight:800;margin-bottom:8px">🤖 GPT 學習診斷</div>
          <div style="white-space:pre-wrap;line-height:1.75">${escapeHtml(result.analysis || '')}</div>
          <div class="record-note" style="margin-top:8px">模型：${escapeHtml(result.model || 'OpenAI')}</div>
        </div>`;
    } else {
      box.innerHTML = `<div style="border:1px solid #fed7aa;background:#fff7ed;border-radius:12px;padding:12px;margin-top:12px;color:#9a3412">分析失敗：${escapeHtml(result.error || '未知錯誤')}</div>`;
    }
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  async function runAnalysis(button, status, resultBox) {
    const wrongAnswers = aggregateWrongAnswers();
    if (!wrongAnswers.length) {
      alert('目前沒有錯題可以分析。');
      return;
    }
    if (!getToken()) {
      alert('請先到「GitHub 同步設定」輸入 Token，GPT 分析會透過私人 Exam-Record 執行。');
      return;
    }

    button.disabled = true;
    const oldText = button.textContent;
    button.textContent = '分析中…';
    status.textContent = '正在送出錯題資料…';
    resultBox.innerHTML = '';

    try {
      const id = await createAnalysisRequest(wrongAnswers);
      const result = await waitForAnalysis(id, status);
      status.textContent = result.status === 'completed' ? '分析完成。' : '分析程序完成，但發生錯誤。';
      renderAnalysis(result, resultBox);
    } catch (e) {
      status.textContent = `無法完成分析：${e.message}`;
    } finally {
      button.disabled = false;
      button.textContent = oldText;
    }
  }

  function injectButton() {
    const modal = document.getElementById('wrongModal');
    if (!modal) return;

    const observer = new MutationObserver(() => {
      const content = $('.record-content', modal);
      if (!content || document.getElementById('gptWrongAnalysisBtn')) return;
      if (!aggregateWrongAnswers().length) return;

      const area = document.createElement('div');
      area.id = 'gptAnalysisArea';
      area.style.cssText = 'margin:14px 0;padding:12px;border:1px solid #dbeafe;border-radius:14px;background:#f8fbff';
      area.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <div><b>AI 錯題診斷</b><div class="record-note">讓 GPT 從累積錯題找出共同弱點與複習方向。</div></div>
          <button id="gptWrongAnalysisBtn" class="record-btn" style="border-color:#93c5fd;color:#1d4ed8">🤖 GPT 分析</button>
        </div>
        <div id="gptAnalysisStatus" class="sync-status"></div>
        <div id="gptAnalysisResult"></div>
      `;
      content.insertBefore(area, content.firstChild);
      $('#gptWrongAnalysisBtn').addEventListener('click', () => runAnalysis(
        $('#gptWrongAnalysisBtn'), $('#gptAnalysisStatus'), $('#gptAnalysisResult')
      ));
    });

    observer.observe(modal, {childList:true, subtree:true});
  }

  function init() { injectButton(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
