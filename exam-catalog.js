(() => {
  'use strict';

  const SUBJECTS = [
    { key: 'chinese', name: '國文', icon: '📖', enabled: true },
    { key: 'english', name: '英文', icon: '🔤', enabled: false },
    { key: 'math', name: '數學', icon: '📐', enabled: false },
    { key: 'science', name: '自然', icon: '🔬', enabled: true },
    { key: 'social', name: '社會', icon: '🌏', enabled: false }
  ];

  const CHINESE_SEMESTERS = [
    { key: '7-1', title: '七年級上學期', short: '一上' },
    { key: '7-2', title: '七年級下學期', short: '一下' },
    { key: '8-1', title: '八年級上學期', short: '二上' },
    { key: '8-2', title: '八年級下學期', short: '二下' },
    { key: '9-1', title: '九年級上學期', short: '三上' },
    { key: '9-2', title: '九年級下學期', short: '三下' }
  ];

  const SCIENCE_SEMESTERS = [
    { key: '7-1', title: '七年級上學期', short: '一上', enabled: true },
    { key: '7-2', title: '七年級下學期', short: '一下', enabled: false },
    { key: '8-1', title: '八年級上學期', short: '二上', enabled: false },
    { key: '8-2', title: '八年級下學期', short: '二下', enabled: false },
    { key: '9-1', title: '九年級上學期', short: '三上', enabled: false },
    { key: '9-2', title: '九年級下學期', short: '三下', enabled: false }
  ];

  const SCIENCE_7_1_CHAPTERS = [
    {
      key: 'science-method',
      number: '第 1 章',
      title: '科學方法',
      desc: '科學方法步驟、實驗組與對照組、變因與資料判讀',
      enabled: true
    }
  ];

  const $ = (sel, root = document) => root.querySelector(sel);

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .catalog-shell{max-width:840px;margin:auto}
      .catalog-header{background:linear-gradient(135deg,#172554,#1d4ed8);color:#fff;border-radius:20px;padding:24px 20px;margin-bottom:16px;box-shadow:0 10px 28px rgba(15,23,42,.14)}
      .catalog-header h1{margin:0 0 4px;font-size:1.65rem}
      .catalog-header p{margin:0;opacity:.9}
      .catalog-panel{background:#fff;border:1px solid #dfe5ee;border-radius:16px;box-shadow:0 4px 14px rgba(15,23,42,.04);padding:22px;margin:14px 0}
      .catalog-title{text-align:center;margin:0 0 6px}
      .catalog-sub{text-align:center;color:#657089;font-size:.92rem;margin:0 0 18px}
      .catalog-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .catalog-card{width:100%;border:2px solid #dfe5ee;background:#fff;border-radius:16px;padding:17px 16px;text-align:left;cursor:pointer;transition:.16s;color:#172033}
      .catalog-card:hover:not(:disabled){transform:translateY(-2px);border-color:#93b4fb;box-shadow:0 7px 20px rgba(37,99,235,.1)}
      .catalog-card:disabled{cursor:default;background:#f8fafc;color:#94a3b8}
      .catalog-card .top{display:flex;align-items:center;gap:11px}
      .catalog-card .icon{font-size:1.6rem;line-height:1}
      .catalog-card strong{font-size:1.16rem}
      .catalog-card .desc{display:block;color:#657089;font-size:.9rem;margin-top:7px}
      .catalog-card:disabled .desc{color:#94a3b8}
      .catalog-badge{display:inline-block;margin-left:auto;border-radius:999px;padding:3px 8px;font-size:.76rem;font-weight:700;background:#eef4ff;color:#1d4ed8}
      .catalog-badge.soon{background:#f1f5f9;color:#64748b}
      .catalog-back{border:0;background:#e2e8f0;color:#1e293b;border-radius:10px;padding:9px 12px;font-weight:700;cursor:pointer;margin-bottom:14px}
      .catalog-path{color:#64748b;font-size:.88rem;margin-bottom:10px}
      .chapter-card{grid-column:1/-1}
      .chapter-card strong{font-size:1.12rem}
      #catalogShell.hidden{display:none!important}
      .chapter-back-row{display:flex;justify-content:flex-start;margin-top:14px}
      #chapterBackBtn{background:#e2e8f0;color:#1e293b}
      @media(max-width:620px){
        .catalog-grid{grid-template-columns:1fr}
        .catalog-panel{padding:17px 14px}
        .catalog-header h1{font-size:1.38rem}
      }
    `;
    document.head.appendChild(style);
  }

  function makeShell() {
    const startScreen = $('#startScreen');
    if (!startScreen || $('#catalogShell')) return null;

    const shell = document.createElement('section');
    shell.id = 'catalogShell';
    shell.className = 'catalog-shell';
    shell.innerHTML = `
      <header class="catalog-header">
        <h1 id="catalogHeaderTitle">國中題庫</h1>
        <p id="catalogHeaderSub">選擇科目開始練習</p>
      </header>
      <div class="catalog-panel">
        <div id="catalogContent"></div>
      </div>
    `;
    startScreen.parentNode.insertBefore(shell, startScreen);
    return shell;
  }

  function setHeader(title, sub) {
    const titleEl = $('#catalogHeaderTitle');
    const subEl = $('#catalogHeaderSub');
    if (titleEl) titleEl.textContent = title;
    if (subEl) subEl.textContent = sub;
  }

  function showSubjects() {
    const shell = $('#catalogShell');
    const startScreen = $('#startScreen');
    const examScreen = $('#examScreen');
    if (!shell) return;

    shell.classList.remove('hidden');
    startScreen?.classList.add('hidden');
    examScreen?.classList.add('hidden');
    setHeader('國中題庫', '先選科目，再選學期與章節');
    document.title = '國中題庫';

    $('#catalogContent').innerHTML = `
      <h2 class="catalog-title">請選擇科目</h2>
      <p class="catalog-sub">目前自然科已有正式題庫，國文科已開始建立學期架構。</p>
      <div class="catalog-grid">
        ${SUBJECTS.map(s => `
          <button class="catalog-card" data-subject="${s.key}" ${s.enabled ? '' : 'disabled'}>
            <span class="top">
              <span class="icon">${s.icon}</span>
              <strong>${s.name}</strong>
              <span class="catalog-badge ${s.enabled ? '' : 'soon'}">${s.enabled ? '已建立' : '建置中'}</span>
            </span>
            <span class="desc">${s.enabled ? '進入科目選擇學期與章節' : '題庫尚未建立'}</span>
          </button>
        `).join('')}
      </div>
    `;

    $('[data-subject="chinese"]')?.addEventListener('click', showChineseSemesters);
    $('[data-subject="science"]')?.addEventListener('click', showScienceSemesters);
  }

  function showChineseSemesters() {
    setHeader('國文科', '選擇年級與學期');
    document.title = '國文科｜國中題庫';
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backSubjectsBtn">← 返回科目</button>
      <div class="catalog-path">國文</div>
      <h2 class="catalog-title">請選擇學期</h2>
      <p class="catalog-sub">六個學期入口已建立；課文章節將依實際教材逐步加入。</p>
      <div class="catalog-grid">
        ${CHINESE_SEMESTERS.map(s => `
          <button class="catalog-card" data-chinese-semester="${s.key}">
            <span class="top">
              <strong>${s.title}</strong>
              <span class="catalog-badge">${s.short}</span>
            </span>
            <span class="desc">查看章節建置狀態</span>
          </button>
        `).join('')}
      </div>
    `;

    $('#backSubjectsBtn')?.addEventListener('click', showSubjects);
    CHINESE_SEMESTERS.forEach(s => {
      $(`[data-chinese-semester="${s.key}"]`)?.addEventListener('click', () => showChineseSemester(s.key));
    });
  }

  function showChineseSemester(semesterKey) {
    const semester = CHINESE_SEMESTERS.find(s => s.key === semesterKey);
    if (!semester) return;

    setHeader(`國文科｜${semester.title}`, '章節建置中');
    document.title = `國文${semester.short}｜國中題庫`;
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backChineseSemestersBtn">← 返回學期</button>
      <div class="catalog-path">國文　›　${semester.title}（${semester.short}）</div>
      <h2 class="catalog-title">章節尚待建立</h2>
      <p class="catalog-sub">此學期入口已完成。等實際課本／講義確認後，再依教材加入課次、題庫與知識基準。</p>
    `;

    $('#backChineseSemestersBtn')?.addEventListener('click', showChineseSemesters);
  }

  function showScienceSemesters() {
    setHeader('自然科', '選擇年級與學期');
    document.title = '自然科｜國中題庫';
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backSubjectsBtn">← 返回科目</button>
      <div class="catalog-path">自然</div>
      <h2 class="catalog-title">請選擇學期</h2>
      <p class="catalog-sub">目前已建立七年級上學期題庫。</p>
      <div class="catalog-grid">
        ${SCIENCE_SEMESTERS.map(s => `
          <button class="catalog-card" data-semester="${s.key}" ${s.enabled ? '' : 'disabled'}>
            <span class="top">
              <strong>${s.title}</strong>
              <span class="catalog-badge ${s.enabled ? '' : 'soon'}">${s.short}</span>
            </span>
            <span class="desc">${s.enabled ? '查看章節' : '尚未建立題庫'}</span>
          </button>
        `).join('')}
      </div>
    `;

    $('#backSubjectsBtn')?.addEventListener('click', showSubjects);
    $('[data-semester="7-1"]')?.addEventListener('click', showScience71Chapters);
  }

  function showScience71Chapters() {
    setHeader('自然科｜七年級上學期', '選擇章節');
    document.title = '自然一上｜國中題庫';
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backSemestersBtn">← 返回學期</button>
      <div class="catalog-path">自然　›　七年級上學期（一上）</div>
      <h2 class="catalog-title">請選擇章節</h2>
      <p class="catalog-sub">選擇章節後，再選簡易／中等／困難開始作答。</p>
      <div class="catalog-grid">
        ${SCIENCE_7_1_CHAPTERS.map(c => `
          <button class="catalog-card chapter-card" data-chapter="${c.key}">
            <span class="top">
              <strong>${c.number}　${c.title}</strong>
              <span class="catalog-badge">目前題庫</span>
            </span>
            <span class="desc">${c.desc}</span>
          </button>
        `).join('')}
      </div>
    `;

    $('#backSemestersBtn')?.addEventListener('click', showScienceSemesters);
    $('[data-chapter="science-method"]')?.addEventListener('click', enterScienceMethod);
  }

  function ensureChapterBackButton() {
    const startScreen = $('#startScreen');
    const panel = $('#startScreen .panel');
    if (!startScreen || !panel || $('#chapterBackBtn')) return;

    const row = document.createElement('div');
    row.className = 'chapter-back-row';
    row.innerHTML = '<button id="chapterBackBtn" class="secondary">← 返回章節</button>';
    panel.appendChild(row);
    $('#chapterBackBtn')?.addEventListener('click', showScience71Chapters);
  }

  function enterScienceMethod() {
    const shell = $('#catalogShell');
    const startScreen = $('#startScreen');
    const examScreen = $('#examScreen');
    shell?.classList.add('hidden');
    examScreen?.classList.add('hidden');
    startScreen?.classList.remove('hidden');
    ensureChapterBackButton();
    document.title = '科學方法模擬考｜自然一上第1章';
  }

  function init() {
    injectStyles();
    if (!makeShell()) return;
    ensureChapterBackButton();
    showSubjects();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
