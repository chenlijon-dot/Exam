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

  let paperAnswerDataUrl = '';
  let paperAnswerHasInk = false;

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
          <span class="desc">適合需要寫計算過程、畫圖或列式的題目。第一版先測試自由手寫畫布。</span>
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
    setHeader('數學科｜紙筆作答', '自由手寫畫布測試');
    document.title = '紙筆作答｜數學科';

    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backPaperMathBtn">← 返回數學</button>
      <div class="catalog-path">數學　›　紙筆作答</div>
      <h2 class="catalog-title">紙筆作答測試</h2>
      <p class="catalog-sub">這一版先測試平板手寫、完成後產生作答縮圖。直尺、畫圓、橡皮擦與 Gemini 判題會沿用這個畫布架構繼續加入。</p>

      <div style="background:#fff;border:1px solid #dfe5ee;border-radius:16px;padding:18px;margin:16px 0;box-shadow:0 4px 14px rgba(15,23,42,.04)">
        <div style="display:flex;align-items:flex-start;gap:10px">
          <span style="display:inline-grid;place-items:center;flex:0 0 auto;width:32px;height:32px;border-radius:50%;background:#eef4ff;color:#2563eb;font-weight:800">1</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:1.08rem;font-weight:800;margin:2px 0 8px">請寫出計算過程並求出答案：</div>
            <div style="font-size:1.42rem;font-weight:800;letter-spacing:.02em;margin:8px 0 16px">(-8) + (+13) = ?</div>
            <button id="openMathPaperCanvasBtn" style="border:0;border-radius:12px;padding:11px 18px;font-size:1rem;font-weight:800;cursor:pointer;background:#2563eb;color:white">✍️ ${paperAnswerDataUrl ? '修改作答' : '作答'}</button>

            <div id="paperAnswerPreview" style="${paperAnswerDataUrl ? '' : 'display:none;'}margin-top:16px">
              <div style="font-size:.92rem;color:#64748b;margin-bottom:7px">已完成作答</div>
              <button id="paperAnswerImageBtn" type="button" style="display:block;border:1px solid #cbd5e1;background:#fff;border-radius:12px;padding:6px;cursor:pointer;max-width:230px">
                <img id="paperAnswerImage" alt="手寫作答縮圖" src="${paperAnswerDataUrl}" style="display:block;width:210px;max-width:100%;height:auto;border-radius:8px;background:#fff">
              </button>
              <div style="font-size:.82rem;color:#94a3b8;margin-top:5px">點縮圖可重新開啟並修改</div>
            </div>
          </div>
        </div>
      </div>

      <div style="position:sticky;bottom:0;background:rgba(246,248,251,.94);backdrop-filter:blur(10px);padding:12px 0 4px;display:flex;gap:10px;z-index:5">
        <button id="submitPaperExamBtn" ${paperAnswerDataUrl ? '' : 'disabled'} style="border:0;border-radius:12px;padding:12px 18px;font-size:1rem;font-weight:800;cursor:${paperAnswerDataUrl ? 'pointer' : 'not-allowed'};background:${paperAnswerDataUrl ? '#15803d' : '#cbd5e1'};color:white;flex:1">交卷</button>
      </div>
      <div id="paperSubmitStatus" style="font-size:.9rem;color:#64748b;margin-top:8px"></div>`;

    $('#backPaperMathBtn')?.addEventListener('click', showMathSemesters);
    $('#openMathPaperCanvasBtn')?.addEventListener('click', openPaperCanvas);
    $('#paperAnswerImageBtn')?.addEventListener('click', openPaperCanvas);
    $('#submitPaperExamBtn')?.addEventListener('click', () => {
      const status = $('#paperSubmitStatus');
      if (!paperAnswerDataUrl) return;
      if (status) status.textContent = '✓ 已收到手寫作答。下一階段會把這張作答圖連同題目一起送給 Gemini 判題。';
    });
  }

  function setNativeDrawingMode(enabled) {
    try {
      const nativeBridge = window.StudentExamNative;

      if (
        nativeBridge &&
        typeof nativeBridge.setDrawingMode === 'function'
      ) {
        nativeBridge.setDrawingMode(!!enabled);
      }
    } catch (e) {
      console.warn(
        'StudentExam drawing-mode bridge unavailable:',
        e
      );
    }
  }

  function openPaperCanvas() {
    if ($('#mathPaperCanvasOverlay')) return;

    setNativeDrawingMode(true);

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const overlay = document.createElement('div');
    overlay.id = 'mathPaperCanvasOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#eef2f7;display:flex;flex-direction:column;overscroll-behavior:none;touch-action:none';
    overlay.innerHTML = `
      <div style="flex:0 0 auto;display:flex;align-items:center;gap:8px;padding:8px 10px;background:#0f172a;color:white;box-shadow:0 2px 8px rgba(15,23,42,.2)">
        <button id="paperCanvasCancelBtn" type="button" style="border:0;border-radius:10px;padding:9px 13px;font-weight:800;background:#334155;color:white">取消</button>
        <div style="flex:1;min-width:0">
          <div style="font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">第 1 題｜(-8) + (+13) = ?</div>
          <div style="font-size:.78rem;opacity:.78">用手指或觸控筆直接書寫</div>
        </div>
        <button id="paperCanvasClearBtn" type="button" style="border:0;border-radius:10px;padding:9px 13px;font-weight:800;background:#475569;color:white">清除</button>
        <button id="paperCanvasDoneBtn" type="button" style="border:0;border-radius:10px;padding:9px 15px;font-weight:800;background:#22c55e;color:#052e16">完成</button>
      </div>
      <div id="paperCanvasStage" style="position:relative;flex:1;min-height:0;padding:10px;background:#e2e8f0;touch-action:none;overflow:hidden">
        <canvas id="mathPaperCanvas" style="display:block;width:100%;height:100%;background:white;border-radius:8px;box-shadow:0 2px 12px rgba(15,23,42,.14);touch-action:none;user-select:none;-webkit-user-select:none"></canvas>
      </div>`;
    document.body.appendChild(overlay);

    const canvas = $('#mathPaperCanvas', overlay);
    const stage = $('#paperCanvasStage', overlay);
    const ctx = canvas.getContext('2d', { alpha: false });
    let drawing = false;
    let activePointerId = null;
    let lastX = 0;
    let lastY = 0;
    let localHasInk = paperAnswerHasInk;

    function sizeCanvas() {
      const rect = stage.getBoundingClientRect();
      const cssW = Math.max(1, Math.floor(rect.width - 20));
      const cssH = Math.max(1, Math.floor(rect.height - 20));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cssW, cssH);
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 2.9;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      return { cssW, cssH };
    }

    const canvasSize = sizeCanvas();

    function loadPreviousAnswer() {
      if (!paperAnswerDataUrl) return;
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasSize.cssW, canvasSize.cssH);
        const scale = Math.min(canvasSize.cssW / img.width, canvasSize.cssH / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, 0, 0, img.width, img.height, (canvasSize.cssW - w) / 2, (canvasSize.cssH - h) / 2, w, h);
      };
      img.src = paperAnswerDataUrl;
    }
    loadPreviousAnswer();

    function pointFromEvent(e) {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function drawPointerSamples(e) {
      if (!drawing || e.pointerId !== activePointerId) return;

      if (e.cancelable) {
        e.preventDefault();
      }

      const samples =
        typeof e.getCoalescedEvents === 'function'
          ? e.getCoalescedEvents()
          : [e];

      if (!samples || samples.length === 0) return;

      for (const sample of samples) {
        const p = pointFromEvent(sample);

        const dx = p.x - lastX;
        const dy = p.y - lastY;
        const distance = Math.hypot(dx, dy);

        /*
         * Ignore tiny capacitive jitter.
         * This is deliberately very small so handwriting still
         * feels immediate.
         */
        if (distance < 0.35) {
          continue;
        }

        const midX = (lastX + p.x) * 0.5;
        const midY = (lastY + p.y) * 0.5;

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);

        /*
         * A midpoint quadratic segment removes the angular
         * "connect-the-dots" appearance without adding a frame
         * of latency.
         */
        ctx.quadraticCurveTo(
          lastX,
          lastY,
          midX,
          midY
        );

        ctx.stroke();

        lastX = midX;
        lastY = midY;
      }

      localHasInk = true;
    }

    canvas.addEventListener('pointerdown', e => {
      if (activePointerId !== null) return;

      e.preventDefault();

      activePointerId = e.pointerId;
      drawing = true;

      canvas.setPointerCapture?.(e.pointerId);

      const p = pointFromEvent(e);

      lastX = p.x;
      lastY = p.y;

      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(lastX + 0.01, lastY + 0.01);
      ctx.stroke();

      localHasInk = true;
    }, { passive: false });

    /*
     * Chromium / Android WebView can expose pointerrawupdate,
     * which arrives closer to the hardware sampling rate than
     * ordinary pointermove.
     *
     * When available, use it as the primary drawing stream.
     * Otherwise fall back to pointermove.
     */
    const useRawPointer =
      'onpointerrawupdate' in window;

    if (useRawPointer) {
      canvas.addEventListener(
        'pointerrawupdate',
        drawPointerSamples,
        { passive: false }
      );
    } else {
      canvas.addEventListener(
        'pointermove',
        drawPointerSamples,
        { passive: false }
      );
    }

    function finishStroke(e) {
      if (e.pointerId !== activePointerId) return;

      /*
       * Do not draw another segment on pointerup.
       * Capacitive stylus coordinates often shift slightly while
       * leaving the glass, producing an unwanted hook or tail.
       */
      if (e.cancelable) {
        e.preventDefault();
      }

      drawing = false;

      try {
        canvas.releasePointerCapture?.(e.pointerId);
      } catch {}

      activePointerId = null;
    }

    canvas.addEventListener(
      'pointerup',
      finishStroke,
      { passive: false }
    );

    canvas.addEventListener(
      'pointercancel',
      finishStroke,
      { passive: false }
    );
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    function closeOverlay() {
      setNativeDrawingMode(false);
      document.body.style.overflow = oldOverflow;
      overlay.remove();
    }

    $('#paperCanvasCancelBtn', overlay)?.addEventListener('click', closeOverlay);
    $('#paperCanvasClearBtn', overlay)?.addEventListener('click', () => {
      const r = canvas.getBoundingClientRect();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, r.width, r.height);
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 2.9;
      localHasInk = false;
    });
    $('#paperCanvasDoneBtn', overlay)?.addEventListener('click', () => {
      if (!localHasInk) {
        alert('畫布還是空白的，請先寫下作答內容。');
        return;
      }
      paperAnswerDataUrl = canvas.toDataURL('image/png');
      paperAnswerHasInk = true;
      closeOverlay();
      showPaperPractice();
    });
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
