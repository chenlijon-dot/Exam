(() => {
  'use strict';

  const SCIENCE_SCHOOL_BANK_PATH = 'chapter-bank/science/7-1/unit-01/section-02/school-exams.json';

  function returnToScienceUnit() {
    const shell = document.getElementById('catalogShell');
    const startScreen = document.getElementById('startScreen');
    const examScreen = document.getElementById('examScreen');

    shell?.classList.remove('hidden');
    startScreen?.classList.add('hidden');
    examScreen?.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function openScienceSchoolBank(button) {
    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = '🏫 載入各校題庫…';

    try {
      const res = await fetch(SCIENCE_SCHOOL_BANK_PATH, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const questions = Array.isArray(data.questions) ? data.questions : [];

      if (!questions.length) {
        alert('1-2 科學方法的「各校題庫」入口已建立，目前尚未匯入各校段考題。之後整理完題目卷與答案卷，就會直接放進這裡。');
        return;
      }

      if (typeof banks === 'undefined' || typeof startExam !== 'function') {
        throw new Error('題庫引擎尚未就緒');
      }

      const key = data.exam?.difficulty || 'science-7-1-u01-s02-school';
      banks[key] = questions;
      window.examContexts = window.examContexts || {};
      window.examContexts[key] = {
        ...(data.exam || {}),
        key,
        examType: true,
        backLabel: '返回 1-2 題庫',
        onBack: () => {
          document.querySelector('#examScreen')?.classList.add('hidden');
          document.querySelector('#startScreen')?.classList.remove('hidden');
          const result = document.querySelector('#result');
          if (result) result.style.display = 'none';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      };

      startExam(key);
    } catch (error) {
      alert(`各校題庫載入失敗：${error.message}`);
    } finally {
      button.disabled = false;
      button.textContent = oldText;
    }
  }

  function ensureScienceSchoolBankButton() {
    const tools = document.getElementById('recordTools');
    const title = document.querySelector('#startScreen header h1')?.textContent || '';
    if (!tools || !title.includes('1-2 科學方法')) return;
    if (document.getElementById('scienceSchoolBankBtn')) return;

    const button = document.createElement('button');
    button.id = 'scienceSchoolBankBtn';
    button.className = 'record-btn';
    button.textContent = '🏫 各校題庫';
    button.title = '各校真實段考題，依 1-2 科學方法分類整理';
    button.addEventListener('click', () => openScienceSchoolBank(button));
    tools.appendChild(button);
  }

  function watchScienceStartScreen() {
    const startScreen = document.getElementById('startScreen');
    if (!startScreen) return;

    const observer = new MutationObserver(ensureScienceSchoolBankButton);
    observer.observe(startScreen, { childList: true, subtree: true, characterData: true });
    ensureScienceSchoolBankButton();
  }

  document.addEventListener('click', event => {
    const button = event.target.closest?.('#chapterBackBtn');
    if (!button) return;

    // exam-catalog.js 會先更新 catalogContent 為單元 1，
    // 這裡補上原本遺漏的畫面切換：題庫首頁 -> catalog。
    setTimeout(returnToScienceUnit, 0);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchScienceStartScreen);
  } else {
    watchScienceStartScreen();
  }
})();
