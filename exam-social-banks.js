(() => {
  'use strict';

  const BASE_PATH = 'chapter-bank/social/7-1/geography/chapter-01';
  const BANK_PATHS = {
    easy: `${BASE_PATH}/practice-easy.json`,
    medium: `${BASE_PATH}/practice-medium.json`,
    hard: `${BASE_PATH}/practice-hard.json`
  };
  const $ = (sel, root = document) => root.querySelector(sel);
  const LEVELS = {
    easy: { label: '簡易', icon: '🌱', desc: '基本名詞、直接判讀與單一步驟概念。' },
    medium: { label: '中等', icon: '🌿', desc: '比較、時差、比例尺換算與生活情境。' },
    hard: { label: '困難', icon: '🌳', desc: '跨概念整合、多步驟計算與條件推理。' }
  };

  let chapterViewFragment = null;
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

  function saveChapterView() {
    const content = $('#catalogContent');
    if (!content || chapterViewFragment) return;
    chapterViewFragment = document.createDocumentFragment();
    while (content.firstChild) chapterViewFragment.appendChild(content.firstChild);
    savedHeaderTitle = $('#catalogHeaderTitle')?.textContent || '社會七上｜地理';
    savedHeaderSub = $('#catalogHeaderSub')?.textContent || '臺灣的環境（上）';
    savedDocumentTitle = document.title;
  }

  function restoreChapterView() {
    const content = $('#catalogContent');
    if (!content || !chapterViewFragment) return;
    content.replaceChildren();
    content.appendChild(chapterViewFragment);
    chapterViewFragment = null;
    if ($('#catalogHeaderTitle')) $('#catalogHeaderTitle').textContent = savedHeaderTitle;
    if ($('#catalogHeaderSub')) $('#catalogHeaderSub').textContent = savedHeaderSub;
    document.title = savedDocumentTitle || '地理第一冊｜七年級上學期';
    showCatalog();
  }

  async function openPractice(level, button) {
    const item = LEVELS[level];
    if (!item) return;
    const badge = button?.querySelector('.catalog-badge');
    const oldBadge = badge?.textContent || '10 題';
    if (button) button.disabled = true;
    if (badge) badge.textContent = '載入中';
    try {
      const res = await fetch(BANK_PATHS[level], { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const questions = Array.isArray(data.questions) ? data.questions : [];
      if (questions.length !== 10) throw new Error('題庫題數異常');
      if (typeof banks === 'undefined' || typeof startExam !== 'function') throw new Error('題庫引擎尚未就緒');

      const key = data.exam?.difficulty || `social-7-1-geo01-${level}`;
      banks[key] = questions;
      window.examContexts = window.examContexts || {};
      window.examContexts[key] = {
        ...(data.exam || {}),
        key,
        backLabel: '返回第一章題庫',
        onBack: showSocialGeo01MenuAfterExam
      };
      startExam(key);
    } catch (error) {
      alert(`題庫載入失敗：${error.message}`);
    } finally {
      if (button) button.disabled = false;
      if (badge) badge.textContent = oldBadge;
    }
  }

  function bindMenuButtons() {
    $('#backSocialGeo01Btn')?.addEventListener('click', restoreChapterView);
    $('#socialGeo01EasyBtn')?.addEventListener('click', event => openPractice('easy', event.currentTarget));
    $('#socialGeo01MediumBtn')?.addEventListener('click', event => openPractice('medium', event.currentTarget));
    $('#socialGeo01HardBtn')?.addEventListener('click', event => openPractice('hard', event.currentTarget));
  }

  function renderSocialGeo01Menu() {
    const content = $('#catalogContent');
    if (!content) return;
    if ($('#catalogHeaderTitle')) $('#catalogHeaderTitle').textContent = '社會七上｜地理第1章';
    if ($('#catalogHeaderSub')) $('#catalogHeaderSub').textContent = '認識位置與地圖｜選擇難度';
    document.title = '第1章 認識位置與地圖｜社會七上';
    content.innerHTML = `
      <button class="catalog-back" id="backSocialGeo01Btn">← 返回地理章節</button>
      <div class="catalog-path">社會　›　地理　›　七年級上學期（一上）　›　第一冊　›　第1章 認識位置與地圖</div>
      <h2 class="catalog-title">第1章　認識位置與地圖</h2>
      <p class="catalog-sub">目前先以文字選擇題為主；每個難度 10 題，每題 10 分。</p>
      <div class="catalog-grid">
        ${Object.entries(LEVELS).map(([key, item]) => `
          <button class="catalog-card" id="socialGeo01${key[0].toUpperCase() + key.slice(1)}Btn">
            <span class="top"><span class="icon">${item.icon}</span><strong>${item.label}</strong><span class="catalog-badge">10 題</span></span>
            <span class="desc">${item.desc}</span>
          </button>`).join('')}
      </div>`;
    bindMenuButtons();
    showCatalog();
  }

  function openSocialGeo01Menu() {
    saveChapterView();
    renderSocialGeo01Menu();
  }

  function showSocialGeo01MenuAfterExam() {
    renderSocialGeo01Menu();
  }

  document.addEventListener('click', event => {
    const chapter = event.target.closest?.('[data-social-chapter="geo-01"]');
    if (!chapter) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openSocialGeo01Menu();
  }, true);
})();