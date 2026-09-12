(() => {
  'use strict';

  function randomInt(maxExclusive) {
    if (maxExclusive <= 1) return 0;
    if (window.crypto && crypto.getRandomValues) {
      const range = 0x100000000;
      const limit = range - (range % maxExclusive);
      const buf = new Uint32Array(1);
      do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
      return buf[0] % maxExclusive;
    }
    return Math.floor(Math.random() * maxExclusive);
  }

  function shuffleQuestionOptions(question) {
    if (!question || !Array.isArray(question.o) || question.o.length < 2) return;

    const items = question.o.map((text, index) => ({
      text,
      correct: index === question.a
    }));

    for (let i = items.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [items[i], items[j]] = [items[j], items[i]];
    }

    question.o = items.map(x => x.text);
    question.a = items.findIndex(x => x.correct);
  }

  function shuffleBank(key) {
    if (typeof banks === 'undefined' || !banks[key]) return;
    banks[key].forEach(shuffleQuestionOptions);
  }

  const originalStartExam = window.startExam;
  if (typeof originalStartExam === 'function') {
    window.startExam = function(selected) {
      shuffleBank(selected);
      return originalStartExam.call(this, selected);
    };
  }

  const originalRestart = window.restart;
  if (typeof originalRestart === 'function') {
    window.restart = function() {
      if (!confirm('確定要清除目前答案，重新作答嗎？')) return;
      if (typeof level !== 'undefined') {
        shuffleBank(level);
        if (typeof questions !== 'undefined' && typeof banks !== 'undefined') {
          questions = banks[level];
        }
      }
      graded = false;
      render();
      result.style.display = 'none';
      document.getElementById('explainBtn').textContent = '顯示詳解';
      window.scrollTo({top:0,behavior:'smooth'});
    };

    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
      restartBtn.replaceWith(restartBtn.cloneNode(true));
      document.getElementById('restartBtn').addEventListener('click', window.restart);
    }
  }
})();
