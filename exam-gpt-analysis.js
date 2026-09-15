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
      schemaVersion: 2,
      id,
      requestedAt: new Date().toISOString(),
      subject: '國一自然',
      semester: '七年級上學期',
      unitGroup: '單元 1 生命現象與科學探究',
      section: '1-2',
      unit: '1-2 科學方法',
      curriculumKey: 'science-method',
      wrongAnswers
    };
    const path = `analysis-requests/${id}.json`;
    await githubApi(`/repos/${RECORD_REPO}/contents/${path}`, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        message:`Request Gemini wrong-answer analysis ${id}`,
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
      statusEl.textContent = `Gemini 正在分析錯題… ${i ? `(${i*5} 秒)` : ''}`;
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
          <div style="font-weight:800;margin-bottom:8px">🤖 AI 學習診斷</div>
          <div style="white-space:pre-wrap;line-height:1.75">${escapeHtml(result.analysis || '')}</div>
          <div class="record-note" style="margin-top:8px">模型：${escapeHtml(result.model || 'Gemini')}</div>
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
      alert('請先到「GitHub 同步設定」輸入 Token，AI 分析會透過私人 Exam-Record 執行。');
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
          <div><b>AI 錯題診斷</b><div class="record-note">讓 Gemini 依自然七上 1-2「科學方法」教材基準分析累積錯題。</div></div>
          <button id="gptWrongAnalysisBtn" class="record-btn" style="border-color:#93c5fd;color:#1d4ed8">🤖 AI 分析</button>
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

  // ---------------- English GEPT AI translation analysis ----------------

  const englishInFlight = new Map();

  function currentEnglishBank() {
    const ctx = window.examContextCurrent || {};
    if (ctx.examType !== 'gept-elementary-reading') return null;
    const key = ctx.key || ctx.difficulty;
    const bank = typeof banks !== 'undefined' ? banks[key] : null;
    return Array.isArray(bank) ? bank : null;
  }

  function findSharedPassage(question, bank) {
    if (!question?.groupId || !Array.isArray(bank)) return '';
    return bank.find(q => q.groupId === question.groupId && q.intro)?.intro || '';
  }

  async function createEnglishAnalysisRequest(payload) {
    const id = requestId();
    const body = {
      schemaVersion: 1,
      id,
      requestedAt: new Date().toISOString(),
      subject: '英文',
      examType: 'GEPT elementary reading',
      ...payload
    };
    await githubApi(`/repos/${RECORD_REPO}/contents/english-analysis-requests/${id}.json`, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        message:`Request Gemini English translation analysis ${id}`,
        content:utf8ToBase64(JSON.stringify(body,null,2)),
        branch:'main'
      })
    });
    return id;
  }

  async function fetchEnglishAnalysisResult(id) {
    try {
      const data = await githubApi(`/repos/${RECORD_REPO}/contents/english-analysis-results/${id}.json?ref=main`);
      const text = base64ToUtf8(data.content || '');
      return JSON.parse(text);
    } catch (e) {
      if (e.status === 404) return null;
      throw e;
    }
  }

  async function waitForEnglishAnalysis(id, statusEl) {
    const maxPolls = 40;
    for (let i=0; i<maxPolls; i++) {
      if (statusEl) statusEl.textContent = `Gemini 正在翻譯分析…${i ? ` ${i * 3} 秒` : ''}`;
      const result = await fetchEnglishAnalysisResult(id);
      if (result) return result;
      await sleep(3000);
    }
    throw new Error('AI 分析尚未完成。已停止自動查詢，請稍後再按一次，避免持續輪詢。');
  }

  function englishPayloadKey(payload) {
    const text = JSON.stringify(payload);
    let h = 2166136261;
    for (let i=0; i<text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return `en-${(h >>> 0).toString(16)}`;
  }

  function injectEnglishStyles() {
    if ($('#englishAiStyles')) return;
    const style = document.createElement('style');
    style.id = 'englishAiStyles';
    style.textContent = `
      .english-ai-btn{margin-top:10px;border:1px solid #c4b5fd;background:#f5f3ff;color:#6d28d9;border-radius:999px;padding:7px 11px;font-size:.82rem;font-weight:800;cursor:pointer}
      .english-ai-btn:hover{background:#ede9fe}.english-ai-btn:disabled{opacity:.6;cursor:wait}
      .english-ai-passage-btn{border:1px solid #c4b5fd;background:#f5f3ff;color:#6d28d9;border-radius:999px;padding:6px 10px;font-size:.78rem;font-weight:800;cursor:pointer;white-space:nowrap}
      #englishAiModal{position:fixed;inset:0;z-index:10020;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;padding:18px}
      #englishAiModal.hidden{display:none}
      .english-ai-dialog{width:min(720px,calc(100% - 24px));height:min(50vh,520px);max-height:50vh;background:#fff;border-radius:18px;box-shadow:0 24px 70px rgba(15,23,42,.34);display:flex;flex-direction:column;overflow:hidden;will-change:transform}
      .english-ai-head{display:flex;align-items:center;gap:10px;padding:13px 16px;border-bottom:1px solid #e2e8f0;background:#fafafa;cursor:grab;user-select:none;touch-action:none}
      .english-ai-head.dragging{cursor:grabbing}.english-ai-title{font-weight:850;color:#5b21b6;flex:1;pointer-events:none}
      .english-ai-close{border:0;background:#e2e8f0;color:#334155;border-radius:999px;width:34px;height:34px;font-size:20px;cursor:pointer}
      .english-ai-body{flex:1;min-height:0;padding:18px 20px;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-gutter:stable;line-height:1.8;color:#1f2937}
      .english-ai-status{color:#64748b;font-size:.9rem;margin-bottom:10px}.english-ai-result{white-space:pre-wrap}
      @media(max-width:620px){.english-ai-dialog{width:calc(100% - 16px);height:52vh;max-height:52vh}.english-ai-body{padding:15px 16px}.english-ai-passage-btn{font-size:.72rem;padding:5px 8px}}
    `;
    document.head.appendChild(style);
  }

  function makeEnglishAiDraggable(modal) {
    const dialog = $('.english-ai-dialog', modal);
    const head = $('.english-ai-head', modal);
    if (!dialog || !head || head.dataset.dragReady === '1') return;
    head.dataset.dragReady = '1';
    let pointerId = null, startX = 0, startY = 0, baseX = 0, baseY = 0, x = 0, y = 0;

    const apply = () => { dialog.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`; };
    const clamp = (nx, ny) => {
      const r = dialog.getBoundingClientRect();
      const dx = nx - x, dy = ny - y, m = 8;
      if (r.left + dx < m) nx += m - (r.left + dx);
      if (r.right + dx > innerWidth - m) nx -= (r.right + dx) - (innerWidth - m);
      if (r.top + dy < m) ny += m - (r.top + dy);
      if (r.bottom + dy > innerHeight - m) ny -= (r.bottom + dy) - (innerHeight - m);
      return {x:nx,y:ny};
    };
    head.addEventListener('pointerdown', e => {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target.closest('.english-ai-close')) return;
      pointerId=e.pointerId; startX=e.clientX; startY=e.clientY; baseX=x; baseY=y;
      head.classList.add('dragging'); head.setPointerCapture?.(pointerId); e.preventDefault();
    });
    head.addEventListener('pointermove', e => {
      if (pointerId===null || e.pointerId!==pointerId) return;
      const p=clamp(baseX+e.clientX-startX,baseY+e.clientY-startY); x=p.x; y=p.y; apply(); e.preventDefault();
    });
    const end = e => {
      if (pointerId===null || (e?.pointerId!==undefined && e.pointerId!==pointerId)) return;
      try { head.releasePointerCapture?.(pointerId); } catch {}
      pointerId=null; head.classList.remove('dragging');
    };
    head.addEventListener('pointerup',end); head.addEventListener('pointercancel',end); head.addEventListener('lostpointercapture',end);
    modal.resetEnglishAiPosition = () => { pointerId=null; x=0; y=0; head.classList.remove('dragging'); apply(); };
  }

  function ensureEnglishAiModal() {
    let modal = $('#englishAiModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'englishAiModal';
    modal.className = 'hidden';
    modal.setAttribute('aria-hidden','true');
    modal.innerHTML = `
      <div class="english-ai-dialog" role="dialog" aria-modal="true" aria-labelledby="englishAiTitle">
        <div class="english-ai-head" title="可用滑鼠或觸控拖曳移動">
          <div class="english-ai-title" id="englishAiTitle">🤖 AI 翻譯分析</div>
          <button type="button" class="english-ai-close" aria-label="關閉 AI 翻譯分析">×</button>
        </div>
        <div class="english-ai-body">
          <div class="english-ai-status" id="englishAiStatus"></div>
          <div class="english-ai-result" id="englishAiResult"></div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    makeEnglishAiDraggable(modal);
    const close = () => {
      modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true');
      modal.resetEnglishAiPosition?.();
    };
    $('.english-ai-close',modal)?.addEventListener('click',close);
    modal.addEventListener('click',e=>{if(e.target===modal)close();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.classList.contains('hidden'))close();});
    return modal;
  }

  async function runEnglishAnalysis(payload, title, triggerButton) {
    if (!getToken()) {
      alert('請先到「GitHub 同步設定」輸入 Token。英文 AI 翻譯分析會沿用目前的私人 Exam-Record + Gemini 流程。');
      return;
    }

    const modal = ensureEnglishAiModal();
    modal.resetEnglishAiPosition?.();
    $('#englishAiTitle',modal).textContent = title || '🤖 AI 翻譯分析';
    const status = $('#englishAiStatus',modal);
    const resultBox = $('#englishAiResult',modal);
    modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false');
    status.textContent = '準備送出翻譯分析…';
    resultBox.textContent = '';

    const key = englishPayloadKey(payload);
    if (triggerButton) triggerButton.disabled = true;

    try {
      let task = englishInFlight.get(key);
      if (!task) {
        task = (async () => {
          const id = await createEnglishAnalysisRequest(payload);
          return waitForEnglishAnalysis(id,status);
        })();
        englishInFlight.set(key,task);
        task.finally(() => englishInFlight.delete(key));
      } else {
        status.textContent = '同一內容已在分析中，沿用原本請求，不重複送出。';
      }

      const result = await task;
      if (result.status === 'completed') {
        status.textContent = `分析完成｜${result.model || 'Gemini'}`;
        resultBox.textContent = result.analysis || '';
      } else {
        status.textContent = '分析失敗';
        resultBox.textContent = result.error || '未知錯誤';
      }
    } catch (e) {
      status.textContent = '無法完成分析';
      resultBox.textContent = e.message;
    } finally {
      if (triggerButton) triggerButton.disabled = false;
    }
  }

  function decorateEnglishQuestionAnalysis() {
    const bank = currentEnglishBank();
    if (!bank) return;
    bank.forEach((q,index) => {
      const number = q.number || index+1;
      const card = document.querySelector(`#quiz .card[data-question-number="${number}"]`);
      const explain = card?.querySelector('.explain');
      if (!explain || explain.querySelector('.english-ai-btn')) return;
      const btn = document.createElement('button');
      btn.type='button'; btn.className='english-ai-btn'; btn.textContent='🤖 AI 協助翻譯分析';
      btn.addEventListener('click', () => {
        const letters=['A','B','C','D','E','F'];
        const correct = Array.isArray(q.o) && Number.isInteger(q.a) ? `${letters[q.a] || ''}. ${q.o[q.a] || ''}` : '';
        runEnglishAnalysis({
          mode:'question',
          questionNumber:number,
          question:q.q || '',
          options:q.o || [],
          correctAnswer:correct,
          localExplanation:q.e || '',
          passage:findSharedPassage(q,bank)
        }, `🤖 第 ${number} 題｜翻譯與用字分析`, btn);
      });
      explain.appendChild(document.createElement('br'));
      explain.appendChild(btn);
    });
  }

  function decoratePassageAiButton() {
    const modal = $('#geptPassageModal');
    const head = $('.gept-passage-head',modal);
    if (!modal || !head || head.querySelector('.english-ai-passage-btn')) return;
    const close = $('.gept-passage-close',head);
    const btn = document.createElement('button');
    btn.type='button'; btn.className='english-ai-passage-btn'; btn.textContent='🤖 AI 翻譯分析';
    btn.addEventListener('pointerdown',e=>e.stopPropagation());
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      const passage=$('#geptPassageBody',modal)?.textContent || '';
      const title=$('#geptPassageTitle',modal)?.textContent || '題組內容';
      if (!passage.trim()) return;
      runEnglishAnalysis({mode:'passage',passage},`🤖 ${title}｜全文翻譯分析`,btn);
    });
    head.insertBefore(btn,close || null);
  }

  function initEnglishAnalysis() {
    injectEnglishStyles();
    ensureEnglishAiModal();
    const quiz = $('#quiz');
    if (quiz) {
      const observer = new MutationObserver(() => {
        const ctx=window.examContextCurrent || {};
        if (ctx.examType==='gept-elementary-reading') requestAnimationFrame(decorateEnglishQuestionAnalysis);
      });
      observer.observe(quiz,{childList:true,subtree:true});
    }
    const bodyObserver = new MutationObserver(() => decoratePassageAiButton());
    bodyObserver.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('exam:started',e=>{
      if (e.detail?.examType!=='gept-elementary-reading') return;
      requestAnimationFrame(()=>{decorateEnglishQuestionAnalysis();decoratePassageAiButton();});
    });
  }

  function init() { injectButton(); initEnglishAnalysis(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();