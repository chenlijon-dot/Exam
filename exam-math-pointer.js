(() => {
  'use strict';

  const POINTER_BUTTON_ID = 'paperCanvasPointerBtn';
  const ZOOM_BADGE_ID = 'paperCanvasZoomBadge';
  const MIN_SCALE = 1;
  const MAX_SCALE = 4;

  function isNativeInkSession() {
    try {
      const overlay = document.getElementById('mathPaperCanvasOverlay');
      if (overlay?.dataset?.fullToolset === '1') return false;

      const bridge = window.StudentExamNative;
      const image = document.getElementById('paperAnswerImage');
      const hasSavedAnswer = String(image?.getAttribute('src') || '').startsWith('data:image/');
      return !!(
        bridge &&
        typeof bridge.showNativeInkSurface === 'function' &&
        !hasSavedAnswer
      );
    } catch {
      return false;
    }
  }

  function hint(overlay, text, duration = 1600) {
    const existing = overlay.querySelector('#paperCanvasFloatingHint');
    if (existing) {
      existing.textContent = text;
      existing.style.opacity = '1';
      existing.style.transform = 'translate(-50%,0)';
      clearTimeout(existing.__pointerHintTimer);
      existing.__pointerHintTimer = setTimeout(() => {
        existing.style.opacity = '0';
        existing.style.transform = 'translate(-50%,-7px)';
      }, duration);
      return;
    }

    const bubble = document.createElement('div');
    bubble.id = 'paperCanvasPointerHint';
    bubble.textContent = text;
    bubble.style.cssText = [
      'position:fixed',
      'left:50%',
      'top:64px',
      'transform:translateX(-50%)',
      'z-index:100060',
      'max-width:88vw',
      'padding:9px 13px',
      'border-radius:999px',
      'background:rgba(15,23,42,.9)',
      'color:#fff',
      'font-size:13px',
      'font-weight:800',
      'pointer-events:none',
      'box-shadow:0 7px 22px rgba(0,0,0,.24)'
    ].join(';');
    overlay.appendChild(bubble);
    setTimeout(() => bubble.remove(), duration);
  }

  function install(overlay) {
    if (!overlay || overlay.dataset.pointerToolInstalled === '1') return;

    const canvas = overlay.querySelector('#mathPaperCanvas');
    const stage = overlay.querySelector('#paperCanvasStage');
    const clearButton = overlay.querySelector('#paperCanvasClearBtn');
    if (!canvas || !stage || !clearButton) return;

    overlay.dataset.pointerToolInstalled = '1';

    const toolbar = clearButton.parentElement;
    const shapeButton = overlay.querySelector('#paperCanvasShapeBtn');

    const pointerButton = document.createElement('button');
    pointerButton.id = POINTER_BUTTON_ID;
    pointerButton.type = 'button';
    pointerButton.textContent = '指標';
    pointerButton.setAttribute('aria-pressed', 'false');
    pointerButton.style.cssText = 'border:0;border-radius:11px;padding:7px 9px;min-height:42px;font-size:14px;line-height:1.1;font-weight:800;background:#475569;color:white;white-space:nowrap;touch-action:manipulation;flex:0 0 auto';

    if (shapeButton) toolbar.insertBefore(pointerButton, shapeButton);
    else toolbar.insertBefore(pointerButton, clearButton);

    const zoomBadge = document.createElement('button');
    zoomBadge.id = ZOOM_BADGE_ID;
    zoomBadge.type = 'button';
    zoomBadge.textContent = '100%';
    zoomBadge.style.cssText = [
      'position:fixed',
      'right:16px',
      'bottom:calc(18px + env(safe-area-inset-bottom,0px))',
      'z-index:100055',
      'display:none',
      'min-width:58px',
      'height:42px',
      'padding:0 11px',
      'border:0',
      'border-radius:999px',
      'background:rgba(15,23,42,.88)',
      'color:white',
      'font-size:13px',
      'font-weight:900',
      'box-shadow:0 6px 20px rgba(0,0,0,.28)',
      'touch-action:manipulation'
    ].join(';');
    overlay.appendChild(zoomBadge);

    let pointerMode = false;
    let viewScale = 1;
    let offsetX = 0;
    let offsetY = 0;

    const activePointers = new Map();
    let panStart = null;
    let pinchStart = null;
    const mappedEvents = new WeakSet();

    const originalCanvasPointerEvents = canvas.style.pointerEvents;
    const originalStageTouchAction = stage.style.touchAction;

    canvas.style.transformOrigin = '0 0';
    canvas.style.willChange = 'transform';

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function naturalBase() {
      const stageRect = stage.getBoundingClientRect();
      return {
        left: stageRect.left + canvas.offsetLeft,
        top: stageRect.top + canvas.offsetTop
      };
    }

    function clampOffsets() {
      if (viewScale <= 1.001) {
        viewScale = 1;
        offsetX = 0;
        offsetY = 0;
        return;
      }

      const scaledW = canvas.clientWidth * viewScale;
      const scaledH = canvas.clientHeight * viewScale;
      const minX = Math.min(0, stage.clientWidth - scaledW - 10);
      const minY = Math.min(0, stage.clientHeight - scaledH - 10);

      offsetX = clamp(offsetX, minX, 0);
      offsetY = clamp(offsetY, minY, 0);
    }

    function applyView() {
      clampOffsets();
      canvas.style.transform = `matrix(${viewScale},0,0,${viewScale},${offsetX},${offsetY})`;
      zoomBadge.textContent = `${Math.round(viewScale * 100)}%`;
      zoomBadge.style.display = pointerMode || viewScale > 1.001 ? 'block' : 'none';
    }

    function resetView(showHint = true) {
      viewScale = 1;
      offsetX = 0;
      offsetY = 0;
      activePointers.clear();
      panStart = null;
      pinchStart = null;
      applyView();
      if (showHint) hint(overlay, '畫布已回到 100%');
    }

    function forcePenModeBeforePointer() {
      const shapeMenu = overlay.querySelector('#paperCanvasShapeMenu');
      const pen = [...(shapeMenu?.querySelectorAll('button') || [])]
        .find(button => String(button.textContent || '').trim() === '畫筆');
      if (pen) pen.click();
    }

    function setPointerMode(enabled) {
      if (enabled && isNativeInkSession()) {
        hint(overlay, '指標縮放目前支援一般手機／瀏覽器畫布');
        return;
      }

      if (enabled && !pointerMode) {
        forcePenModeBeforePointer();
      }

      pointerMode = !!enabled;
      activePointers.clear();
      panStart = null;
      pinchStart = null;

      if (pointerMode) {
        canvas.style.pointerEvents = 'none';
        stage.style.touchAction = 'none';

        pointerButton.textContent = '指標✓';
        pointerButton.style.background = '#f59e0b';
        pointerButton.style.color = '#451a03';
        pointerButton.setAttribute('aria-pressed', 'true');
        stage.style.cursor = 'grab';
        zoomBadge.style.display = 'block';
        hint(overlay, '指標：單指拖動畫布，雙指縮放');
      } else {
        canvas.style.pointerEvents = originalCanvasPointerEvents;
        stage.style.touchAction = originalStageTouchAction || 'none';

        pointerButton.textContent = '指標';
        pointerButton.style.background = '#475569';
        pointerButton.style.color = '#ffffff';
        pointerButton.setAttribute('aria-pressed', 'false');
        stage.style.cursor = '';
        zoomBadge.style.display = viewScale > 1.001 ? 'block' : 'none';
      }

      applyView();
    }

    function midpoint(a, b) {
      return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2
      };
    }

    function distance(a, b) {
      return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function startPinch() {
      const points = [...activePointers.values()];
      if (points.length < 2) return;

      const a = points[0];
      const b = points[1];
      const mid = midpoint(a, b);
      const base = naturalBase();

      pinchStart = {
        distance: Math.max(1, distance(a, b)),
        scale: viewScale,
        contentX: (mid.x - base.left - offsetX) / viewScale,
        contentY: (mid.y - base.top - offsetY) / viewScale
      };
      panStart = null;
    }

    function updateGesture() {
      const points = [...activePointers.values()];

      if (points.length >= 2) {
        if (!pinchStart) startPinch();
        if (!pinchStart) return;

        const a = points[0];
        const b = points[1];
        const currentMid = midpoint(a, b);
        const currentDistance = Math.max(1, distance(a, b));
        const base = naturalBase();
        const nextScale = clamp(
          pinchStart.scale * currentDistance / pinchStart.distance,
          MIN_SCALE,
          MAX_SCALE
        );

        viewScale = nextScale;
        offsetX = currentMid.x - base.left - pinchStart.contentX * viewScale;
        offsetY = currentMid.y - base.top - pinchStart.contentY * viewScale;
        applyView();
        return;
      }

      if (points.length === 1) {
        const p = points[0];
        if (!panStart) {
          panStart = {
            x: p.x,
            y: p.y,
            offsetX,
            offsetY
          };
        }

        offsetX = panStart.offsetX + (p.x - panStart.x);
        offsetY = panStart.offsetY + (p.y - panStart.y);
        applyView();
      }
    }

    function pointerInsideStage(event) {
      if (event.target === stage || event.target === canvas) return true;
      return !!event.target?.closest?.('#paperCanvasStage');
    }

    function handlePointerGesture(event) {
      if (!pointerMode || mappedEvents.has(event)) return false;
      if (!pointerInsideStage(event)) return false;

      if (event.cancelable) event.preventDefault();
      event.stopImmediatePropagation();

      if (event.type === 'pointerdown') {
        activePointers.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY
        });

        try { stage.setPointerCapture?.(event.pointerId); } catch {}

        if (activePointers.size === 1) {
          panStart = {
            x: event.clientX,
            y: event.clientY,
            offsetX,
            offsetY
          };
          pinchStart = null;
        } else if (activePointers.size === 2) {
          startPinch();
        }

        return true;
      }

      if (event.type === 'pointermove' || event.type === 'pointerrawupdate') {
        if (!activePointers.has(event.pointerId)) return true;

        activePointers.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY
        });
        updateGesture();
        return true;
      }

      if (event.type === 'pointerup' || event.type === 'pointercancel') {
        activePointers.delete(event.pointerId);
        try { stage.releasePointerCapture?.(event.pointerId); } catch {}

        pinchStart = null;
        panStart = null;

        const remain = [...activePointers.values()];
        if (remain.length >= 2) {
          startPinch();
        } else if (remain.length === 1) {
          const p = remain[0];
          panStart = {
            x: p.x,
            y: p.y,
            offsetX,
            offsetY
          };
        }
        return true;
      }

      return true;
    }

    function makeMappedPointerEvent(original) {
      const rect = canvas.getBoundingClientRect();
      const logicalX = (original.clientX - rect.left) / viewScale;
      const logicalY = (original.clientY - rect.top) / viewScale;
      const mappedClientX = rect.left + logicalX;
      const mappedClientY = rect.top + logicalY;

      const init = {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId: original.pointerId + 500000,
        width: original.width,
        height: original.height,
        pressure: original.pressure,
        tangentialPressure: original.tangentialPressure || 0,
        tiltX: original.tiltX || 0,
        tiltY: original.tiltY || 0,
        twist: original.twist || 0,
        pointerType: original.pointerType || 'touch',
        isPrimary: original.isPrimary,
        button: original.button,
        buttons: original.buttons,
        clientX: mappedClientX,
        clientY: mappedClientY,
        screenX: original.screenX,
        screenY: original.screenY,
        ctrlKey: original.ctrlKey,
        shiftKey: original.shiftKey,
        altKey: original.altKey,
        metaKey: original.metaKey
      };

      const mapped = new PointerEvent(original.type, init);
      mappedEvents.add(mapped);

      try {
        Object.defineProperty(mapped, 'getCoalescedEvents', {
          configurable: true,
          value: () => [mapped]
        });
      } catch {}

      return mapped;
    }

    function keepVisualCursorOnPhysicalPointer(original) {
      const eraserCursor = overlay.querySelector('#paperCanvasEraserCursor');
      if (!eraserCursor || eraserCursor.style.display === 'none') return;

      eraserCursor.style.left = `${original.clientX}px`;
      eraserCursor.style.top = `${original.clientY}px`;
    }

    function remapDrawingEvent(event) {
      if (mappedEvents.has(event)) return;
      if (pointerMode || viewScale <= 1.001) return;
      if (event.target !== canvas) return;

      if (event.cancelable) event.preventDefault();
      event.stopImmediatePropagation();

      const mapped = makeMappedPointerEvent(event);
      canvas.dispatchEvent(mapped);

      /*
       * Drawing needs logical (unscaled) coordinates, but the eraser ring is a
       * fixed screen-space overlay. The mapped event therefore deliberately
       * carries different clientX/clientY values. Restore the ring to the real
       * finger/stylus screen position after the mapped handlers have run.
       */
      keepVisualCursorOnPhysicalPointer(event);
    }

    const eventTypes = [
      'pointerdown',
      'pointerrawupdate',
      'pointermove',
      'pointerup',
      'pointercancel'
    ];

    eventTypes.forEach(type => {
      overlay.addEventListener(type, event => {
        if (mappedEvents.has(event)) return;
        if (handlePointerGesture(event)) return;
        remapDrawingEvent(event);
      }, { capture: true, passive: false });
    });

    pointerButton.addEventListener('click', () => {
      setPointerMode(!pointerMode);
    });

    zoomBadge.addEventListener('click', () => {
      resetView(true);
    });

    overlay.addEventListener('click', event => {
      if (!pointerMode) return;

      const target = event.target.closest?.('button');
      if (!target || target === pointerButton || target === zoomBadge) return;

      if (
        target.id === 'paperCanvasShapeBtn' ||
        target.id === 'paperCanvasEraserBtn' ||
        target.id === 'paperCanvasTextBtn' ||
        target.closest?.('#paperCanvasShapeMenu') ||
        target.closest?.('#paperCanvasTextMenu')
      ) {
        setPointerMode(false);
      }
    }, true);

    clearButton.addEventListener('click', () => {
      if (viewScale > 1.001) requestAnimationFrame(applyView);
    });

    const doneButton = overlay.querySelector('#paperCanvasDoneBtn');
    const cancelButton = overlay.querySelector('#paperCanvasCancelBtn');

    const cleanupView = () => {
      pointerMode = false;
      activePointers.clear();
      canvas.style.pointerEvents = originalCanvasPointerEvents;
      stage.style.touchAction = originalStageTouchAction;
      canvas.style.transform = '';
      canvas.style.transformOrigin = '';
      canvas.style.willChange = '';
      stage.style.cursor = '';
    };

    doneButton?.addEventListener('click', cleanupView, { once: true });
    cancelButton?.addEventListener('click', cleanupView, { once: true });

    applyView();
  }

  function scan() {
    install(document.getElementById('mathPaperCanvasOverlay'));
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
