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

  // 國文第一冊依已確認教材逐課建立；未確認的課次不先猜測。
  const CHINESE_7_1_LESSONS = [
    {
      key: 'chinese-7-1-lesson-01',
      code: '第一課',
      title: '夏夜',
      referenceReady: true,
      quizReady: false,
      desc: '教材知識庫已建立並持續整理；正式章節題庫待建。'
    },
    {
      key: 'chinese-7-1-lesson-02',
      code: '第二課',
      title: '手的故事',
      referenceReady: true,
      quizReady: false,
      desc: '課文內容與教材知識庫已建立；待正式課本頁面補齊後持續校對並建立題庫。'
    }
  ];

  const SCIENCE_SEMESTERS = [
    { key: '7-1', title: '七年級上學期', short: '一上', enabled: true },
    { key: '7-2', title: '七年級下學期', short: '一下', enabled: false },
    { key: '8-1', title: '八年級上學期', short: '二上', enabled: false },
    { key: '8-2', title: '八年級下學期', short: '二下', enabled: false },
    { key: '9-1', title: '九年級上學期', short: '三上', enabled: false },
    { key: '9-2', title: '九年級下學期', short: '三下', enabled: false }
  ];

  // 依使用者提供之七年級上學期自然教材目錄建立。
  // 尚未建立題目的小節仍先保留在 catalog，避免日後章節定位漂移。
  const SCIENCE_7_1_UNITS = [
    {
      key: 'unit-1', number: '單元 1', title: '生命現象與科學探究',
      sections: [
        { key: 'science-7-1-1-1', code: '1-1', title: '生命現象和生物圈', enabled: false },
        { key: 'science-method', code: '1-2', title: '科學方法', enabled: true, desc: '科學方法步驟、實驗組與對照組、變因與資料判讀' },
        { key: 'science-7-1-1-3', code: '1-3', title: '認識實驗室', enabled: false },
        { key: 'science-7-1-core-1', code: '核心素養', title: '生活在沙漠中的生物', enabled: false, type: 'literacy' }
      ]
    },
    {
      key: 'unit-2', number: '單元 2', title: '生物體的構造',
      sections: [
        { key: 'science-7-1-2-1', code: '2-1', title: '生物體的基本構造', enabled: false },
        { key: 'science-7-1-2-2', code: '2-2', title: '細胞的形態和構造', enabled: false },
        { key: 'science-7-1-2-3', code: '2-3', title: '有關生命的物質', enabled: false },
        { key: 'science-7-1-2-4', code: '2-4', title: '從細胞到生物體', enabled: false },
        { key: 'science-7-1-core-2', code: '核心素養', title: '生命的起源', enabled: false, type: 'literacy' }
      ]
    },
    {
      key: 'unit-3', number: '單元 3', title: '生物體內的營養',
      sections: [
        { key: 'science-7-1-3-1', code: '3-1', title: '食物和養分', enabled: false },
        { key: 'science-7-1-3-2', code: '3-2', title: '酵素的作用', enabled: false },
        { key: 'science-7-1-3-3', code: '3-3', title: '光合作用', enabled: false },
        { key: 'science-7-1-3-4', code: '3-4', title: '人體的消化系統', enabled: false },
        { key: 'science-7-1-core-3', code: '核心素養', title: '養分的消化與吸收', enabled: false, type: 'literacy' }
      ]
    },
    {
      key: 'unit-4', number: '單元 4', title: '生物體內的運輸作用',
      sections: [
        { key: 'science-7-1-4-1', code: '4-1', title: '植物的維管束', enabled: false },
        { key: 'science-7-1-4-2', code: '4-2', title: '蒸散作用與養分運輸', enabled: false },
        { key: 'science-7-1-4-3', code: '4-3', title: '人體的血液循環', enabled: false },
        { key: 'science-7-1-4-4', code: '4-4', title: '人體的循環系統', enabled: false },
        { key: 'science-7-1-core-4', code: '核心素養', title: '人體的專一性防禦作用', enabled: false, type: 'literacy' }
      ]
    },
    {
      key: 'unit-5', number: '單元 5', title: '生物體內的協調作用',
      sections: [
        { key: 'science-7-1-5-1', code: '5-1', title: '刺激與反應', enabled: false },
        { key: 'science-7-1-5-2', code: '5-2', title: '神經系統', enabled: false },
        { key: 'science-7-1-5-3', code: '5-3', title: '內分泌系統', enabled: false },
        { key: 'science-7-1-5-4', code: '5-4', title: '行為與感應', enabled: false },
        { key: 'science-7-1-core-5', code: '核心素養', title: '動物印痕', enabled: false, type: 'literacy' }
      ]
    },
    {
      key: 'unit-6', number: '單元 6', title: '生物體內的恆定性',
      sections: [
        { key: 'science-7-1-6-1', code: '6-1', title: '呼吸運動與氣體恆定', enabled: false },
        { key: 'science-7-1-6-2', code: '6-2', title: '排泄作用與水分恆定', enabled: false },
        { key: 'science-7-1-6-3', code: '6-3', title: '體溫恆定與血糖恆定', enabled: false },
        { key: 'science-7-1-core-6', code: '核心素養', title: '糖尿病', enabled: false, type: 'literacy' }
      ]
    },
    {
      key: 'cross-topic', number: '跨科主題', title: '尺度的認識與應用',
      sections: [
        { key: 'science-7-1-cross-scale', code: '跨科主題', title: '尺度的認識與應用', enabled: false, type: 'cross' }
      ]
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
      .catalog-badge{display:inline-block;margin-left:auto;border-radius:999px;padding:3px 8px;font-size:.76rem;font-weight:700;background:#eef4ff;color:#1d4ed8;white-space:nowrap}
      .catalog-badge.soon{background:#f1f5f9;color:#64748b}
      .catalog-badge.core{background:#fff7ed;color:#c2410c}
      .catalog-badge.reference{background:#ecfdf5;color:#047857}
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
      <p class="catalog-sub">目前自然科已有正式題庫，國文科已開始建立學期與課次架構。</p>
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
      <p class="catalog-sub">七年級上學期已開始建立實際課次；其他學期將依教材逐步加入。</p>
      <div class="catalog-grid">
        ${CHINESE_SEMESTERS.map(s => `
          <button class="catalog-card" data-chinese-semester="${s.key}">
            <span class="top">
              <strong>${s.title}</strong>
              <span class="catalog-badge ${s.key === '7-1' ? 'reference' : ''}">${s.short}</span>
            </span>
            <span class="desc">${s.key === '7-1' ? '第一冊已建立第一課〈夏夜〉與第二課〈手的故事〉' : '查看章節建置狀態'}</span>
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

    if (semesterKey === '7-1') {
      showChinese71Lessons();
      return;
    }

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

  function showChinese71Lessons() {
    setHeader('國文科｜七年級上學期', '第一冊｜選擇課次');
    document.title = '國文第一冊｜七年級上學期';
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backChineseSemestersBtn">← 返回學期</button>
      <div class="catalog-path">國文　›　七年級上學期（一上）　›　第一冊</div>
      <h2 class="catalog-title">請選擇課次</h2>
      <p class="catalog-sub">已依目前確認的實際教材建立第一、二課；其他課次待教材確認後再加入。</p>
      <div class="catalog-grid">
        ${CHINESE_7_1_LESSONS.map(lesson => `
          <button class="catalog-card chapter-card" data-chinese-lesson="${lesson.key}">
            <span class="top">
              <strong>${lesson.code}　${lesson.title}</strong>
              <span class="catalog-badge ${lesson.quizReady ? '' : 'reference'}">${lesson.quizReady ? '題庫可用' : '教材建置中'}</span>
            </span>
            <span class="desc">${lesson.desc}</span>
          </button>
        `).join('')}
      </div>
    `;

    $('#backChineseSemestersBtn')?.addEventListener('click', showChineseSemesters);
    CHINESE_7_1_LESSONS.forEach(lesson => {
      $(`[data-chinese-lesson="${lesson.key}"]`)?.addEventListener('click', () => showChinese71Lesson(lesson.key));
    });
  }

  function showChinese71Lesson(lessonKey) {
    const lesson = CHINESE_7_1_LESSONS.find(item => item.key === lessonKey);
    if (!lesson) return;

    setHeader(`國文第一冊｜${lesson.code}`, lesson.title);
    document.title = `${lesson.code} ${lesson.title}｜國文第一冊`;
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backChinese71LessonsBtn">← 返回課次</button>
      <div class="catalog-path">國文　›　七年級上學期（一上）　›　第一冊　›　${lesson.code} ${lesson.title}</div>
      <h2 class="catalog-title">${lesson.code}　${lesson.title}</h2>
      <p class="catalog-sub">課次節點與教材知識庫架構已建立；目前正在收錄原始課本／講義內容，正式章節題庫尚未開放。</p>
      <div class="catalog-grid">
        <button class="catalog-card chapter-card" disabled>
          <span class="top">
            <strong>📚 教材參考資料</strong>
            <span class="catalog-badge reference">知識庫已建立</span>
          </span>
          <span class="desc">Google Drive canonical 教材知識庫已建立，內容將依你提供的課本照片、課文與講義持續整理。</span>
        </button>
        <button class="catalog-card chapter-card" disabled>
          <span class="top">
            <strong>📝 章節題庫</strong>
            <span class="catalog-badge soon">待建</span>
          </span>
          <span class="desc">教材內容確認後，再建立本課自編題與各校段考拆解題。</span>
        </button>
      </div>
    `;

    $('#backChinese71LessonsBtn')?.addEventListener('click', showChinese71Lessons);
  }

  function showScienceSemesters() {
    setHeader('自然科', '選擇年級與學期');
    document.title = '自然科｜國中題庫';
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backSubjectsBtn">← 返回科目</button>
      <div class="catalog-path">自然</div>
      <h2 class="catalog-title">請選擇學期</h2>
      <p class="catalog-sub">七年級上學期已依目前教材目錄建立完整單元架構。</p>
      <div class="catalog-grid">
        ${SCIENCE_SEMESTERS.map(s => `
          <button class="catalog-card" data-semester="${s.key}" ${s.enabled ? '' : 'disabled'}>
            <span class="top">
              <strong>${s.title}</strong>
              <span class="catalog-badge ${s.enabled ? '' : 'soon'}">${s.short}</span>
            </span>
            <span class="desc">${s.enabled ? '查看單元與小節' : '尚未建立題庫'}</span>
          </button>
        `).join('')}
      </div>
    `;

    $('#backSubjectsBtn')?.addEventListener('click', showSubjects);
    $('[data-semester="7-1"]')?.addEventListener('click', showScience71Units);
  }

  function showScience71Units() {
    setHeader('自然科｜七年級上學期', '選擇單元');
    document.title = '自然一上｜國中題庫';
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backSemestersBtn">← 返回學期</button>
      <div class="catalog-path">自然　›　七年級上學期（一上）</div>
      <h2 class="catalog-title">請選擇單元</h2>
      <p class="catalog-sub">目前 1-2「科學方法」已有題庫；其餘單元與小節先完成分類，題目後續加入。</p>
      <div class="catalog-grid">
        ${SCIENCE_7_1_UNITS.map(u => {
          const ready = u.sections.filter(s => s.enabled).length;
          return `
            <button class="catalog-card chapter-card" data-science-unit="${u.key}">
              <span class="top">
                <strong>${u.number}　${u.title}</strong>
                <span class="catalog-badge ${ready ? '' : 'soon'}">${ready ? `${ready} 節可作答` : '架構已建'}</span>
              </span>
              <span class="desc">${u.sections.map(s => `${s.code} ${s.title}`).join('、')}</span>
            </button>`;
        }).join('')}
      </div>
    `;

    $('#backSemestersBtn')?.addEventListener('click', showScienceSemesters);
    SCIENCE_7_1_UNITS.forEach(u => {
      $(`[data-science-unit="${u.key}"]`)?.addEventListener('click', () => showScience71Unit(u.key));
    });
  }

  // 舊函式名稱保留給既有返回流程／其他模組相容。
  function showScience71Chapters() {
    showScience71Units();
  }

  function showScience71Unit(unitKey) {
    const unit = SCIENCE_7_1_UNITS.find(u => u.key === unitKey);
    if (!unit) return;

    setHeader(`自然一上｜${unit.number}`, unit.title);
    document.title = `${unit.number} ${unit.title}｜自然一上`;
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backScienceUnitsBtn">← 返回單元</button>
      <div class="catalog-path">自然　›　七年級上學期（一上）　›　${unit.number} ${unit.title}</div>
      <h2 class="catalog-title">${unit.number}　${unit.title}</h2>
      <p class="catalog-sub">已建立教材小節分類；標示「題庫可用」者可以開始作答。</p>
      <div class="catalog-grid">
        ${unit.sections.map(s => `
          <button class="catalog-card chapter-card" data-science-section="${s.key}" ${s.enabled ? '' : 'disabled'}>
            <span class="top">
              <strong>${s.code}　${s.title}</strong>
              <span class="catalog-badge ${s.enabled ? '' : (s.type === 'literacy' ? 'core' : 'soon')}">${s.enabled ? '題庫可用' : (s.type === 'literacy' ? '核心素養｜待建' : '建置中')}</span>
            </span>
            <span class="desc">${s.enabled ? (s.desc || '進入題庫') : '章節位置已建立，題目後續補入。'}</span>
          </button>
        `).join('')}
      </div>
    `;

    $('#backScienceUnitsBtn')?.addEventListener('click', showScience71Units);
    if (unitKey === 'unit-1') {
      $('[data-science-section="science-method"]')?.addEventListener('click', enterScienceMethod);
    }
  }

  function ensureChapterBackButton() {
    const startScreen = $('#startScreen');
    const panel = $('#startScreen .panel');
    if (!startScreen || !panel || $('#chapterBackBtn')) return;

    const row = document.createElement('div');
    row.className = 'chapter-back-row';
    row.innerHTML = '<button id="chapterBackBtn" class="secondary">← 返回單元 1</button>';
    panel.appendChild(row);
    $('#chapterBackBtn')?.addEventListener('click', () => showScience71Unit('unit-1'));
  }

  function enterScienceMethod() {
    const shell = $('#catalogShell');
    const startScreen = $('#startScreen');
    const examScreen = $('#examScreen');
    shell?.classList.add('hidden');
    examScreen?.classList.add('hidden');
    startScreen?.classList.remove('hidden');
    ensureChapterBackButton();

    const h1 = $('#startScreen header h1');
    const p = $('#startScreen header p');
    if (h1) h1.textContent = '1-2 科學方法模擬考';
    if (p) p.textContent = '自然七上｜單元 1 生命現象與科學探究｜1-2 科學方法';
    document.title = '1-2 科學方法模擬考｜自然七上單元1';
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