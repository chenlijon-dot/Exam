(() => {
  'use strict';

  const BANK_PATH = 'chapter-bank/chinese/7-1/lesson-01/school-exams.json';
  const BUTTON_ID = 'chineseLesson01SchoolBankBtn';
  const SCHOOL_BANK_DESC = '由各校真實段考拆題；支援原始題型、閱讀題組、圖片與紙筆練習。';
  const $ = (sel, root = document) => root.querySelector(sel);

  function resetSchoolBankButton() {
    const btn = $(`#${BUTTON_ID}`);
    if (!btn) return;
    btn.disabled = false;
    const desc = btn.querySelector('.desc');
    if (desc) desc.textContent = SCHOOL_BANK_DESC;
  }

  async function openLesson01SchoolBank() {
    const btn = $(`#${BUTTON_ID}`);
    if (btn) {
      btn.disabled = true;
      const desc = btn.querySelector('.desc');
      if (desc) desc.textContent = '正在載入各校〈夏夜〉真題…';
    }

    try {
      const res = await fetch(BANK_PATH, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const key = data.exam.difficulty;

      if (typeof banks === 'undefined' || typeof startExam !== 'function') {
        throw new Error('題庫引擎尚未就緒');
      }

      banks[key] = data.questions;
      window.examContexts = window.examContexts || {};
      window.examContexts[key] = {
        ...data.exam,
        key,
        examType: true,
        backLabel: '返回第一課題庫',
        onBack: () => {
          document.querySelector('#examScreen')?.classList.add('hidden');
          document.querySelector('#startScreen')?.classList.add('hidden');
          document.querySelector('#catalogShell')?.classList.remove('hidden');
          document.querySelector('#result')?.style && (document.querySelector('#result').style.display = 'none');
          resetSchoolBankButton();
          interceptSchoolBankButton();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      };

      // 載入成功後立即恢復按鈕狀態。catalog 在考試期間雖然隱藏，
      // 但返回同一個 DOM 時不能留下 disabled，否則無法再次進入各校題庫。
      resetSchoolBankButton();
      startExam(key);
    } catch (error) {
      alert(`各校題庫載入失敗：${error.message}`);
      resetSchoolBankButton();
    }
  }

  function interceptSchoolBankButton() {
    const btn = $(`#${BUTTON_ID}`);
    if (!btn || btn.dataset.directSchoolBank === '1') return;
    btn.dataset.directSchoolBank = '1';

    // exam-catalog.js 原本會開啟學校清單；以 capture phase 攔截，改為直接進入混合真題。
    btn.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      openLesson01SchoolBank();
    }, true);
  }

  function init() {
    const target = $('#catalogContent') || document.body;
    const observer = new MutationObserver(interceptSchoolBankButton);
    observer.observe(target, { childList: true, subtree: true });
    interceptSchoolBankButton();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();