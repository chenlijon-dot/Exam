(() => {
  'use strict';

  const ERASER_BUTTON_ID = 'paperCanvasEraserBtn';
  const LINE_BUTTON_ID = 'paperCanvasLineBtn';
  const CURSOR_ID = 'paperCanvasEraserCursor';
  const PEN_COLOR = '#111827';
  const PEN_WIDTH = 2.5;
  const ERASER_WIDTH = 34;

  const QUESTION = {
    id: 'math-paper-linear-test-002',
    semester: '七年級上學期',
    unit: '一元一次方程式',
    text: '3(x - 2) + 5 = 2x + 7，求 x。',
    expectedAnswer: 'x = 8',
    gradingInstructions: '請依數學意義判斷。學生可使用移項、等量公理、展開括號或其他正確方法。最後答案 x=8 即為正確；若最後答案不是 8，或計算過程出現會影響答案的實質數學錯誤，判 incorrect。若字跡無法可靠辨識，判 unclear。'
  };

  window.MathPaperQuestionConfig = QUESTION;

  function getNativeBridge() {
    try {
      return window.StudentExamNative || null;
    } catch {
      return null;
    }
  }

  function hasSavedAnswer() {
    const image = document.getElementById('paperAnswerImage');
    const src = image?.getAttribute('src') || '';
    return src.startsWith('data:image/');
  }

  function isNativeInkSession() {
    const bridge = getNativeBridge();
    return !!(
      bridge &&
      typeof bridge.showNativeInkSurface === 'function' &&
      !hasSavedAnswer()
    );
  }

  function hideDebugHud(root = document) {
    const hud = root.querySelector?.('#paperCanvasDebugHud');
    if (hud) {
      hud.style.display = 'none';
      hud.setAttribute('aria-hidden', 'true');
    }
  }

  function syncPaperQuestion() {
    const root = document.getElementById('catalogContent');
    if (!root) return;

    const oldText = 'x² - 5x + 6 = 0，求 x 的所有解。';
    const target = [...root.querySelectorAll('div')].find(el => {
      const text = String(el.textContent || '').trim();
      return text === oldText || text === QUESTION.text;
    });

    if (target && target.textContent !== QUESTION.text) {
      target.textContent = QUESTION.text;
    }
  }

  function syncOverlayQuestion(overlay) {
    const oldTitle = '第 1 題｜x² - 5x + 6 = 0';
    const title = [...overlay.querySelectorAll('div')].find(el =>
      String(el.textContent || '').trim() === oldTitle
    );
    if (title) title.textContent = `第 1 題｜${QUESTION.text}`;
  }

  function setWebCanvasTool(canvas, erasing) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = erasing ? '#ffffff' : PEN_COLOR;
    ctx.lineWidth = erasing ? ERASER_WIDTH : PEN_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function setNativeEraser(erasing) {
    const bridge = getNativeBridge();
    if (!bridge || typeof bridge.setNativeInkEraserMode !== 'function') {
      return false;
    }

    try {
      bridge.setNativeInkEraserMode(!!erasing);
      return true;
    } catch (error) {
      console.error('[MathTools] native eraser bridge failed', error);
      return false;
    }
  }

  function createCursor(overlay) {
    let cursor = overlay.querySelector(`#${CURSOR_ID}`);
    if (cursor) return cursor;

    cursor = document.createElement('div');
    cursor.id = CURSOR_ID;
    cursor.style.cssText = [
      'position:fixed',
      'z-index:100005',
      `width:${ERASER_WIDTH}px`,
      `height:${ERASER_WIDTH}px`,
      'margin-left:-17px',
      'margin-top:-17px',
      'border:2px solid rgba(245,158,11,.95)',
      'border-radius:50%',
      'background:rgba(255,255,255,.34)',
      'box-shadow:0 0 0 1px rgba(255,255,255,.65)',
      'pointer-events:none',
      'display:none'
    ].join(';');

    overlay.appendChild(cursor);
    return cursor;
  }

  function installForOverlay(overlay) {
    if (!overlay || overlay.dataset.mathToolsInstalled === '1') return;

    hideDebugHud(overlay);
    syncOverlayQuestion(overlay);

    const clearButton = overlay.querySelector('#paperCanvasClearBtn');
    const canvas = overlay.querySelector('#mathPaperCanvas');
    if (!clearButton || !canvas) return;

    overlay.dataset.mathToolsInstalled = '1';

    const lineButton = document.createElement('button');
    lineButton.id = LINE_BUTTON_ID;
    lineButton.type = 'button';
    lineButton.textContent = '📏 直線';
    lineButton.setAttribute('aria-pressed', 'false');
    lineButton.style.cssText = 'border:0;border-radius:10px;padding:9px 9px;font-weight:800;background:#475569;color:white;white-space:nowrap;touch-action:manipulation';

    const eraserButton = document.createElement('button');
    eraserButton.id = ERASER_BUTTON_ID;
    eraserButton.type = 'button';
    eraserButton.textContent = '🧽 橡皮擦';
    eraserButton.setAttribute('aria-pressed', 'false');
    eraserButton.style.cssText = 'border:0;border-radius:10px;padding:9px 9px;font-weight:800;background:#475569;color:white;white-space:nowrap;touch-action:manipulation';

    clearButton.parentNode.insertBefore(lineButton, clearButton);
    clearButton.parentNode.insertBefore(eraserButton, clearButton);

    const cursor = createCursor(overlay);
    const ctx = canvas.getContext('2d', { alpha: false });

    let mode = 'pen';
    let linePointerId = null;
    let lineStart = null;
    let lineLast = null;
    let lineSnapshot = null;
    let forwardingSyntheticInk = false;
    let syntheticPointerId = 920000;

    function hideCursor() {
      cursor.style.display = 'none';
    }

    function updateButtons() {
      const lineActive = mode === 'line';
      const eraserActive = mode === 'eraser';

      lineButton.textContent = lineActive ? '✏️ 返回筆' : '📏 直線';
      lineButton.setAttribute('aria-pressed', lineActive ? 'true' : 'false');
      lineButton.style.background = lineActive ? '#f59e0b' : '#475569';
      lineButton.style.color = lineActive ? '#451a03' : '#ffffff';

      eraserButton.textContent = eraserActive ? '✏️ 返回筆' : '🧽 橡皮擦';
      eraserButton.setAttribute('aria-pressed', eraserActive ? 'true' : 'false');
      eraserButton.style.background = eraserActive ? '#f59e0b' : '#475569';
      eraserButton.style.color = eraserActive ? '#451a03' : '#ffffff';

      if (!eraserActive) hideCursor();
    }

    function switchMode(nextMode) {
      if (mode === 'eraser' && isNativeInkSession()) {
        setNativeEraser(false);
      }

      mode = nextMode;

      if (!isNativeInkSession()) {
        setWebCanvasTool(canvas, mode === 'eraser');
      }

      updateButtons();
    }

    function pointFromEvent(event) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }

    function makeSnapshot() {
      const copy = document.createElement('canvas');
      copy.width = canvas.width;
      copy.height = canvas.height;
      copy.getContext('2d').drawImage(canvas, 0, 0);
      return copy;
    }

    function restoreSnapshot() {
      if (!lineSnapshot) return;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(lineSnapshot, 0, 0);
      ctx.restore();
    }

    function drawStraightLine(endPoint) {
      if (!lineStart || !endPoint) return;
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = PEN_COLOR;
      ctx.lineWidth = PEN_WIDTH;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(lineStart.x, lineStart.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.stroke();
      ctx.restore();
    }

    function resetLineGesture(restore = false) {
      if (restore) restoreSnapshot();
      if (linePointerId !== null) {
        try { canvas.releasePointerCapture?.(linePointerId); } catch {}
      }
      linePointerId = null;
      lineStart = null;
      lineLast = null;
      lineSnapshot = null;
    }

    function markCatalogCanvasAsInk(startPoint, endPoint) {
      const dx = endPoint.x - startPoint.x;
      const dy = endPoint.y - startPoint.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 3.2) return;

      const ux = dx / distance;
      const uy = dy / distance;
      const rect = canvas.getBoundingClientRect();
      const id = syntheticPointerId++;
      const moveType = 'onpointerrawupdate' in window ? 'pointerrawupdate' : 'pointermove';

      const initAt = (point, buttons, pressure) => ({
        bubbles: true,
        cancelable: true,
        pointerId: id,
        pointerType: 'pen',
        isPrimary: true,
        buttons,
        pressure,
        clientX: rect.left + point.x,
        clientY: rect.top + point.y
      });

      const p1 = { x: startPoint.x + ux * 1.6, y: startPoint.y + uy * 1.6 };
      const p2 = { x: startPoint.x + ux * 3.2, y: startPoint.y + uy * 3.2 };

      forwardingSyntheticInk = true;
      try {
        canvas.dispatchEvent(new PointerEvent('pointerdown', initAt(startPoint, 1, 0.5)));
        canvas.dispatchEvent(new PointerEvent(moveType, initAt(p1, 1, 0.5)));
        canvas.dispatchEvent(new PointerEvent(moveType, initAt(p2, 1, 0.5)));
        canvas.dispatchEvent(new PointerEvent('pointerup', initAt(p2, 0, 0)));
      } catch (error) {
        console.warn('[MathTools] unable to mark synthetic line ink', error);
      } finally {
        forwardingSyntheticInk = false;
      }
    }

    function onLinePointerDown(event) {
      if (forwardingSyntheticInk || mode !== 'line' || isNativeInkSession()) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      linePointerId = event.pointerId;
      lineStart = pointFromEvent(event);
      lineLast = lineStart;
      lineSnapshot = makeSnapshot();

      try { canvas.setPointerCapture?.(event.pointerId); } catch {}
    }

    function onLinePointerMove(event) {
      if (
        forwardingSyntheticInk ||
        mode !== 'line' ||
        linePointerId === null ||
        event.pointerId !== linePointerId
      ) {
        return;
      }

      if (event.cancelable) event.preventDefault();
      event.stopImmediatePropagation();

      lineLast = pointFromEvent(event);
      restoreSnapshot();
      drawStraightLine(lineLast);
    }

    function onLinePointerUp(event) {
      if (
        forwardingSyntheticInk ||
        mode !== 'line' ||
        linePointerId === null ||
        event.pointerId !== linePointerId
      ) {
        return;
      }

      if (event.cancelable) event.preventDefault();
      event.stopImmediatePropagation();

      const startPoint = lineStart;
      const endPoint = pointFromEvent(event);

      restoreSnapshot();
      drawStraightLine(endPoint);
      resetLineGesture(false);

      markCatalogCanvasAsInk(startPoint, endPoint);
      setWebCanvasTool(canvas, false);
    }

    function onLinePointerCancel(event) {
      if (
        forwardingSyntheticInk ||
        mode !== 'line' ||
        linePointerId === null ||
        event.pointerId !== linePointerId
      ) {
        return;
      }

      if (event.cancelable) event.preventDefault();
      event.stopImmediatePropagation();
      resetLineGesture(true);
    }

    lineButton.addEventListener('click', () => {
      if (isNativeInkSession()) {
        alert('直線工具目前先支援一般手機／瀏覽器的網頁畫布。');
        return;
      }

      switchMode(mode === 'line' ? 'pen' : 'line');
    });

    eraserButton.addEventListener('click', () => {
      const nextMode = mode === 'eraser' ? 'pen' : 'eraser';

      if (isNativeInkSession() && nextMode === 'eraser') {
        if (!setNativeEraser(true)) {
          alert('目前這個 Student Exam App 的原生手寫畫布尚未加入橡皮擦橋接。一般手機／瀏覽器的網頁畫布橡皮擦已可直接使用。');
          return;
        }
        mode = 'eraser';
        updateButtons();
        return;
      }

      switchMode(nextMode);
    });

    function moveCursor(event) {
      if (mode !== 'eraser' || isNativeInkSession()) {
        hideCursor();
        return;
      }

      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
      cursor.style.display = 'block';
    }

    canvas.addEventListener('pointerdown', onLinePointerDown, { capture: true, passive: false });
    canvas.addEventListener('pointerrawupdate', onLinePointerMove, { capture: true, passive: false });
    canvas.addEventListener('pointermove', onLinePointerMove, { capture: true, passive: false });
    canvas.addEventListener('pointerup', onLinePointerUp, { capture: true, passive: false });
    canvas.addEventListener('pointercancel', onLinePointerCancel, { capture: true, passive: false });

    canvas.addEventListener('pointerdown', moveCursor, { passive: true });
    canvas.addEventListener('pointermove', moveCursor, { passive: true });
    canvas.addEventListener('pointerup', hideCursor, { passive: true });
    canvas.addEventListener('pointercancel', hideCursor, { passive: true });
    canvas.addEventListener('pointerleave', hideCursor, { passive: true });

    clearButton.addEventListener('click', () => {
      resetLineGesture(false);
      if (!isNativeInkSession()) {
        requestAnimationFrame(() => setWebCanvasTool(canvas, mode === 'eraser'));
      }
    });

    const doneButton = overlay.querySelector('#paperCanvasDoneBtn');
    const cancelButton = overlay.querySelector('#paperCanvasCancelBtn');

    const resetTool = () => {
      hideCursor();
      resetLineGesture(false);
      if (mode === 'eraser' && isNativeInkSession()) setNativeEraser(false);
      mode = 'pen';
    };

    doneButton?.addEventListener('click', resetTool, { once: true });
    cancelButton?.addEventListener('click', resetTool, { once: true });

    updateButtons();
  }

  function scan() {
    syncPaperQuestion();
    hideDebugHud(document);
    installForOverlay(document.getElementById('mathPaperCanvasOverlay'));
  }

  const observer = new MutationObserver(scan);

  function start() {
    scan();
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
