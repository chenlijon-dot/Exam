(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const content = () => $('#catalogContent');

  function isSubjectMenu() {
    const title = $('#catalogContent .catalog-title');
    const headerTitle = $('#catalogHeaderTitle');
    const hasPath = !!$('#catalogContent .catalog-path');
    return !!title && !!headerTitle &&
      title.textContent.trim() === '請選擇科目' &&
      headerTitle.textContent.trim() === '國中題庫' &&
      !hasPath;
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
        ${card({id:'bct90Btn',icon:'🗓️',title:'90 年度',badge:'已收錄',desc:'第一次、第二次皆已收錄國文與數學。'})}
        ${card({id:'bct91Btn',icon:'🗓️',title:'91 年度',badge:'已收錄',desc:'第一次、第二次數學科皆已建立題目、原卷附圖與詳解。'})}
        ${card({id:'bct92Btn',icon:'🗓️',title:'92 年度',badge:'已收錄',desc:'第一次、第二次數學科皆已建立題目、答案、原卷附圖與詳解。'})}
        ${card({id:'bct93Btn',icon:'🗓️',title:'93 年度',badge:'已收錄',desc:'第一次、第二次數學科皆已建立題目、答案、原卷附圖與詳解。'})}
        ${card({id:'bct94Btn',icon:'🗓️',title:'94 年度',badge:'已收錄',desc:'第一次、第二次數學科皆已建立題目、答案、原卷附圖與逐題詳解。'})}
        ${card({id:'bct95Btn',icon:'🗓️',title:'95 年度',badge:'已收錄',desc:'第一次、第二次數學科皆已建立 33 題、官方答案、原卷附圖與逐題詳解。'})}
        ${card({id:'bct96Btn',icon:'🗓️',title:'96 年度',badge:'已收錄',desc:'第一次、第二次数學科皆已建立 33 題、官方答案、原卷附圖與逐題詳解。'})}
        ${card({id:'bct97Btn',icon:'🗓️',title:'97 年度',badge:'已收錄',desc:'第一次、第二次数學科皆已建立 34 題、官方答案、原卷附圖與逐題詳解。'})}
        ${card({id:'bct98Btn',icon:'🗓️',title:'98 年度',badge:'已收錄',desc:'第一次、第二次数學科皆已建立 34 題、官方答案、原卷附圖與逐題詳解。'})}
      </div>`;
    $('#bct90Btn')?.addEventListener('click', showBct90Sessions);
    $('#bct91Btn')?.addEventListener('click', showBct91Sessions);
    $('#bct92Btn')?.addEventListener('click', showBct92Sessions);
    $('#bct93Btn')?.addEventListener('click', showBct93Sessions);
    $('#bct94Btn')?.addEventListener('click', showBct94Sessions);
    $('#bct95Btn')?.addEventListener('click', showBct95Sessions);
    $('#bct96Btn')?.addEventListener('click', showBct96Sessions);
    $('#bct97Btn')?.addEventListener('click', showBct97Sessions);
    $('#bct98Btn')?.addEventListener('click', showBct98Sessions);
  }

  function showBct90Sessions() {
    setHeader('90 年度基測', '選擇測驗次別');
    content().innerHTML = `
      ${backButton('backBct90Btn','返回年度',showBctYears)}
      <div class="catalog-path">歷屆考題　›　基測　›　90 年度</div>
      <h2 class="catalog-title">請選擇次別</h2>
      <div class="catalog-grid">
        ${card({id:'bct90FirstBtn',icon:'1️⃣',title:'第一次',badge:'已收錄',desc:'90 年度第一次國中基本學力測驗。'})}
        ${card({id:'bct90SecondBtn',icon:'2️⃣',title:'第二次',badge:'已收錄',desc:'90 年度第二次國中基本學力測驗。'})}
      </div>`;
    $('#bct90FirstBtn')?.addEventListener('click', showBct90FirstSubjects);
    $('#bct90SecondBtn')?.addEventListener('click', showBct90SecondSubjects);
  }

  function showBct91Sessions() {
    setHeader('91 年度基測', '選擇測驗次別');
    content().innerHTML = `
      ${backButton('backBct91Btn','返回年度',showBctYears)}
      <div class="catalog-path">歷屆考題　›　基測　›　91 年度</div>
      <h2 class="catalog-title">請選擇次別</h2>
      <div class="catalog-grid">
        ${card({id:'bct91FirstBtn',icon:'1️⃣',title:'第一次',badge:'已收錄',desc:'91 年度第一次基測；數學科題目、附圖與詳解已建立。'})}
        ${card({id:'bct91SecondBtn',icon:'2️⃣',title:'第二次',badge:'已收錄',desc:'91 年度第二次基測；數學科題目、原卷附圖與詳解已建立。'})}
      </div>`;
    $('#bct91FirstBtn')?.addEventListener('click', showBct91FirstSubjects);
    $('#bct91SecondBtn')?.addEventListener('click', showBct91SecondSubjects);
  }

  function showBct92Sessions() {
    setHeader('92 年度基測', '選擇測驗次別');
    content().innerHTML = `
      ${backButton('backBct92Btn','返回年度',showBctYears)}
      <div class="catalog-path">歷屆考題　›　基測　›　92 年度</div>
      <h2 class="catalog-title">請選擇次別</h2>
      <div class="catalog-grid">
        ${card({id:'bct92FirstBtn',icon:'1️⃣',title:'第一次',badge:'已收錄',desc:'92 年度第一次基測；數學科題目、答案、原卷附圖與詳解已建立。'})}
        ${card({id:'bct92SecondBtn',icon:'2️⃣',title:'第二次',badge:'已收錄',desc:'92 年度第二次基測；數學科題目、答案、原卷附圖與詳解已建立。'})}
      </div>`;
    $('#bct92FirstBtn')?.addEventListener('click', showBct92FirstSubjects);
    $('#bct92SecondBtn')?.addEventListener('click', showBct92SecondSubjects);
  }

  function showBct93Sessions() {
    setHeader('93 年度基測', '選擇測驗次別');
    content().innerHTML = `
      ${backButton('backBct93Btn','返回年度',showBctYears)}
      <div class="catalog-path">歷屆考題　›　基測　›　93 年度</div>
      <h2 class="catalog-title">請選擇次別</h2>
      <div class="catalog-grid">
        ${card({id:'bct93FirstBtn',icon:'1️⃣',title:'第一次',badge:'已收錄',desc:'93 年度第一次基測；數學科題目、答案、原卷附圖與詳解已建立。'})}
        ${card({id:'bct93SecondBtn',icon:'2️⃣',title:'第二次',badge:'已收錄',desc:'93 年度第二次基測；數學科題目、答案、原卷附圖與詳解已建立。'})}
      </div>`;
    $('#bct93FirstBtn')?.addEventListener('click', showBct93FirstSubjects);
    $('#bct93SecondBtn')?.addEventListener('click', showBct93SecondSubjects);
  }

  function showBct94Sessions() {
    setHeader('94 年度基測', '選擇測驗次別');
    content().innerHTML = `
      ${backButton('backBct94Btn','返回年度',showBctYears)}
      <div class="catalog-path">歷屆考題　›　基測　›　94 年度</div>
      <h2 class="catalog-title">請選擇次別</h2>
      <div class="catalog-grid">
        ${card({id:'bct94FirstBtn',icon:'1️⃣',title:'第一次',badge:'已收錄',desc:'94 年度第一次基測；數學科題目、答案、原卷附圖與詳解已建立。'})}
        ${card({id:'bct94SecondBtn',icon:'2️⃣',title:'第二次',badge:'已收錄',desc:'94 年度第二次基測；數學科題目、答案、原卷附圖與詳解已建立。'})}
      </div>`;
    $('#bct94FirstBtn')?.addEventListener('click', showBct94FirstSubjects);
    $('#bct94SecondBtn')?.addEventListener('click', showBct94SecondSubjects);
  }

  function showBct95Sessions() {
    setHeader('95 年度基測', '選擇測驗次別');
    content().innerHTML = `
      ${backButton('backBct95Btn','返回年度',showBctYears)}
      <div class="catalog-path">歷屆考題　›　基測　›　95 年度</div>
      <h2 class="catalog-title">請選擇次別</h2>
      <div class="catalog-grid">
        ${card({id:'bct95FirstBtn',icon:'1️⃣',title:'第一次',badge:'已收錄',desc:'95 年度第一次基測；數學科 33 題、答案、原卷附圖與逐題詳解已建立。'})}
        ${card({id:'bct95SecondBtn',icon:'2️⃣',title:'第二次',badge:'已收錄',desc:'95 年度第二次基測；數學科 33 題、官方答案、原卷附圖與逐題詳解已建立。'})}
      </div>`;
    $('#bct95FirstBtn')?.addEventListener('click', showBct95FirstSubjects);
    $('#bct95SecondBtn')?.addEventListener('click', showBct95SecondSubjects);
  }

  function showBct96Sessions() {
    setHeader('96 年度基測', '選擇測驗次別');
    content().innerHTML = `
      ${backButton('backBct96Btn','返回年度',showBctYears)}
      <div class="catalog-path">歷屆考題　›　基測　›　96 年度</div>
      <h2 class="catalog-title">請選擇次別</h2>
      <div class="catalog-grid">
        ${card({id:'bct96FirstBtn',icon:'1️⃣',title:'第一次',badge:'已收錄',desc:'96 年度第一次基測；數學科 33 題、官方答案、原卷附圖與逐題詳解已建立。'})}
        ${card({id:'bct96SecondBtn',icon:'2️⃣',title:'第二次',badge:'已收錄',desc:'96 年度第二次基測；數學科 33 題、官方答案、原卷附圖與逐題詳解已建立。'})}
      </div>`;
    $('#bct96FirstBtn')?.addEventListener('click', showBct96FirstSubjects);
    $('#bct96SecondBtn')?.addEventListener('click', showBct96SecondSubjects);
  }

  function showBct97Sessions() {
    setHeader('97 年度基測', '選擇測驗次別');
    content().innerHTML = `
      ${backButton('backBct97Btn','返回年度',showBctYears)}
      <div class="catalog-path">歷屆考題　›　基測　›　97 年度</div>
      <h2 class="catalog-title">請選擇次別</h2>
      <div class="catalog-grid">
        ${card({id:'bct97FirstBtn',icon:'1️⃣',title:'第一次',badge:'34 題',desc:'97 年度第一次基測；數學科 34 題、官方答案、原卷附圖與逐題詳解已建立。'})}
        ${card({id:'bct97SecondBtn',icon:'2️⃣',title:'第二次',badge:'34 題',desc:'97 年度第二次基測；數學科 34 題、官方答案、原卷附圖與逐題詳解已建立。'})}
      </div>`;
    $('#bct97FirstBtn')?.addEventListener('click', showBct97FirstSubjects);
    $('#bct97SecondBtn')?.addEventListener('click', showBct97SecondSubjects);
  }
  function showBct98Sessions() {
    setHeader('98 年度基測', '選擇測驗次別');
    content().innerHTML = `
      ${backButton('backBct98Btn','返回年度',showBctYears)}
      <div class="catalog-path">歷屆考題　›　基測　›　98 年度</div>
      <h2 class="catalog-title">請選擇次別</h2>
      <div class="catalog-grid">
        ${card({id:'bct98FirstBtn',icon:'1️⃣',title:'第一次',badge:'34 題',desc:'98 年度第一次基測；數學科 34 題、官方答案、原卷附圖與逐題詳解已建立。'})}
        ${card({id:'bct98SecondBtn',icon:'2️⃣',title:'第二次',badge:'34 題',desc:'98 年度第二次基測；數學科 34 題、官方答案、原卷附圖與逐題詳解已建立。'})}
      </div>`;
    $('#bct98FirstBtn')?.addEventListener('click', showBct98FirstSubjects);
    $('#bct98SecondBtn')?.addEventListener('click', showBct98SecondSubjects);
  }

  function subjectCards(prefix, chineseCount, {mathCount=null}={}) {
    const hasMath = Number.isInteger(mathCount);
    return `
      ${card({id:`${prefix}ChineseBtn`,icon:'📖',title:'國文科',badge:`${chineseCount} 題`,desc:'完整原題、題組與附圖；以網站考題模式作答。'})}
      ${card({id:`${prefix}EnglishBtn`,icon:'🔤',title:'英文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
      ${card({id:`${prefix}MathBtn`,icon:'📐',title:'數學科',badge:hasMath?`${mathCount} 題`:'待匯入',desc:hasMath?'完整原題與數學公式；附圖與詳解依題庫建置狀態顯示。':'尚未匯入。',disabled:!hasMath})}
      ${card({id:`${prefix}ScienceBtn`,icon:'🔬',title:'自然科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
      ${card({id:`${prefix}SocialBtn`,icon:'🌏',title:'社會科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}`;
  }

  function showBct90FirstSubjects() {
    setHeader('90 年度第一次基測', '選擇科目');
    content().innerHTML = `
      ${backButton('backBct90FirstBtn','返回次別',showBct90Sessions)}
      <div class="catalog-path">歷屆考題　›　基測　›　90 年度　›　第一次</div>
      <h2 class="catalog-title">請選擇科目</h2>
      <div class="catalog-grid">${subjectCards('bct90First',46,{mathCount:32})}</div>`;
    $('#bct90FirstChineseBtn')?.addEventListener('click', () => loadPastExam({buttonId:'bct90FirstChineseBtn',path:'past-exams/bct/90/first/chinese.json',onBack:showBct90FirstSubjects}));
    $('#bct90FirstMathBtn')?.addEventListener('click', () => loadPastExam({buttonId:'bct90FirstMathBtn',path:'past-exams/bct/90/first/math.json',explanationsPath:'past-exams/bct/90/first/math-explanations.json',onBack:showBct90FirstSubjects}));
  }

  function showBct90SecondSubjects() {
    setHeader('90 年度第二次基測', '選擇科目');
    content().innerHTML = `
      ${backButton('backBct90SecondBtn','返回次別',showBct90Sessions)}
      <div class="catalog-path">歷屆考題　›　基測　›　90 年度　›　第二次</div>
      <h2 class="catalog-title">請選擇科目</h2>
      <div class="catalog-grid">${subjectCards('bct90Second',47,{mathCount:31})}</div>`;
    $('#bct90SecondChineseBtn')?.addEventListener('click', () => loadPastExam({buttonId:'bct90SecondChineseBtn',path:'past-exams/bct/90/second/chinese.json',onBack:showBct90SecondSubjects}));
    $('#bct90SecondMathBtn')?.addEventListener('click', () => loadPastExam({buttonId:'bct90SecondMathBtn',path:'past-exams/bct/90/second/math.json',explanationsPath:'past-exams/bct/90/second/math-explanations.json',onBack:showBct90SecondSubjects}));
  }

  function showBct91FirstSubjects() {
    setHeader('91 年度第一次基測', '選擇科目');
    content().innerHTML = `
      ${backButton('backBct91FirstBtn','返回次別',showBct91Sessions)}
      <div class="catalog-path">歷屆考題　›　基測　›　91 年度　›　第一次</div>
      <h2 class="catalog-title">請選擇科目</h2>
      <div class="catalog-grid">
        ${card({id:'bct91FirstChineseBtn',icon:'📖',title:'國文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct91FirstEnglishBtn',icon:'🔤',title:'英文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct91FirstMathBtn',icon:'📐',title:'數學科',badge:'31 題',desc:'31 題原題、原卷附圖與逐題詳解已建立。'})}
        ${card({id:'bct91FirstScienceBtn',icon:'🔬',title:'自然科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct91FirstSocialBtn',icon:'🌏',title:'社會科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
      </div>`;
    $('#bct91FirstMathBtn')?.addEventListener('click', () => loadPastExam({buttonId:'bct91FirstMathBtn',path:'past-exams/bct/91/first/math.json',explanationsPath:'past-exams/bct/91/first/math-explanations.json',onBack:showBct91FirstSubjects}));
  }

  function showBct91SecondSubjects() {
    setHeader('91 年度第二次基測', '選擇科目');
    content().innerHTML = `
      ${backButton('backBct91SecondBtn','返回次別',showBct91Sessions)}
      <div class="catalog-path">歷屆考題　›　基測　›　91 年度　›　第二次</div>
      <h2 class="catalog-title">請選擇科目</h2>
      <div class="catalog-grid">
        ${card({id:'bct91SecondChineseBtn',icon:'📖',title:'國文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct91SecondEnglishBtn',icon:'🔤',title:'英文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct91SecondMathBtn',icon:'📐',title:'數學科',badge:'31 題',desc:'31 題原題、選項、答案、原卷附圖與逐題詳解已建立。'})}
        ${card({id:'bct91SecondScienceBtn',icon:'🔬',title:'自然科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct91SecondSocialBtn',icon:'🌏',title:'社會科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
      </div>`;
    $('#bct91SecondMathBtn')?.addEventListener('click', () => loadPastExam({buttonId:'bct91SecondMathBtn',path:'past-exams/bct/91/second/math.json',explanationsPath:'past-exams/bct/91/second/math-explanations.json',onBack:showBct91SecondSubjects}));
  }

  function showBct92FirstSubjects() {
    setHeader('92 年度第一次基測', '選擇科目');
    content().innerHTML = `
      ${backButton('backBct92FirstBtn','返回次別',showBct92Sessions)}
      <div class="catalog-path">歷屆考題　›　基測　›　92 年度　›　第一次</div>
      <h2 class="catalog-title">請選擇科目</h2>
      <div class="catalog-grid">
        ${card({id:'bct92FirstChineseBtn',icon:'📖',title:'國文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct92FirstEnglishBtn',icon:'🔤',title:'英文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct92FirstMathBtn',icon:'📐',title:'數學科',badge:'31 題',desc:'31 題原題、答案、原卷附圖與逐題詳解已建立。'})}
        ${card({id:'bct92FirstScienceBtn',icon:'🔬',title:'自然科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct92FirstSocialBtn',icon:'🌏',title:'社會科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
      </div>`;
    $('#bct92FirstMathBtn')?.addEventListener('click', () => loadPastExam({buttonId:'bct92FirstMathBtn',path:'past-exams/bct/92/first/math.json',explanationsPath:'past-exams/bct/92/first/math-explanations.json',onBack:showBct92FirstSubjects}));
  }

  function showBct92SecondSubjects() {
    setHeader('92 年度第二次基測', '選擇科目');
    content().innerHTML = `
      ${backButton('backBct92SecondBtn','返回次別',showBct92Sessions)}
      <div class="catalog-path">歷屆考題　›　基測　›　92 年度　›　第二次</div>
      <h2 class="catalog-title">請選擇科目</h2>
      <div class="catalog-grid">
        ${card({id:'bct92SecondChineseBtn',icon:'📖',title:'國文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct92SecondEnglishBtn',icon:'🔤',title:'英文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct92SecondMathBtn',icon:'📐',title:'數學科',badge:'31 題',desc:'31 題原題、答案、原卷附圖與逐題詳解已建立。'})}
        ${card({id:'bct92SecondScienceBtn',icon:'🔬',title:'自然科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct92SecondSocialBtn',icon:'🌏',title:'社會科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
      </div>`;
    $('#bct92SecondMathBtn')?.addEventListener('click', () => loadPastExam({buttonId:'bct92SecondMathBtn',path:'past-exams/bct/92/second/math.json',explanationsPath:'past-exams/bct/92/second/math-explanations.json',onBack:showBct92SecondSubjects}));
  }

  function showBct93FirstSubjects() {
    setHeader('93 年度第一次基測', '選擇科目');
    content().innerHTML = `
      ${backButton('backBct93FirstBtn','返回次別',showBct93Sessions)}
      <div class="catalog-path">歷屆考題　›　基測　›　93 年度　›　第一次</div>
      <h2 class="catalog-title">請選擇科目</h2>
      <div class="catalog-grid">
        ${card({id:'bct93FirstChineseBtn',icon:'📖',title:'國文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct93FirstEnglishBtn',icon:'🔤',title:'英文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct93FirstMathBtn',icon:'📐',title:'數學科',badge:'32 題',desc:'32 題原題、答案、原卷附圖與逐題詳解已建立。'})}
        ${card({id:'bct93FirstScienceBtn',icon:'🔬',title:'自然科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct93FirstSocialBtn',icon:'🌏',title:'社會科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
      </div>`;
    $('#bct93FirstMathBtn')?.addEventListener('click', () => loadPastExam({
      buttonId:'bct93FirstMathBtn',
      path:'past-exams/bct/93/first/math.json',
      explanationsPath:'past-exams/bct/93/first/math-explanations.json',
      onBack:showBct93FirstSubjects
    }));
  }

  function showBct93SecondSubjects() {
    setHeader('93 年度第二次基測', '選擇科目');
    content().innerHTML = `
      ${backButton('backBct93SecondBtn','返回次別',showBct93Sessions)}
      <div class="catalog-path">歷屆考題　›　基測　›　93 年度　›　第二次</div>
      <h2 class="catalog-title">請選擇科目</h2>
      <div class="catalog-grid">
        ${card({id:'bct93SecondChineseBtn',icon:'📖',title:'國文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct93SecondEnglishBtn',icon:'🔤',title:'英文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct93SecondMathBtn',icon:'📐',title:'數學科',badge:'32 題',desc:'32 題原題、答案、原卷附圖與逐題詳解已建立。'})}
        ${card({id:'bct93SecondScienceBtn',icon:'🔬',title:'自然科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct93SecondSocialBtn',icon:'🌏',title:'社會科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
      </div>`;
    $('#bct93SecondMathBtn')?.addEventListener('click', () => loadPastExam({
      buttonId:'bct93SecondMathBtn',
      path:'past-exams/bct/93/second/math.json',
      explanationsPath:'past-exams/bct/93/second/math-explanations.json',
      onBack:showBct93SecondSubjects
    }));
  }

  function showBct94FirstSubjects() {
    setHeader('94 年度第一次基測', '選擇科目');
    content().innerHTML = `
      ${backButton('backBct94FirstBtn','返回次別',showBct94Sessions)}
      <div class="catalog-path">歷屆考題　›　基測　›　94 年度　›　第一次</div>
      <h2 class="catalog-title">請選擇科目</h2>
      <div class="catalog-grid">
        ${card({id:'bct94FirstChineseBtn',icon:'📖',title:'國文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct94FirstEnglishBtn',icon:'🔤',title:'英文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct94FirstMathBtn',icon:'📐',title:'數學科',badge:'33 題',desc:'33 題原題、答案、原卷附圖與逐題詳解已建立。'})}
        ${card({id:'bct94FirstScienceBtn',icon:'🔬',title:'自然科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct94FirstSocialBtn',icon:'🌏',title:'社會科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
      </div>`;
    $('#bct94FirstMathBtn')?.addEventListener('click', () => loadPastExam({
      buttonId:'bct94FirstMathBtn',
      path:'past-exams/bct/94/first/math.json',
      explanationsPath:'past-exams/bct/94/first/math-explanations.json',
      onBack:showBct94FirstSubjects
    }));
  }

  function showBct94SecondSubjects() {
    setHeader('94 年度第二次基測', '選擇科目');
    content().innerHTML = `
      ${backButton('backBct94SecondBtn','返回次別',showBct94Sessions)}
      <div class="catalog-path">歷屆考題　›　基測　›　94 年度　›　第二次</div>
      <h2 class="catalog-title">請選擇科目</h2>
      <div class="catalog-grid">
        ${card({id:'bct94SecondChineseBtn',icon:'📖',title:'國文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct94SecondEnglishBtn',icon:'🔤',title:'英文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct94SecondMathBtn',icon:'📐',title:'數學科',badge:'33 題',desc:'33 題原題、答案、原卷附圖與逐題詳解已建立。'})}
        ${card({id:'bct94SecondScienceBtn',icon:'🔬',title:'自然科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct94SecondSocialBtn',icon:'🌏',title:'社會科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
      </div>`;
    $('#bct94SecondMathBtn')?.addEventListener('click', () => loadPastExam({
      buttonId:'bct94SecondMathBtn',
      path:'past-exams/bct/94/second/math.json',
      explanationsPath:'past-exams/bct/94/second/math-explanations.json',
      onBack:showBct94SecondSubjects
    }));
  }

  function showBct95FirstSubjects() {
    setHeader('95 年度第一次基測', '選擇科目');
    content().innerHTML = `
      ${backButton('backBct95FirstBtn','返回次別',showBct95Sessions)}
      <div class="catalog-path">歷屆考題　›　基測　›　95 年度　›　第一次</div>
      <h2 class="catalog-title">請選擇科目</h2>
      <div class="catalog-grid">
        ${card({id:'bct95FirstChineseBtn',icon:'📖',title:'國文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct95FirstEnglishBtn',icon:'🔤',title:'英文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct95FirstMathBtn',icon:'📐',title:'數學科',badge:'33 題',desc:'33 題原題、官方答案、原卷附圖與逐題詳解已建立。'})}
        ${card({id:'bct95FirstScienceBtn',icon:'🔬',title:'自然科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct95FirstSocialBtn',icon:'🌏',title:'社會科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
      </div>`;
    $('#bct95FirstMathBtn')?.addEventListener('click', () => loadPastExam({
      buttonId:'bct95FirstMathBtn',
      path:'past-exams/bct/95/first/math.json',
      explanationsPath:'past-exams/bct/95/first/math-explanations.json',
      onBack:showBct95FirstSubjects
    }));
  }
  function showBct95SecondSubjects() {
    setHeader('95 年度第二次基測', '選擇科目');
    content().innerHTML = `
      ${backButton('backBct95SecondBtn','返回次別',showBct95Sessions)}
      <div class="catalog-path">歷屆考題　›　基測　›　95 年度　›　第二次</div>
      <h2 class="catalog-title">請選擇科目</h2>
      <div class="catalog-grid">
        ${card({id:'bct95SecondChineseBtn',icon:'📖',title:'國文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct95SecondEnglishBtn',icon:'🔤',title:'英文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct95SecondMathBtn',icon:'📐',title:'數學科',badge:'33 題',desc:'33 題原題、官方答案、原卷附圖與逐題詳解已建立。'})}
        ${card({id:'bct95SecondScienceBtn',icon:'🔬',title:'自然科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct95SecondSocialBtn',icon:'🌏',title:'社會科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
      </div>`;
    $('#bct95SecondMathBtn')?.addEventListener('click', () => loadPastExam({
      buttonId:'bct95SecondMathBtn',
      path:'past-exams/bct/95/second/math.json',
      explanationsPath:'past-exams/bct/95/second/math-explanations.json',
      onBack:showBct95SecondSubjects
    }));
  }

  function showBct96FirstSubjects() {
    setHeader('96 年度第一次基測', '選擇科目');
    content().innerHTML = `
      ${backButton('backBct96FirstBtn','返回次別',showBct96Sessions)}
      <div class="catalog-path">歷屆考題　›　基測　›　96 年度　›　第一次</div>
      <h2 class="catalog-title">請選擇科目</h2>
      <div class="catalog-grid">
        ${card({id:'bct96FirstChineseBtn',icon:'📖',title:'國文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct96FirstEnglishBtn',icon:'🔤',title:'英文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct96FirstMathBtn',icon:'📐',title:'數學科',badge:'33 題',desc:'33 題原題、官方答案、原卷附圖與逐題詳解已建立。'})}
        ${card({id:'bct96FirstScienceBtn',icon:'🔬',title:'自然科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct96FirstSocialBtn',icon:'🌏',title:'社會科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
      </div>`;
    $('#bct96FirstMathBtn')?.addEventListener('click', () => loadPastExam({
      buttonId:'bct96FirstMathBtn',
      path:'past-exams/bct/96/first/math.json',
      explanationsPath:'past-exams/bct/96/first/math-explanations.json',
      onBack:showBct96FirstSubjects
    }));
  }

  function showBct96SecondSubjects() {
    setHeader('96 年度第二次基測', '選擇科目');
    content().innerHTML = `
      ${backButton('backBct96SecondBtn','返回次別',showBct96Sessions)}
      <div class="catalog-path">歷屆考題　›　基測　›　96 年度　›　第二次</div>
      <h2 class="catalog-title">請選擇科目</h2>
      <div class="catalog-grid">
        ${card({id:'bct96SecondChineseBtn',icon:'📖',title:'國文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct96SecondEnglishBtn',icon:'🔤',title:'英文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct96SecondMathBtn',icon:'📐',title:'數學科',badge:'33 題',desc:'33 題原題、官方答案、原卷附圖與逐題詳解已建立。'})}
        ${card({id:'bct96SecondScienceBtn',icon:'🔬',title:'自然科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct96SecondSocialBtn',icon:'🌏',title:'社會科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
      </div>`;
    $('#bct96SecondMathBtn')?.addEventListener('click', () => loadPastExam({
      buttonId:'bct96SecondMathBtn',
      path:'past-exams/bct/96/second/math.json',
      explanationsPath:'past-exams/bct/96/second/math-explanations.json',
      onBack:showBct96SecondSubjects
    }));
  }


  function showBct97FirstSubjects() {
    setHeader('97 年度第一次基測', '選擇科目');
    content().innerHTML = `
      ${backButton('backBct97FirstBtn','返回次別',showBct97Sessions)}
      <div class="catalog-path">歷屆考題　›　基測　›　97 年度　›　第一次</div>
      <h2 class="catalog-title">請選擇科目</h2>
      <div class="catalog-grid">
        ${card({id:'bct97FirstChineseBtn',icon:'📖',title:'國文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct97FirstEnglishBtn',icon:'🔤',title:'英文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct97FirstMathBtn',icon:'📐',title:'數學科',badge:'34 題',desc:'34 題原題、官方答案、19 張原卷裁圖與逐題詳解已建立。'})}
        ${card({id:'bct97FirstScienceBtn',icon:'🔬',title:'自然科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct97FirstSocialBtn',icon:'🌏',title:'社會科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
      </div>`;
    $('#bct97FirstMathBtn')?.addEventListener('click', () => loadPastExam({
      buttonId:'bct97FirstMathBtn',
      path:'past-exams/bct/97/first/math.json',
      explanationsPath:'past-exams/bct/97/first/math-explanations.json',
      onBack:showBct97FirstSubjects
    }));
  }

  function showBct97SecondSubjects() {
    setHeader('97 年度第二次基測', '選擇科目');
    content().innerHTML = `
      ${backButton('backBct97SecondBtn','返回次別',showBct97Sessions)}
      <div class="catalog-path">歷屆考題　›　基測　›　97 年度　›　第二次</div>
      <h2 class="catalog-title">請選擇科目</h2>
      <div class="catalog-grid">
        ${card({id:'bct97SecondChineseBtn',icon:'📖',title:'國文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct97SecondEnglishBtn',icon:'🔤',title:'英文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct97SecondMathBtn',icon:'📐',title:'數學科',badge:'34 題',desc:'34 題原題、官方答案、17 張原卷裁圖與逐題詳解已建立。'})}
        ${card({id:'bct97SecondScienceBtn',icon:'🔬',title:'自然科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct97SecondSocialBtn',icon:'🌏',title:'社會科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
      </div>`;
    $('#bct97SecondMathBtn')?.addEventListener('click', () => loadPastExam({
      buttonId:'bct97SecondMathBtn',
      path:'past-exams/bct/97/second/math.json',
      explanationsPath:'past-exams/bct/97/second/math-explanations.json',
      onBack:showBct97SecondSubjects
    }));
  }

  function showBct98FirstSubjects() {
    setHeader('98 年度第一次基測', '選擇科目');
    content().innerHTML = `
      ${backButton('backBct98FirstBtn','返回次別',showBct98Sessions)}
      <div class="catalog-path">歷屆考題　›　基測　›　98 年度　›　第一次</div>
      <h2 class="catalog-title">請選擇科目</h2>
      <div class="catalog-grid">
        ${card({id:'bct98FirstChineseBtn',icon:'📖',title:'國文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct98FirstEnglishBtn',icon:'🔤',title:'英文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct98FirstMathBtn',icon:'📐',title:'數學科',badge:'34 題',desc:'34 題原題、官方答案、15 張原卷裁圖與逐題詳解已建立。'})}
        ${card({id:'bct98FirstScienceBtn',icon:'🔬',title:'自然科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct98FirstSocialBtn',icon:'🌏',title:'社會科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
      </div>`;
    $('#bct98FirstMathBtn')?.addEventListener('click', () => loadPastExam({
      buttonId:'bct98FirstMathBtn',
      path:'past-exams/bct/98/first/math.json',
      explanationsPath:'past-exams/bct/98/first/math-explanations.json',
      onBack:showBct98FirstSubjects
    }));
  }

  function showBct98SecondSubjects() {
    setHeader('98 年度第二次基測', '選擇科目');
    content().innerHTML = `
      ${backButton('backBct98SecondBtn','返回次別',showBct98Sessions)}
      <div class="catalog-path">歷屆考題　›　基測　›　98 年度　›　第二次</div>
      <h2 class="catalog-title">請選擇科目</h2>
      <div class="catalog-grid">
        ${card({id:'bct98SecondChineseBtn',icon:'📖',title:'國文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct98SecondEnglishBtn',icon:'🔤',title:'英文科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct98SecondMathBtn',icon:'📐',title:'數學科',badge:'34 題',desc:'34 題原題、官方答案、18 張原卷裁圖與逐題詳解已建立。'})}
        ${card({id:'bct98SecondScienceBtn',icon:'🔬',title:'自然科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
        ${card({id:'bct98SecondSocialBtn',icon:'🌏',title:'社會科',badge:'待匯入',desc:'尚未匯入。',disabled:true})}
      </div>`;
    $('#bct98SecondMathBtn')?.addEventListener('click', () => loadPastExam({
      buttonId:'bct98SecondMathBtn',
      path:'past-exams/bct/98/second/math.json',
      explanationsPath:'past-exams/bct/98/second/math-explanations.json',
      onBack:showBct98SecondSubjects
    }));
  }

  async function loadCompanionExplanations(path, data) {
    if (!path) return;
    try {
      const res = await fetch(path, {cache:'no-store'});
      if (!res.ok) return;
      const details = await res.json();
      const explanations = details?.explanations || {};
      const answerOverrides = details?.answerOverrides || {};
      for (const q of data.questions || []) {
        const number = String(q.number || '');
        if (Object.prototype.hasOwnProperty.call(explanations, number)) q.e = explanations[number];
        if (Object.prototype.hasOwnProperty.call(answerOverrides, number)) q.a = Number(answerOverrides[number]);
      }
      if (details?.note) data.exam.solutionNote = details.note;
    } catch (error) {
      console.warn('歷屆詳解載入失敗，仍使用原題庫內容：', error);
    }
  }

  async function loadPastExam({buttonId, path, explanationsPath=null, onBack}) {
    const btn = $(`#${buttonId}`);
    if (btn) {
      btn.disabled = true;
      const desc = btn.querySelector('.desc');
      if (desc) desc.textContent = '正在載入完整試題…';
    }
    try {
      const res = await fetch(path, {cache:'no-store'});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      await loadCompanionExplanations(explanationsPath, data);
      const key = data.exam.difficulty;
      banks[key] = data.questions;
      window.examContexts = window.examContexts || {};
      window.examContexts[key] = {...data.exam,key,examType:true,backLabel:'返回歷屆考題',onBack};
      startExam(key);
    } catch (e) {
      alert(`試題載入失敗：${e.message}`);
      onBack();
    }
  }

  window.showPastExams = showPastExams;
  window.showBct90FirstSubjects = showBct90FirstSubjects;
  window.showBct90SecondSubjects = showBct90SecondSubjects;
  window.showBct91FirstSubjects = showBct91FirstSubjects;
  window.showBct91SecondSubjects = showBct91SecondSubjects;
  window.showBct92FirstSubjects = showBct92FirstSubjects;
  window.showBct92SecondSubjects = showBct92SecondSubjects;
  window.showBct93FirstSubjects = showBct93FirstSubjects;
  window.showBct93SecondSubjects = showBct93SecondSubjects;
  window.showBct94FirstSubjects = showBct94FirstSubjects;
  window.showBct94SecondSubjects = showBct94SecondSubjects;
  window.showBct95FirstSubjects = showBct95FirstSubjects;
  window.showBct95SecondSubjects = showBct95SecondSubjects;
  window.showBct96FirstSubjects = showBct96FirstSubjects;
  window.showBct96SecondSubjects = showBct96SecondSubjects;
  window.showBct97FirstSubjects = showBct97FirstSubjects;
  window.showBct97SecondSubjects = showBct97SecondSubjects;
  window.showBct98FirstSubjects = showBct98FirstSubjects;
  window.showBct98SecondSubjects = showBct98SecondSubjects;

  function init() {
    const target = $('#catalogContent') || document.body;
    const observer = new MutationObserver(injectPastExamCard);
    observer.observe(target, { childList: true, subtree: true });
    injectPastExamCard();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();