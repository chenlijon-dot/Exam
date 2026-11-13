(() => {
  'use strict';
  const SECTION_KEY = 'science-7-1-4-2';
  const ROOT = 'chapter-bank/science/7-1/unit-04/section-02';
  const LEVELS = {
    easy: { label:'簡易', icon:'🌱', count:20, desc:'蒸散、氣孔、保衛細胞與水分運輸基礎。' },
    medium: { label:'中等', icon:'🌿', count:30, desc:'挖空四選一，涵蓋蒸散原理、氣孔調節及芹菜實驗。' },
    hard: { label:'困難', icon:'🌳', count:50, desc:'切花水柱、實驗控制變因、量筒數據與推論。' }
  };
  const $ = (selector) => document.querySelector(selector);
  let savedView = null;
  let savedHeaderTitle = '';
  let savedHeaderSub = '';
  let savedDocumentTitle = '';

  function showCatalog() {
    $('#catalogShell')?.classList.remove('hidden');
    $('#startScreen')?.classList.add('hidden');
    $('#examScreen')?.classList.add('hidden');
    const result = $('#result');
    if (result) result.style.display = 'none';
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function saveUnitView() {
    const content = $('#catalogContent');
    if (!content || savedView) return;
    savedView = document.createDocumentFragment();
    while (content.firstChild) savedView.appendChild(content.firstChild);
    savedHeaderTitle = $('#catalogHeaderTitle')?.textContent || '自然七上｜單元 4';
    savedHeaderSub = $('#catalogHeaderSub')?.textContent || '生物體內的運輸作用';
    savedDocumentTitle = document.title;
  }
  function restoreUnitView() {
    const content = $('#catalogContent');
    if (!content || !savedView) return;
    content.replaceChildren(savedView);
    savedView = null;
    if ($('#catalogHeaderTitle')) $('#catalogHeaderTitle').textContent = savedHeaderTitle;
    if ($('#catalogHeaderSub')) $('#catalogHeaderSub').textContent = savedHeaderSub;
    document.title = savedDocumentTitle || '自然七上｜單元 4';
    showCatalog();
  }
  async function fetchBank(level) {
    const response = await fetch(ROOT + '/' + level + '.json', {cache:'no-store'});
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    if (!Array.isArray(data.questions)) throw new Error('題庫格式錯誤');
    return data;
  }
  function activeQuestions(data) {
    return data.questions.filter(q =>
      q.lifecycle === 'active' && q.answerVerified === true &&
      typeof q.questionId === 'string' && Number.isInteger(q.revision) &&
      !q.imagePending && !q.optionImagePending
    );
  }
  function makeContext(data, level) {
    const config = LEVELS[level];
    const key = data.exam?.difficulty || 'science-7-1-u04-s02-' + level;
    return {
      ...(data.exam || {}),
      key,
      title: '4-2 蒸散作用與養分運輸｜' + config.label,
      subtitle: '自然七上｜單元 4 生物體內的運輸作用｜4-2 蒸散作用與養分運輸｜' + config.label,
      subject:'science',
      subjectLabel:'自然',
      semester:'7-1',
      semesterLabel:'七年級上學期',
      unitGroup:'unit-04',
      unitGroupLabel:'單元 4 生物體內的運輸作用',
      section:'section-02',
      unit:'4-2 蒸散作用與養分運輸',
      difficulty:level,
      difficultyLabel:config.label,
      scoreMode:'percent',
      analysisEligible:true,
      preserveOptionOrder:false,
      backLabel:'返回 4-2 題庫',
      onBack:renderMenu
    };
  }
  async function openBank(level, button) {
    const config = LEVELS[level];
    if (!config) return;
    const badge = button?.querySelector('.catalog-badge');
    const oldBadge = badge?.textContent || '';
    if (button) button.disabled = true;
    if (badge) badge.textContent = '載入中';
    try {
      const data = await fetchBank(level);
      const questions = activeQuestions(data);
      if (!questions.length) {
        alert('4-2 ' + config.label + '題庫目前沒有已核准的可作答題目。');
        return;
      }
      if (typeof banks === 'undefined' || typeof startExam !== 'function') throw new Error('題庫引擎尚未就緒');
      const context = makeContext(data,level);
      banks[context.key] = questions;
      window.examContexts = window.examContexts || {};
      window.examContexts[context.key] = context;
      startExam(context.key);
    } catch(error) {
      alert('4-2 ' + config.label + '題庫載入失敗：' + error.message);
    } finally {
      if (button) button.disabled = false;
      if (badge) badge.textContent = oldBadge;
    }
  }
  async function updateBadge(level) {
    const button = $('#scienceUnit4_' + level);
    const badge = button?.querySelector('.catalog-badge');
    if (!badge) return;
    try {
      const data = await fetchBank(level);
      const count = activeQuestions(data).length;
      badge.textContent = count ? count + ' 題' : '待審核';
      badge.classList.toggle('soon', !count);
      button.disabled = count === 0;
    } catch {
      badge.textContent = '載入失敗';
      button.disabled = true;
    }
  }
  function renderMenu() {
    const content = $('#catalogContent');
    if (!content) return;
    if ($('#catalogHeaderTitle')) $('#catalogHeaderTitle').textContent = '自然七上｜4-2';
    if ($('#catalogHeaderSub')) $('#catalogHeaderSub').textContent = '蒸散作用與養分運輸｜選擇題庫';
    document.title = '4-2 蒸散作用與養分運輸｜自然七上';
    const options = Object.entries(LEVELS).map(([level,info]) =>
      '<button class="catalog-card" id="scienceUnit4_' + level + '">' +
      '<span class="top"><span class="icon">' + info.icon + '</span><strong>' + info.label + '</strong><span class="catalog-badge">檢查中</span></span>' +
      '<span class="desc">' + info.desc + '</span></button>'
    ).join('');
    content.innerHTML =
      '<button class="catalog-back" id="backScienceUnit4Btn">← 返回單元 4</button>' +
      '<div class="catalog-path">自然　›　七年級上學期（一上）　›　單元 4 生物體內的運輸作用　›　4-2 蒸散作用與養分運輸</div>' +
      '<h2 class="catalog-title">4-2　蒸散作用與養分運輸</h2>' +
      '<p class="catalog-sub">簡易 20 題、中等 30 題（挖空選擇題）、困難 50 題；百分比計分，保留錯題歷程。</p>' +
      '<div class="catalog-grid">' + options +
      '<button class="catalog-card" disabled><span class="top"><strong>🏫 各校題庫</strong><span class="catalog-badge soon">待建立</span></span><span class="desc">4-2 真實段考題後續獨立匯入。</span></button>' +
      '<button class="catalog-card" disabled><span class="top"><strong>📘 自修題庫</strong><span class="catalog-badge soon">待建立</span></span><span class="desc">參考書原題獨立保存。</span></button></div>';
    $('#backScienceUnit4Btn')?.addEventListener('click', restoreUnitView);
    Object.keys(LEVELS).forEach(level => {
      $('#scienceUnit4_' + level)?.addEventListener('click', event => openBank(level, event.currentTarget));
      updateBadge(level);
    });
    showCatalog();
  }
  document.addEventListener('click', event => {
    const card = event.target?.closest?.('[data-science-section]');
    if (card?.getAttribute('data-science-section') !== SECTION_KEY) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    saveUnitView();
    renderMenu();
  }, true);
})();
