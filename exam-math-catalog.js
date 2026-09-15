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
        { code: '1-1', title: '正數與負數', page: 8 },
        { code: '1-2', title: '正負數的加減', page: 23 },
        { code: '1-3', title: '正負數的乘除', page: 46 },
        { code: '1-4', title: '指數記法與科學記號', page: 63 }
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
    setHeader('數學科', '選擇年級與學期');
    document.title = '數學科｜國中題庫';
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backMathSubjectsBtn">← 返回科目</button>
      <div class="catalog-path">數學</div>
      <h2 class="catalog-title">請選擇學期</h2>
      <p class="catalog-sub">七年級上學期已依實體課本目錄建立單元與小節架構；其他學期後續加入。</p>
      <div class="catalog-grid">
        ${MATH_SEMESTERS.map(s => `
          <button class="catalog-card" data-math-semester="${s.key}" ${s.enabled ? '' : 'disabled'}>
            <span class="top"><strong>${s.title}</strong><span class="catalog-badge ${s.enabled ? 'reference' : 'soon'}">${s.short}</span></span>
            <span class="desc">${s.enabled ? '第一冊：3 單元、11 小節' : '尚未建立教材目錄'}</span>
          </button>`).join('')}
      </div>`;

    $('#backMathSubjectsBtn')?.addEventListener('click', restoreHome);
    $('[data-math-semester="7-1"]')?.addEventListener('click', showMath71Units);
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
      <p class="catalog-sub">課本單元起始頁 p.${unit.page}；小節位置已確認，題庫與教材知識庫後續逐節建立。</p>
      <div class="catalog-grid">
        ${unit.sections.map(section => `
          <button class="catalog-card chapter-card" disabled>
            <span class="top"><strong>${section.code}　${section.title}</strong><span class="catalog-badge soon">目錄已確認</span></span>
            <span class="desc">課本起始頁 p.${section.page}｜題庫待建</span>
          </button>`).join('')}
      </div>`;
    $('#backMathUnitsBtn')?.addEventListener('click', showMath71Units);
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
    if (desc) desc.textContent = '進入科目選擇學期與章節';

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
})();
