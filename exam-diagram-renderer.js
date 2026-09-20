(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const VIEW_W = 760;
  const VIEW_H = 156;
  const AXIS_Y = 82;
  const AXIS_LEFT = 58;
  const AXIS_RIGHT = 702;
  const MAX_TICKS = 201;

  function svgEl(name, attrs = {}, text = '') {
    const el = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value !== undefined && value !== null) el.setAttribute(key, String(value));
    });
    if (text !== '') el.textContent = String(text);
    return el;
  }

  function finiteNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function cleanNumber(value) {
    const rounded = Math.round(Number(value) * 1e10) / 1e10;
    return Object.is(rounded, -0) ? 0 : rounded;
  }

  function formatNumber(value) {
    const number = cleanNumber(value);
    if (Number.isInteger(number)) return String(number);
    return String(Number(number.toFixed(6)));
  }

  function safeFallback(container, message = '圖形資料格式錯誤') {
    if (!container) return null;
    container.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'diagram-fallback';
    box.setAttribute('role', 'note');
    box.textContent = message;
    container.appendChild(box);
    return null;
  }

  function validateDiagramSpec(spec) {
    if (!spec || typeof spec !== 'object') {
      return { ok:false, reason:'diagram spec 必須是物件' };
    }
    if (spec.type !== 'number-line') {
      return { ok:false, reason:`不支援的 diagram type: ${String(spec.type || '')}` };
    }

    const min = finiteNumber(spec.min);
    const max = finiteNumber(spec.max);
    const tickStep = finiteNumber(spec.tickStep ?? 1);

    if (min === null || max === null || !(max > min)) {
      return { ok:false, reason:'number-line 需要有限數值且 max > min' };
    }
    if (tickStep === null || tickStep <= 0) {
      return { ok:false, reason:'tickStep 必須大於 0' };
    }

    const estimatedTicks = Math.floor((max - min) / tickStep + 1e-9) + 1;
    if (!Number.isFinite(estimatedTicks) || estimatedTicks < 2 || estimatedTicks > MAX_TICKS) {
      return { ok:false, reason:`刻度數量需介於 2 到 ${MAX_TICKS} 之間` };
    }

    return {
      ok:true,
      value:{
        ...spec,
        min,
        max,
        tickStep,
        showNumberLabels: spec.showNumberLabels !== false,
        showArrows: spec.showArrows !== false,
        points: Array.isArray(spec.points) ? spec.points : []
      }
    };
  }

  function enumerateTicks(min, max, step) {
    const ticks = [];
    const epsilon = Math.abs(step) * 1e-7 + 1e-10;
    for (let i = 0; i < MAX_TICKS; i += 1) {
      const value = cleanNumber(min + i * step);
      if (value > max + epsilon) break;
      ticks.push(value);
    }

    const last = ticks[ticks.length - 1];
    if (last === undefined || Math.abs(last - max) > epsilon) {
      ticks.push(cleanNumber(max));
    }
    return ticks;
  }

  function ariaDescription(spec) {
    if (spec.ariaLabel) return String(spec.ariaLabel);
    const parts = [`數線，範圍 ${formatNumber(spec.min)} 到 ${formatNumber(spec.max)}`];

    const validPoints = spec.points
      .map(point => ({
        x: finiteNumber(point?.x),
        label: point?.label ? String(point.label) : ''
      }))
      .filter(point => point.x !== null && point.x >= spec.min && point.x <= spec.max);

    if (validPoints.length) {
      parts.push(
        validPoints.map(point =>
          point.label
            ? `${point.label} 點在 ${formatNumber(point.x)}`
            : `標記點在 ${formatNumber(point.x)}`
        ).join('，')
      );
    }
    return parts.join('；');
  }

  function ensureStyles() {
    if (document.getElementById('examDiagramRendererStyles')) return;
    const style = document.createElement('style');
    style.id = 'examDiagramRendererStyles';
    style.textContent = `
      .question-diagram-host,
      .number-line-diagram{
        width:100%;
        max-width:760px;
        margin:12px auto 14px;
      }
      .number-line-diagram svg{
        display:block;
        width:100%;
        height:auto;
        overflow:visible;
      }
      .number-line-diagram .nl-axis{
        stroke:#0f172a;
        stroke-width:3;
        vector-effect:non-scaling-stroke;
      }
      .number-line-diagram .nl-tick{
        stroke:#334155;
        stroke-width:2;
        vector-effect:non-scaling-stroke;
      }
      .number-line-diagram .nl-zero{
        stroke:#0f172a;
        stroke-width:3;
      }
      .number-line-diagram .nl-number{
        fill:#334155;
        font:600 17px/1 system-ui,-apple-system,"Segoe UI","Noto Sans TC",sans-serif;
        text-anchor:middle;
      }
      .number-line-diagram .nl-point-label{
        fill:#0f172a;
        font:800 18px/1 system-ui,-apple-system,"Segoe UI","Noto Sans TC",sans-serif;
        text-anchor:middle;
      }
      .number-line-diagram .nl-point-value{
        fill:#475569;
        font:600 14px/1 system-ui,-apple-system,"Segoe UI","Noto Sans TC",sans-serif;
        text-anchor:middle;
      }
      .number-line-diagram .nl-point{
        stroke:#0f172a;
        stroke-width:2.5;
        vector-effect:non-scaling-stroke;
      }
      .diagram-fallback{
        margin:12px auto;
        max-width:760px;
        padding:12px 14px;
        border:1px dashed #cbd5e1;
        border-radius:12px;
        background:#f8fafc;
        color:#64748b;
        text-align:center;
        font-size:.9rem;
      }
      @media(max-width:620px){
        .number-line-diagram .nl-number{font-size:15px}
        .number-line-diagram .nl-point-label{font-size:17px}
      }
    `;
    document.head.appendChild(style);
  }

  function renderNumberLine(container, rawSpec) {
    ensureStyles();
    const checked = validateDiagramSpec(rawSpec);
    if (!checked.ok) {
      console.warn('[DiagramRenderer]', checked.reason, rawSpec);
      return safeFallback(container);
    }

    const spec = checked.value;
    if (!container) return null;
    container.innerHTML = '';
    container.classList.add('number-line-diagram');

    const svg = svgEl('svg', {
      viewBox:`0 0 ${VIEW_W} ${VIEW_H}`,
      width:'100%',
      role:'img',
      'aria-label':ariaDescription(spec),
      preserveAspectRatio:'xMidYMid meet'
    });

    const span = spec.max - spec.min;
    const xFor = value =>
      AXIS_LEFT + ((value - spec.min) / span) * (AXIS_RIGHT - AXIS_LEFT);

    svg.appendChild(svgEl('line', {
      x1:AXIS_LEFT,
      y1:AXIS_Y,
      x2:AXIS_RIGHT,
      y2:AXIS_Y,
      class:'nl-axis'
    }));

    if (spec.showArrows) {
      svg.appendChild(svgEl('polygon', {
        points:`${AXIS_LEFT},${AXIS_Y} ${AXIS_LEFT + 13},${AXIS_Y - 7} ${AXIS_LEFT + 13},${AXIS_Y + 7}`,
        fill:'#0f172a'
      }));
      svg.appendChild(svgEl('polygon', {
        points:`${AXIS_RIGHT},${AXIS_Y} ${AXIS_RIGHT - 13},${AXIS_Y - 7} ${AXIS_RIGHT - 13},${AXIS_Y + 7}`,
        fill:'#0f172a'
      }));
    }

    const ticks = enumerateTicks(spec.min, spec.max, spec.tickStep);
    const labelEvery = ticks.length > 25 ? Math.ceil(ticks.length / 21) : 1;

    ticks.forEach((value, index) => {
      const x = xFor(value);
      const isZero = Math.abs(value) < 1e-10;
      svg.appendChild(svgEl('line', {
        x1:x,
        y1:AXIS_Y - (isZero ? 11 : 8),
        x2:x,
        y2:AXIS_Y + (isZero ? 11 : 8),
        class:isZero ? 'nl-tick nl-zero' : 'nl-tick'
      }));

      if (
        spec.showNumberLabels &&
        (index % labelEvery === 0 || index === ticks.length - 1 || isZero)
      ) {
        svg.appendChild(svgEl('text', {
          x,
          y:AXIS_Y + 31,
          class:'nl-number'
        }, formatNumber(value)));
      }
    });

    spec.points.forEach((point, pointIndex) => {
      const value = finiteNumber(point?.x);
      if (value === null) {
        console.warn('[DiagramRenderer] point.x 不是有限數值', point);
        return;
      }
      if (value < spec.min || value > spec.max) {
        console.warn('[DiagramRenderer] point.x 超出數線範圍，略過', point);
        return;
      }

      const x = xFor(value);
      const label = point?.label ? String(point.label) : '';
      const style = ['solid','hollow','marker'].includes(point?.style)
        ? point.style
        : 'solid';

      if (!label && point?.label !== '') {
        console.warn(`[DiagramRenderer] 第 ${pointIndex + 1} 個 point 缺少 label`);
      }

      if (style === 'marker') {
        svg.appendChild(svgEl('polygon', {
          points:`${x},${AXIS_Y - 8} ${x - 7},${AXIS_Y - 20} ${x + 7},${AXIS_Y - 20}`,
          fill:'#0f172a'
        }));
      } else {
        svg.appendChild(svgEl('circle', {
          cx:x,
          cy:AXIS_Y,
          r:6.5,
          fill:style === 'hollow' ? '#ffffff' : '#0f172a',
          class:'nl-point'
        }));
      }

      if (label) {
        svg.appendChild(svgEl('text', {
          x,
          y:point?.showValue ? AXIS_Y - 36 : AXIS_Y - 24,
          class:'nl-point-label'
        }, label));
      }

      if (point?.showValue) {
        svg.appendChild(svgEl('text', {
          x,
          y:AXIS_Y - 19,
          class:'nl-point-value'
        }, formatNumber(value)));
      }
    });

    container.appendChild(svg);
    return svg;
  }

  function renderDiagram(container, spec) {
    if (!container) return null;
    if (!spec || typeof spec !== 'object') {
      console.warn('[DiagramRenderer] diagram spec 缺失');
      return safeFallback(container);
    }

    switch (spec.type) {
      case 'number-line':
        return renderNumberLine(container, spec);
      default:
        console.warn('[DiagramRenderer] 不支援的 diagram type', spec.type);
        return safeFallback(container);
    }
  }

  window.validateDiagramSpec = validateDiagramSpec;
  window.renderNumberLine = renderNumberLine;
  window.renderDiagram = renderDiagram;
})();
