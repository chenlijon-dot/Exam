(() => {
  'use strict';

  const DEFAULT_ATTEMPT_PATH = 'chapter-bank/science/7-1/unit-01/school-exam-records/2026-unit-01-school-exam-01-attempt.json';

  async function loadAttempt(path = DEFAULT_ATTEMPT_PATH) {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  function validateAttempt(attempt) {
    if (!attempt || typeof attempt !== 'object') throw new Error('紙本考試紀錄格式無效');
    if (attempt.recordOrigin !== 'school-paper') throw new Error('只允許匯入 school-paper 紀錄');
    if (attempt.historyDomain !== 'question') throw new Error('紙本考試必須使用 question historyDomain');
    if (!String(attempt.schoolExamId || '').trim()) throw new Error('缺少 schoolExamId');
    if (!Array.isArray(attempt.answers) || !attempt.answers.length) throw new Error('紙本考試沒有可匯入的答案');
    return attempt;
  }

  async function importAttempt(attempt) {
    validateAttempt(attempt);
    const store = window.ChrisExamHistoryStore;
    if (!store?.importSchoolPaperAttempt) throw new Error('Firebase 紙本匯入服務尚未就緒');
    return store.importSchoolPaperAttempt(attempt);
  }

  async function importCurrentPaper() {
    return importAttempt(await loadAttempt());
  }

  window.SchoolPaperImport = {
    DEFAULT_ATTEMPT_PATH,
    loadAttempt,
    validateAttempt,
    importAttempt,
    importCurrentPaper
  };
})();
