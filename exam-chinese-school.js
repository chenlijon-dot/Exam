(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);

  const SCHOOL_BANK_DESC = '由各校真實段考拆題；支援原始題型、閱讀題組、圖片與紙筆練習。';

  const BANK_CONFIGS = [
    {
      lesson: '01',
      buttonId: 'chineseLesson01SchoolBankBtn',
      bankPath: 'chapter-bank/chinese/7-1/lesson-01/school-exams.json',
      extraPaths: ['chapter-bank/chinese/7-1/lesson-01/school-exams-yushan-114.json'],
      schoolCount: 6,
      lessonTitle: '夏夜',
      backLabel: '返回第一課題庫',
      loadingText: '正在載入各校〈夏夜〉真題…'
    },
    {
      lesson: '02',
      buttonId: 'chineseLesson02SchoolBankBtn',
      bankPath: 'chapter-bank/chinese/7-1/lesson-02/school-exams.json',
      extraPaths: ['chapter-bank/chinese/7-1/lesson-02/school-exams-yushan-114.json'],
      schoolCount: 5,
      lessonTitle: '生之歌選',
      backLabel: '返回第二課題庫',
      loadingText: '正在載入各校〈生之歌選〉真題…'
    }
  ];

  const LESSON_02_SCHOOLS = [
    '臺北市立誠正國中',
    '花蓮縣宜昌國中',
    '臺中市立四育國中',
    '高雄市立鳳甲國中',
    '嘉義市玉山國中'
  ];

  function resetSchoolBankButton(config) {
    const btn = $(`#${config.buttonId}`);
    if (!btn) return;
    btn.disabled = false;
    const desc = btn.querySelector('.desc');
    if (desc) desc.textContent = SCHOOL_BANK_DESC;
  }

  async function fetchJson(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
    return res.json();
  }

  async function loadMergedBank(config) {
    const data = await fetchJson(config.bankPath);
    data.questions = Array.isArray(data.questions) ? [...data.questions] : [];

    for (const path of config.extraPaths || []) {
      const extra = await fetchJson(path);
      if (Array.isArray(extra.questions)) data.questions.push(...extra.questions);
    }

    data.questions.forEach((question, index) => {
      question.number = index + 1;
    });

    const manualCount = data.questions.filter(q => q?.type === 'manual-study').length;
    const autoCount = data.questions.length - manualCount;
    data.exam = data.exam || {};
    data.exam.subtitle = `國文第一冊｜各校段考精選｜${autoCount} 題自動評量＋${manualCount} 題紙筆練習`;

    return data;
  }

  async function openSchoolBank(config) {
    const btn = $(`#${config.buttonId}`);
    if (btn) {
      btn.disabled = true;
      const desc = btn.querySelector('.desc');
      if (desc) desc.textContent = config.loadingText;
    }

    try {
      const data = await loadMergedBank(config);
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
        backLabel: config.backLabel,
        onBack: () => {
          document.querySelector('#examScreen')?.classList.add('hidden');
          document.querySelector('#startScreen')?.classList.add('hidden');
          document.querySelector('#catalogShell')?.classList.remove('hidden');
          if (document.querySelector('#result')?.style) document.querySelector('#result').style.display = 'none';
          enhanceLesson01Menu();
          enhanceLesson02Menu();
          resetSchoolBankButton(config);
          interceptSchoolBankButton(config);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      };

      // catalog 在考試期間只是隱藏，同一顆按鈕不能留下 disabled，
      // 否則從考題返回後就會變成「看得到但點不進去」。
      resetSchoolBankButton(config);
      startExam(key);
    } catch (error) {
      alert(`各校題庫載入失敗：${error.message}`);
      resetSchoolBankButton(config);
    }
  }

  function interceptSchoolBankButton(config) {
    const btn = $(`#${config.buttonId}`);
    if (!btn || btn.dataset.directSchoolBank === '1') return;
    btn.dataset.directSchoolBank = '1';

    btn.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      openSchoolBank(config);
    }, true);
  }

  function enhanceLesson01Menu() {
    const config = BANK_CONFIGS.find(item => item.lesson === '01');
    if (!config) return;
    const btn = $(`#${config.buttonId}`);
    if (!btn) return;
    const badge = btn.querySelector('.catalog-badge.school');
    if (badge) badge.textContent = `${config.schoolCount} 校已索引`;
    interceptSchoolBankButton(config);
  }

  function enhanceLesson02CatalogCard() {
    const card = $('[data-chinese-lesson="chinese-7-1-lesson-02"]');
    if (!card) return;

    const badge = card.querySelector('.catalog-badge');
    if (badge) {
      badge.classList.remove('soon');
      badge.classList.add('reference');
      badge.textContent = '題庫架構已建';
    }

    const descs = card.querySelectorAll('.desc');
    if (descs.length > 1) {
      descs[descs.length - 1].textContent = '〈一顆珍珠〉、〈手的故事〉教材知識庫與各校段考題庫已開始收錄。';
    }
  }

  function enhanceLesson02Menu() {
    const content = $('#catalogContent');
    if (!content) return;

    const title = content.querySelector('.catalog-title');
    const path = content.querySelector('.catalog-path');
    if (!title || !path) return;

    const isLesson02 = title.textContent.replace(/\s+/g, '').includes('第二課生之歌選') ||
      path.textContent.replace(/\s+/g, '').includes('第二課生之歌選');
    if (!isLesson02) return;

    const grid = content.querySelector('.catalog-grid');
    if (!grid) return;

    const sub = content.querySelector('.catalog-sub');
    if (sub) sub.textContent = '自編題依難度建立；各校題庫保留真實段考來源與原始題型。';

    if (grid.dataset.lesson02BankMenu !== '1') {
      grid.dataset.lesson02BankMenu = '1';
      grid.innerHTML = `
        <button class="catalog-card" disabled><span class="top"><span class="icon">🌱</span><strong>簡易</strong><span class="catalog-badge soon">待建</span></span><span class="desc">字音字形、基本課文內容、作者與基礎修辭。</span></button>
        <button class="catalog-card" disabled><span class="top"><span class="icon">🌿</span><strong>中等</strong><span class="catalog-badge soon">待建</span></span><span class="desc">文意理解、象徵判讀、藉事說理與寫作手法整合。</span></button>
        <button class="catalog-card" disabled><span class="top"><span class="icon">🌳</span><strong>困難</strong><span class="catalog-badge soon">待建</span></span><span class="desc">跨文本、延伸閱讀、生命價值與高層次綜合判讀。</span></button>
        <button class="catalog-card" id="chineseLesson02SchoolBankBtn"><span class="top"><span class="icon">🏫</span><strong>各校題庫</strong><span class="catalog-badge school">${LESSON_02_SCHOOLS.length} 校已索引</span></span><span class="desc">${SCHOOL_BANK_DESC}</span></button>`;
    }

    const config = BANK_CONFIGS.find(item => item.lesson === '02');
    if (config) interceptSchoolBankButton(config);
  }

  function refresh() {
    enhanceLesson01Menu();
    enhanceLesson02CatalogCard();
    enhanceLesson02Menu();
    BANK_CONFIGS.forEach(interceptSchoolBankButton);
  }

  function init() {
    const target = $('#catalogContent') || document.body;
    const observer = new MutationObserver(refresh);
    observer.observe(target, { childList: true, subtree: true });
    refresh();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
