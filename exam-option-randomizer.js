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

  function difficultyKey(button) {
    if (button.classList.contains('easy')) return 'easy';
    if (button.classList.contains('medium')) return 'medium';
    if (button.classList.contains('hard')) return 'hard';
    return null;
  }

  document.addEventListener('click', event => {
    const difficultyButton = event.target.closest?.('.difficulty');
    if (difficultyButton) {
      const key = difficultyKey(difficultyButton);
      if (key) shuffleBank(key);
      return;
    }

    const restartButton = event.target.closest?.('#restartBtn');
    if (!restartButton) return;

    const originalConfirm = window.confirm;
    window.confirm = message => {
      const ok = originalConfirm.call(window, message);
      if (ok && typeof level !== 'undefined') {
        shuffleBank(level);
        if (typeof questions !== 'undefined' && typeof banks !== 'undefined') {
          questions = banks[level];
        }
      }
      return ok;
    };

    queueMicrotask(() => {
      window.confirm = originalConfirm;
    });
  }, true);
})();
