(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const content = () => $('#catalogContent');

  function isSubjectMenu() {
    const title = $('#catalogContent .catalog-title');
    return !!title && title.textContent.trim() === '請選擇科目';
  }

  function setHeader(title, sub) {
    if ($('#catalogHeaderTitle')) $('#catalogHeaderTitle').textContent = title;
    if ($('#catalogHeaderSub')) $('#catalogHeaderSub').textContent = sub;
  }

  function backButton(id, label, fn) {
    queueMicrotask(() => $(`#${id}`)?.addEventListener('click', fn));
    return `<button class="catalog-back" id="${id}">← ${label}</button>`;
  }

  function card({id, icon='📄', title, badge='', desc='', disabled=false}) {
    return `<button class="catalog-card" id="${id}" ${disabled ? 'disabled' : ''}>
      <span class="top"><span class="icon">${icon}</span><strong>${title}</strong><span class="catalog-badge ${disabled ? 'soon' : ''}">${badge}</span></span>
      <span class="desc">${desc}</span>
    </button>`;
  }

  function injectPastExamCard() {
    const grid = $('#catalogContent .catalog-grid');
    if (!grid || !isSubjectMenu() || $('#pastExamsBtn')) return;
    const button = document.createElement('button');
    button.id = 'pastExamsBtn';
    button.className = 'catalog-card';
    button.innerHTML = `<span class="top"><span class="icon">🧾</span><strong>歷屆考題</strong><span class="catalog-badge">已建立</span></span><span class="desc">國中基測與教育會考歷屆試題，依年度、次別與科目練習。</span>`;
    button.addEventListener('click', showPastExams);
    grid.appendChild(button);
  }

  function showPastExams() {
    setHeader('歷屆考題', '基測／教育會考｜依年度與科目整理');
    document.title = '歷屆考題｜國中題庫';
    content().innerHTML = `
      ${backButton('backFromPastExamsBtn','返回科目',()=>window.location.reload())}
      <div class="catalog-path">歷屆考題</div>
      <h2 class="catalog-title">請選擇考試制度</h2>
      <p class="catalog-sub">已開始收錄完整歷屆試卷，保留原始題號與選項順序。</p>
      <div class="catalog-grid">
        ${card({id:'bctBtn',icon:'📜',title:'國中基本學力測驗（基測）',badge:'已建立',desc:'舊制基測歷屆試題。'})}
        ${card({id:'capBtn',icon:'📝',title:'國中教育會考',badge:'待匯入',desc:'現行教育會考歷屆試題。',disabled:true})}
      </div>`;
    $('#bctBtn')?.addEventListener('click', showBctYears);
  }

  function showBctYears() {
    setHeader('國中基本學力測驗（基測）', '選擇年度');
    content().innerHTML = `
      ${backButton('backBctYearsBtn','返回考試制度',showPastExams)}
      <div class="catalog-path">歷屆考題　›　基測</div>
      <h2 class="catalog-title">請選擇年度</h2>
      <div class="catalog-grid">
        ${card({id:'bct90Btn',icon:'🗓️',title:'90 年度',badge:'已收錄',desc:'已建立第一次基測國文科完整 46 題。'})}
      </div>`;
    $('#bct90Btn')?.addEventListener('click', showBct90Sessions);
  }

  function showBct90Sessions() {
    setHeader('90 年度基測', '選擇測驗次別');
    content().innerHTML = `
      ${backButton('backBct90Btn','返回年度',showBctYears)}
      <div class="catalog-path">歷屆考題　›　基測　›　90 年度</div>
      <h2 class="catalog-title">請選擇次別</h2>
      <div class="catalog-grid">
        ${card({id:'bct90FirstBtn',icon:'1️⃣',title:'第一次',badge:'已收錄',desc:'90 年度第一次國中基本學力測驗。'})}
        ${card({id:'bct90SecondBtn',icon:'2️⃣',title:'第二次',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
      </div>`;
    $('#bct90FirstBtn')?.addEventListener('click', showBct90FirstSubjects);
  }

  function showBct90FirstSubjects() {
    setHeader('90 年度第一次基測', '選擇科目');
    content().innerHTML = `
      ${backButton('backBct90FirstBtn','返回次別',showBct90Sessions)}
      <div class="catalog-path">歷屆考題　›　基測　›　90 年度　›　第一次</div>
      <h2 class="catalog-title">請選擇科目</h2>
      <div class="catalog-grid">
        ${card({id:'bct90FirstChineseBtn',icon:'📖',title:'國文科',badge:'46 題',desc:'完整原題、題組與附圖；以網站考題模式作答。'})}
        ${card({id:'bct90FirstEnglishBtn',icon:'🔤',title:'英文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct90FirstMathBtn',icon:'📐',title:'數學科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct90FirstScienceBtn',icon:'🔬',title:'自然科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct90FirstSocialBtn',icon:'🌏',title:'社會科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
      </div>`;
    $('#bct90FirstChineseBtn')?.addEventListener('click', loadBct90FirstChinese);
  }

  async function loadBct90FirstChinese() {
    const btn = $('#bct90FirstChineseBtn');
    if (btn) { btn.disabled = true; btn.querySelector('.desc').textContent = '正在載入完整試題…'; }
    try {
      const res = await fetch('past-exams/bct/90/first/chinese.json', {cache:'no-store'});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const key = data.exam.difficulty;
      banks[key] = data.questions;
      window.examContexts = window.examContexts || {};
      window.examContexts[key] = {
        ...data.exam,
        key,
        examType:true,
        backLabel:'返回歷屆考題',
        onBack: showBct90FirstSubjects
      };
      startExam(key);
    } catch (e) {
      alert(`試題載入失敗：${e.message}`);
      showBct90FirstSubjects();
    }
  }

  window.showPastExams = showPastExams;
  window.showBct90FirstSubjects = showBct90FirstSubjects;

  function init() {
    const target = $('#catalogContent') || document.body;
    const observer = new MutationObserver(injectPastExamCard);
    observer.observe(target, { childList: true, subtree: true });
    injectPastExamCard();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
