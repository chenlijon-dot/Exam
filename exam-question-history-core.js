(() => {
  'use strict';

  function qualifiesHistoryAnswer(answer) {
    return !!answer?.questionId &&
      (answer.result === 'correct' || answer.result === 'incorrect');
  }

  function aggregateQuestionHistory(attempts) {
    const ordered = [...(attempts || [])].sort((a, b) =>
      String(a.submittedAt || '').localeCompare(String(b.submittedAt || ''))
    );
    const result = {};

    for (const attempt of ordered) {
      if (attempt?.historyDomain !== 'question') continue;
      for (const answer of attempt.answers || []) {
        if (!qualifiesHistoryAnswer(answer)) continue;
        const id = String(answer.questionId);
        const current = result[id] || {
          answeredCount: 0,
          correctCount: 0,
          wrongCount: 0,
          lastAttemptAt: '',
          lastSelectedAnswer: '',
          lastResult: ''
        };
        current.answeredCount += 1;
        if (answer.result === 'correct') current.correctCount += 1;
        else current.wrongCount += 1;
        current.lastAttemptAt = String(attempt.submittedAt || '');
        current.lastSelectedAnswer = answer.selectedDisplayLabel || answer.selectedLetter || answer.selectedText || '';
        current.lastResult = answer.result;
        result[id] = current;
      }
    }

    return result;
  }

  window.ExamQuestionHistoryCore = {
    qualifiesHistoryAnswer,
    aggregateQuestionHistory
  };
})();
