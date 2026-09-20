(() => {
  'use strict';

  const SHAPE_BUTTON_ID = 'paperCanvasShapeBtn';
  const ERASER_BUTTON_ID = 'paperCanvasEraserBtn';
  const TEXT_BUTTON_ID = 'paperCanvasTextBtn';
  const CURSOR_ID = 'paperCanvasEraserCursor';
  const HINT_ID = 'paperCanvasFloatingHint';
  const AUX_BUTTON_ID = 'paperCanvasAuxBtn';
  const SHAPE_MENU_ID = 'paperCanvasShapeMenu';
  const TEXT_MENU_ID = 'paperCanvasTextMenu';
  const PEN_COLOR = '#111827';
  const PEN_WIDTH = 2.5;
  const ERASER_WIDTH = 34;
  const SHAPES = ['line', 'triangle', 'circle', 'rect'];
  const SHAPE_LABEL = {
    line: '直線',
    triangle: '三角',
    circle: '圓形',
    rect: '矩形'
  };
  const TEXT_CHARS = [
    'A','B','C','D','E',
    'P','Q','R','S','T',
    'x','y','z',
    'i','j','l','m','n'
  ];

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
    return String(image?.getAttribute('src') || '').startsWith('data:image/');
  }

  function isNativeInkSession() {
    const overlay = document.getElementById('mathPaperCanvasOverlay');
    if (overlay?.dataset?.fullToolset === '1') return false;

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
    if (!bridge || typeof bridge.setNativeInkEraserMode !== 'function') return false;

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

  let hintTimer = null;

  function ensureFloatingHint(overlay) {
    let hint = overlay.querySelector(`#${HINT_ID}`);
    if (hint) return hint;

    hint = document.createElement('div');
    hint.id = HINT_ID;
    hint.style.cssText = [
      'position:fixed',
      'left:50%',
      'top:64px',
      'transform:translate(-50%,-7px)',
      'z-index:100030',
      'max-width:min(88vw,450px)',
      'padding:9px 13px',
      'border-radius:999px',
      'background:rgba(15,23,42,.88)',
      'color:#fff',
      'font-size:13px',
      'font-weight:750',
      'line-height:1.35',
      'text-align:center',
      'box-shadow:0 7px 22px rgba(0,0,0,.24)',
      'backdrop-filter:blur(8px)',
      '-webkit-backdrop-filter:blur(8px)',
      'opacity:0',
      'pointer-events:none',
      'transition:opacity .18s ease,transform .18s ease'
    ].join(';');
    overlay.appendChild(hint);
    return hint;
  }

  function showFloatingHint(overlay, text, duration = 1700) {
    const hint = ensureFloatingHint(overlay);
    hint.textContent = text;
    hint.style.opacity = '1';
    hint.style.transform = 'translate(-50%,0)';

    if (hintTimer) clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      hint.style.opacity = '0';
      hint.style.transform = 'translate(-50%,-7px)';
    }, duration);
  }

  function compactToolbar(overlay, clearButton) {
    const toolbar = clearButton.parentElement;
    if (!toolbar) return;

    toolbar.style.display = 'flex';
    toolbar.style.alignItems = 'center';
    toolbar.style.gap = '5px';
    toolbar.style.padding = '7px 7px';
    toolbar.style.flexWrap = 'nowrap';
    toolbar.style.overflowX = 'auto';
    toolbar.style.webkitOverflowScrolling = 'touch';
    toolbar.style.scrollbarWidth = 'none';

    const cancelButton = overlay.querySelector('#paperCanvasCancelBtn');
    const doneButton = overlay.querySelector('#paperCanvasDoneBtn');
    const titleBlock = cancelButton?.nextElementSibling;

    const baseButton = button => {
      if (!button) return;
      button.style.minWidth = '0';
      button.style.minHeight = '42px';
      button.style.padding = '7px 9px';
      button.style.borderRadius = '11px';
      button.style.fontSize = '14px';
      button.style.lineHeight = '1.1';
      button.style.whiteSpace = 'nowrap';
      button.style.flex = '0 0 auto';
      button.style.touchAction = 'manipulation';
    };

    baseButton(cancelButton);
    baseButton(clearButton);
    baseButton(doneButton);

    if (window.innerWidth <= 760 && titleBlock) {
      titleBlock.style.display = 'none';
    } else if (titleBlock) {
      titleBlock.style.minWidth = '0';
      titleBlock.style.flex = '1 1 auto';
      const instruction = [...titleBlock.querySelectorAll('div,span,p')].find(el =>
        String(el.textContent || '').includes('用手指或觸控筆直接書寫')
      );
      if (instruction) instruction.style.display = 'none';
    }
  }

  function installForOverlay(overlay) {
    if (!overlay || overlay.dataset.mathToolsInstalled === '1') return;

    hideDebugHud(overlay);
    syncOverlayQuestion(overlay);

    const clearButton = overlay.querySelector('#paperCanvasClearBtn');
    const canvas = overlay.querySelector('#mathPaperCanvas');
    if (!clearButton || !canvas) return;

    overlay.dataset.mathToolsInstalled = '1';
    compactToolbar(overlay, clearButton);

    const toolButtonStyle = 'border:0;border-radius:11px;padding:7px 9px;min-height:42px;font-size:14px;line-height:1.1;font-weight:800;background:#475569;color:white;white-space:nowrap;touch-action:manipulation;flex:0 0 auto';

    const shapeButton = document.createElement('button');
    shapeButton.id = SHAPE_BUTTON_ID;
    shapeButton.type = 'button';
    shapeButton.textContent = '直線';
    shapeButton.style.cssText = toolButtonStyle;

    const eraserButton = document.createElement('button');
    eraserButton.id = ERASER_BUTTON_ID;
    eraserButton.type = 'button';
    eraserButton.textContent = '擦除';
    eraserButton.style.cssText = toolButtonStyle;

    const textButton = document.createElement('button');
    textButton.id = TEXT_BUTTON_ID;
    textButton.type = 'button';
    textButton.textContent = '文';
    textButton.style.cssText = toolButtonStyle;

    clearButton.parentNode.insertBefore(shapeButton, clearButton);
    clearButton.parentNode.insertBefore(eraserButton, clearButton);
    clearButton.parentNode.insertBefore(textButton, clearButton);

    const cursor = createCursor(overlay);
    const ctx = canvas.getContext('2d', { alpha: false });

    let mode = 'pen';
    let selectedShape = 'line';
    let selectedText = 'A';
    let textSize = 30;
    let constraintHeld = false;
    let constraintPointerId = null;
    let textSizeStartY = 0;
    let textSizeStartValue = textSize;

    let shapePointerId = null;
    let shapeStart = null;
    let shapeLast = null;
    let shapeSnapshot = null;
    let forwardingSyntheticInk = false;
    let syntheticPointerId = 930000;

    function hideCursor() {
      cursor.style.display = 'none';
    }

    function createMenu(id) {
      const menu = document.createElement('div');
      menu.id = id;
      menu.style.cssText = [
        'position:fixed',
        'left:50%',
        'top:60px',
        'transform:translateX(-50%)',
        'z-index:100040',
        'display:none',
        'gap:7px',
        'flex-wrap:wrap',
        'justify-content:center',
        'max-width:min(92vw,520px)',
        'padding:9px',
        'border-radius:14px',
        'background:rgba(15,23,42,.94)',
        'box-shadow:0 10px 28px rgba(0,0,0,.28)',
        'backdrop-filter:blur(10px)',
        '-webkit-backdrop-filter:blur(10px)'
      ].join(';');
      overlay.appendChild(menu);
      return menu;
    }

    const shapeMenu = createMenu(SHAPE_MENU_ID);
    const textMenu = createMenu(TEXT_MENU_ID);

    function paletteButton(label) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.style.cssText = 'border:0;border-radius:10px;min-width:46px;min-height:42px;padding:7px 10px;background:#334155;color:white;font-size:15px;font-weight:800;touch-action:manipulation';
      return b;
    }

    const penChoice = paletteButton('畫筆');
    penChoice.addEventListener('click', () => {
      switchMode('pen');
      hideMenus();
    });
    shapeMenu.appendChild(penChoice);

    [
      ['line','／ 直線'],
      ['triangle','△ 三角'],
      ['circle','○ 圓形'],
      ['rect','□ 矩形']
    ].forEach(([shape, label]) => {
      const b = paletteButton(label);
      b.addEventListener('click', () => {
        selectedShape = shape;
        switchMode('shape');
        hideMenus();
        showFloatingHint(overlay, `${SHAPE_LABEL[shape]}工具已啟用`);
      });
      shapeMenu.appendChild(b);
    });

    TEXT_CHARS.forEach(ch => {
      const b = paletteButton(ch);
      b.style.minWidth = '42px';
      b.addEventListener('click', () => {
        selectedText = ch;
        switchMode('text');
        hideMenus();
        showFloatingHint(overlay, `文字 ${ch}：點畫布放置`);
      });
      textMenu.appendChild(b);
    });

    const textPenChoice = paletteButton('畫筆');
    textPenChoice.addEventListener('click', () => {
      switchMode('pen');
      hideMenus();
    });
    textMenu.appendChild(textPenChoice);

    function hideMenus() {
      shapeMenu.style.display = 'none';
      textMenu.style.display = 'none';
    }

    function showMenu(menu) {
      const opening = menu.style.display !== 'flex';
      hideMenus();
      if (opening) menu.style.display = 'flex';
    }

    const auxButton = document.createElement('button');
    auxButton.id = AUX_BUTTON_ID;
    auxButton.type = 'button';
    auxButton.style.cssText = [
      'position:fixed',
      'left:16px',
      'bottom:calc(18px + env(safe-area-inset-bottom,0px))',
      'z-index:100035',
      'display:none',
      'width:54px',
      'height:54px',
      'border:0',
      'border-radius:50%',
      'background:rgba(15,23,42,.88)',
      'color:white',
      'font-size:13px',
      'font-weight:900',
      'line-height:1.05',
      'box-shadow:0 6px 20px rgba(0,0,0,.28)',
      'touch-action:none',
      'user-select:none',
      '-webkit-user-select:none'
    ].join(';');
    overlay.appendChild(auxButton);

    function updateAuxButton() {
      if (mode === 'shape') {
        auxButton.style.display = 'block';
        auxButton.textContent = constraintHeld ? '鎖定' : '正形';
        auxButton.style.background = constraintHeld ? '#16a34a' : 'rgba(15,23,42,.88)';
      } else if (mode === 'text') {
        auxButton.style.display = 'block';
        auxButton.textContent = `${textSize}px`;
        auxButton.style.background = constraintPointerId !== null ? '#2563eb' : 'rgba(15,23,42,.88)';
      } else {
        auxButton.style.display = 'none';
      }
    }

    function updateButtons() {
      const shapeActive = mode === 'shape';
      const eraserActive = mode === 'eraser';
      const textActive = mode === 'text';

      shapeButton.textContent = SHAPE_LABEL[selectedShape];
      shapeButton.style.background = shapeActive ? '#f59e0b' : '#475569';
      shapeButton.style.color = shapeActive ? '#451a03' : '#ffffff';
      shapeButton.setAttribute('aria-pressed', shapeActive ? 'true' : 'false');

      eraserButton.style.background = eraserActive ? '#f59e0b' : '#475569';
      eraserButton.style.color = eraserActive ? '#451a03' : '#ffffff';
      eraserButton.setAttribute('aria-pressed', eraserActive ? 'true' : 'false');

      textButton.textContent = textActive ? `文:${selectedText}` : '文';
      textButton.style.background = textActive ? '#f59e0b' : '#475569';
      textButton.style.color = textActive ? '#451a03' : '#ffffff';
      textButton.setAttribute('aria-pressed', textActive ? 'true' : 'false');

      if (!eraserActive) hideCursor();
      updateAuxButton();
    }

    function switchMode(nextMode, showHint = false) {
      if (mode === 'eraser' && isNativeInkSession()) setNativeEraser(false);
      resetShapeGesture(false);
      mode = nextMode;

      if (!isNativeInkSession()) {
        setWebCanvasTool(canvas, mode === 'eraser');
      }

      updateButtons();

      if (showHint) {
        const hints = {
          pen: '畫筆：自由書寫',
          eraser: '橡皮擦：直接擦除筆跡',
          shape: `${SHAPE_LABEL[selectedShape]}工具`,
          text: `文字 ${selectedText}：點畫布放置`
        };
        showFloatingHint(overlay, hints[mode] || '');
      }
    }

    function pointFromEvent(event) {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function makeSnapshot() {
      const copy = document.createElement('canvas');
      copy.width = canvas.width;
      copy.height = canvas.height;
      copy.getContext('2d').drawImage(canvas, 0, 0);
      return copy;
    }

    function restoreSnapshot() {
      if (!shapeSnapshot) return;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(shapeSnapshot, 0, 0);
      ctx.restore();
    }

    function constrainedEnd(start, end, shape) {
      if (!constraintHeld) return end;

      let dx = end.x - start.x;
      let dy = end.y - start.y;
      const sx = dx < 0 ? -1 : 1;
      const sy = dy < 0 ? -1 : 1;

      if (shape === 'line') {
        if (Math.abs(dx) >= Math.abs(dy)) dy = 0;
        else dx = 0;
        return { x: start.x + dx, y: start.y + dy };
      }

      if (shape === 'circle' || shape === 'rect') {
        const side = Math.max(Math.abs(dx), Math.abs(dy));
        return { x: start.x + sx * side, y: start.y + sy * side };
      }

      if (shape === 'triangle') {
        const sideFromHeight = Math.abs(dy) * 2 / Math.sqrt(3);
        const side = Math.max(Math.abs(dx), sideFromHeight);
        const height = side * Math.sqrt(3) / 2;
        return { x: start.x + sx * side, y: start.y + sy * height };
      }

      return end;
    }

    function drawShape(endPoint) {
      if (!shapeStart || !endPoint) return;
      const end = constrainedEnd(shapeStart, endPoint, selectedShape);
      const x1 = shapeStart.x;
      const y1 = shapeStart.y;
      const x2 = end.x;
      const y2 = end.y;
      const left = Math.min(x1, x2);
      const right = Math.max(x1, x2);
      const top = Math.min(y1, y2);
      const bottom = Math.max(y1, y2);
      const width = Math.max(0.1, right - left);
      const height = Math.max(0.1, bottom - top);

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = PEN_COLOR;
      ctx.lineWidth = PEN_WIDTH;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      if (selectedShape === 'line') {
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      } else if (selectedShape === 'rect') {
        ctx.rect(left, top, width, height);
      } else if (selectedShape === 'circle') {
        ctx.ellipse((left + right) / 2, (top + bottom) / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
      } else if (selectedShape === 'triangle') {
        const upward = y2 >= y1;
        const apexY = upward ? top : bottom;
        const baseY = upward ? bottom : top;
        ctx.moveTo((left + right) / 2, apexY);
        ctx.lineTo(right, baseY);
        ctx.lineTo(left, baseY);
        ctx.closePath();
      }

      ctx.stroke();
      ctx.restore();
    }

    function resetShapeGesture(restore = false) {
      if (restore) restoreSnapshot();
      if (shapePointerId !== null) {
        try { canvas.releasePointerCapture?.(shapePointerId); } catch {}
      }
      shapePointerId = null;
      shapeStart = null;
      shapeLast = null;
      shapeSnapshot = null;
    }

    function markCanvasInk(point) {
      const rect = canvas.getBoundingClientRect();
      const id = syntheticPointerId++;
      const moveType = 'onpointerrawupdate' in window ? 'pointerrawupdate' : 'pointermove';
      const initAt = (x, y, buttons, pressure) => ({
        bubbles: true,
        cancelable: true,
        pointerId: id,
        pointerType: 'pen',
        isPrimary: true,
        buttons,
        pressure,
        clientX: rect.left + x,
        clientY: rect.top + y
      });

      forwardingSyntheticInk = true;
      try {
        canvas.dispatchEvent(new PointerEvent('pointerdown', initAt(point.x, point.y, 1, 0.5)));
        canvas.dispatchEvent(new PointerEvent(moveType, initAt(point.x + 1.8, point.y, 1, 0.5)));
        canvas.dispatchEvent(new PointerEvent(moveType, initAt(point.x + 3.6, point.y, 1, 0.5)));
        canvas.dispatchEvent(new PointerEvent('pointerup', initAt(point.x + 3.6, point.y, 0, 0)));
      } catch (error) {
        console.warn('[MathTools] unable to mark canvas ink', error);
      } finally {
        forwardingSyntheticInk = false;
      }
    }

    function onShapePointerDown(event) {
      if (forwardingSyntheticInk || mode !== 'shape' || isNativeInkSession()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      hideMenus();
      shapePointerId = event.pointerId;
      shapeStart = pointFromEvent(event);
      shapeLast = shapeStart;
      shapeSnapshot = makeSnapshot();
      try { canvas.setPointerCapture?.(event.pointerId); } catch {}
    }

    function onShapePointerMove(event) {
      if (
        forwardingSyntheticInk || mode !== 'shape' ||
        shapePointerId === null || event.pointerId !== shapePointerId
      ) return;

      if (event.cancelable) event.preventDefault();
      event.stopImmediatePropagation();
      shapeLast = pointFromEvent(event);
      restoreSnapshot();
      drawShape(shapeLast);
    }

    function onShapePointerUp(event) {
      if (
        forwardingSyntheticInk || mode !== 'shape' ||
        shapePointerId === null || event.pointerId !== shapePointerId
      ) return;

      if (event.cancelable) event.preventDefault();
      event.stopImmediatePropagation();
      const start = shapeStart;
      const end = pointFromEvent(event);
      restoreSnapshot();
      markCanvasInk(start);
      drawShape(end);
      resetShapeGesture(false);
      setWebCanvasTool(canvas, false);
    }

    function onShapePointerCancel(event) {
      if (mode !== 'shape' || shapePointerId === null || event.pointerId !== shapePointerId) return;
      if (event.cancelable) event.preventDefault();
      event.stopImmediatePropagation();
      resetShapeGesture(true);
    }

    function drawTextAt(point) {
      markCanvasInk(point);
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = PEN_COLOR;
      ctx.font = `600 ${textSize}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(selectedText, point.x, point.y);
      ctx.restore();
      setWebCanvasTool(canvas, false);
    }

    function onTextPointerDown(event) {
      if (forwardingSyntheticInk || mode !== 'text' || isNativeInkSession()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      hideMenus();
      drawTextAt(pointFromEvent(event));
    }

    shapeButton.addEventListener('click', () => {
      if (isNativeInkSession()) {
        showFloatingHint(overlay, '圖形工具目前支援一般手機／瀏覽器畫布');
        return;
      }
      showMenu(shapeMenu);
    });

    eraserButton.addEventListener('click', () => {
      hideMenus();
      const nextMode = mode === 'eraser' ? 'pen' : 'eraser';

      if (isNativeInkSession() && nextMode === 'eraser') {
        if (!setNativeEraser(true)) {
          showFloatingHint(overlay, '目前原生畫布尚未支援橡皮擦');
          return;
        }
        mode = 'eraser';
        updateButtons();
        showFloatingHint(overlay, '橡皮擦：直接擦除筆跡');
        return;
      }

      switchMode(nextMode, true);
    });

    textButton.addEventListener('click', () => {
      if (isNativeInkSession()) {
        showFloatingHint(overlay, '文字工具目前支援一般手機／瀏覽器畫布');
        return;
      }
      showMenu(textMenu);
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

    auxButton.addEventListener('pointerdown', event => {
      if (mode !== 'shape' && mode !== 'text') return;
      event.preventDefault();
      event.stopPropagation();
      constraintPointerId = event.pointerId;
      try { auxButton.setPointerCapture?.(event.pointerId); } catch {}

      if (mode === 'shape') {
        constraintHeld = true;
        updateAuxButton();
        const labels = {
          line: '鎖定：水平／垂直直線',
          circle: '鎖定：正圓',
          rect: '鎖定：正方形',
          triangle: '鎖定：正三角形'
        };
        showFloatingHint(overlay, labels[selectedShape], 1100);
      } else {
        textSizeStartY = event.clientY;
        textSizeStartValue = textSize;
        updateAuxButton();
        showFloatingHint(overlay, `字級 ${textSize}px`, 900);
      }
    });

    auxButton.addEventListener('pointermove', event => {
      if (constraintPointerId !== event.pointerId || mode !== 'text') return;
      event.preventDefault();
      const dy = textSizeStartY - event.clientY;
      textSize = Math.max(14, Math.min(72, Math.round(textSizeStartValue + dy * 0.45)));
      updateAuxButton();
      showFloatingHint(overlay, `字級 ${textSize}px`, 500);
    });

    function releaseAux(event) {
      if (constraintPointerId !== event.pointerId) return;
      if (mode === 'shape') constraintHeld = false;
      constraintPointerId = null;
      updateAuxButton();
      try { auxButton.releasePointerCapture?.(event.pointerId); } catch {}
    }

    auxButton.addEventListener('pointerup', releaseAux);
    auxButton.addEventListener('pointercancel', releaseAux);

    canvas.addEventListener('pointerdown', onShapePointerDown, { capture: true, passive: false });
    canvas.addEventListener('pointerrawupdate', onShapePointerMove, { capture: true, passive: false });
    canvas.addEventListener('pointermove', onShapePointerMove, { capture: true, passive: false });
    canvas.addEventListener('pointerup', onShapePointerUp, { capture: true, passive: false });
    canvas.addEventListener('pointercancel', onShapePointerCancel, { capture: true, passive: false });
    canvas.addEventListener('pointerdown', onTextPointerDown, { capture: true, passive: false });

    canvas.addEventListener('pointerdown', moveCursor, { passive: true });
    canvas.addEventListener('pointermove', moveCursor, { passive: true });
    canvas.addEventListener('pointerup', hideCursor, { passive: true });
    canvas.addEventListener('pointercancel', hideCursor, { passive: true });
    canvas.addEventListener('pointerleave', hideCursor, { passive: true });

    clearButton.addEventListener('click', () => {
      hideMenus();
      resetShapeGesture(false);
      showFloatingHint(overlay, '畫布已清除', 1100);
      if (!isNativeInkSession()) {
        requestAnimationFrame(() => setWebCanvasTool(canvas, mode === 'eraser'));
      }
    });

    overlay.addEventListener('pointerdown', event => {
      if (
        !shapeMenu.contains(event.target) && !textMenu.contains(event.target) &&
        event.target !== shapeButton && event.target !== textButton
      ) {
        hideMenus();
      }
    });

    const doneButton = overlay.querySelector('#paperCanvasDoneBtn');
    const cancelButton = overlay.querySelector('#paperCanvasCancelBtn');

    const resetTool = () => {
      hideMenus();
      hideCursor();
      resetShapeGesture(false);
      constraintHeld = false;
      constraintPointerId = null;
      if (mode === 'eraser' && isNativeInkSession()) setNativeEraser(false);
      mode = 'pen';
    };

    doneButton?.addEventListener('click', resetTool, { once: true });
    cancelButton?.addEventListener('click', resetTool, { once: true });

    updateButtons();
    requestAnimationFrame(() => {
      showFloatingHint(overlay, '畫筆可自由書寫；直線可切換圖形；「文」可加入標示', 2300);
    });
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
