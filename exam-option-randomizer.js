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
    if (!question || question.fixedOptions || !Array.isArray(question.o) || question.o.length < 2) return;

    const optionImages = Array.isArray(question.optionImages) ? question.optionImages : [];
    const optionImageAlts = Array.isArray(question.optionImageAlts) ? question.optionImageAlts : [];
    const canonicalIndices = Array.isArray(question.optionCanonicalIndices) &&
      question.optionCanonicalIndices.length === question.o.length
      ? [...question.optionCanonicalIndices]
      : question.o.map((_, index) => index);
    const items = question.o.map((text, index) => ({
      text,
      image: optionImages[index] || '',
      imageAlt: optionImageAlts[index] || '',
      canonicalIndex: canonicalIndices[index],
      correct: index === question.a
    }));

    for (let i = items.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [items[i], items[j]] = [items[j], items[i]];
    }

    question.o = items.map(x => x.text);
    question.optionCanonicalIndices = items.map(x => x.canonicalIndex);
    question.a = items.findIndex(x => x.correct);

    if (optionImages.length) {
      question.optionImages = items.map(x => x.image);
    }
    if (optionImageAlts.length) {
      question.optionImageAlts = items.map(x => x.imageAlt);
    }
  }

  function shuffleBank(key) {
    if (typeof banks === 'undefined' || !banks[key]) return;
    const ctx = window.examContexts?.[key];
    if (ctx?.preserveOptionOrder) return;
    banks[key].forEach(shuffleQuestionOptions);
  }

  const originalStartExam = window.startExam;
  if (typeof originalStartExam === 'function') {
    window.startExam = function(selected) {
      shuffleBank(selected);
      return originalStartExam.call(this, selected);
    };
  }
})();