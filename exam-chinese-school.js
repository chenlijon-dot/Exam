(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const SCHOOL_BANK_DESC = '由各校真實段考拆題；支援原始題型、閱讀題組、圖片與紙筆練習。';

  const BANK_CONFIGS = [
    {
      lesson: '01', buttonId: 'chineseLesson01SchoolBankBtn',
      bankPath: 'chapter-bank/chinese/7-1/lesson-01/school-exams.json',
      extraPaths: [
        'chapter-bank/chinese/7-1/lesson-01/school-exams-yushan-114.json',
        'chapter-bank/chinese/7-1/lesson-01/school-exams-zuoying-113.json'
      ],
      schoolCount: 7, lessonTitle: '夏夜', backLabel: '返回第一課題庫', loadingText: '正在載入各校〈夏夜〉真題…'
    },
    {
      lesson: '02', buttonId: 'chineseLesson02SchoolBankBtn',
      bankPath: 'chapter-bank/chinese/7-1/lesson-02/school-exams.json',
      extraPaths: [
        'chapter-bank/chinese/7-1/lesson-02/school-exams-yushan-114.json',
        'chapter-bank/chinese/7-1/lesson-02/school-exams-zuoying-113.json',
        'chapter-bank/chinese/7-1/lesson-02/school-exams-siyu-114.json'
      ],
      schoolCount: 6, lessonTitle: '生之歌選', backLabel: '返回第二課題庫', loadingText: '正在載入各校〈生之歌選〉真題…'
    },
    {
      lesson: '03', buttonId: 'chineseLesson03SchoolBankBtn',
      bankPath: 'chapter-bank/chinese/7-1/lesson-03/school-exams-zuoying-113.json',
      extraPaths: [
        'chapter-bank/chinese/7-1/lesson-03/school-exams-chengzheng-114.json',
        'chapter-bank/chinese/7-1/lesson-03/school-exams-yichang-114.json',
        'chapter-bank/chinese/7-1/lesson-03/school-exams-siyu-114.json',
        'chapter-bank/chinese/7-1/lesson-03/school-exams-fengjia-114.json'
      ], schoolCount: 5, lessonTitle: '吃冰的滋味', backLabel: '返回第三課題庫', loadingText: '正在載入各校〈吃冰的滋味〉真題…'
    },
    {
      lesson: 'language01', buttonId: 'chineseLanguage01SchoolBankBtn',
      bankPath: 'chapter-bank/chinese/7-1/language-01/school-exams-zuoying-113.json',
      extraPaths: [
        'chapter-bank/chinese/7-1/language-01/school-exams-chengzheng-114.json',
        'chapter-bank/chinese/7-1/language-01/school-exams-siyu-114.json',
        'chapter-bank/chinese/7-1/language-01/school-exams-fengjia-114.json',
        'chapter-bank/chinese/7-1/language-01/school-exams-yushan-114.json'
      ], schoolCount: 5, lessonTitle: '標點符號使用法', backLabel: '返回語文天地一題庫', loadingText: '正在載入各校標點符號真題…'
    },
    {
      lesson: 'self01', buttonId: 'chineseSelf01SchoolBankBtn',
      bankPath: 'chapter-bank/chinese/7-1/self-01/school-exams-zuoying-113.json',
      extraPaths: ['chapter-bank/chinese/7-1/self-01/school-exams-chengzheng-114.json'],
      schoolCount: 2, lessonTitle: '善用時間的方法', backLabel: '返回自學一題庫', loadingText: '正在載入各校〈善用時間的方法〉真題…'
    }
  ];

  const PRACTICE_CONFIGS = [
    { lesson:'01', difficulty:'easy', buttonId:'chineseLesson01EasyBtn', path:'chapter-bank/chinese/7-1/lesson-01/practice-easy.json', loadingText:'正在載入〈夏夜〉簡易題…', backLabel:'返回第一課題庫' },
    { lesson:'01', difficulty:'medium', buttonId:'chineseLesson01MediumBtn', path:'chapter-bank/chinese/7-1/lesson-01/practice-medium.json', loadingText:'正在載入〈夏夜〉中等題…', backLabel:'返回第一課題庫' },
    { lesson:'01', difficulty:'hard', buttonId:'chineseLesson01HardBtn', path:'chapter-bank/chinese/7-1/lesson-01/practice-hard.json', loadingText:'正在載入〈夏夜〉困難題…', backLabel:'返回第一課題庫' },
    { lesson:'02', difficulty:'easy', buttonId:'chineseLesson02EasyBtn', path:'chapter-bank/chinese/7-1/lesson-02/practice-easy.json', loadingText:'正在載入〈生之歌選〉簡易題…', backLabel:'返回第二課題庫' },
    { lesson:'02', difficulty:'medium', buttonId:'chineseLesson02MediumBtn', path:'chapter-bank/chinese/7-1/lesson-02/practice-medium.json', loadingText:'正在載入〈生之歌選〉中等題…', backLabel:'返回第二課題庫' },
    { lesson:'02', difficulty:'hard', buttonId:'chineseLesson02HardBtn', path:'chapter-bank/chinese/7-1/lesson-02/practice-hard.json', loadingText:'正在載入〈生之歌選〉困難題…', backLabel:'返回第二課題庫' },
    { lesson:'03', difficulty:'easy', buttonId:'chineseLesson03EasyBtn', path:'chapter-bank/chinese/7-1/lesson-03/practice-easy.json', loadingText:'正在載入〈吃冰的滋味〉簡易題…', backLabel:'返回第三課題庫' },
    { lesson:'03', difficulty:'medium', buttonId:'chineseLesson03MediumBtn', path:'chapter-bank/chinese/7-1/lesson-03/practice-medium.json', loadingText:'正在載入〈吃冰的滋味〉中等題…', backLabel:'返回第三課題庫' },
    { lesson:'03', difficulty:'hard', buttonId:'chineseLesson03HardBtn', path:'chapter-bank/chinese/7-1/lesson-03/practice-hard.json', loadingText:'正在載入〈吃冰的滋味〉困難題…', backLabel:'返回第三課題庫' }
  ];

  function setTextIfChanged(node, text) {
    if (node && node.textContent !== text) node.textContent = text;
  }

  function resetSchoolBankButton(config) {
    const btn = $(`#${config.buttonId}`);
    if (!btn) return;
    btn.disabled = false;
    setTextIfChanged(btn.querySelector('.desc'), SCHOOL_BANK_DESC);
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
    data.questions.forEach((question, index) => { question.number = index + 1; });
    const manualCount = data.questions.filter(q => q?.type === 'manual-study').length;
    const autoCount = data.questions.length - manualCount;
    data.exam = data.exam || {};
    data.exam.subtitle = `國文第一冊｜各校段考精選｜${autoCount} 題自動評量＋${manualCount} 題紙筆練習`;
    return data;
  }

  function returnToCatalog(config) {
    document.querySelector('#examScreen')?.classList.add('hidden');
    document.querySelector('#startScreen')?.classList.add('hidden');
    document.querySelector('#catalogShell')?.classList.remove('hidden');
    if (document.querySelector('#result')?.style) document.querySelector('#result').style.display = 'none';
    enhanceAllMenus();
    if (config) {
      resetSchoolBankButton(config);
      interceptSchoolBankButton(config);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function openSchoolBank(config) {
    const btn = $(`#${config.buttonId}`);
    if (btn) {
      btn.disabled = true;
      setTextIfChanged(btn.querySelector('.desc'), config.loadingText);
    }
    try {
      const data = await loadMergedBank(config);
      const key = data.exam.difficulty;
      if (typeof banks === 'undefined' || typeof startExam !== 'function') throw new Error('題庫引擎尚未就緒');
      banks[key] = data.questions;
      window.examContexts = window.examContexts || {};
      window.examContexts[key] = { ...data.exam, key, examType:true, backLabel:config.backLabel, onBack:() => returnToCatalog(config) };
      resetSchoolBankButton(config);
      startExam(key);
    } catch (error) {
      alert(`各校題庫載入失敗：${error.message}`);
      resetSchoolBankButton(config);
    }
  }

  async function openPracticeBank(config) {
    const btn = $(`#${config.buttonId}`);
    const originalDesc = btn?.querySelector('.desc')?.textContent || '';
    if (btn) {
      btn.disabled = true;
      setTextIfChanged(btn.querySelector('.desc'), config.loadingText);
    }
    try {
      const data = await fetchJson(config.path);
      const key = data.exam.difficulty;
      if (typeof banks === 'undefined' || typeof startExam !== 'function') throw new Error('題庫引擎尚未就緒');
      banks[key] = Array.isArray(data.questions) ? data.questions : [];
      window.examContexts = window.examContexts || {};
      window.examContexts[key] = { ...data.exam, key, examType:true, backLabel:config.backLabel, onBack:() => returnToCatalog(null) };
      if (btn) {
        btn.disabled = false;
        setTextIfChanged(btn.querySelector('.desc'), originalDesc);
      }
      startExam(key);
    } catch (error) {
      alert(`自編題載入失敗：${error.message}`);
      if (btn) {
        btn.disabled = false;
        setTextIfChanged(btn.querySelector('.desc'), originalDesc);
      }
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

  function interceptPracticeButton(config) {
    const btn = $(`#${config.buttonId}`);
    if (!btn || btn.dataset.directPracticeBank === '1') return;
    btn.dataset.directPracticeBank = '1';
    btn.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      openPracticeBank(config);
    }, true);
  }

  function currentCatalogText() {
    const content = $('#catalogContent');
    if (!content) return '';
    return `${content.querySelector('.catalog-title')?.textContent || ''} ${content.querySelector('.catalog-path')?.textContent || ''}`.replace(/\s+/g, '');
  }

  function renderGenericBankMenu(config, easyDesc, mediumDesc, hardDesc) {
    const content = $('#catalogContent');
    if (!content) return;
    const grid = content.querySelector('.catalog-grid');
    if (!grid) return;
    const marker = `bankMenu${config.lesson}`;
    if (grid.dataset[marker] === '1') return;
    grid.dataset[marker] = '1';
    setTextIfChanged(content.querySelector('.catalog-sub'), '自編題依難度建立；各校題庫保留真實段考來源與原始題型。');
    grid.innerHTML = `
      <button class="catalog-card" disabled><span class="top"><span class="icon">🌱</span><strong>簡易</strong><span class="catalog-badge soon">待建</span></span><span class="desc">${easyDesc}</span></button>
      <button class="catalog-card" disabled><span class="top"><span class="icon">🌿</span><strong>中等</strong><span class="catalog-badge soon">待建</span></span><span class="desc">${mediumDesc}</span></button>
      <button class="catalog-card" disabled><span class="top"><span class="icon">🌳</span><strong>困難</strong><span class="catalog-badge soon">待建</span></span><span class="desc">${hardDesc}</span></button>
      <button class="catalog-card" id="${config.buttonId}"><span class="top"><span class="icon">🏫</span><strong>各校題庫</strong><span class="catalog-badge school">${config.schoolCount} 校已索引</span></span><span class="desc">${SCHOOL_BANK_DESC}</span></button>`;
    interceptSchoolBankButton(config);
  }

  function enablePracticeButtons(lesson) {
    const grid = $('#catalogContent .catalog-grid');
    if (!grid) return;
    const map = { '簡易':'easy', '中等':'medium', '困難':'hard' };
    grid.querySelectorAll('.catalog-card').forEach(btn => {
      const label = btn.querySelector('strong')?.textContent?.trim();
      const difficulty = map[label];
      if (!difficulty) return;
      const practice = PRACTICE_CONFIGS.find(item => item.lesson === lesson && item.difficulty === difficulty);
      if (!practice) return;
      btn.id = practice.buttonId;
      btn.disabled = false;
      const badge = btn.querySelector('.catalog-badge');
      if (badge) {
        badge.classList.remove('soon');
        badge.classList.add('reference');
        setTextIfChanged(badge, '20 題');
      }
      interceptPracticeButton(practice);
    });
  }

  function enhanceLesson01Menu() {
    if (!currentCatalogText().includes('第一課夏夜')) return;
    const config = BANK_CONFIGS.find(item => item.lesson === '01');
    const schoolBtn = $(`#${config.buttonId}`);
    if (schoolBtn) {
      setTextIfChanged(schoolBtn.querySelector('.catalog-badge.school'), `${config.schoolCount} 校已索引`);
      interceptSchoolBankButton(config);
    }
    enablePracticeButtons('01');
  }

  function enhanceLesson02Menu() {
    if (!currentCatalogText().includes('第二課生之歌選')) return;
    const config = BANK_CONFIGS.find(item => item.lesson === '02');
    renderGenericBankMenu(config,
      '字音字形、基本課文內容、作者與基礎修辭。',
      '文意理解、象徵判讀、藉事說理與寫作手法整合。',
      '跨文本、延伸閱讀、生命價值與高層次綜合判讀。');
    enablePracticeButtons('02');
  }

  function enhanceLesson03Menu() {
    if (!currentCatalogText().includes('第三課吃冰的滋味')) return;
    const config = BANK_CONFIGS.find(item => item.lesson === '03');
    renderGenericBankMenu(config,
      '字詞、注釋、課文基本內容與人物事件。',
      '今昔對比、文意理解、修辭與主旨判讀。',
      '跨文本、圖表閱讀與高層次整合。');
    enablePracticeButtons('03');
  }

  function enhanceLanguage01Menu() {
    if (!currentCatalogText().includes('語文天地一標點符號使用法')) return;
    const config = BANK_CONFIGS.find(item => item.lesson === 'language01');
    renderGenericBankMenu(config,
      '十五種標點符號的名稱與基本功能。',
      '句意、語氣與標點功能辨析。',
      '生活情境斷句、語意改變與綜合應用。');
  }

  function enhanceSelf01Menu() {
    if (!currentCatalogText().includes('自學一善用時間的方法')) return;
    const config = BANK_CONFIGS.find(item => item.lesson === 'self01');
    renderGenericBankMenu(config,
      '文章基本內容與重要語句。',
      '文意理解、時間運用與觀點判讀。',
      '跨文本、寫作脈絡與價值思辨。');
  }

  function enhanceCatalogCards() {
    const updates = [
      ['chinese-7-1-lesson-02', '題庫架構已建', '〈一顆珍珠〉、〈手的故事〉教材知識庫與各校段考題庫已收錄。'],
      ['chinese-7-1-lesson-03', '題庫架構已建', '〈吃冰的滋味〉教材知識庫、自編題與各校段考題庫已收錄。'],
      ['chinese-7-1-language-01', '題庫架構已建', '標點符號教材知識庫與各校段考題庫已開始收錄。'],
      ['chinese-7-1-self-01', '題庫架構已建', '〈善用時間的方法〉各校段考題庫已開始收錄。']
    ];
    for (const [key, badgeText, descText] of updates) {
      const card = $(`[data-chinese-lesson="${key}"]`);
      if (!card) continue;
      const badge = card.querySelector('.catalog-badge');
      if (badge) {
        badge.classList.remove('soon');
        badge.classList.add('reference');
        setTextIfChanged(badge, badgeText);
      }
      const descs = card.querySelectorAll('.desc');
      if (descs.length) setTextIfChanged(descs[descs.length - 1], descText);
    }
  }

  function enhanceAllMenus() {
    enhanceCatalogCards();
    enhanceLesson01Menu();
    enhanceLesson02Menu();
    enhanceLesson03Menu();
    enhanceLanguage01Menu();
    enhanceSelf01Menu();
    BANK_CONFIGS.forEach(interceptSchoolBankButton);
    PRACTICE_CONFIGS.forEach(interceptPracticeButton);
  }

  function init() {
    const target = $('#catalogContent') || document.body;
    const observer = new MutationObserver(enhanceAllMenus);
    observer.observe(target, { childList: true, subtree: true });
    enhanceAllMenus();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
