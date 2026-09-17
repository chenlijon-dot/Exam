(() => {
  'use strict';

  const SECTION_KEY = 'science-7-1-1-3';
  const BASE_PATH = 'chapter-bank/science/7-1/unit-01/section-03';
  const BANK_PATHS = {
    easy: `${BASE_PATH}/easy.json`,
    medium: `${BASE_PATH}/medium.json`,
    hard: `${BASE_PATH}/hard.json`,
    school: `${BASE_PATH}/school-exams.json`
  };

  const LEVELS = {
    easy: {
      label: '簡易',
      icon: '🌱',
      desc: '實驗室器材、安全規則、量筒讀值、顯微鏡基本觀念。'
    },
    medium: {
      label: '中等',
      icon: '🌿',
      desc: '倍率與視野、低倍轉高倍、成像方向、玻片移動與顯微鏡選擇。'
    },
    hard: {
      label: '困難',
      icon: '🌳',
      desc: '倍率綜合推論、視野與移動判讀、操作錯誤診斷、器材情境應用。'
    }
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  let unitViewFragment = null;
  let savedHeaderTitle = '';
  let savedHeaderSub = '';
  let savedDocumentTitle = '';

  function showCatalog() {
    $('#catalogShell')?.classList.remove('hidden');
    $('#startScreen')?.classList.add('hidden');
    $('#examScreen')?.classList.add('hidden');
    const result = $('#result');
    if (result) result.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function saveUnitView() {
    const content = $('#catalogContent');
    if (!content || unitViewFragment) return;
    unitViewFragment = document.createDocumentFragment();
    while (content.firstChild) unitViewFragment.appendChild(content.firstChild);
    savedHeaderTitle = $('#catalogHeaderTitle')?.textContent || '自然一上｜單元 1';
    savedHeaderSub = $('#catalogHeaderSub')?.textContent || '生命現象與科學探究';
    savedDocumentTitle = document.title;
  }

  function restoreUnitView() {
    const content = $('#catalogContent');
    if (!content || !unitViewFragment) return;
    content.replaceChildren();
    content.appendChild(unitViewFragment);
    unitViewFragment = null;
    const title = $('#catalogHeaderTitle');
    const sub = $('#catalogHeaderSub');
    if (title) title.textContent = savedHeaderTitle;
    if (sub) sub.textContent = savedHeaderSub;
    document.title = savedDocumentTitle || '單元 1 生命現象與科學探究｜自然一上';
    showCatalog();
    enableCatalogEntry();
  }

  async function fetchBank(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.questions) || !data.questions.length) throw new Error('題庫沒有題目');
    return data;
  }

  function buildContext(data, key, label, isSchool = false) {
    const exam = data.exam || {};
    return {
      ...exam,
      key,
      title: exam.title || `1-3 認識實驗室｜${label}`,
      subtitle: `自然七上｜單元 1 生命現象與科學探究｜1-3 認識實驗室｜${label}題庫`,
      subject: 'science',
      subjectLabel: '自然',
      semester: '7-1',
      semesterLabel: '七年級上學期',
      unitGroup: 'unit-01',
      unitGroupLabel: '單元 1 生命現象與科學探究',
      section: 'section-03',
      unit: '1-3 認識實驗室',
      difficulty: key,
      difficultyLabel: label,
      scoreMode: isSchool ? (exam.scoreMode || 'percent') : 'fixed',
      pointsPerQuestion: isSchool ? undefined : 5,
      analysisEligible: true,
      preserveOptionOrder: isSchool ? true : false,
      examType: isSchool,
      backLabel: '返回 1-3 題庫',
      onBack: showScienceLabMenuAfterExam
    };
  }

  async function openBank(kind, button) {
    const isSchool = kind === 'school';
    const level = LEVELS[kind];
    const badge = button?.querySelector('.catalog-badge');
    const desc = button?.querySelector('.desc');
    const oldBadge = badge?.textContent || '';
    const oldDesc = desc?.textContent || '';

    if (button) button.disabled = true;
    if (badge) badge.textContent = '載入中';
    if (desc) desc.textContent = '正在載入題庫…';

    try {
      const data = await fetchBank(BANK_PATHS[kind]);
      if (typeof banks === 'undefined' || typeof startExam !== 'function') throw new Error('題庫引擎尚未就緒');
      const key = data.exam?.difficulty || `science-7-1-u01-s03-${kind}`;
      banks[key] = data.questions;
      window.examContexts = window.examContexts || {};
      window.examContexts[key] = buildContext(data, key, isSchool ? '各校題庫' : level.label, isSchool);
      startExam(key);
    } catch (error) {
      alert(`1-3 題庫載入失敗：${error.message}`);
    } finally {
      if (button) button.disabled = false;
      if (badge) badge.textContent = oldBadge;
      if (desc) desc.textContent = oldDesc;
    }
  }

  async function updateSchoolBadge() {
    const badge = $('#scienceLabSchoolBankBtn .catalog-badge');
    const desc = $('#scienceLabSchoolBankBtn .desc');
    if (!badge) return;
    try {
      const data = await fetchBank(BANK_PATHS.school);
      const ready = data.questions.length;
      const classified = Number(data.exam?.classifiedQuestionCount || ready);
      const pending = Math.max(0, classified - ready);
      badge.textContent = `${ready} 題已收錄`;
      badge.classList.add('school');
      if (desc && pending) {
        desc.textContent = `真實段考已分類 ${classified} 題；目前 ${ready} 題可直接作答，另 ${pending} 題待原卷附圖資產完成後匯入。`;
      }
    } catch {
      badge.textContent = '載入失敗';
      badge.classList.add('soon');
    }
  }

  function bindMenuButtons() {
    $('#backScienceLabBtn')?.addEventListener('click', restoreUnitView);
    $('#scienceLabEasyBtn')?.addEventListener('click', event => openBank('easy', event.currentTarget));
    $('#scienceLabMediumBtn')?.addEventListener('click', event => openBank('medium', event.currentTarget));
    $('#scienceLabHardBtn')?.addEventListener('click', event => openBank('hard', event.currentTarget));
    $('#scienceLabSchoolBankBtn')?.addEventListener('click', event => openBank('school', event.currentTarget));
  }

  function renderScienceLabMenu() {
    const content = $('#catalogContent');
    if (!content) return;
    const headerTitle = $('#catalogHeaderTitle');
    const headerSub = $('#catalogHeaderSub');
    if (headerTitle) headerTitle.textContent = '自然七上｜1-3';
    if (headerSub) headerSub.textContent = '認識實驗室｜選擇題庫';
    document.title = '1-3 認識實驗室｜自然七上';

    content.innerHTML = `
      <button class="catalog-back" id="backScienceLabBtn">← 返回單元 1</button>
      <div class="catalog-path">自然　›　七年級上學期（一上）　›　單元 1 生命現象與科學探究　›　1-3 認識實驗室</div>
      <h2 class="catalog-title">1-3　認識實驗室</h2>
      <p class="catalog-sub">依已核對的 p.14～21 canonical 教材知識庫建立；自編題依難度練習，各校題庫保留真實段考來源。</p>
      <div class="catalog-grid">
        <button class="catalog-card" id="scienceLabEasyBtn">
          <span class="top"><span class="icon">🌱</span><strong>簡易</strong><span class="catalog-badge">20 題</span></span>
          <span class="desc">${LEVELS.easy.desc}</span>
        </button>
        <button class="catalog-card" id="scienceLabMediumBtn">
          <span class="top"><span class="icon">🌿</span><strong>中等</strong><span class="catalog-badge">20 題</span></span>
          <span class="desc">${LEVELS.medium.desc}</span>
        </button>
        <button class="catalog-card" id="scienceLabHardBtn">
          <span class="top"><span class="icon">🌳</span><strong>困難</strong><span class="catalog-badge">20 題</span></span>
          <span class="desc">${LEVELS.hard.desc}</span>
        </button>
        <button class="catalog-card" id="scienceLabSchoolBankBtn">
          <span class="top"><span class="icon">🏫</span><strong>各校題庫</strong><span class="catalog-badge school">檢查中</span></span>
          <span class="desc">由各校自然科真實段考拆題；保留原始題號、選項順序、圖片與來源。</span>
        </button>
      </div>`;

    bindMenuButtons();
    updateSchoolBadge();
    showCatalog();
  }

  function openScienceLabMenu() {
    saveUnitView();
    renderScienceLabMenu();
  }

  function showScienceLabMenuAfterExam() {
    renderScienceLabMenu();
  }

  function enableCatalogEntry() {
    const card = document.querySelector(`[data-science-section="${SECTION_KEY}"]`);
    if (!card) return;
    card.disabled = false;
    const badge = card.querySelector('.catalog-badge');
    const desc = card.querySelector('.desc');
    if (badge) {
      badge.textContent = '題庫已建立';
      badge.classList.remove('soon');
      badge.classList.add('reference');
    }
    if (desc) desc.textContent = '實驗室器材、安全操作、量筒讀值、顯微鏡構造、倍率與成像判讀';
  }

  document.addEventListener('click', event => {
    const section = event.target.closest?.(`[data-science-section="${SECTION_KEY}"]`);
    if (!section) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openScienceLabMenu();
  }, true);

  const observer = new MutationObserver(enableCatalogEntry);
  const startObserver = () => {
    const content = $('#catalogContent');
    if (content) observer.observe(content, { childList: true, subtree: true });
    enableCatalogEntry();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver, { once: true });
  } else {
    startObserver();
  }
})();
