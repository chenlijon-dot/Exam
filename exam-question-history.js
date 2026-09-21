(() => {
  'use strict';

  let aggregate = {};
  let submitted = false;
  let loadToken = 0;
  let activeExamKey = '';

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
    `;
    document.head.appendChild(style);
  }

  document.addEventListener('exam:started', () => {
    activeExamKey = currentExamKey();
    submitted = false;
    aggregate = {};
    clearAnnotations();
    loadAggregateForCurrentExam();
  });

  document.addEventListener('exam:submitted', () => {
    loadToken += 1;
    submitted = true;

    const currentAttempt = latestLocalAttempt();
    if (currentAttempt && String(currentAttempt.examKey || '') === activeExamKey) {
      mergeCurrentAttempt(currentAttempt);
    }

    renderAll();
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
    loadAggregateForCurrentExam,
    resetForRetry
  };
})();
