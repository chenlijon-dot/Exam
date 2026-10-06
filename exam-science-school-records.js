(() => {
  'use strict';

  const BANK_PATH = 'chapter-bank/science/7-1/unit-01/school-exam-records/2026-unit-01-school-exam-01.json';
  const ATTEMPT_PATH = 'chapter-bank/science/7-1/unit-01/school-exam-records/2026-unit-01-school-exam-01-attempt.json';
  const EXAM_KEY = 'science-7-1-u01-school-exam-01';
  const SCHOOL_EXAM_ID = 'science-7-1-u01-school-paper-20261006-01';
  const SECTION_KEY = 'science-7-1-u01-school-records';

  const $ = (sel, root = document) => root.querySelector(sel);
  let unitViewFragment = null;
  let savedHeaderTitle = '';
  let savedHeaderSub = '';
  let savedDocumentTitle = '';
  let bankCache = null;
  let attemptCache = null;

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  function showCatalog() {
    $('#catalogShell')?.classList.remove('hidden');
    $('#startScreen')?.classList.add('hidden');
    $('#examScreen')?.classList.add('hidden');
    const result = $('#result');
    if (result) result.style.display = 'none';
    window.scrollTo({ top:0, behavior:'smooth' });
  }

  function saveUnitView() {
    const content = $('#catalogContent');
    if (!content || unitViewFragment) return;
    unitViewFragment = document.createDocumentFragment();
    while (content.firstChild) unitViewFragment.appendChild(content.firstChild);
    savedHeaderTitle = $('#catalogHeaderTitle')?.textContent || '自然一上｜單元 1';
    savedHeaderSub = $('#catalogHeaderSub')?.textContent || '生命現象與科學探究';
    savedDocumentTitle = document.title;
  }

  function restoreUnitView() {
    const content = $('#catalogContent');
    if (!content || !unitViewFragment) return;
    content.replaceChildren();
    content.appendChild(unitViewFragment);
    unitViewFragment = null;
    if ($('#catalogHeaderTitle')) $('#catalogHeaderTitle').textContent = savedHeaderTitle;
    if ($('#catalogHeaderSub')) $('#catalogHeaderSub').textContent = savedHeaderSub;
    document.title = savedDocumentTitle || '單元 1 生命現象與科學探究｜自然一上';
    showCatalog();
  }

  async function fetchJson(path) {
    const response = await fetch(path, { cache:'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function loadBank() {
    if (!bankCache) bankCache = await fetchJson(BANK_PATH);
    return bankCache;
  }

  async function loadAttempt() {
    if (!attemptCache) attemptCache = await fetchJson(ATTEMPT_PATH);
    return attemptCache;
  }

  function setCatalogHeader(title, sub) {
    if ($('#catalogHeaderTitle')) $('#catalogHeaderTitle').textContent = title;
    if ($('#catalogHeaderSub')) $('#catalogHeaderSub').textContent = sub;
  }

  function injectStyles() {
    if ($('#schoolPaperRecordStyles')) return;
    const style = document.createElement('style');
    style.id = 'schoolPaperRecordStyles';
    style.textContent = `
      .school-paper-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}
      .school-paper-stat{border:1px solid #dfe5ee;border-radius:12px;padding:10px;background:#f8fafc;text-align:center}
      .school-paper-stat b{display:block;font-size:1.25rem;color:#1d4ed8}
      .school-paper-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
      .school-paper-action{border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;border-radius:11px;padding:10px 14px;font-weight:800;cursor:pointer}
      .school-paper-action.secondary{border-color:#cbd5e1;background:#fff;color:#334155}
      .school-paper-review-card{border:1px solid #dfe5ee;border-radius:14px;padding:14px;margin:12px 0;background:#fff}
      .school-paper-review-card.history-wrong{border:2px solid #dc2626;background:#fef2f2}
      .school-paper-option{padding:6px 9px;margin:4px 0;border-radius:9px;background:#f8fafc}
      .school-paper-option.correct{background:#dcfce7;color:#166534;font-weight:800}
      .school-paper-option.selected-wrong{background:#fee2e2;color:#991b1b;font-weight:800}
      .school-paper-history{margin-top:8px;font-size:.86rem;color:#64748b}
      .school-paper-result{font-weight:800;margin:8px 0}
      .school-paper-review-image{max-width:min(100%,720px);max-height:430px;object-fit:contain;border-radius:10px;border:1px solid #e2e8f0;margin:8px auto;display:block}
      @media(max-width:650px){.school-paper-summary{grid-template-columns:repeat(2,1fr)}}
    `;
    document.head.appendChild(style);
  }

  async function setImportButtonStatus(button) {
    if (!button) return;
    if (!window.ChrisExamAuth?.authorized) {
      button.textContent = '登入後可匯入學習歷程';
      button.disabled = true;
      return;
    }
    button.disabled = false;
    button.textContent = '匯入我的學習歷程';
  }

  async function handleImport(button) {
    const old = button.textContent;
    button.disabled = true;
    button.textContent = '匯入中…';
    try {
      const attempt = await loadAttempt();
      const result = await window.SchoolPaperImport?.importAttempt?.(attempt);
      if (!result) throw new Error('紙本匯入模組尚未就緒');
      if (result.status === 'already-imported') button.textContent = '✓ 已匯入，不重複計數';
      else if (result.status === 'imported') button.textContent = '✓ 已匯入學習歷程';
      else throw new Error(result.message || result.status || '匯入失敗');
    } catch (error) {
      button.disabled = false;
      button.textContent = old;
      alert(`紙本考試匯入失敗：${error.message}`);
    }
  }

  async function showRecordList({ preserveUnit = false } = {}) {
    if (!preserveUnit) saveUnitView();
    injectStyles();
    setCatalogHeader('自然一上｜單元 1', '學校考試紀錄');
    document.title = '學校考試紀錄｜自然一上單元 1';
    const content = $('#catalogContent');
    if (!content) return;
    content.innerHTML = `
      <button class="catalog-back" id="schoolPaperBackUnitBtn">← 返回單元 1</button>
      <div class="catalog-path">自然　›　七年級上學期（一上）　›　單元 1　›　學校考試紀錄</div>
      <h2 class="catalog-title">🏫 學校考試紀錄</h2>
      <p class="catalog-sub">真實紙本考試會納入既有 questionId 回溯；查看舊考卷不會新增作答次數。</p>
      <div class="catalog-grid">
        <div class="catalog-card chapter-card" style="cursor:default">
          <span class="top"><strong>七年級第一學期第一單元</strong><span class="catalog-badge school">73 / 100</span></span>
          <div class="school-paper-summary">
            <div class="school-paper-stat"><b>30</b>題</div>
            <div class="school-paper-stat"><b>22</b>答對</div>
            <div class="school-paper-stat"><b>8</b>答錯</div>
            <div class="school-paper-stat"><b>73%</b>正確率</div>
          </div>
          <div class="school-paper-actions">
            <button type="button" class="school-paper-action" id="schoolPaperReviewBtn">查看考卷</button>
            <button type="button" class="school-paper-action secondary" id="schoolPaperImportBtn">匯入我的學習歷程</button>
          </div>
        </div>
      </div>`;
    $('#schoolPaperBackUnitBtn')?.addEventListener('click', restoreUnitView);
    $('#schoolPaperReviewBtn')?.addEventListener('click', showReview);
    const importBtn = $('#schoolPaperImportBtn');
    importBtn?.addEventListener('click', () => handleImport(importBtn));
    setImportButtonStatus(importBtn);
    showCatalog();
  }

  async function loadAggregate() {
    const store = window.ChrisExamHistoryStore;
    const core = window.ExamQuestionHistoryCore;
    if (!store?.loadRecentQuestionAttempts || !core?.aggregateQuestionHistory) return {};
    try {
      return core.aggregateQuestionHistory(await store.loadRecentQuestionAttempts(50));
    } catch (error) {
      console.warn('[SchoolPaperRecords] history unavailable', error);
      return {};
    }
  }

  function historyText(stats) {
    if (!stats?.answeredCount) return '尚未匯入／沒有其他作答紀錄';
    const parts = [`作答 ${stats.answeredCount} 次`];
    if (stats.wrongCount) parts.push(`錯題 ${stats.wrongCount} 次`);
    if (stats.lastResult) parts.push(`上次：${stats.lastResult === 'correct' ? '正確' : '錯誤'}`);
    return parts.join('｜');
  }

  async function showReview() {
    injectStyles();
    setCatalogHeader('自然一上｜單元 1', '學校考試紀錄｜考卷回顧');
    document.title = '七年級第一學期第一單元｜考卷回顧';
    const content = $('#catalogContent');
    if (!content) return;
    content.innerHTML = '<div class="catalog-sub">正在載入紙本考卷…</div>';
    try {
      const [bank, attempt, aggregate] = await Promise.all([loadBank(), loadAttempt(), loadAggregate()]);
      const answerMap = new Map((attempt.answers || []).map(a => [String(a.questionId), a]));
      const cards = (bank.questions || []).map(q => {
        const a = answerMap.get(String(q.questionId));
        const wrong = a?.result === 'incorrect';
        const options = (q.o || []).map((option, index) => {
          const classes = ['school-paper-option'];
          if (index === Number(a?.correctCanonicalIndex)) classes.push('correct');
          if (wrong && index === Number(a?.selectedCanonicalIndex)) classes.push('selected-wrong');
          return `<div class="${classes.join(' ')}">${String.fromCharCode(65 + index)}. ${esc(option)}</div>`;
        }).join('');
        return `<section class="school-paper-review-card${wrong ? ' history-wrong' : ''}" data-question-id="${esc(q.questionId)}">
          <div><b>${esc(q.originalLabel)}</b>　${esc(q.q)}</div>
          ${q.intro ? `<div class="record-note" style="margin-top:8px">${esc(q.intro)}</div>` : ''}
          ${q.image ? `<img class="school-paper-review-image" src="${esc(q.image)}" alt="${esc(q.imageAlt || '題目附圖')}">` : ''}
          <div style="margin-top:8px">${options}</div>
          <div class="school-paper-result">${wrong ? `❌ 當時作答：${esc(a?.selectedDisplayLabel || '')}　✅ 正確答案：${esc(a?.correctLetter || '')}` : `✅ 當時作答：${esc(a?.selectedDisplayLabel || '')}`}</div>
          <div class="record-note">${esc(q.e || '')}</div>
          <div class="school-paper-history">${esc(historyText(aggregate[String(q.questionId)]))}</div>
        </section>`;
      }).join('');
      content.innerHTML = `
        <button class="catalog-back" id="schoolPaperBackListBtn">← 返回學校考試紀錄</button>
        <div class="catalog-path">自然　›　單元 1　›　學校考試紀錄　›　七年級第一學期第一單元</div>
        <h2 class="catalog-title">七年級第一學期第一單元｜73 / 100</h2>
        <p class="catalog-sub">紅框為這次紙本考試答錯題；本頁為只讀回顧，不會建立新的 attempt。</p>
        <div class="school-paper-actions"><button type="button" class="school-paper-action" id="schoolPaperRetryBtn">重新挑戰這份考卷</button></div>
        ${cards}`;
      $('#schoolPaperBackListBtn')?.addEventListener('click', () => showRecordList({ preserveUnit:true }));
      $('#schoolPaperRetryBtn')?.addEventListener('click', retryPaperExam);
      showCatalog();
    } catch (error) {
      content.innerHTML = `<button class="catalog-back" id="schoolPaperBackListBtn">← 返回學校考試紀錄</button><div class="catalog-sub">考卷載入失敗：${esc(error.message)}</div>`;
      $('#schoolPaperBackListBtn')?.addEventListener('click', () => showRecordList({ preserveUnit:true }));
    }
  }

  async function retryPaperExam() {
    const bank = await loadBank();
    if (typeof banks === 'undefined' || typeof startExam !== 'function') {
      alert('題庫引擎尚未就緒，請重新整理後再試。');
      return;
    }
    banks[EXAM_KEY] = bank.questions || [];
    window.examContexts = window.examContexts || {};
    window.examContexts[EXAM_KEY] = {
      ...(bank.exam || {}),
      key: EXAM_KEY,
      difficulty: EXAM_KEY,
      difficultyLabel: '學校考試重做',
      title: '七年級第一學期第一單元｜重新挑戰',
      subtitle: '自然七上｜單元 1 生命現象與科學探究｜學校紙本考卷重做',
      subject:'science', subjectLabel:'自然', semester:'7-1', semesterLabel:'七年級上學期',
      unitGroup:'unit-01', unitGroupLabel:'單元 1 生命現象與科學探究', unit:'單元 1 生命現象與科學探究',
      examType:true, scoreMode:'percent', analysisEligible:true, preserveOptionOrder:true,
      recordOrigin:'web', schoolExamId:SCHOOL_EXAM_ID,
      backLabel:'返回學校考試紀錄',
      onBack:() => showRecordList({ preserveUnit:true })
    };
    startExam(EXAM_KEY);
  }

  document.addEventListener('click', event => {
    const section = event.target.closest?.(`[data-science-section="${SECTION_KEY}"]`);
    if (!section) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showRecordList();
  }, true);

  window.addEventListener('chrisexam-auth-ready', () => setImportButtonStatus($('#schoolPaperImportBtn')));
  window.addEventListener('chrisexam-auth-changed', () => setImportButtonStatus($('#schoolPaperImportBtn')));

  window.ScienceSchoolRecords = { showRecordList, showReview, retryPaperExam };
})();
