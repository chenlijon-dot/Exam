(() => {
  'use strict';

  function returnToScienceUnit() {
    const shell = document.getElementById('catalogShell');
    const startScreen = document.getElementById('startScreen');
    const examScreen = document.getElementById('examScreen');

    shell?.classList.remove('hidden');
    startScreen?.classList.add('hidden');
    examScreen?.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.addEventListener('click', event => {
    const button = event.target.closest?.('#chapterBackBtn');
    if (!button) return;

    // exam-catalog.js 會先更新 catalogContent 為單元 1，
    // 這裡補上原本遺漏的畫面切換：題庫首頁 -> catalog。
    setTimeout(returnToScienceUnit, 0);
  });
})();
