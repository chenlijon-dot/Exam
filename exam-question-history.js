(() => {
  'use strict';

  let aggregate = {};
  let submitted = false;
  let loadToken = 0;
  let activeExamKey = '';
  let recallAttempts = [];
  let recallIndex = -1;
  let recallLoading = false;
  let recallLoadToken = 0;

  function formatActiveHistory(stats) {
    const wrongCount = Number(stats?.wrongCount || 0);
    return wrongCount > 0 ? `錯題 ${wrongCount} 次` : null;
  }

  function formatSubmittedHistory(stats) {
    const answeredCount = Number(stats?.answeredCount || 0);
    if (answeredCount <= 0) return null;

    const wrongCount = Number(stats?.wrongCount || 0);
    const firstLine = wrongCount > 0
      ? `作答 ${answeredCount} 次｜錯題 ${wrongCount} 次`
      : `作答 ${answeredCount} 次`;

    const answer = String(stats?.lastSelectedAnswer || '').trim();
    const resultLabel = stats?.lastResult === 'correct'
      ? '正確'
      : stats?.lastResult === 'incorrect'
        ? '錯誤'
        : '';

    const secondLine = answer && resultLabel
      ? `上次：選 ${answer}｜${resultLabel}`
      : resultLabel
        ? `上次：${resultLabel}`
        : '';

    return secondLine ? [firstLine, secondLine] : [firstLine];
  }

  function buildRecallAttemptView(attempt) {
    const view = {};
    for (const answer of attempt?.answers || []) {
      const questionId = answer?.questionId == null ? '' : String(answer.questionId);
      if (!questionId || (answer.result !== 'correct' && answer.result !== 'incorrect')) continue;

      const displayAnswer = String(
        answer.selectedDisplayLabel || answer.selectedLetter || answer.selectedText || ''
      ).trim();
      const resultLabel = answer.result === 'correct' ? '正確' : '錯誤';
      const label = displayAnswer
        ? `當時：選 ${displayAnswer}｜${resultLabel}`
        : `當時：${resultLabel}`;

      view[questionId] = {
        wrong: answer.result === 'incorrect',
        label
      };
    }
    return view;
  }

  function formatRecallTime(value) {
    if (!value) return '';
    try {
      return new Intl.DateTimeFormat('zh-TW', {
        year:'numeric',
        month:'2-digit',
        day:'2-digit',
        hour:'2-digit',
        minute:'2-digit',
        hour12:false
      }).format(new Date(value));
    } catch {
      return String(value);
    }
  }

  function clearRecallCardState() {
    document.querySelectorAll('.history-wrong').forEach(card => card.classList.remove('history-wrong'));
    document.querySelectorAll('[data-history-answer]').forEach(el => el.remove());
  }

  function clearRecallControls() {
    document.querySelectorAll('[data-question-history-recall-controls]').forEach(el => el.remove());
  }

  function clearRecallButton() {
    document.querySelector('#questionHistoryRecallBtn')?.remove();
  }

  function resetRecallState({ removeButton = true, invalidateLoad = true } = {}) {
    if (invalidateLoad) recallLoadToken += 1;
    recallAttempts = [];
    recallIndex = -1;
    recallLoading = false;
    clearRecallCardState();
    clearRecallControls();
    document.querySelector('#questionHistoryRecallMessage')?.remove();
    if (removeButton) clearRecallButton();
  }

  function sameAttempt(candidate, currentAttempt) {
    if (!candidate || !currentAttempt) return false;
    if (String(candidate.examKey || '') !== String(currentAttempt.examKey || '')) return false;
    const candidateTime = String(candidate.submittedAt || '');
    const currentTime = String(currentAttempt.submittedAt || '');
    return !!candidateTime && candidateTime === currentTime;
  }

  function renderRecallAttempt() {
    clearRecallCardState();
    if (recallIndex < 0 || recallIndex >= recallAttempts.length) return;

    const attempt = recallAttempts[recallIndex];
    const view = buildRecallAttemptView(attempt);

    document.querySelectorAll('.card[data-q]').forEach((card, index) => {
      if (card.dataset.questionType === 'manual-study') return;
      const { source } = cardSource(card, index);
      const questionId = source?.questionId == null ? '' : String(source.questionId);
      const historical = view[questionId];
      if (!historical) return;

      if (historical.wrong) card.classList.add('history-wrong');

      const info = document.createElement('div');
      info.setAttribute('data-history-answer', '1');
      info.className = historical.wrong
        ? 'question-history-answer wrong'
        : 'question-history-answer correct';
      info.textContent = historical.label;

      const annotation = card.querySelector('[data-question-history-annotation]');
      if (annotation) annotation.insertAdjacentElement('afterend', info);
      else card.querySelector('.qtitle')?.insertAdjacentElement('afterend', info);
    });

    updateRecallControls();
  }

  function updateRecallControls() {
    if (recallIndex < 0 || recallIndex >= recallAttempts.length) return;

    const attempt = recallAttempts[recallIndex];
    const time = formatRecallTime(attempt?.submittedAt);
    const label = `第 ${recallIndex + 1} / ${recallAttempts.length} 次${time ? `｜${time}` : ''}`;

    document.querySelectorAll('[data-question-history-recall-controls]').forEach(controls => {
      const position = controls.querySelector('[data-recall-position]');
      const older = controls.querySelector('[data-recall-older]');
      const newer = controls.querySelector('[data-recall-newer]');

      if (position) position.textContent = label;
      if (older) older.disabled = recallIndex >= recallAttempts.length - 1;
      if (newer) newer.disabled = recallIndex <= 0;
    });
  }

  function wireRecallControls(controls) {
    controls.querySelector('[data-recall-older]')?.addEventListener('click', () => {
      if (recallIndex >= recallAttempts.length - 1) return;
      recallIndex += 1;
      renderRecallAttempt();
    });
    controls.querySelector('[data-recall-newer]')?.addEventListener('click', () => {
      if (recallIndex <= 0) return;
      recallIndex -= 1;
      renderRecallAttempt();
    });
  }

  function createRecallControls(id) {
    const controls = document.createElement('div');
    controls.id = id;
    controls.dataset.questionHistoryRecallControls = '1';
    controls.className = 'question-history-recall-controls';
    controls.innerHTML = `
      <button type="button" class="secondary" data-recall-older>前一次</button>
      <span class="question-history-recall-position" data-recall-position></span>
      <button type="button" class="secondary" data-recall-newer>後一次</button>
    `;
    wireRecallControls(controls);
    return controls;
  }

  function ensureRecallControls() {
    let topControls = document.querySelector('#questionHistoryRecallControlsTop');
    if (!topControls) {
      topControls = createRecallControls('questionHistoryRecallControlsTop');
      const quiz = document.querySelector('#quiz');
      if (quiz) quiz.insertAdjacentElement('beforebegin', topControls);
      else document.querySelector('#result')?.insertAdjacentElement('afterend', topControls);
    }

    let bottomControls = document.querySelector('#questionHistoryRecallControls');
    if (!bottomControls) {
      bottomControls = createRecallControls('questionHistoryRecallControls');
      const actions = document.querySelector('#examScreen .actions');
      if (actions) actions.insertAdjacentElement('beforebegin', bottomControls);
      else document.querySelector('#quiz')?.insertAdjacentElement('afterend', bottomControls);
    }

    updateRecallControls();
    return bottomControls;
  }

  function showRecallMessage(message) {
    let el = document.querySelector('#questionHistoryRecallMessage');
    if (!el) {
      el = document.createElement('div');
      el.id = 'questionHistoryRecallMessage';
      el.className = 'question-history-recall-message';
      const result = document.querySelector('#result');
      if (result) result.insertAdjacentElement('afterend', el);
    }
    if (!el) return;
    el.textContent = message;
    clearTimeout(el._historyHideTimer);
    el._historyHideTimer = setTimeout(() => el.remove(), 3000);
  }

  async function enterRecallMode() {
    if (!submitted || recallLoading) return;
    const requestToken = ++recallLoadToken;
    const examKey = currentExamKey();
    const store = historyStore();
    if (!examKey || !store?.loadExamAttempts) {
      showRecallMessage('歷史紀錄目前無法讀取');
      return;
    }

    recallLoading = true;
    const button = document.querySelector('#questionHistoryRecallBtn');
    if (button) {
      button.disabled = true;
      button.textContent = '載入回溯…';
    }

    try {
      const currentAttempt = latestLocalAttempt();
      const attempts = await store.loadExamAttempts(examKey, 50);
      if (requestToken !== recallLoadToken || !submitted) return;
      recallAttempts = (attempts || [])
        .filter(attempt => String(attempt?.examKey || '') === examKey)
        .filter(attempt => !sameAttempt(attempt, currentAttempt));

      if (!recallAttempts.length) {
        resetRecallState({ removeButton:false, invalidateLoad:false });
        showRecallMessage('沒有更早的作答紀錄');
        return;
      }

      recallIndex = 0;
      ensureRecallControls();
      renderRecallAttempt();
    } catch (error) {
      console.warn('[QuestionHistory] same-exam recall failed', error);
      showRecallMessage('歷史紀錄目前無法讀取');
    } finally {
      if (requestToken !== recallLoadToken) return;
      recallLoading = false;
      const currentButton = document.querySelector('#questionHistoryRecallBtn');
      if (currentButton) {
        currentButton.disabled = false;
        currentButton.textContent = '回溯';
      }
    }
  }

  function ensureRecallButton() {
    if (!submitted || !activeExamKey) return null;
    let button = document.querySelector('#questionHistoryRecallBtn');
    if (button) return button;

    const actions = document.querySelector('#examScreen .actions');
    if (!actions) return null;

    button = document.createElement('button');
    button.type = 'button';
    button.id = 'questionHistoryRecallBtn';
    button.className = 'secondary question-history-recall-btn';
    button.textContent = '回溯';
    button.addEventListener('click', enterRecallMode);

    const restart = actions.querySelector('#restartBtn');
    if (restart) actions.insertBefore(button, restart);
    else actions.appendChild(button);
    return button;
  }

  function currentQuestions() {
    try {
      return typeof questions !== 'undefined' && Array.isArray(questions) ? questions : [];
    } catch {
      return [];
    }
  }

  function currentExamKey() {
    return String(window.examContextCurrent?.key || window.examContextCurrent?.difficulty || '');
  }

  function cardSource(card, fallbackIndex) {
    const sourceIndex = Number(card?.dataset?.q ?? fallbackIndex);
    const list = currentQuestions();
    return {
      sourceIndex,
      source: list[sourceIndex] || {}
    };
  }

  function clearAnnotations() {
    document.querySelectorAll('[data-question-history-annotation]').forEach(el => el.remove());
  }

  function ensureAnnotationHost(card) {
    let host = card.querySelector('[data-question-history-annotation]');
    if (host) return host;

    host = document.createElement('div');
    host.dataset.questionHistoryAnnotation = '1';
    host.className = 'question-history-annotation';
    const title = card.querySelector('.qtitle');
    if (title) title.insertAdjacentElement('afterend', host);
    else card.insertAdjacentElement('afterbegin', host);
    return host;
  }

  function renderCard(card, stats) {
    const host = ensureAnnotationHost(card);

    if (!submitted) {
      const text = formatActiveHistory(stats);
      if (!text) {
        host.remove();
        return;
      }
      host.className = 'question-history-annotation active';
      host.textContent = text;
      return;
    }

    const lines = formatSubmittedHistory(stats);
    if (!lines?.length) {
      host.remove();
      return;
    }

    host.className = 'question-history-annotation submitted';
    host.innerHTML = lines.map((line, index) =>
      `<div class="${index === 0 ? 'question-history-summary' : 'question-history-last'}">${escapeHtml(line)}</div>`
    ).join('');
  }

  function renderAll() {
    document.querySelectorAll('.card[data-q]').forEach((card, index) => {
      if (card.dataset.questionType === 'manual-study') return;
      const { source } = cardSource(card, index);
      const questionId = source?.questionId == null ? '' : String(source.questionId);
      if (!questionId) {
        card.querySelector('[data-question-history-annotation]')?.remove();
        return;
      }
      renderCard(card, aggregate[questionId]);
    });
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[ch]));
  }

  function historyStore() {
    return window.ChrisExamHistoryStore || null;
  }

  async function loadAggregateForCurrentExam() {
    const token = ++loadToken;
    const store = historyStore();
    if (!store?.loadRecentQuestionAttempts || !window.ExamQuestionHistoryCore?.aggregateQuestionHistory) {
      return false;
    }

    try {
      const attempts = await store.loadRecentQuestionAttempts(50);
      if (token !== loadToken) return false;
      aggregate = window.ExamQuestionHistoryCore.aggregateQuestionHistory(attempts || []);
      renderAll();
      return true;
    } catch (error) {
      console.warn('[QuestionHistory] history load failed', error);
      return false;
    }
  }

  function latestLocalAttempt() {
    try {
      const records = JSON.parse(localStorage.getItem('examRecords.v1') || '[]');
      if (!Array.isArray(records) || !records.length) return null;
      return records[0] || null;
    } catch {
      return null;
    }
  }

  function mergeCurrentAttempt(attempt) {
    if (!attempt || attempt.historyDomain !== 'question') return;
    if (!window.ExamQuestionHistoryCore?.aggregateQuestionHistory) return;

    const one = window.ExamQuestionHistoryCore.aggregateQuestionHistory([attempt]);
    for (const [questionId, added] of Object.entries(one)) {
      const current = aggregate[questionId] || {
        answeredCount: 0,
        correctCount: 0,
        wrongCount: 0,
        lastAttemptAt: '',
        lastSelectedAnswer: '',
        lastResult: ''
      };

      aggregate[questionId] = {
        answeredCount: Number(current.answeredCount || 0) + Number(added.answeredCount || 0),
        correctCount: Number(current.correctCount || 0) + Number(added.correctCount || 0),
        wrongCount: Number(current.wrongCount || 0) + Number(added.wrongCount || 0),
        lastAttemptAt: added.lastAttemptAt || current.lastAttemptAt || '',
        lastSelectedAnswer: added.lastSelectedAnswer || current.lastSelectedAnswer || '',
        lastResult: added.lastResult || current.lastResult || ''
      };
    }
  }

  function resetForRetry() {
    submitted = false;
    resetRecallState();
    clearAnnotations();
    renderAll();
  }

  function injectStyles() {
    if (document.getElementById('questionHistoryStyles')) return;
    const style = document.createElement('style');
    style.id = 'questionHistoryStyles';
    style.textContent = `
      .question-history-annotation{
        margin:8px 0 2px;
        width:max-content;
        max-width:100%;
        font-size:.84rem;
        line-height:1.45;
      }
      .question-history-annotation.active{
        padding:4px 9px;
        border-radius:999px;
        background:#fef2f2;
        color:#b91c1c;
        font-weight:800;
      }
      .question-history-annotation.submitted{
        padding:7px 10px;
        border-radius:10px;
        background:#f8fafc;
        border:1px solid #e2e8f0;
        color:#334155;
      }
      .question-history-summary{font-weight:800}
      .question-history-last{margin-top:2px;color:#64748b}
      .card.history-wrong{
        border:2px solid #dc2626!important;
        background:#fef2f2!important;
        box-shadow:0 0 0 2px rgba(220,38,38,.08);
      }
      .question-history-answer{
        margin:6px 0 2px;
        padding:6px 9px;
        border-radius:9px;
        font-size:.84rem;
        font-weight:800;
      }
      .question-history-answer.wrong{background:#fee2e2;color:#991b1b}
      .question-history-answer.correct{background:#f0fdf4;color:#166534}
      .question-history-recall-controls{
        display:flex;
        align-items:center;
        justify-content:center;
        gap:10px;
        flex-wrap:wrap;
        margin:12px 0;
        padding:10px;
        border:1px solid #e2e8f0;
        border-radius:12px;
        background:#fff;
      }
      .question-history-recall-position{font-weight:800;color:#334155}
      .question-history-recall-message{
        margin:10px 0;
        padding:9px 12px;
        border-radius:10px;
        background:#f8fafc;
        color:#475569;
        text-align:center;
        font-size:.9rem;
      }
    `;
    document.head.appendChild(style);
  }

  document.addEventListener('exam:started', () => {
    activeExamKey = currentExamKey();
    submitted = false;
    aggregate = {};
    resetRecallState();
    clearAnnotations();
    loadAggregateForCurrentExam();
  });

  document.addEventListener('exam:submitted', () => {
    loadToken += 1;
    submitted = true;
    renderAll();
  });

  document.addEventListener('exam:attempt-recorded', event => {
    const currentAttempt = event.detail?.attempt || null;
    if (!submitted || !currentAttempt) return;
    if (String(currentAttempt.examKey || '') !== activeExamKey) return;

    mergeCurrentAttempt(currentAttempt);
    renderAll();

    if (currentAttempt.historyDomain === 'question') {
      ensureRecallButton();
    }
  });

  window.addEventListener?.('chrisexam-firestore-ready', () => {
    if (!activeExamKey) return;
    loadAggregateForCurrentExam();
  });

  window.addEventListener?.('chrisexam-firestore-synced', () => {
    if (!activeExamKey) return;
    loadAggregateForCurrentExam();
  });

  window.addEventListener?.('chrisexam-auth-ready', () => {
    if (!activeExamKey || submitted) return;
    loadAggregateForCurrentExam();
  });

  injectStyles();

  window.ExamQuestionHistoryUI = {
    formatActiveHistory,
    formatSubmittedHistory,
    buildRecallAttemptView,
    loadAggregateForCurrentExam,
    resetForRetry
  };
})();
