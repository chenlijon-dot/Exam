(() => {
  'use strict';

  const answers = new Map();
  const $ = (sel, root = document) => root.querySelector(sel);

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  function answerKey(examKey, questionNumber) {
    return `${examKey || 'exam'}::${questionNumber}`;
  }

  function getAnswer(key) {
    return answers.get(key) || null;
  }

  function setAnswer(key, dataUrl, source = 'web-canvas') {
    if (!dataUrl) return;
    answers.set(key, { dataUrl, source });
  }

  function reset() {
    answers.clear();
  }

  function nativeBridge() {
    try { return window.StudentExamNative || null; } catch { return null; }
  }

  function nativeInkAvailable() {
    const bridge = nativeBridge();
    return !!(
      bridge &&
      typeof bridge.showNativeInkSurface === 'function' &&
      typeof bridge.clearNativeInkSurface === 'function' &&
      typeof bridge.finishNativeInkSurface === 'function' &&
      typeof bridge.hideNativeInkSurface === 'function'
    );
  }

  function setDrawingMode(enabled) {
    try {
      const bridge = nativeBridge();
      if (bridge && typeof bridge.setDrawingMode === 'function') {
        bridge.setDrawingMode(!!enabled);
      }
    } catch {}
  }

  async function waitForFirebaseGrader(timeoutMs = 12000) {
    const started = performance.now();
    while (performance.now() - started < timeoutMs) {
      if (typeof window.ChrisExamAI?.gradeMathHandwriting === 'function') {
        return window.ChrisExamAI;
      }
      await new Promise(resolve => setTimeout(resolve, 120));
    }
    throw new Error('Firebase AI Logic 尚未完成載入，請稍後再交卷。');
  }

  function openCanvas({
    key,
    title,
    subtitle = '請寫出完整計算過程與答案'
  }) {
    if (!key) return Promise.reject(new Error('缺少手寫題識別碼。'));
    if ($('#mathPaperCanvasOverlay')) return Promise.resolve(null);

    const previous = getAnswer(key);

    /*
     * 正式題庫統一使用 Web Canvas 版完整工具鏈：
     * - exam-math-eraser.js：橡皮擦、直線/三角/圓/矩形、文字標示
     * - exam-math-pointer.js：拖移/縮放
     * - exam-math-ballpoint.js：原子筆筆觸
     *
     * 這樣 1-1～1-4 的手寫題與原本測試畫布共享同一套 UI/工具能力。
     * Android 的 setDrawingMode 仍保留，用來避免外層手勢干擾。
     */
    const useNative = false;

    return new Promise(resolve => {
      setDrawingMode(true);

      const oldOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const overlay = document.createElement('div');
      overlay.id = 'mathPaperCanvasOverlay';
      overlay.dataset.examHandwritingKey = key;
      overlay.dataset.fullToolset = '1';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#eef2f7;display:flex;flex-direction:column;overscroll-behavior:none;touch-action:none';

      overlay.innerHTML = `
        <div style="flex:0 0 auto;display:flex;align-items:center;gap:8px;padding:8px 10px;background:#0f172a;color:white;box-shadow:0 2px 8px rgba(15,23,42,.2)">
          <button id="paperCanvasCancelBtn" type="button" style="border:0;border-radius:10px;padding:9px 13px;font-weight:800;background:#334155;color:white">取消</button>
          <div style="flex:1;min-width:0">
            <div style="font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(title || '手寫題')}</div>
            <div style="font-size:.78rem;opacity:.78">${escapeHtml(subtitle)}</div>
          </div>
          <button id="paperCanvasClearBtn" type="button" style="border:0;border-radius:10px;padding:9px 13px;font-weight:800;background:#475569;color:white">清除</button>
          <button id="paperCanvasDoneBtn" type="button" style="border:0;border-radius:10px;padding:9px 15px;font-weight:800;background:#22c55e;color:#052e16">完成</button>
        </div>
        <div id="paperCanvasStage" style="position:relative;flex:1;min-height:0;padding:10px;background:#e2e8f0;touch-action:none;overflow:hidden">
          <div id="paperCanvasDebugHud"
               style="position:absolute;left:18px;top:18px;z-index:20;pointer-events:none;background:rgba(15,23,42,.82);color:#e2e8f0;border-radius:8px;padding:7px 9px;font:12px/1.35 monospace;white-space:pre;box-shadow:0 2px 8px rgba(0,0,0,.18);display:none"
               aria-hidden="true">waiting for input...</div>
          <canvas id="mathPaperCanvas"
                  style="display:block;width:100%;height:100%;background:white;border-radius:8px;box-shadow:0 2px 12px rgba(15,23,42,.14);touch-action:none;user-select:none;-webkit-user-select:none"></canvas>
        </div>`;

      document.body.appendChild(overlay);

      const canvas = $('#mathPaperCanvas', overlay);
      const stage = $('#paperCanvasStage', overlay);
      const ctx = canvas.getContext('2d', { alpha:false });

      let activePointerId = null;
      const pointerCandidates = new Map();
      let lastX = 0;
      let lastY = 0;
      let localHasInk = !!previous?.dataUrl;
      let resolved = false;

      function sizeCanvas() {
        const rect = stage.getBoundingClientRect();
        const cssW = Math.max(1, Math.floor(rect.width - 20));
        const cssH = Math.max(1, Math.floor(rect.height - 20));
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.floor(cssW * dpr);
        canvas.height = Math.floor(cssH * dpr);
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;

        ctx.setTransform(dpr,0,0,dpr,0,0);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0,0,cssW,cssH);
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        return { cssW, cssH };
      }

      const canvasSize = sizeCanvas();

      if (previous?.dataUrl) {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(
            canvasSize.cssW / img.width,
            canvasSize.cssH / img.height
          );
          const w = img.width * scale;
          const h = img.height * scale;

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0,0,canvasSize.cssW,canvasSize.cssH);
          ctx.drawImage(
            img,
            0,0,img.width,img.height,
            (canvasSize.cssW-w)/2,
            (canvasSize.cssH-h)/2,
            w,h
          );
        };
        img.src = previous.dataUrl;
      }

      function pointFromEvent(e) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      }

      function drawPointerSamples(e) {
        if (e.cancelable) e.preventDefault();

        if (activePointerId === null) {
          const candidate = pointerCandidates.get(e.pointerId);
          if (!candidate) return;

          const p = pointFromEvent(e);
          const dx = p.x - candidate.lastX;
          const dy = p.y - candidate.lastY;

          candidate.distance += Math.hypot(dx,dy);
          candidate.lastX = p.x;
          candidate.lastY = p.y;
          candidate.moves += 1;

          /*
           * 與測試版相同：避免 pointerdown 就把手掌當作寫字筆。
           * 必須有連續移動後才升格成 active writing pointer。
           */
          if (candidate.moves >= 2 && candidate.distance >= 2.4) {
            activePointerId = e.pointerId;
            lastX = candidate.startX;
            lastY = candidate.startY;

            try { canvas.setPointerCapture?.(e.pointerId); } catch {}

            ctx.beginPath();
            ctx.moveTo(lastX,lastY);
            ctx.lineTo(lastX + 0.01,lastY + 0.01);
            ctx.stroke();
            localHasInk = true;
          } else {
            return;
          }
        }

        if (e.pointerId !== activePointerId) return;

        const samples =
          typeof e.getCoalescedEvents === 'function'
            ? e.getCoalescedEvents()
            : [e];

        if (!samples?.length) return;

        for (const sample of samples) {
          const p = pointFromEvent(sample);
          const dx = p.x - lastX;
          const dy = p.y - lastY;
          const distance = Math.hypot(dx,dy);

          if (distance < 0.15) continue;

          /*
           * 沿用測試版低採樣率補點。
           * 只在真實 sample 間做線性細分，不改動真實端點。
           */
          const targetSpacing = 2.5;
          const steps = Math.min(
            6,
            Math.max(1, Math.ceil(distance / targetSpacing))
          );

          const startX = lastX;
          const startY = lastY;

          ctx.beginPath();
          ctx.moveTo(startX,startY);

          for (let i=1;i<=steps;i+=1) {
            const t = i / steps;
            ctx.lineTo(
              startX + (p.x-startX)*t,
              startY + (p.y-startY)*t
            );
          }

          ctx.stroke();
          lastX = p.x;
          lastY = p.y;
        }

        localHasInk = true;
      }

      canvas.addEventListener('pointerdown', e => {
        if (e.cancelable) e.preventDefault();

        const p = pointFromEvent(e);
        pointerCandidates.set(e.pointerId,{
          startX:p.x,
          startY:p.y,
          lastX:p.x,
          lastY:p.y,
          distance:0,
          moves:0
        });
      }, { passive:false });

      const moveEvent =
        'onpointerrawupdate' in window
          ? 'pointerrawupdate'
          : 'pointermove';

      canvas.addEventListener(
        moveEvent,
        drawPointerSamples,
        { passive:false }
      );

      function finishStroke(e) {
        pointerCandidates.delete(e.pointerId);
        if (e.pointerId !== activePointerId) return;

        if (e.cancelable) e.preventDefault();

        try { canvas.releasePointerCapture?.(e.pointerId); } catch {}
        activePointerId = null;
      }

      canvas.addEventListener('pointerup',finishStroke,{ passive:false });
      canvas.addEventListener('pointercancel',finishStroke,{ passive:false });
      canvas.addEventListener('contextmenu',e=>e.preventDefault());

      function finish(value = null) {
        if (resolved) return;
        resolved = true;
        setDrawingMode(false);
        document.body.style.overflow = oldOverflow;
        overlay.remove();
        resolve(value);
      }

      $('#paperCanvasCancelBtn',overlay)?.addEventListener('click',()=>finish(null));

      $('#paperCanvasClearBtn',overlay)?.addEventListener('click',()=>{
        ctx.save();
        ctx.setTransform(1,0,0,1,0,0);
        ctx.fillStyle='#ffffff';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.restore();

        ctx.strokeStyle='#111827';
        ctx.lineWidth=2.5;
        localHasInk=false;
      });

      $('#paperCanvasDoneBtn',overlay)?.addEventListener('click',()=>{
        if (!localHasInk) {
          alert('畫布還是空白的，請先寫下作答內容。');
          return;
        }

        const dataUrl = canvas.toDataURL('image/png');
        setAnswer(key,dataUrl,'web-canvas-full-tools');
        finish(dataUrl);
      });
    });
  }

  async function uploadAndGrade({ key, question }) {
    const answer = getAnswer(key);

    if (!answer?.dataUrl) {
      return {
        verdict:'incorrect',
        recognizedAnswer:'',
        recognizedWork:'',
        errorStep:'本題未作答。',
        whyWrong:'',
        correction:'',
        nextHint:'',
        feedback:'本題未作答。',
        confidence:1,
        modelName:''
      };
    }

    const ai = await waitForFirebaseGrader();

    const questionOverride = {
      id: question.questionId || key,
      semester: question.semester || '',
      unit: question.unit || '',
      text: question.q || '',
      expectedAnswer: question.expectedAnswer || question.manualAnswer || '',
      gradingInstructions:
        question.gradingInstructions ||
        '請依數學意義判斷學生答案與計算過程。只有答案與主要計算邏輯皆正確時 verdict 才為 correct；若錯誤，請指出最早一個可以可靠確認的實質錯誤。'
    };

    return ai.gradeMathHandwriting(
      answer.dataUrl,
      questionOverride
    );
  }

  window.ExamHandwriting = {
    answerKey,
    getAnswer,
    setAnswer,
    reset,
    openCanvas,
    uploadAndGrade,
    hasToken:() => true,
    nativeInkAvailable
  };
})();
