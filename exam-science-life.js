(() => {
  'use strict';

  const ROOT = 'chapter-bank/science/7-1/unit-01/section-01';
  const BANKS = {
    easy: `${ROOT}/easy.json`,
    medium: `${ROOT}/medium.json`,
    hard: `${ROOT}/hard.json`,
    school: `${ROOT}/school-exams.json`,
    selfStudy: `${ROOT}/self-study.json`
  };

  const LEVELS = {
    easy: { icon:'🌱', label:'簡易', desc:'基本生命現象、生物與非生物、生物圈基本概念。' },
    medium: { icon:'🌿', label:'中等', desc:'環境限制因子、生物適應與情境判讀。' },
    hard: { icon:'🌳', label:'困難', desc:'綜合資料、生物圈圖表、極端環境與素養推論。' }
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
    window.scrollTo({ top:0, behavior:'smooth' });
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
  }

  async function fetchBank(path) {
    const res = await fetch(path, { cache:'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.questions)) throw new Error('題庫格式錯誤');
    return data;
  }

  function liveQuestions(data) {
    return data.questions.filter(q => !q.imagePending && !q.optionImagePending);
  }

  function makeContext(data, key) {
    const isPractice = ['easy','medium','hard'].includes(key);
    const label = key === 'school' ? '各校題庫' : key === 'selfStudy' ? '自修題庫' : LEVELS[key]?.label || key;
    return {
      ...(data.exam || {}),
      key: data.exam?.difficulty || `science-7-1-u01-s01-${key}`,
      title: `1-1 生命現象和生物圈｜${label}`,
      subtitle: `自然七上｜單元 1 生命現象與科學探究｜1-1 生命現象和生物圈｜${label}`,
      subject:'science',
      subjectLabel:'自然',
      semester:'7-1',
      semesterLabel:'七年級上學期',
      unitGroup:'unit-01',
      unitGroupLabel:'單元 1 生命現象與科學探究',
      section:'section-01',
      unit:'1-1 生命現象和生物圈',
      difficulty:key,
      difficultyLabel:label,
      scoreMode:isPractice ? 'fixed' : 'percent',
      pointsPerQuestion:isPractice ? 5 : undefined,
      analysisEligible:true,
      preserveOptionOrder:!isPractice,
      examType:key === 'school',
      backLabel:'返回 1-1 題庫',
      onBack:renderMenu
    };
  }

  async function openBank(key, button) {
    const path = BANKS[key];
    if (!path) return;
    const badge = button?.querySelector('.catalog-badge');
    const oldBadge = badge?.textContent || '';
    if (button) button.disabled = true;
    if (badge) badge.textContent = '載入中';
    try {
      const data = await fetchBank(path);
      const questions = liveQuestions(data);
      if (!questions.length) {
        alert('這個題庫入口已建立，目前題目尚待匯入。');
        return;
      }
      if (typeof banks === 'undefined' || typeof startExam !== 'function') throw new Error('題庫引擎尚未就緒');
      const bankKey = data.exam?.difficulty || `science-7-1-u01-s01-${key}`;
      banks[bankKey] = questions;
      window.examContexts = window.examContexts || {};
      window.examContexts[bankKey] = makeContext(data, key);
      startExam(bankKey);
    } catch (error) {
      alert(`1-1 題庫載入失敗：${error.message}`);
    } finally {
      if (button) button.disabled = false;
      if (badge) badge.textContent = oldBadge;
    }
  }

  async function updateBadge(buttonId, key) {
    const button = $(buttonId);
    const badge = button?.querySelector('.catalog-badge');
    const desc = button?.querySelector('.desc');
    if (!button || !badge) return;
    try {
      const data = await fetchBank(BANKS[key]);
      const count = liveQuestions(data).length;
      const pending = data.questions.length - count;
      if (!count) {
        badge.textContent = '待建立';
        badge.classList.add('soon');
        if (desc) desc.textContent = key === 'school'
          ? '各校段考入口已建立，題目待匯入。'
          : `${LEVELS[key]?.label || ''}題庫入口已建立，題目待建立。`;
      } else {
        badge.textContent = pending ? `${count} 題可作答｜${pending} 題待圖` : `${count} 題`;
        badge.classList.remove('soon');
        if (key === 'selfStudy') badge.classList.add('school');
      }
    } catch {
      badge.textContent = '載入失敗';
    }
  }

  function bindMenu() {
    $('#backScienceLifeBtn')?.addEventListener('click', restoreUnitView);
    $('#scienceLifeEasyBtn')?.addEventListener('click', e => openBank('easy', e.currentTarget));
    $('#scienceLifeMediumBtn')?.addEventListener('click', e => openBank('medium', e.currentTarget));
    $('#scienceLifeHardBtn')?.addEventListener('click', e => openBank('hard', e.currentTarget));
    $('#scienceLifeSchoolBtn')?.addEventListener('click', e => openBank('school', e.currentTarget));
    $('#scienceLifeSelfStudyBtn')?.addEventListener('click', e => openBank('selfStudy', e.currentTarget));
  }

  function renderMenu() {
    const content = $('#catalogContent');
    if (!content) return;

    if ($('#catalogHeaderTitle')) $('#catalogHeaderTitle').textContent = '自然七上｜1-1';
    if ($('#catalogHeaderSub')) $('#catalogHeaderSub').textContent = '生命現象和生物圈｜選擇題庫';
    document.title = '1-1 生命現象和生物圈｜自然七上';

    content.innerHTML = `
      <button class="catalog-back" id="backScienceLifeBtn">← 返回單元 1</button>
      <div class="catalog-path">自然　›　七年級上學期（一上）　›　單元 1 生命現象與科學探究　›　1-1 生命現象和生物圈</div>
      <h2 class="catalog-title">1-1　生命現象和生物圈</h2>
      <p class="catalog-sub">自編題依難度建立；各校題庫保留真實段考來源；自修題庫保留新無敵自然自修原題與原始選項。</p>
      <div class="catalog-grid">
        <button class="catalog-card" id="scienceLifeEasyBtn"><span class="top"><span class="icon">${LEVELS.easy.icon}</span><strong>${LEVELS.easy.label}</strong><span class="catalog-badge">檢查中</span></span><span class="desc">${LEVELS.easy.desc}</span></button>
        <button class="catalog-card" id="scienceLifeMediumBtn"><span class="top"><span class="icon">${LEVELS.medium.icon}</span><strong>${LEVELS.medium.label}</strong><span class="catalog-badge">檢查中</span></span><span class="desc">${LEVELS.medium.desc}</span></button>
        <button class="catalog-card" id="scienceLifeHardBtn"><span class="top"><span class="icon">${LEVELS.hard.icon}</span><strong>${LEVELS.hard.label}</strong><span class="catalog-badge">檢查中</span></span><span class="desc">${LEVELS.hard.desc}</span></button>
        <button class="catalog-card" id="scienceLifeSchoolBtn"><span class="top"><span class="icon">🏫</span><strong>各校題庫</strong><span class="catalog-badge">檢查中</span></span><span class="desc">各校自然科真實段考拆題；保留原始題號、選項順序、圖片與來源。</span></button>
        <button class="catalog-card" id="scienceLifeSelfStudyBtn"><span class="top"><span class="icon">📘</span><strong>自修題庫</strong><span class="catalog-badge school">檢查中</span></span><span class="desc">新無敵自然自修 1-1 原題；答案已依解答篇與書內印刷答案核對。</span></button>
      </div>
    `;

    bindMenu();
    updateBadge('#scienceLifeEasyBtn','easy');
    updateBadge('#scienceLifeMediumBtn','medium');
    updateBadge('#scienceLifeHardBtn','hard');
    updateBadge('#scienceLifeSchoolBtn','school');
    updateBadge('#scienceLifeSelfStudyBtn','selfStudy');
    showCatalog();
  }

  function openMenu() {
    saveUnitView();
    renderMenu();
  }

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const section = target?.closest('[data-science-section="science-7-1-1-1"]');
    if (!section) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openMenu();
  }, true);
})();
