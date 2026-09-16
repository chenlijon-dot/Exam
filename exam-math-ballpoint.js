(() => {
  'use strict';

  const BASE_INK = [15, 23, 42];
  const DEFAULT_WIDTH = 1.62;
  const MIN_WIDTH = 1.12;
  const MAX_WIDTH = 2.18;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function install(overlay) {
    if (!overlay || overlay.dataset.ballpointBrushInstalled === '1') return;

    const canvas = overlay.querySelector('#mathPaperCanvas');
    if (!canvas) return;

    overlay.dataset.ballpointBrushInstalled = '1';

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let activePointerId = null;
    let lastX = 0;
    let lastY = 0;
    let lastTime = 0;
    let smoothedWidth = DEFAULT_WIDTH;
    let smoothedSpeed = 0;
    let pressureSeen = false;

    function toolIsActive(id) {
      return overlay.querySelector(`#${id}`)?.getAttribute('aria-pressed') === 'true';
    }

    function isFreehandPen() {
      return !toolIsActive('paperCanvasPointerBtn') &&
        !toolIsActive('paperCanvasShapeBtn') &&
        !toolIsActive('paperCanvasEraserBtn') &&
        !toolIsActive('paperCanvasTextBtn');
    }

    function setInk(width, alpha) {
      const a = clamp(alpha, 0.78, 0.98);
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = `rgba(${BASE_INK[0]},${BASE_INK[1]},${BASE_INK[2]},${a.toFixed(3)})`;
      ctx.lineWidth = clamp(width, MIN_WIDTH, MAX_WIDTH);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    function beginStroke(event) {
      if (!isFreehandPen()) return;

      activePointerId = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      lastTime = event.timeStamp || performance.now();
      smoothedWidth = DEFAULT_WIDTH;
      smoothedSpeed = 0;
      pressureSeen = false;

      setInk(DEFAULT_WIDTH, 0.93);
    }

    function tuneStroke(event) {
      if (!isFreehandPen()) return;
      if (activePointerId !== null && event.pointerId !== activePointerId) return;

      const now = event.timeStamp || performance.now();
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      const distance = Math.hypot(dx, dy);
      const dt = Math.max(1, now - lastTime);
      const rawSpeed = distance / dt;

      smoothedSpeed = smoothedSpeed * 0.72 + rawSpeed * 0.28;

      const rawPressure = Number(event.pressure);
      const penPressure = event.pointerType === 'pen' && Number.isFinite(rawPressure) && rawPressure > 0.01;
      if (penPressure && Math.abs(rawPressure - 0.5) > 0.035) pressureSeen = true;

      const pressure = pressureSeen && penPressure
        ? clamp(rawPressure, 0.08, 1)
        : 0.48;

      /*
       * Ballpoint feel:
       * - fast strokes become slightly finer;
       * - slow strokes gain a little body;
       * - real stylus pressure adds only subtle variation (not calligraphy).
       * The range intentionally stays narrow so handwriting remains crisp.
       */
      const slowFactor = 1 - clamp(smoothedSpeed / 1.15, 0, 1);
      const pressureDelta = (pressure - 0.48) * 0.62;
      const targetWidth = clamp(
        1.30 + slowFactor * 0.46 + pressureDelta,
        MIN_WIDTH,
        MAX_WIDTH
      );

      smoothedWidth = smoothedWidth * 0.68 + targetWidth * 0.32;

      const alpha = clamp(
        0.88 + slowFactor * 0.045 + (pressure - 0.48) * 0.075,
        0.82,
        0.97
      );

      setInk(smoothedWidth, alpha);

      lastX = event.clientX;
      lastY = event.clientY;
      lastTime = now;
    }

    function endStroke(event) {
      if (event.pointerId !== activePointerId) return;
      activePointerId = null;
      setInk(DEFAULT_WIDTH, 0.93);
    }

    /*
     * These capture listeners run before the legacy handwriting renderer.
     * We do not replace its well-tested palm filtering or sample reconstruction;
     * we only tune Canvas ink width/opacity immediately before it calls stroke().
     */
    canvas.addEventListener('pointerdown', beginStroke, {
      capture: true,
      passive: true
    });

    const moveEvent = 'onpointerrawupdate' in window
      ? 'pointerrawupdate'
      : 'pointermove';

    canvas.addEventListener(moveEvent, tuneStroke, {
      capture: true,
      passive: true
    });

    canvas.addEventListener('pointerup', endStroke, {
      capture: true,
      passive: true
    });

    canvas.addEventListener('pointercancel', endStroke, {
      capture: true,
      passive: true
    });

    window.MathBallpointBrush = {
      name: 'ballpoint',
      minWidth: MIN_WIDTH,
      maxWidth: MAX_WIDTH,
      defaultWidth: DEFAULT_WIDTH
    };
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
