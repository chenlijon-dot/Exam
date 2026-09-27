(() => {
  'use strict';

  const MATH_SEMESTERS = [
    { key: '7-1', title: '七年級上學期', short: '一上', enabled: true },
    { key: '7-2', title: '七年級下學期', short: '一下', enabled: false },
    { key: '8-1', title: '八年級上學期', short: '二上', enabled: false },
    { key: '8-2', title: '八年級下學期', short: '二下', enabled: false },
    { key: '9-1', title: '九年級上學期', short: '三上', enabled: false },
    { key: '9-2', title: '九年級下學期', short: '三下', enabled: false }
  ];

  const MATH_7_1_UNITS = [
    {
      key: 'unit-1', number: '單元 1', title: '數與數線', page: 4,
      sections: [
        {
          code: '1-1', title: '正數與負數', page: 8,
          bankMenuReady: true,
          banks: {
            easy: 'chapter-bank/math/7-1/1-1/easy.json',
            medium: 'chapter-bank/math/7-1/1-1/medium.json',
            hard: 'chapter-bank/math/7-1/1-1/hard.json',
            school: {
              bankPath: 'chapter-bank/math/7-1/1-1/school-exams-banqiao-114.json',
              extraPaths: [
                'chapter-bank/math/7-1/1-1/school-exams-tucheng-114.json',
                'chapter-bank/math/7-1/1-1/school-exams-chiayi-113.json',
                'chapter-bank/math/7-1/1-1/school-exams-zhongxing-112.json'
              ]
            }
          },
          schoolCount: 4
        },
        {
          code: '1-2', title: '正負數的加減', page: 23,
          bankMenuReady: true,
          banks: {
            easy: 'chapter-bank/math/7-1/1-2/easy.json',
            medium: 'chapter-bank/math/7-1/1-2/medium.json',
            hard: 'chapter-bank/math/7-1/1-2/hard.json',
            school: {
              bankPath: 'chapter-bank/math/7-1/1-2/school-exams-banqiao-114.json',
              extraPaths: [
                'chapter-bank/math/7-1/1-2/school-exams-tucheng-114.json',
                'chapter-bank/math/7-1/1-2/school-exams-chiayi-113.json',
                'chapter-bank/math/7-1/1-2/school-exams-zhongxing-112.json'
              ]
            }
          },
          schoolCount: 4
        },
        {
          code: '1-3', title: '正負數的乘除', page: 46,
          bankMenuReady: true,
          banks: {
            easy: 'chapter-bank/math/7-1/1-3/easy.json',
            medium: 'chapter-bank/math/7-1/1-3/medium.json',
            hard: 'chapter-bank/math/7-1/1-3/hard.json',
            school: {
              bankPath: 'chapter-bank/math/7-1/1-3/school-exams-banqiao-114.json',
              extraPaths: [
                'chapter-bank/math/7-1/1-3/school-exams-tucheng-114.json',
                'chapter-bank/math/7-1/1-3/school-exams-chiayi-113.json',
                'chapter-bank/math/7-1/1-3/school-exams-zhongxing-112.json'
              ]
            }
          },
          schoolCount: 4
        },
        {
          code: '1-4', title: '指數記法與科學記號', page: 63,
          bankMenuReady: true,
          banks: {
            easy: 'chapter-bank/math/7-1/1-4/easy.json',
            medium: 'chapter-bank/math/7-1/1-4/medium.json',
            hard: 'chapter-bank/math/7-1/1-4/hard.json',
            school: {
              bankPath: 'chapter-bank/math/7-1/1-4/school-exams-banqiao-114.json',
              extraPaths: [
                'chapter-bank/math/7-1/1-4/school-exams-tucheng-114.json',
                'chapter-bank/math/7-1/1-4/school-exams-chiayi-113.json',
                'chapter-bank/math/7-1/1-4/school-exams-zhongxing-112.json'
              ]
            }
          },
          schoolCount: 4
        }
      ]
    },
    {
      key: 'unit-2', number: '單元 2', title: '標準分解式與分數運算', page: 80,
      sections: [
        { code: '2-1', title: '質因數分解', page: 84 },
        { code: '2-2', title: '最大公因數與最小公倍數', page: 100 },
        { code: '2-3', title: '分數的四則運算', page: 118 },
        { code: '2-4', title: '指數律', page: 137 }
      ]
    },
    {
      key: 'unit-3', number: '單元 3', title: '一元一次方程式', page: 152,
      sections: [
        { code: '3-1', title: '式子的運算', page: 156 },
        { code: '3-2', title: '解一元一次方程式', page: 174 },
        { code: '3-3', title: '應用問題', page: 190 }
      ]
    }
  ];

  const MATH_7_1_EXTRAS = [
    { title: '名詞解釋', page: 209 },
    { title: '教學附件', page: 213 },
    { title: '資訊普拉斯｜計算機介紹', page: 225 },
    { title: '迷思逃脫', page: 227 },
    { title: '穿越數學史', page: 229 },
    { title: '趣學數學', page: 231 },
    { title: '趣玩桌遊', page: 233 }
  ];

  const $ = (sel, root = document) => root.querySelector(sel);

  const PAPER_TEST_QUESTION = {
    questionId:'math-paper-quadratic-test-001',
    revision:1,
    type:'handwriting',
    q:'x² - 5x + 6 = 0，求 x 的所有解。',
    handwritingInstruction:'請寫出計算過程，並清楚寫出兩個解。',
    expectedAnswer:'x = 2 或 x = 3',
    gradingInstructions:'請以數學意義判斷，不可用答案字串逐字比較。此題完整解集合為 x = 2 與 x = 3。x=2 or 3、x=2,3、x=3,2、{2,3}、x=2 或 x=3 等寫法都代表相同的兩個解，皆應視為答案正確。若學生完整得到 2 與 3 兩個根，而且計算過程沒有明顯數學錯誤，verdict 必須為 correct。只有漏掉其中一個根、加入錯誤的根、或計算過程有實質錯誤時才判 incorrect。',
    semester:'九年級上學期',
    unit:'一元二次方程式'
  };

  const PAPER_TEST_KEY = 'math-paper-practice::math-paper-quadratic-test-001';
  let paperPracticeGrade = null;

  function paperEscapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[ch]);
  }

  function renderPaperGrade(result, box) {
    if (!box) return;
    if (!result) {
      box.innerHTML = '';
      return;
    }

    const verdict = result.verdict || 'unclear';
    const cfg = verdict === 'correct'
      ? { title:'✓ 作答正確', border:'#86efac', bg:'#f0fdf4', ink:'#166534' }
      : verdict === 'incorrect'
        ? { title:'✗ 作答需要修正', border:'#fca5a5', bg:'#fef2f2', ink:'#991b1b' }
        : { title:'？AI 無法可靠判讀', border:'#fde68a', bg:'#fffbeb', ink:'#92400e' };

    const row = (label, value) => value
      ? `<div style="margin:5px 0"><b>${label}</b>${paperEscapeHtml(value)}</div>`
      : '';

    const confidence = typeof result.confidence === 'number'
      ? `${Math.round(result.confidence * 100)}%`
      : '';

    box.innerHTML = `
      <div style="margin-top:14px;padding:15px;border-radius:14px;border:1px solid ${cfg.border};background:${cfg.bg};color:${cfg.ink}">
        <div style="font-size:1.08rem;font-weight:900;margin-bottom:8px">${cfg.title}</div>
        ${row('辨識答案：', result.recognizedAnswer)}
        ${row('辨識過程：', result.recognizedWork)}
        ${row('錯在這一步：', result.errorStep)}
        ${row('為什麼錯：', result.whyWrong)}
        ${row('應該這樣改：', result.correction)}
        ${row('接著試試看：', result.nextHint)}
        ${result.feedback ? `<div style="margin-top:9px;line-height:1.7">${paperEscapeHtml(result.feedback)}</div>` : ''}
        <div style="font-size:.78rem;opacity:.72;margin-top:8px">
          ${confidence ? `判讀信心：${confidence}　` : ''}
          ${result.modelName ? `模型：${paperEscapeHtml(result.modelName)} · ` : ''}Firebase AI Logic
        </div>
      </div>`;
  }

  function setHeader(title, sub) {
    const titleEl = $('#catalogHeaderTitle');
    const subEl = $('#catalogHeaderSub');
    if (titleEl) titleEl.textContent = title;
    if (subEl) subEl.textContent = sub;
  }

  function restoreHome() {
    location.reload();
  }

  function showMathSemesters() {
    setHeader('數學科', '選擇作答方式或年級與學期');
    document.title = '數學科｜國中題庫';
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backMathSubjectsBtn">← 返回科目</button>
      <div class="catalog-path">數學</div>
      <h2 class="catalog-title">數學練習</h2>
      <p class="catalog-sub">可先進入紙筆作答測試；一般章節題庫則依年級與學期進入。</p>

      <div style="margin:18px 0 24px">
        <button class="catalog-card chapter-card" id="mathPaperPracticeBtn" style="width:100%;text-align:left;border:2px solid #93c5fd;background:#eff6ff">
          <span class="top"><strong>✍️ 紙筆作答</strong><span class="catalog-badge reference">測試版</span></span>
          <span class="desc">固定測試題，使用完整手寫畫布並由 Firebase AI Logic 判題。</span>
        </button>
      </div>

      <h2 class="catalog-title" style="font-size:1.12rem">章節題庫</h2>
      <div class="catalog-grid">
        ${MATH_SEMESTERS.map(s => `
          <button class="catalog-card" data-math-semester="${s.key}" ${s.enabled ? '' : 'disabled'}>
            <span class="top"><strong>${s.title}</strong><span class="catalog-badge ${s.enabled ? 'reference' : 'soon'}">${s.short}</span></span>
            <span class="desc">${s.enabled ? '第一冊：3 單元、11 小節' : '尚未建立教材目錄'}</span>
          </button>`).join('')}
      </div>`;

    $('#backMathSubjectsBtn')?.addEventListener('click', restoreHome);
    $('#mathPaperPracticeBtn')?.addEventListener('click', showPaperPractice);
    $('[data-math-semester="7-1"]')?.addEventListener('click', showMath71Units);
  }

  function showPaperPractice() {
    setHeader('數學科｜紙筆作答', '固定測試題｜Firebase AI Logic');
    document.title = '紙筆作答｜數學科';

    const answer = window.ExamHandwriting?.getAnswer?.(PAPER_TEST_KEY);

    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backPaperMathBtn">← 返回數學</button>
      <div class="catalog-path">數學　›　紙筆作答</div>
      <h2 class="catalog-title">紙筆作答測試</h2>
      <p class="catalog-sub">使用固定測試題驗證手寫畫布與 Firebase AI Logic 判題流程。</p>

      <div style="background:#fff;border:1px solid #dfe5ee;border-radius:16px;padding:18px;margin:16px 0;box-shadow:0 4px 14px rgba(15,23,42,.04)">
        <div style="display:flex;align-items:flex-start;gap:10px">
          <span style="display:inline-grid;place-items:center;flex:0 0 auto;width:32px;height:32px;border-radius:50%;background:#eef4ff;color:#2563eb;font-weight:800">1</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:1.08rem;font-weight:800;margin:2px 0 8px">請寫出計算過程並求出答案：</div>
            <div style="font-size:1.42rem;font-weight:800;letter-spacing:.02em;margin:8px 0 10px;line-height:1.55">${paperEscapeHtml(PAPER_TEST_QUESTION.q)}</div>
            <div style="font-size:.92rem;color:#64748b;margin-bottom:14px">${paperEscapeHtml(PAPER_TEST_QUESTION.handwritingInstruction)}</div>
            <button id="openMathPaperCanvasBtn" type="button" style="border:0;border-radius:12px;padding:11px 18px;font-size:1rem;font-weight:800;cursor:pointer;background:#2563eb;color:white">✍️ ${answer?.dataUrl ? '修改作答' : '作答'}</button>

            <div id="paperAnswerPreview" style="${answer?.dataUrl ? '' : 'display:none;'}margin-top:16px">
              <div style="font-size:.92rem;color:#64748b;margin-bottom:7px">已完成作答</div>
              <img alt="手寫作答縮圖" src="${answer?.dataUrl || ''}" style="display:block;width:210px;max-width:100%;height:auto;border:1px solid #cbd5e1;border-radius:10px;background:#fff">
            </div>
          </div>
        </div>
      </div>

      <div style="position:sticky;bottom:0;background:rgba(246,248,251,.94);backdrop-filter:blur(10px);padding:12px 0 4px;display:flex;gap:10px;z-index:5">
        <button id="submitPaperExamBtn" ${answer?.dataUrl ? '' : 'disabled'} style="border:0;border-radius:12px;padding:12px 18px;font-size:1rem;font-weight:800;cursor:${answer?.dataUrl ? 'pointer' : 'not-allowed'};background:${answer?.dataUrl ? '#15803d' : '#cbd5e1'};color:white;flex:1">🤖 交卷並由 Firebase Gemini 判題</button>
      </div>

      <div id="paperSubmitStatus" style="font-size:.9rem;color:#64748b;margin-top:8px"></div>
      <div id="paperAiResult"></div>`;

    $('#backPaperMathBtn')?.addEventListener('click', showMathSemesters);

    $('#openMathPaperCanvasBtn')?.addEventListener('click', async () => {
      if (!window.ExamHandwriting?.openCanvas) {
        alert('手寫模組尚未載入，請重新整理後再試。');
        return;
      }

      await window.ExamHandwriting.openCanvas({
        key:PAPER_TEST_KEY,
        title:'第 1 題｜x² - 5x + 6 = 0',
        subtitle:PAPER_TEST_QUESTION.handwritingInstruction
      });

      paperPracticeGrade = null;
      showPaperPractice();
    });

    $('#submitPaperExamBtn')?.addEventListener('click', async event => {
      const button = event.currentTarget;
      const status = $('#paperSubmitStatus');
      const resultBox = $('#paperAiResult');

      if (!window.ExamHandwriting?.uploadAndGrade) {
        alert('Firebase 手寫判題模組尚未載入，請重新整理後再試。');
        return;
      }

      const oldText = button.textContent;
      button.disabled = true;
      button.textContent = 'Firebase Gemini 判題中…';
      if (status) status.textContent = '正在將固定測試題與手寫作答送交 Firebase AI Logic…';
      if (resultBox) resultBox.innerHTML = '';

      try {
        const result = await window.ExamHandwriting.uploadAndGrade({
          key:PAPER_TEST_KEY,
          question:PAPER_TEST_QUESTION,
          context:{
            subject:'math',
            semester:PAPER_TEST_QUESTION.semester,
            unit:PAPER_TEST_QUESTION.unit,
            section:'paper-test'
          }
        });

        paperPracticeGrade = result;
        if (status) status.textContent = 'Firebase Gemini 判題完成。';
        renderPaperGrade(result, resultBox);
      } catch (error) {
        console.error('[MathPaperPractice] Firebase grading failed', error);
        if (status) status.textContent = `無法完成 Firebase AI 判題：${error?.message || error}`;
      } finally {
        button.disabled = false;
        button.textContent = oldText;
      }
    });

    if (paperPracticeGrade) {
      renderPaperGrade(paperPracticeGrade, $('#paperAiResult'));
    }
  }

  function showMath71Units() {
    setHeader('數學科｜七年級上學期', '第一冊｜選擇單元');
    document.title = '數學第一冊｜七年級上學期';
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backMathSemestersBtn">← 返回學期</button>
      <div class="catalog-path">數學　›　七年級上學期（一上）　›　第一冊</div>
      <h2 class="catalog-title">請選擇單元</h2>
      <p class="catalog-sub">依實體課本目錄建立：3 單元、11 小節；目前先建立入口與教材定位。</p>
      <div class="catalog-grid">
        ${MATH_7_1_UNITS.map(unit => `
          <button class="catalog-card chapter-card" data-math-unit="${unit.key}">
            <span class="top"><strong>${unit.number}　${unit.title}</strong><span class="catalog-badge reference">p.${unit.page}</span></span>
            <span class="desc">${unit.sections.map(s => `${s.code} ${s.title}`).join('、')}</span>
          </button>`).join('')}
        <button class="catalog-card chapter-card" id="math71ExtrasBtn">
          <span class="top"><strong>附錄與延伸內容</strong><span class="catalog-badge soon">p.209 起</span></span>
          <span class="desc">名詞解釋、教學附件、資訊普拉斯、迷思逃脫、穿越數學史、趣學數學、趣玩桌遊。</span>
        </button>
      </div>`;

    $('#backMathSemestersBtn')?.addEventListener('click', showMathSemesters);
    MATH_7_1_UNITS.forEach(unit => {
      $(`[data-math-unit="${unit.key}"]`)?.addEventListener('click', () => showMath71Unit(unit.key));
    });
    $('#math71ExtrasBtn')?.addEventListener('click', showMath71Extras);
  }

  function showMath71Unit(unitKey) {
    const unit = MATH_7_1_UNITS.find(item => item.key === unitKey);
    if (!unit) return;
    setHeader(`數學一上｜${unit.number}`, unit.title);
    document.title = `${unit.number} ${unit.title}｜數學一上`;
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backMathUnitsBtn">← 返回單元</button>
      <div class="catalog-path">數學　›　七年級上學期（一上）　›　${unit.number} ${unit.title}</div>
      <h2 class="catalog-title">${unit.number}　${unit.title}</h2>
      <p class="catalog-sub">課本單元起始頁 p.${unit.page}；單元 1 的 1-1～1-4 分級自編題庫皆已建立。</p>
      <div class="catalog-grid">
        ${unit.sections.map(section => {
          const ready = section.bankMenuReady === true;
          return `
          <button class="catalog-card chapter-card" data-math-section="${section.code}" ${ready ? '' : 'disabled'}>
            <span class="top"><strong>${section.code}　${section.title}</strong><span class="catalog-badge ${ready ? 'reference' : 'soon'}">${ready ? '題庫已建立' : '目錄已確認'}</span></span>
            <span class="desc">課本起始頁 p.${section.page}｜${ready ? (section.code === '1-2' ? '簡易 20 題・中等 10 題・困難 12 題（含 2 題手寫）｜含數線距離與等距題' : (section.code === '1-3' ? '簡易 20 題・中等 10 題・困難 12 題（含 2 題手寫）｜含乘除符號、分配律與情境題' : (section.code === '1-4' ? '簡易 20 題・中等 10 題・困難 12 題（含 2 題手寫）｜含指數、10 的次方與科學記號' : '簡易 20 題・中等 10 題・困難 12 題（含 2 題手寫）'))) : '題庫待建'}</span>
          </button>`;
        }).join('')}
      </div>`;
    $('#backMathUnitsBtn')?.addEventListener('click', showMath71Units);
    unit.sections.forEach(section => {
      if (!section.bankMenuReady) return;
      $(`[data-math-section="${section.code}"]`)?.addEventListener('click', () => {
        showMath71SectionBanks(unitKey, section.code);
      });
    });
  }

  function showMath71SectionBanks(unitKey, sectionCode) {
    const unit = MATH_7_1_UNITS.find(item => item.key === unitKey);
    const section = unit?.sections?.find(item => item.code === sectionCode);
    if (!unit || !section?.bankMenuReady) return;

    const levels = [
      ...(section.code === '1-2'
        ? [
            { key:'easy', icon:'🌱', label:'簡易', count:20, desc:'同號異號加法、減法、絕對值與基本數線。' },
            { key:'medium', icon:'🌿', label:'中等', count:10, desc:'混合運算、距離、中點、等距點與情境應用。' },
            { key:'hard', icon:'🌳', label:'困難', count:12, desc:'絕對值方程、等距反推、中點與綜合推理。' }
          ]
        : section.code === '1-3'
          ? [
              { key:'easy', icon:'🌱', label:'簡易', count:20, desc:'乘除符號、特殊數、基本四則與分配律。' },
              { key:'medium', icon:'🌿', label:'中等', count:10, desc:'連乘連除、四則混合、巧算與情境應用。' },
              { key:'hard', icon:'🌳', label:'困難', count:12, desc:'符號推理、反推未知數、分配律與綜合運算。' }
            ]
          : section.code === '1-4'
            ? [
                { key:'easy', icon:'🌱', label:'簡易', count:20, desc:'指數基本概念、10 的次方與科學記號轉換。' },
                { key:'medium', icon:'🌿', label:'中等', count:10, desc:'負底數、同底數比較、科學記號大小與位數。' },
                { key:'hard', icon:'🌳', label:'困難', count:12, desc:'含指數混合運算、數量級、反推指數與綜合比較。' }
              ]
            : [
                { key:'easy', icon:'🌱', label:'簡易', count:20, desc:'正負數、0、相反數、絕對值與基本數線判讀。' },
                { key:'medium', icon:'🌿', label:'中等', count:10, desc:'分數刻度、等距點、相反數與絕對值綜合。' },
                { key:'hard', icon:'🌳', label:'困難', count:12, desc:'等距、中點、內分點與代數條件綜合推理。' }
              ])
    ];

    if (section.banks?.school) {
      levels.push({
        key:'school',
        icon:'🏫',
        label:'各校題庫',
        count:null,
        badge:`${section.schoolCount || 1} 校已索引`,
        desc:'真實段考拆題；保留學校、年度、原題號與原始題型，非選擇題會明確標示網站改編。'
      });
    }

    setHeader(`數學一上｜${section.code}`, section.title);
    document.title = `${section.code} ${section.title}｜數學一上`;
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backMathSectionBtn">← 返回 ${unit.number}</button>
      <div class="catalog-path">數學　›　七年級上學期（一上）　›　${unit.number} ${unit.title}　›　${section.code}</div>
      <h2 class="catalog-title">${section.code}　${section.title}</h2>
      <p class="catalog-sub">全新自編 42 題；困難題含 10 題選擇題＋2 題手寫計分題，手寫題在交卷時由 Gemini 判題。需要數線的題目由 SVG number-line renderer 即時繪製。</p>
      <div class="catalog-grid">
        ${levels.map(level => `
          <button class="catalog-card" data-math-section-bank="${level.key}">
            <span class="top"><span class="icon">${level.icon}</span><strong>${level.label}</strong><span class="catalog-badge ${level.key === 'school' ? 'school' : 'reference'}">${level.badge || `${level.count} 題`}</span></span>
            <span class="desc">${level.desc}</span>
          </button>`).join('')}
      </div>`;

    $('#backMathSectionBtn')?.addEventListener('click', () => showMath71Unit(unitKey));
    levels.forEach(level => {
      $(`[data-math-section-bank="${level.key}"]`)?.addEventListener('click', event => {
        openMath71SectionBank(unitKey, sectionCode, level.key, event.currentTarget);
      });
    });
  }

  async function openMath71SectionBank(unitKey, sectionCode, difficultyKey, button) {
    const unit = MATH_7_1_UNITS.find(item => item.key === unitKey);
    const section = unit?.sections?.find(item => item.code === sectionCode);
    const bankConfig = section?.banks?.[difficultyKey];
    if (!unit || !section || !bankConfig || !button) return;

    const oldHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span class="top"><span class="icon">⏳</span><strong>準備題目…</strong></span><span class="desc">正在載入題目與詳解</span>';

    try {
      const loadJson = async path => {
        const response = await fetch(path, { cache:'no-store' });
        if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
        return response.json();
      };

      let data;
      let questions;

      if (typeof bankConfig === 'string') {
        data = await loadJson(bankConfig);
        questions = Array.isArray(data.questions) ? [...data.questions] : [];
      } else {
        data = await loadJson(bankConfig.bankPath);
        questions = Array.isArray(data.questions) ? [...data.questions] : [];

        for (const extraPath of bankConfig.extraPaths || []) {
          const extra = await loadJson(extraPath);
          if (Array.isArray(extra.questions)) questions.push(...extra.questions);
        }

        questions.forEach((question, index) => {
          question.number = index + 1;
        });

        data.exam = data.exam || {};
        const manualCount = questions.filter(question => question?.type === 'manual-study').length;
        const autoCount = questions.length - manualCount;
        data.exam.subtitle = `數學七上｜${section.code} ${section.title}｜各校段考題｜${section.schoolCount || 1} 校｜${autoCount} 題自動評量${manualCount ? `＋${manualCount} 題紙筆練習` : ''}`;
      }
      const expected = difficultyKey === 'easy'
        ? 20
        : difficultyKey === 'hard'
          ? 12
          : difficultyKey === 'medium'
            ? 10
            : null;
      if (expected !== null && questions.length !== expected) {
        throw new Error(`題數異常：${questions.length}/${expected}`);
      }
      if (typeof banks === 'undefined' || typeof window.startExam !== 'function') throw new Error('題庫引擎尚未就緒');

      const exam = data.exam || {};
      const key = exam.key || exam.difficulty || `math-7-1-${sectionCode}-${difficultyKey}`;

      banks[key] = questions;
      window.examContexts = window.examContexts || {};
      window.examContexts[key] = {
        ...exam,
        key,
        difficulty:key,
        examType:exam.examType || 'math-school-section-practice',
        preserveOptionOrder:exam.preserveOptionOrder === true,
        backLabel:`返回 ${section.code} 題庫`,
        onBack:() => showMath71SectionBanks(unitKey, sectionCode)
      };

      window.startExam(key);
    } catch (error) {
      console.error('[math-section-bank] load failed', error);
      alert(`題庫載入失敗：${error.message}`);
      button.disabled = false;
      button.innerHTML = oldHtml;
    }
  }

  function showMath71Extras() {
    setHeader('數學一上｜附錄與延伸內容', '第一冊');
    document.title = '附錄與延伸內容｜數學第一冊';
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backMathUnitsBtn">← 返回單元</button>
      <div class="catalog-path">數學　›　七年級上學期（一上）　›　附錄與延伸內容</div>
      <h2 class="catalog-title">附錄與延伸內容</h2>
      <p class="catalog-sub">依實體課本目錄收錄位置；目前作為教材索引。</p>
      <div class="catalog-grid">
        ${MATH_7_1_EXTRAS.map(item => `
          <button class="catalog-card chapter-card" disabled>
            <span class="top"><strong>${item.title}</strong><span class="catalog-badge soon">p.${item.page}</span></span>
            <span class="desc">教材索引已建立</span>
          </button>`).join('')}
      </div>`;
    $('#backMathUnitsBtn')?.addEventListener('click', showMath71Units);
  }

  function enhanceHomeMathCard() {
    const title = $('#catalogContent .catalog-title')?.textContent?.trim();
    const mathButton = $('[data-subject="math"]');
    if (title !== '請選擇科目' || !mathButton || mathButton.dataset.mathCatalogReady === '1') return;

    mathButton.dataset.mathCatalogReady = '1';
    mathButton.disabled = false;
    const badge = mathButton.querySelector('.catalog-badge');
    const desc = mathButton.querySelector('.desc');
    if (badge) {
      badge.textContent = '已建立';
      badge.classList.remove('soon');
    }
    if (desc) desc.textContent = '進入數學紙筆作答或選擇學期與章節';

    const sub = $('#catalogContent .catalog-sub');
    if (sub && sub.textContent.includes('國文、英文與自然')) {
      sub.textContent = '目前國文、英文、數學與自然已建立科目入口；教材與題庫內容持續擴充。';
    }

    mathButton.addEventListener('click', showMathSemesters);
  }

  function init() {
    const content = $('#catalogContent');
    if (!content) return;
    const observer = new MutationObserver(enhanceHomeMathCard);
    observer.observe(content, { childList: true, subtree: true });
    enhanceHomeMathCard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  // Restore Android pull-to-refresh if the page is unloaded
  // while the handwriting canvas is still active.
  window.addEventListener('pagehide', () => {
    setNativeDrawingMode(false);
  });
})();
