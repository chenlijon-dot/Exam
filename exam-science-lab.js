(() => {
  'use strict';

  const ROOT = 'chapter-bank/science/7-1/unit-01/section-03';
  const BANKS = {
    easy: `${ROOT}/easy.json`,
    medium: `${ROOT}/medium.json`,
    hard: `${ROOT}/hard.json`,
    school: `${ROOT}/school-exams.json`
  };

  const LEVELS = {
    easy: {
      icon: '🌱',
      label: '簡易',
      desc: '器材用途、安全規則、基本倍率、顯微鏡成像與基本操作。'
    },
    medium: {
      icon: '🌿',
      label: '中等',
      desc: '情境操作、倍率與視野、玻片移動、顯微鏡選擇與應用。'
    },
    hard: {
      icon: '🌳',
      label: '困難',
      desc: '綜合判讀、鏡頭倍率推理、移動追蹤、操作錯誤與結果分析。'
    }
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  let savedUnitView = null;
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

  function activateSectionCard() {
    const card = $('[data-science-section="science-7-1-1-3"]');
    if (!card) return;
    card.disabled = false;
    card.removeAttribute('disabled');
    const badge = card.querySelector('.catalog-badge');
    if (badge) {
      badge.textContent = '題庫已建立';
      badge.classList.remove('soon');
      badge.classList.add('reference');
    }
    const desc = card.querySelector('.desc');
    if (desc) desc.textContent = '實驗器材、量筒、複式與解剖顯微鏡、倍率、成像與操作';
  }

  function saveUnitView() {
    const content = $('#catalogContent');
    if (!content || savedUnitView) return;
    savedUnitView = document.createDocumentFragment();
    while (content.firstChild) savedUnitView.appendChild(content.firstChild);
    savedHeaderTitle = $('#catalogHeaderTitle')?.textContent || '自然一上｜單元 1';
    savedHeaderSub = $('#catalogHeaderSub')?.textContent || '生命現象與科學探究';
    savedDocumentTitle = document.title;
  }

  function restoreUnitView() {
    const content = $('#catalogContent');
    if (!content || !savedUnitView) return;
    content.replaceChildren();
    content.appendChild(savedUnitView);
    savedUnitView = null;
    if ($('#catalogHeaderTitle')) $('#catalogHeaderTitle').textContent = savedHeaderTitle;
    if ($('#catalogHeaderSub')) $('#catalogHeaderSub').textContent = savedHeaderSub;
    document.title = savedDocumentTitle || '單元 1 生命現象與科學探究｜自然一上';
    showCatalog();
    queueMicrotask(activateSectionCard);
  }

  async function fetchBank(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.questions)) throw new Error('題庫格式錯誤');
    return data;
  }

  function makeContext(data, key, isSchool) {
    const difficultyLabel = isSchool ? '各校題庫' : LEVELS[key]?.label || key;
    return {
      ...(data.exam || {}),
      key: data.exam?.difficulty || `science-7-1-u01-s03-${key}`,
      title: `1-3 認識實驗室｜${difficultyLabel}`,
      subtitle: `自然七上｜單元 1 生命現象與科學探究｜1-3 認識實驗室｜${difficultyLabel}`,
      subject: 'science',
      subjectLabel: '自然',
      semester: '7-1',
      semesterLabel: '七年級上學期',
      unitGroup: 'unit-01',
      unitGroupLabel: '單元 1 生命現象與科學探究',
      section: 'section-03',
      unit: '1-3 認識實驗室',
      difficulty: key,
      difficultyLabel,
      scoreMode: isSchool ? 'percent' : 'fixed',
      pointsPerQuestion: isSchool ? undefined : 5,
      analysisEligible: true,
      preserveOptionOrder: isSchool ? true : false,
      examType: !!isSchool,
      backLabel: '返回 1-3 題庫',
      onBack: renderMenu
    };
  }

  async function openBank(key, button) {
    const path = BANKS[key];
    if (!path) return;
    const oldDisabled = !!button?.disabled;
    const oldBadge = button?.querySelector('.catalog-badge')?.textContent || '';
    if (button) button.disabled = true;
    const badge = button?.querySelector('.catalog-badge');
    if (badge) badge.textContent = '載入中';

    try {
      const data = await fetchBank(path);
      const isSchool = key === 'school';
      const bankKey = data.exam?.difficulty || `science-7-1-u01-s03-${key}`;
      if (typeof banks === 'undefined' || typeof startExam !== 'function') {
        throw new Error('題庫引擎尚未就緒');
      }
      banks[bankKey] = data.questions;
      window.examContexts = window.examContexts || {};
      window.examContexts[bankKey] = makeContext(data, key, isSchool);
      startExam(bankKey);
    } catch (error) {
      alert(`1-3 題庫載入失敗：${error.message}`);
    } finally {
      if (button) button.disabled = oldDisabled;
      if (badge) badge.textContent = oldBadge;
    }
  }

  async function updateSchoolBadge() {
    const badge = $('#scienceLabSchoolBtn .catalog-badge');
    const desc = $('#scienceLabSchoolBtn .desc');
    if (!badge) return;
    try {
      const data = await fetchBank(BANKS.school);
      const count = data.questions.length;
      const pending = Array.isArray(data.exam?.pendingImageQuestionNumbers)
        ? data.exam.pendingImageQuestionNumbers.length
        : 0;
      badge.textContent = `${count} 題已收錄`;
      badge.classList.add('school');
      if (desc) {
        desc.textContent = pending
          ? `各校真實段考文字題先上線；目前 ${count} 題可作答，另 ${pending} 題附圖題稍後補圖。`
          : `各校自然科真實段考拆題；保留原始題號、選項順序與來源。`;
      }
    } catch {
      badge.textContent = '載入失敗';
    }
  }

  function bindMenu() {
    $('#backScienceLabBtn')?.addEventListener('click', restoreUnitView);
    $('#scienceLabEasyBtn')?.addEventListener('click', e => openBank('easy', e.currentTarget));
    $('#scienceLabMediumBtn')?.addEventListener('click', e => openBank('medium', e.currentTarget));
    $('#scienceLabHardBtn')?.addEventListener('click', e => openBank('hard', e.currentTarget));
    $('#scienceLabSchoolBtn')?.addEventListener('click', e => openBank('school', e.currentTarget));
  }

  function renderMenu() {
    const content = $('#catalogContent');
    if (!content) return;

    if ($('#catalogHeaderTitle')) $('#catalogHeaderTitle').textContent = '自然七上｜1-3';
    if ($('#catalogHeaderSub')) $('#catalogHeaderSub').textContent = '認識實驗室｜選擇題庫';
    document.title = '1-3 認識實驗室｜自然七上';

    content.innerHTML = `
      <button class="catalog-back" id="backScienceLabBtn">← 返回單元 1</button>
      <div class="catalog-path">自然　›　七年級上學期（一上）　›　單元 1 生命現象與科學探究　›　1-3 認識實驗室</div>
      <h2 class="catalog-title">1-3　認識實驗室</h2>
      <p class="catalog-sub">題目依 Google Drive canonical 教材知識庫與已核對題型建立；先完成文字題，附圖題稍後補上原卷圖資。</p>
      <div class="catalog-grid">
        <button class="catalog-card" id="scienceLabEasyBtn">
          <span class="top"><span class="icon">${LEVELS.easy.icon}</span><strong>${LEVELS.easy.label}</strong><span class="catalog-badge">20 題</span></span>
          <span class="desc">${LEVELS.easy.desc}</span>
        </button>
        <button class="catalog-card" id="scienceLabMediumBtn">
          <span class="top"><span class="icon">${LEVELS.medium.icon}</span><strong>${LEVELS.medium.label}</strong><span class="catalog-badge">20 題</span></span>
          <span class="desc">${LEVELS.medium.desc}</span>
        </button>
        <button class="catalog-card" id="scienceLabHardBtn">
          <span class="top"><span class="icon">${LEVELS.hard.icon}</span><strong>${LEVELS.hard.label}</strong><span class="catalog-badge">20 題</span></span>
          <span class="desc">${LEVELS.hard.desc}</span>
        </button>
        <button class="catalog-card" id="scienceLabSchoolBtn">
          <span class="top"><span class="icon">🏫</span><strong>各校題庫</strong><span class="catalog-badge school">檢查中</span></span>
          <span class="desc">各校自然科真實段考拆題；保留原始題號、選項順序與來源。</span>
        </button>
      </div>
    `;

    bindMenu();
    updateSchoolBadge();
    showCatalog();
  }

  function openMenu() {
    saveUnitView();
    renderMenu();
  }

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const section = target?.closest?.('[data-science-section="science-7-1-1-3"]');
    if (!section) return;
    event.preventDefault();
    event.stopPropagation();
    openMenu();
  }, true);

  const observer = new MutationObserver(activateSectionCard);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  activateSectionCard();
})();
