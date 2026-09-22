(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const VIEW_W = 760;
  const NL_VIEW_H = 156;
  const GEO_VIEW_H = 420;
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

  function pointValue(point, key) {
    return finiteNumber(point?.[key]);
  }

  function normalizeVertex(point, fallbackLabel = '') {
    const x = pointValue(point, 'x');
    const y = pointValue(point, 'y');
    if (x === null || y === null) return null;
    return {
      x,
      y,
      label:point?.label === undefined ? fallbackLabel : String(point.label)
    };
  }

  function normalizeVertex3D(point, fallbackLabel = '') {
    const x = finiteNumber(point?.x);
    const y = finiteNumber(point?.y);
    const z = finiteNumber(point?.z);
    if (x === null || y === null || z === null) return null;
    return {
      x,
      y,
      z,
      label:point?.label === undefined ? fallbackLabel : String(point.label)
    };
  }

  function buildBoxSolid(spec) {
    const origin = normalizeVertex3D(spec.origin || { x:0, y:0, z:0 }, '');
    if (!origin) return null;

    let width;
    let height;
    let depth;

    if (spec.solid === 'cube') {
      const size = finiteNumber(spec.size);
      if (size === null || size <= 0) return null;
      width = size;
      height = size;
      depth = size;
    } else {
      width = finiteNumber(spec.width);
      height = finiteNumber(spec.height);
      depth = finiteNumber(spec.depth);
      if (
        width === null || height === null || depth === null ||
        width <= 0 || height <= 0 || depth <= 0
      ) return null;
    }

    const x = origin.x;
    const y = origin.y;
    const z = origin.z;

    const vertices = {
      A:{ x, y, z, label:'A' },
      B:{ x:x + width, y, z, label:'B' },
      C:{ x:x + width, y:y + height, z, label:'C' },
      D:{ x, y:y + height, z, label:'D' },
      E:{ x, y, z:z + depth, label:'E' },
      F:{ x:x + width, y, z:z + depth, label:'F' },
      G:{ x:x + width, y:y + height, z:z + depth, label:'G' },
      H:{ x, y:y + height, z:z + depth, label:'H' }
    };

    const edges = [
      ['A','B'],['B','C'],['C','D'],['D','A'],
      ['E','F'],['F','G'],['G','H'],['H','E'],
      ['A','E'],['B','F'],['C','G'],['D','H']
    ];

    const faces = [
      ['A','B','C','D'],
      ['E','F','G','H'],
      ['A','B','F','E'],
      ['B','C','G','F'],
      ['C','D','H','G'],
      ['D','A','E','H']
    ];

    return { vertices, edges, faces };
  }

  function validateSolidProjection(spec) {
    const solid = String(spec.solid || 'cube');
    if (!['cube','cuboid','custom'].includes(solid)) {
      return { ok:false, reason:'solid-projection 目前支援 cube / cuboid / custom' };
    }

    let built;

    if (solid === 'custom') {
      const sourceVertices = spec.vertices && typeof spec.vertices === 'object'
        ? spec.vertices
        : null;
      const sourceEdges = Array.isArray(spec.edges) ? spec.edges : null;

      if (!sourceVertices || !sourceEdges) {
        return { ok:false, reason:'custom solid 需要 vertices 與 edges' };
      }

      const vertices = {};
      for (const [name, point] of Object.entries(sourceVertices)) {
        const vertex = normalizeVertex3D(point, name);
        if (!vertex) {
          return { ok:false, reason:`custom solid 頂點 ${name} 格式錯誤` };
        }
        vertices[name] = { ...vertex, label:point?.label === undefined ? name : String(point.label) };
      }

      if (Object.keys(vertices).length < 2) {
        return { ok:false, reason:'custom solid 至少需要 2 個頂點' };
      }

      const edges = [];
      for (const edge of sourceEdges) {
        if (!Array.isArray(edge) || edge.length !== 2) {
          return { ok:false, reason:'custom solid edge 必須是 [from, to]' };
        }
        const from = String(edge[0]);
        const to = String(edge[1]);
        if (!vertices[from] || !vertices[to] || from === to) {
          return { ok:false, reason:`custom solid edge 無效: ${from}-${to}` };
        }
        edges.push([from, to]);
      }

      if (!edges.length) {
        return { ok:false, reason:'custom solid 至少需要 1 條 edge' };
      }

      let faces = [];
      if (Array.isArray(spec.faces)) {
        for (const face of spec.faces) {
          if (!Array.isArray(face) || face.length < 3) {
            return { ok:false, reason:'custom solid face 至少需要 3 個頂點' };
          }
          const normalizedFace = face.map(name => String(name));
          if (normalizedFace.some(name => !vertices[name])) {
            return { ok:false, reason:`custom solid face 包含不存在的頂點: ${normalizedFace.join('-')}` };
          }
          faces.push(normalizedFace);
        }
      }

      built = { vertices, edges, faces };
    } else {
      built = buildBoxSolid({ ...spec, solid });
      if (!built) {
        return { ok:false, reason:'solid-projection 尺寸或 origin 格式錯誤' };
      }
    }

    const view = spec.view && typeof spec.view === 'object' ? spec.view : {};
    const yaw = finiteNumber(view.yaw ?? 38);
    const pitch = finiteNumber(view.pitch ?? 28);
    const roll = finiteNumber(view.roll ?? 0);
    const projection = String(view.projection || 'orthographic');

    if (yaw === null || pitch === null || roll === null) {
      return { ok:false, reason:'solid-projection view 角度必須是有限數值' };
    }
    if (!['orthographic','oblique'].includes(projection)) {
      return { ok:false, reason:'solid-projection v1 projection 僅支援 orthographic / oblique' };
    }

    return {
      ok:true,
      value:{
        ...spec,
        type:'solid-projection',
        solid,
        vertices:built.vertices,
        edges:built.edges,
        faces:Array.isArray(built.faces) ? built.faces : [],
        view:{ yaw, pitch, roll, projection },
        showVertexLabels:spec.showVertexLabels !== false,
        showHiddenEdges:spec.showHiddenEdges !== false,
        showAxes:spec.showAxes === true,
        axisLength:finiteNumber(spec.axisLength)
      }
    };
  }

  function validateNumberLine(spec) {
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
        showNumberLabels:spec.showNumberLabels !== false,
        showArrows:spec.showArrows !== false,
        labelValues:Array.isArray(spec.labelValues)
          ? spec.labelValues.map(finiteNumber).filter(value => value !== null)
          : null,
        minorTicks:Array.isArray(spec.minorTicks)
          ? spec.minorTicks.map(finiteNumber).filter(value => value !== null)
          : [],
        points:Array.isArray(spec.points) ? spec.points : []
      }
    };
  }

  function validateTriangle(spec) {
    const vertices = Array.isArray(spec.vertices)
      ? spec.vertices.map((point, index) => normalizeVertex(point, ['A','B','C'][index] || '')).filter(Boolean)
      : [];

    if (vertices.length !== 3) {
      return { ok:false, reason:'triangle 需要正好 3 個 vertices' };
    }
    return { ok:true, value:{ ...spec, vertices, showVertexLabels:spec.showVertexLabels !== false } };
  }

  function validateSquare(spec) {
    let vertices = [];
    if (Array.isArray(spec.vertices)) {
      vertices = spec.vertices.map((point, index) =>
        normalizeVertex(point, ['A','B','C','D'][index] || '')
      ).filter(Boolean);
      if (vertices.length !== 4) {
        return { ok:false, reason:'square 使用 vertices 時需要正好 4 個頂點' };
      }
    } else {
      const x = finiteNumber(spec.x ?? 0);
      const y = finiteNumber(spec.y ?? 0);
      const size = finiteNumber(spec.size);
      if (x === null || y === null || size === null || size <= 0) {
        return { ok:false, reason:'square 需要 4 個 vertices，或有效的 x/y/size' };
      }
      vertices = [
        { x, y, label:'A' },
        { x:x + size, y, label:'B' },
        { x:x + size, y:y + size, label:'C' },
        { x, y:y + size, label:'D' }
      ];
    }
    return { ok:true, value:{ ...spec, vertices, showVertexLabels:spec.showVertexLabels !== false } };
  }

  function validateCircle(spec) {
    const centerSource = spec.center || { x:spec.cx ?? 0, y:spec.cy ?? 0, label:spec.centerLabel || 'O' };
    const center = normalizeVertex(centerSource, 'O');
    const radius = finiteNumber(spec.radius);
    if (!center || radius === null || radius <= 0) {
      return { ok:false, reason:'circle 需要有效 center 與 radius > 0' };
    }

    const points = Array.isArray(spec.points)
      ? spec.points.map(point => normalizeVertex(point, '')).filter(Boolean)
      : [];

    return {
      ok:true,
      value:{
        ...spec,
        center,
        radius,
        points,
        showCenter:spec.showCenter !== false,
        showVertexLabels:spec.showVertexLabels !== false
      }
    };
  }

  function validateCoordinatePlane(spec) {
    const xMin = finiteNumber(spec.xMin ?? -5);
    const xMax = finiteNumber(spec.xMax ?? 5);
    const yMin = finiteNumber(spec.yMin ?? -5);
    const yMax = finiteNumber(spec.yMax ?? 5);
    const tickStep = finiteNumber(spec.tickStep ?? 1);

    if (
      xMin === null || xMax === null || yMin === null || yMax === null ||
      !(xMax > xMin) || !(yMax > yMin)
    ) {
      return { ok:false, reason:'coordinate-plane 需要 xMax>xMin 且 yMax>yMin' };
    }
    if (tickStep === null || tickStep <= 0) {
      return { ok:false, reason:'coordinate-plane tickStep 必須大於 0' };
    }

    const xTicks = Math.floor((xMax - xMin) / tickStep + 1e-9) + 1;
    const yTicks = Math.floor((yMax - yMin) / tickStep + 1e-9) + 1;
    if (xTicks > MAX_TICKS || yTicks > MAX_TICKS) {
      return { ok:false, reason:'coordinate-plane 刻度數量過多' };
    }

    return {
      ok:true,
      value:{
        ...spec,
        xMin,
        xMax,
        yMin,
        yMax,
        tickStep,
        showGrid:spec.showGrid !== false,
        showNumberLabels:spec.showNumberLabels !== false,
        points:Array.isArray(spec.points) ? spec.points : [],
        segments:Array.isArray(spec.segments) ? spec.segments : []
      }
    };
  }


  function validateBullseye(spec) {
    const rings = Array.isArray(spec.rings) ? spec.rings : [];
    if (!rings.length) {
      return { ok:false, reason:'bullseye 需要 rings' };
    }

    const normalized = rings.map((ring, index) => ({
      radius:finiteNumber(ring?.radius),
      label:ring?.label === undefined ? '' : String(ring.label),
      labelAngle:finiteNumber(ring?.labelAngle ?? 0),
      labelRadius:finiteNumber(ring?.labelRadius),
      index
    }));

    if (normalized.some(ring => ring.radius === null || ring.radius <= 0)) {
      return { ok:false, reason:'bullseye ring radius 必須是正數' };
    }

    normalized.sort((a, b) => b.radius - a.radius);

    return {
      ok:true,
      value:{
        ...spec,
        type:'bullseye',
        rings:normalized,
        showCenter:spec.showCenter === true
      }
    };
  }

  function validateDiagramSpec(spec) {
    if (!spec || typeof spec !== 'object') {
      return { ok:false, reason:'diagram spec 必須是物件' };
    }

    switch (spec.type) {
      case 'number-line': return validateNumberLine(spec);
      case 'triangle': return validateTriangle(spec);
      case 'square': return validateSquare(spec);
      case 'circle': return validateCircle(spec);
      case 'bullseye': return validateBullseye(spec);
      case 'coordinate-plane':
      case 'xy-plane':
        return validateCoordinatePlane({ ...spec, type:'coordinate-plane' });
      case 'solid-projection':
        return validateSolidProjection(spec);
      default:
        return { ok:false, reason:`不支援的 diagram type: ${String(spec.type || '')}` };
    }
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

  function createSvg(height, ariaLabel) {
    return svgEl('svg', {
      viewBox:`0 0 ${VIEW_W} ${height}`,
      width:'100%',
      role:'img',
      'aria-label':ariaLabel,
      preserveAspectRatio:'xMidYMid meet'
    });
  }

  function numberLineAria(spec) {
    if (spec.ariaLabel) return String(spec.ariaLabel);
    const parts = [`數線，範圍 ${formatNumber(spec.min)} 到 ${formatNumber(spec.max)}`];

    const validPoints = spec.points
      .map(point => ({
        x:finiteNumber(point?.x),
        label:point?.label ? String(point.label) : ''
      }))
      .filter(point => point.x !== null && point.x >= spec.min && point.x <= spec.max);

    if (validPoints.length) {
      parts.push(validPoints.map(point =>
        point.label
          ? `${point.label} 點在 ${formatNumber(point.x)}`
          : `標記點在 ${formatNumber(point.x)}`
      ).join('，'));
    }
    return parts.join('；');
  }

  function ensureStyles() {
    if (document.getElementById('examDiagramRendererStyles')) return;
    const style = document.createElement('style');
    style.id = 'examDiagramRendererStyles';
    style.textContent = `
      .question-diagram-host,
      .number-line-diagram,
      .geometry-diagram,
      .coordinate-plane-diagram,
      .solid-projection-diagram,
      .bullseye-diagram{
        width:100%;
        max-width:760px;
        margin:12px auto 14px;
      }
      .number-line-diagram svg,
      .geometry-diagram svg,
      .coordinate-plane-diagram svg,
      .solid-projection-diagram svg,
      .bullseye-diagram svg{
        display:block;
        width:100%;
        height:auto;
        overflow:visible;
      }
      .nl-axis,.cp-axis,.geo-edge{
        stroke:#0f172a;
        stroke-width:3;
        vector-effect:non-scaling-stroke;
      }
      .nl-tick,.cp-tick{
        stroke:#334155;
        stroke-width:2;
        vector-effect:non-scaling-stroke;
      }
      .nl-minor-tick{
        stroke:#64748b;
        stroke-width:1.4;
        vector-effect:non-scaling-stroke;
      }
      .nl-zero{stroke:#0f172a;stroke-width:3}
      .nl-number,.cp-number{
        fill:#334155;
        font:600 17px/1 system-ui,-apple-system,"Segoe UI","Noto Sans TC",sans-serif;
        text-anchor:middle;
      }
      .nl-point-label,.geo-label,.cp-label,.bullseye-label{
        fill:#0f172a;
        font:800 18px/1 system-ui,-apple-system,"Segoe UI","Noto Sans TC",sans-serif;
        text-anchor:middle;
      }
      .nl-point-value{
        fill:#475569;
        font:600 14px/1 system-ui,-apple-system,"Segoe UI","Noto Sans TC",sans-serif;
        text-anchor:middle;
      }
      .nl-point,.geo-point,.cp-point{
        stroke:#0f172a;
        stroke-width:2.5;
        vector-effect:non-scaling-stroke;
      }
      .geo-fill{fill:#f8fafc;stroke:#0f172a;stroke-width:3;vector-effect:non-scaling-stroke}
      .geo-center{fill:#0f172a}
      .cp-grid{stroke:#dbe3ef;stroke-width:1;vector-effect:non-scaling-stroke}
      .cp-segment{stroke:#2563eb;stroke-width:2.5;vector-effect:non-scaling-stroke}
      .cp-axis-label{
        fill:#0f172a;
        font:800 18px/1 system-ui,-apple-system,"Segoe UI","Noto Sans TC",sans-serif;
      }
      .solid-edge{
        stroke:#0f172a;
        stroke-width:2.7;
        fill:none;
        vector-effect:non-scaling-stroke;
      }
      .solid-edge-silhouette{
        stroke:#0f172a;
        stroke-width:3.4;
        fill:none;
        vector-effect:non-scaling-stroke;
      }
      .solid-edge-hidden{
        stroke:#64748b;
        stroke-width:1.8;
        stroke-dasharray:7 6;
        fill:none;
        vector-effect:non-scaling-stroke;
      }
      .solid-axis{
        stroke:#94a3b8;
        stroke-width:1.4;
        fill:none;
        vector-effect:non-scaling-stroke;
      }
      .solid-axis-label{
        fill:#334155;
        font:800 17px/1 system-ui,-apple-system,"Segoe UI","Noto Sans TC",sans-serif;
        text-anchor:middle;
      }
      .solid-axis-origin{
        fill:#475569;
        font:700 14px/1 system-ui,-apple-system,"Segoe UI","Noto Sans TC",sans-serif;
      }
      .solid-vertex{fill:#0f172a}
      .solid-label{
        fill:#0f172a;
        font:800 18px/1 system-ui,-apple-system,"Segoe UI","Noto Sans TC",sans-serif;
        text-anchor:middle;
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
        .nl-number,.cp-number{font-size:14px}
        .nl-point-label,.geo-label,.cp-label{font-size:16px}
      }
    `;
    document.head.appendChild(style);
  }

  function renderNumberLine(container, rawSpec) {
    ensureStyles();
    const checked = validateNumberLine(rawSpec);
    if (!checked.ok) {
      console.warn('[DiagramRenderer]', checked.reason, rawSpec);
      return safeFallback(container);
    }

    const spec = checked.value;
    if (!container) return null;
    container.innerHTML = '';
    container.classList.add('number-line-diagram');

    const svg = createSvg(NL_VIEW_H, numberLineAria(spec));
    const span = spec.max - spec.min;
    const xFor = value => AXIS_LEFT + ((value - spec.min) / span) * (AXIS_RIGHT - AXIS_LEFT);

    svg.appendChild(svgEl('line', { x1:AXIS_LEFT, y1:AXIS_Y, x2:AXIS_RIGHT, y2:AXIS_Y, class:'nl-axis' }));

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
    const customLabelValues = Array.isArray(spec.labelValues) && spec.labelValues.length
      ? spec.labelValues
      : null;
    const shouldLabel = (value, index, isZero) => {
      if (!spec.showNumberLabels) return false;
      if (customLabelValues) {
        return customLabelValues.some(labelValue => Math.abs(labelValue - value) < 1e-8);
      }
      return index % labelEvery === 0 || index === ticks.length - 1 || isZero;
    };

    ticks.forEach((value, index) => {
      const x = xFor(value);
      const isZero = Math.abs(value) < 1e-10;
      svg.appendChild(svgEl('line', {
        x1:x, y1:AXIS_Y - (isZero ? 11 : 8), x2:x, y2:AXIS_Y + (isZero ? 11 : 8),
        class:isZero ? 'nl-tick nl-zero' : 'nl-tick'
      }));

      if (shouldLabel(value, index, isZero)) {
        svg.appendChild(svgEl('text', { x, y:AXIS_Y + 31, class:'nl-number' }, formatNumber(value)));
      }
    });

    spec.minorTicks.forEach(value => {
      if (value < spec.min || value > spec.max) return;
      if (ticks.some(tick => Math.abs(tick - value) < 1e-8)) return;
      const x = xFor(value);
      svg.appendChild(svgEl('line', {
        x1:x, y1:AXIS_Y - 6, x2:x, y2:AXIS_Y + 6, class:'nl-minor-tick'
      }));
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
      const style = ['solid','hollow','marker'].includes(point?.style) ? point.style : 'solid';

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
          cx:x, cy:AXIS_Y, r:6.5,
          fill:style === 'hollow' ? '#ffffff' : '#0f172a',
          class:'nl-point'
        }));
      }

      if (label) {
        svg.appendChild(svgEl('text', {
          x, y:point?.showValue ? AXIS_Y - 36 : AXIS_Y - 24, class:'nl-point-label'
        }, label));
      }

      if (point?.showValue) {
        svg.appendChild(svgEl('text', { x, y:AXIS_Y - 19, class:'nl-point-value' }, formatNumber(value)));
      }
    });

    container.appendChild(svg);
    return svg;
  }

  function geometryBounds(vertices, padding = 1) {
    const xs = vertices.map(p => p.x);
    const ys = vertices.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);
    return {
      minX:minX - spanX * padding * 0.18,
      maxX:maxX + spanX * padding * 0.18,
      minY:minY - spanY * padding * 0.22,
      maxY:maxY + spanY * padding * 0.22
    };
  }

  function geometryMapper(bounds) {
    const left = 90;
    const right = 670;
    const top = 48;
    const bottom = 365;
    const spanX = Math.max(1e-9, bounds.maxX - bounds.minX);
    const spanY = Math.max(1e-9, bounds.maxY - bounds.minY);
    const scale = Math.min((right - left) / spanX, (bottom - top) / spanY);
    const contentW = spanX * scale;
    const contentH = spanY * scale;
    const originX = (VIEW_W - contentW) / 2;
    const originY = top + (bottom - top - contentH) / 2;
    return point => ({
      x:originX + (point.x - bounds.minX) * scale,
      y:originY + (bounds.maxY - point.y) * scale
    });
  }

  function vertexLabelPosition(mapped, center, distance = 22) {
    let dx = mapped.x - center.x;
    let dy = mapped.y - center.y;
    const length = Math.hypot(dx, dy) || 1;
    dx /= length;
    dy /= length;
    return { x:mapped.x + dx * distance, y:mapped.y + dy * distance + 5 };
  }

  function renderPolygonGeometry(container, rawSpec, type) {
    ensureStyles();
    const checked = type === 'triangle' ? validateTriangle(rawSpec) : validateSquare(rawSpec);
    if (!checked.ok) {
      console.warn('[DiagramRenderer]', checked.reason, rawSpec);
      return safeFallback(container);
    }

    const spec = checked.value;
    container.innerHTML = '';
    container.classList.add('geometry-diagram');

    const shapeName = type === 'triangle' ? '三角形' : '正方形';
    const aria = spec.ariaLabel || `${shapeName}，頂點 ${spec.vertices.map(v => v.label || '').filter(Boolean).join('、')}`;
    const svg = createSvg(GEO_VIEW_H, aria);
    const bounds = geometryBounds(spec.vertices);
    const map = geometryMapper(bounds);
    const mapped = spec.vertices.map(map);
    const center = {
      x:mapped.reduce((sum,p) => sum + p.x, 0) / mapped.length,
      y:mapped.reduce((sum,p) => sum + p.y, 0) / mapped.length
    };

    svg.appendChild(svgEl('polygon', {
      points:mapped.map(p => `${p.x},${p.y}`).join(' '),
      class:'geo-fill'
    }));

    mapped.forEach((point, index) => {
      const vertex = spec.vertices[index];
      svg.appendChild(svgEl('circle', {
        cx:point.x, cy:point.y, r:5.5, fill:'#0f172a', class:'geo-point'
      }));

      if (spec.showVertexLabels && vertex.label) {
        const labelPos = vertexLabelPosition(point, center);
        svg.appendChild(svgEl('text', {
          x:labelPos.x, y:labelPos.y, class:'geo-label'
        }, vertex.label));
      }
    });

    container.appendChild(svg);
    return svg;
  }

  function renderTriangle(container, spec) {
    return renderPolygonGeometry(container, spec, 'triangle');
  }

  function renderSquare(container, spec) {
    return renderPolygonGeometry(container, spec, 'square');
  }

  function renderCircle(container, rawSpec) {
    ensureStyles();
    const checked = validateCircle(rawSpec);
    if (!checked.ok) {
      console.warn('[DiagramRenderer]', checked.reason, rawSpec);
      return safeFallback(container);
    }

    const spec = checked.value;
    container.innerHTML = '';
    container.classList.add('geometry-diagram');

    const pointsForBounds = [
      {x:spec.center.x - spec.radius, y:spec.center.y - spec.radius},
      {x:spec.center.x + spec.radius, y:spec.center.y + spec.radius},
      ...spec.points
    ];
    const map = geometryMapper(geometryBounds(pointsForBounds, 1.15));
    const center = map(spec.center);
    const edge = map({x:spec.center.x + spec.radius, y:spec.center.y});
    const radiusPx = Math.abs(edge.x - center.x);

    const labels = [
      spec.showCenter && spec.center.label ? `圓心 ${spec.center.label}` : '',
      ...spec.points.filter(p => p.label).map(p => `點 ${p.label}`)
    ].filter(Boolean);
    const svg = createSvg(GEO_VIEW_H, spec.ariaLabel || `圓形${labels.length ? '，' + labels.join('，') : ''}`);

    svg.appendChild(svgEl('circle', {
      cx:center.x, cy:center.y, r:radiusPx, class:'geo-fill'
    }));

    if (spec.showCenter) {
      svg.appendChild(svgEl('circle', {
        cx:center.x, cy:center.y, r:5, class:'geo-center'
      }));
      if (spec.showVertexLabels && spec.center.label) {
        svg.appendChild(svgEl('text', {
          x:center.x + 18, y:center.y - 12, class:'geo-label'
        }, spec.center.label));
      }
    }

    spec.points.forEach(point => {
      const mapped = map(point);
      svg.appendChild(svgEl('circle', {
        cx:mapped.x, cy:mapped.y, r:5.5, fill:'#0f172a', class:'geo-point'
      }));
      if (spec.showVertexLabels && point.label) {
        const dx = mapped.x - center.x;
        const dy = mapped.y - center.y;
        const len = Math.hypot(dx, dy) || 1;
        svg.appendChild(svgEl('text', {
          x:mapped.x + dx / len * 20,
          y:mapped.y + dy / len * 20 + 5,
          class:'geo-label'
        }, point.label));
      }
    });

    container.appendChild(svg);
    return svg;
  }


  function renderBullseye(container, rawSpec) {
    ensureStyles();
    const checked = validateBullseye(rawSpec);
    if (!checked.ok) {
      console.warn('[DiagramRenderer]', checked.reason, rawSpec);
      return safeFallback(container);
    }

    const spec = checked.value;
    container.innerHTML = '';
    container.classList.add('bullseye-diagram');

    const svg = createSvg(GEO_VIEW_H, spec.ariaLabel || '同心圓飛鏢靶');
    const cx = VIEW_W / 2;
    const cy = GEO_VIEW_H / 2;
    const maxRadius = Math.max(...spec.rings.map(ring => ring.radius));
    const scale = 145 / maxRadius;

    spec.rings.forEach((ring, index) => {
      const radiusPx = ring.radius * scale;
      svg.appendChild(svgEl('circle', {
        cx, cy, r:radiusPx,
        fill:index % 2 === 0 ? '#ffffff' : '#f8fafc',
        stroke:'#0f172a',
        'stroke-width':3,
        'vector-effect':'non-scaling-stroke'
      }));

      if (ring.label) {
        const nextRadius = index < spec.rings.length - 1
          ? spec.rings[index + 1].radius
          : 0;
        const autoRadius = nextRadius + (ring.radius - nextRadius) / 2;
        const labelRadius = (ring.labelRadius === null ? autoRadius : ring.labelRadius) * scale;
        const angle = degreesToRadians(ring.labelAngle === null ? 0 : ring.labelAngle);
        svg.appendChild(svgEl('text', {
          x:cx + Math.cos(angle) * labelRadius,
          y:cy + Math.sin(angle) * labelRadius + 6,
          class:'bullseye-label'
        }, ring.label));
      }
    });

    if (spec.showCenter) {
      svg.appendChild(svgEl('circle', { cx, cy, r:4.5, fill:'#0f172a' }));
    }

    container.appendChild(svg);
    return svg;
  }

  function renderCoordinatePlane(container, rawSpec) {
    ensureStyles();
    const checked = validateCoordinatePlane(rawSpec);
    if (!checked.ok) {
      console.warn('[DiagramRenderer]', checked.reason, rawSpec);
      return safeFallback(container);
    }

    const spec = checked.value;
    container.innerHTML = '';
    container.classList.add('coordinate-plane-diagram');

    const svg = createSvg(GEO_VIEW_H, spec.ariaLabel || `XY 座標平面，x 從 ${formatNumber(spec.xMin)} 到 ${formatNumber(spec.xMax)}，y 從 ${formatNumber(spec.yMin)} 到 ${formatNumber(spec.yMax)}`);
    const left = 74;
    const right = 694;
    const top = 42;
    const bottom = 360;
    const xSpan = spec.xMax - spec.xMin;
    const ySpan = spec.yMax - spec.yMin;
    const xFor = value => left + ((value - spec.xMin) / xSpan) * (right - left);
    const yFor = value => bottom - ((value - spec.yMin) / ySpan) * (bottom - top);

    const xTicks = enumerateTicks(spec.xMin, spec.xMax, spec.tickStep);
    const yTicks = enumerateTicks(spec.yMin, spec.yMax, spec.tickStep);
    const xLabelEvery = xTicks.length > 17 ? Math.ceil(xTicks.length / 15) : 1;
    const yLabelEvery = yTicks.length > 13 ? Math.ceil(yTicks.length / 11) : 1;

    if (spec.showGrid) {
      xTicks.forEach(value => {
        const x = xFor(value);
        svg.appendChild(svgEl('line', { x1:x, y1:top, x2:x, y2:bottom, class:'cp-grid' }));
      });
      yTicks.forEach(value => {
        const y = yFor(value);
        svg.appendChild(svgEl('line', { x1:left, y1:y, x2:right, y2:y, class:'cp-grid' }));
      });
    }

    const xAxisY = spec.yMin <= 0 && spec.yMax >= 0 ? yFor(0) : bottom;
    const yAxisX = spec.xMin <= 0 && spec.xMax >= 0 ? xFor(0) : left;

    svg.appendChild(svgEl('line', { x1:left, y1:xAxisY, x2:right, y2:xAxisY, class:'cp-axis' }));
    svg.appendChild(svgEl('line', { x1:yAxisX, y1:bottom, x2:yAxisX, y2:top, class:'cp-axis' }));

    svg.appendChild(svgEl('polygon', {
      points:`${right},${xAxisY} ${right - 12},${xAxisY - 7} ${right - 12},${xAxisY + 7}`,
      fill:'#0f172a'
    }));
    svg.appendChild(svgEl('polygon', {
      points:`${yAxisX},${top} ${yAxisX - 7},${top + 12} ${yAxisX + 7},${top + 12}`,
      fill:'#0f172a'
    }));
    svg.appendChild(svgEl('text', { x:right - 4, y:xAxisY - 13, class:'cp-axis-label', 'text-anchor':'end' }, 'x'));
    svg.appendChild(svgEl('text', { x:yAxisX + 12, y:top + 16, class:'cp-axis-label' }, 'y'));

    xTicks.forEach((value, index) => {
      const x = xFor(value);
      svg.appendChild(svgEl('line', { x1:x, y1:xAxisY - 5, x2:x, y2:xAxisY + 5, class:'cp-tick' }));
      if (spec.showNumberLabels && Math.abs(value) > 1e-10 && index % xLabelEvery === 0) {
        svg.appendChild(svgEl('text', {
          x, y:Math.min(bottom + 24, xAxisY + 24), class:'cp-number'
        }, formatNumber(value)));
      }
    });

    yTicks.forEach((value, index) => {
      const y = yFor(value);
      svg.appendChild(svgEl('line', { x1:yAxisX - 5, y1:y, x2:yAxisX + 5, y2:y, class:'cp-tick' }));
      if (spec.showNumberLabels && Math.abs(value) > 1e-10 && index % yLabelEvery === 0) {
        const label = svgEl('text', {
          x:Math.max(left + 14, yAxisX - 12),
          y:y + 5,
          class:'cp-number',
          'text-anchor':'end'
        }, formatNumber(value));
        svg.appendChild(label);
      }
    });

    if (spec.showNumberLabels && spec.xMin <= 0 && spec.xMax >= 0 && spec.yMin <= 0 && spec.yMax >= 0) {
      svg.appendChild(svgEl('text', {
        x:yAxisX - 12, y:xAxisY + 23, class:'cp-number', 'text-anchor':'end'
      }, '0'));
    }

    spec.segments.forEach(segment => {
      const from = normalizeVertex(segment?.from);
      const to = normalizeVertex(segment?.to);
      if (!from || !to) return;
      if (
        from.x < spec.xMin || from.x > spec.xMax || from.y < spec.yMin || from.y > spec.yMax ||
        to.x < spec.xMin || to.x > spec.xMax || to.y < spec.yMin || to.y > spec.yMax
      ) return;

      svg.appendChild(svgEl('line', {
        x1:xFor(from.x), y1:yFor(from.y),
        x2:xFor(to.x), y2:yFor(to.y),
        class:'cp-segment'
      }));
    });

    spec.points.forEach(point => {
      const normalized = normalizeVertex(point);
      if (!normalized) {
        console.warn('[DiagramRenderer] coordinate-plane point 格式錯誤', point);
        return;
      }
      if (
        normalized.x < spec.xMin || normalized.x > spec.xMax ||
        normalized.y < spec.yMin || normalized.y > spec.yMax
      ) {
        console.warn('[DiagramRenderer] coordinate-plane point 超出範圍', point);
        return;
      }

      const x = xFor(normalized.x);
      const y = yFor(normalized.y);
      const hollow = point?.style === 'hollow';
      svg.appendChild(svgEl('circle', {
        cx:x, cy:y, r:6,
        fill:hollow ? '#ffffff' : '#2563eb',
        class:'cp-point'
      }));
      if (normalized.label) {
        svg.appendChild(svgEl('text', {
          x:x + 18, y:y - 12, class:'cp-label'
        }, normalized.label));
      }
    });

    container.appendChild(svg);
    return svg;
  }

  function degreesToRadians(value) {
    return Number(value) * Math.PI / 180;
  }

  function rotatePoint3D(point, view) {
    const yaw = degreesToRadians(view.yaw);
    const pitch = degreesToRadians(view.pitch);
    const roll = degreesToRadians(view.roll);

    let x = point.x;
    let y = point.y;
    let z = point.z;

    const xYaw = x * Math.cos(yaw) - z * Math.sin(yaw);
    const zYaw = x * Math.sin(yaw) + z * Math.cos(yaw);
    x = xYaw;
    z = zYaw;

    const yPitch = y * Math.cos(pitch) - z * Math.sin(pitch);
    const zPitch = y * Math.sin(pitch) + z * Math.cos(pitch);
    y = yPitch;
    z = zPitch;

    const xRoll = x * Math.cos(roll) - y * Math.sin(roll);
    const yRoll = x * Math.sin(roll) + y * Math.cos(roll);
    x = xRoll;
    y = yRoll;

    return { x, y, z, label:point.label };
  }

  function projectPoint3D(point, view) {
    if (view.projection === 'oblique') {
      const depthFactor = 0.42;
      return {
        x:point.x + point.z * depthFactor,
        y:point.y + point.z * depthFactor * 0.62,
        depth:point.z,
        label:point.label
      };
    }

    return {
      x:point.x,
      y:point.y,
      depth:point.z,
      label:point.label
    };
  }

  function mapProjectedPoints(projected) {
    const xs = projected.map(point => point.x);
    const ys = projected.map(point => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = Math.max(1e-9, maxX - minX);
    const spanY = Math.max(1e-9, maxY - minY);

    const left = 105;
    const right = 655;
    const top = 58;
    const bottom = 352;
    const scale = Math.min((right - left) / spanX, (bottom - top) / spanY);
    const usedW = spanX * scale;
    const usedH = spanY * scale;
    const offsetX = (VIEW_W - usedW) / 2;
    const offsetY = top + (bottom - top - usedH) / 2;

    return projected.map(point => ({
      ...point,
      screenX:offsetX + (point.x - minX) * scale,
      screenY:offsetY + (maxY - point.y) * scale
    }));
  }

  function solidAxisWorldPoints(spec) {
    const values = Object.values(spec.vertices);
    const minX = Math.min(...values.map(point => point.x));
    const maxX = Math.max(...values.map(point => point.x));
    const minY = Math.min(...values.map(point => point.y));
    const maxY = Math.max(...values.map(point => point.y));
    const minZ = Math.min(...values.map(point => point.z));
    const maxZ = Math.max(...values.map(point => point.z));

    const origin = {
      x:minX,
      y:minY,
      z:minZ,
      label:'__axisO'
    };

    const autoLength = Math.max(
      maxX - minX,
      maxY - minY,
      maxZ - minZ,
      1
    ) * 0.72;

    const requested = finiteNumber(spec.axisLength);
    const length = requested !== null && requested > 0 ? requested : autoLength;

    return [
      origin,
      { x:origin.x + length, y:origin.y, z:origin.z, label:'__axisX' },
      { x:origin.x, y:origin.y + length, z:origin.z, label:'__axisY' },
      { x:origin.x, y:origin.y, z:origin.z + length, label:'__axisZ' }
    ];
  }

  function drawSolidAxis(svg, from, to, label) {
    svg.appendChild(svgEl('line', {
      x1:from.screenX,
      y1:from.screenY,
      x2:to.screenX,
      y2:to.screenY,
      class:'solid-axis'
    }));

    const dx = to.screenX - from.screenX;
    const dy = to.screenY - from.screenY;
    const length = Math.hypot(dx, dy) || 1;
    const ux = dx / length;
    const uy = dy / length;
    const px = -uy;
    const py = ux;
    const arrow = 11;
    const half = 5.5;

    svg.appendChild(svgEl('polygon', {
      points:[
        [to.screenX, to.screenY],
        [to.screenX - ux * arrow + px * half, to.screenY - uy * arrow + py * half],
        [to.screenX - ux * arrow - px * half, to.screenY - uy * arrow - py * half]
      ].map(point => point.join(',')).join(' '),
      fill:'#475569'
    }));

    svg.appendChild(svgEl('text', {
      x:to.screenX + ux * 15,
      y:to.screenY + uy * 15 + 5,
      class:'solid-axis-label'
    }, label));
  }

  function subtract3D(a, b) {
    return { x:a.x - b.x, y:a.y - b.y, z:a.z - b.z };
  }

  function cross3D(a, b) {
    return {
      x:a.y * b.z - a.z * b.y,
      y:a.z * b.x - a.x * b.z,
      z:a.x * b.y - a.y * b.x
    };
  }

  function dot3D(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  function average3D(points) {
    const count = Math.max(points.length, 1);
    return {
      x:points.reduce((sum, point) => sum + point.x, 0) / count,
      y:points.reduce((sum, point) => sum + point.y, 0) / count,
      z:points.reduce((sum, point) => sum + point.z, 0) / count
    };
  }

  function edgeKey(a, b) {
    return [String(a), String(b)].sort().join('|');
  }

  function classifySolidEdges(spec, rotatedByLabel) {
    if (!Array.isArray(spec.faces) || !spec.faces.length) {
      console.warn('[DiagramRenderer] solid-projection 缺少 faces，無法可靠判斷遮蔽；邊線全部以可視實線處理。');
      return new Map(spec.edges.map(([from, to]) => [edgeKey(from, to), 'visible']));
    }

    const solidCenter = average3D(Object.values(rotatedByLabel));
    const faceInfo = spec.faces.map((face, index) => {
      const vertices = face.map(name => rotatedByLabel[name]).filter(Boolean);
      if (vertices.length < 3) return { index, face, visible:false };

      const a = vertices[0];
      const b = vertices[1];
      const c = vertices[2];
      let normal = cross3D(subtract3D(b, a), subtract3D(c, a));
      const faceCenter = average3D(vertices);
      const outward = subtract3D(faceCenter, solidCenter);

      if (dot3D(normal, outward) < 0) {
        normal = { x:-normal.x, y:-normal.y, z:-normal.z };
      }

      // Camera is on the negative-Z side of camera space, looking toward +Z.
      const visible = normal.z < -1e-9;
      return { index, face, visible };
    });

    const adjacent = new Map();
    faceInfo.forEach(info => {
      const face = info.face;
      for (let i = 0; i < face.length; i += 1) {
        const from = face[i];
        const to = face[(i + 1) % face.length];
        const key = edgeKey(from, to);
        if (!adjacent.has(key)) adjacent.set(key, []);
        adjacent.get(key).push(info);
      }
    });

    const result = new Map();
    spec.edges.forEach(([from, to]) => {
      const key = edgeKey(from, to);
      const faces = adjacent.get(key) || [];
      if (!faces.length) {
        result.set(key, 'visible');
        return;
      }

      const visibleCount = faces.filter(face => face.visible).length;
      const hiddenCount = faces.length - visibleCount;

      if (visibleCount > 0 && hiddenCount > 0) {
        result.set(key, 'silhouette');
      } else if (visibleCount > 0) {
        result.set(key, 'visible');
      } else {
        result.set(key, 'hidden');
      }
    });

    return result;
  }

  function renderSolidProjection(container, rawSpec) {
    ensureStyles();
    const checked = validateSolidProjection(rawSpec);
    if (!checked.ok) {
      console.warn('[DiagramRenderer]', checked.reason, rawSpec);
      return safeFallback(container);
    }

    const spec = checked.value;
    container.innerHTML = '';
    container.classList.add('solid-projection-diagram');

    const rotatedByLabel = {};
    Object.entries(spec.vertices).forEach(([label, point]) => {
      rotatedByLabel[label] = rotatePoint3D(point, spec.view);
    });

    const projectedVertices = Object.entries(rotatedByLabel).map(([label, point]) => ({
      ...projectPoint3D(point, spec.view),
      label
    }));

    const axisProjected = spec.showAxes
      ? solidAxisWorldPoints(spec).map(point => {
          const rotated = rotatePoint3D(point, spec.view);
          return {
            ...projectPoint3D(rotated, spec.view),
            label:point.label
          };
        })
      : [];

    const mappedAll = mapProjectedPoints([...projectedVertices, ...axisProjected]);
    const mapped = Object.fromEntries(mappedAll.map(point => [point.label, point]));
    const mappedList = projectedVertices.map(point => mapped[point.label]);

    const svg = createSvg(
      GEO_VIEW_H,
      spec.ariaLabel || `${spec.solid === 'cube' ? '正方體' : spec.solid === 'cuboid' ? '長方體' : '自訂立體'}，頂點 ${Object.values(spec.vertices).map(point => point.label).join('、')} 的二維投影圖${spec.showAxes ? '，含 XYZ 空間方向軸' : ''}`
    );

    if (spec.showAxes) {
      const axisO = mapped.__axisO;
      const axisX = mapped.__axisX;
      const axisY = mapped.__axisY;
      const axisZ = mapped.__axisZ;

      if (axisO && axisX && axisY && axisZ) {
        drawSolidAxis(svg, axisO, axisX, 'x');
        drawSolidAxis(svg, axisO, axisY, 'y');
        drawSolidAxis(svg, axisO, axisZ, 'z');

        svg.appendChild(svgEl('circle', {
          cx:axisO.screenX,
          cy:axisO.screenY,
          r:3.8,
          fill:'#475569'
        }));
        svg.appendChild(svgEl('text', {
          x:axisO.screenX - 12,
          y:axisO.screenY + 18,
          class:'solid-axis-origin'
        }, 'O'));
      }
    }

    const edgeVisibility = classifySolidEdges(spec, rotatedByLabel);
    const edges = spec.edges.map(([from, to]) => {
      const a = mapped[from];
      const b = mapped[to];
      return {
        from,
        to,
        a,
        b,
        depth:(a.depth + b.depth) / 2,
        visibility:edgeVisibility.get(edgeKey(from, to)) || 'visible'
      };
    });

    // Draw hidden edges first so visible contours remain visually dominant.
    edges.sort((left, right) => {
      const rank = { hidden:0, visible:1, silhouette:2 };
      return (rank[left.visibility] - rank[right.visibility]) || (right.depth - left.depth);
    });

    edges.forEach(edge => {
      if (edge.visibility === 'hidden' && !spec.showHiddenEdges) return;

      const className = edge.visibility === 'hidden'
        ? 'solid-edge-hidden'
        : edge.visibility === 'silhouette'
          ? 'solid-edge-silhouette'
          : 'solid-edge';

      svg.appendChild(svgEl('line', {
        x1:edge.a.screenX,
        y1:edge.a.screenY,
        x2:edge.b.screenX,
        y2:edge.b.screenY,
        class:className
      }));
    });

    const center = {
      x:mappedList.reduce((sum, point) => sum + point.screenX, 0) / mappedList.length,
      y:mappedList.reduce((sum, point) => sum + point.screenY, 0) / mappedList.length
    };

    mappedList.forEach(point => {
      svg.appendChild(svgEl('circle', {
        cx:point.screenX,
        cy:point.screenY,
        r:4.8,
        class:'solid-vertex'
      }));

      if (spec.showVertexLabels) {
        let dx = point.screenX - center.x;
        let dy = point.screenY - center.y;
        const length = Math.hypot(dx, dy) || 1;
        dx /= length;
        dy /= length;

        const sourceVertex = Object.values(spec.vertices).find(vertex => vertex.label === point.label);
        const labelDx = finiteNumber(sourceVertex?.labelDx) ?? 0;
        const labelDy = finiteNumber(sourceVertex?.labelDy) ?? 0;

        svg.appendChild(svgEl('text', {
          x:point.screenX + dx * 22 + labelDx,
          y:point.screenY + dy * 22 + 5 + labelDy,
          class:'solid-label'
        }, point.label));
      }
    });

    container.appendChild(svg);
    return svg;
  }

  function renderDiagram(container, spec) {
    if (!container) return null;
    const checked = validateDiagramSpec(spec);
    if (!checked.ok) {
      console.warn('[DiagramRenderer]', checked.reason, spec);
      return safeFallback(container);
    }

    switch (checked.value.type) {
      case 'number-line': return renderNumberLine(container, checked.value);
      case 'triangle': return renderTriangle(container, checked.value);
      case 'square': return renderSquare(container, checked.value);
      case 'circle': return renderCircle(container, checked.value);
      case 'bullseye': return renderBullseye(container, checked.value);
      case 'coordinate-plane': return renderCoordinatePlane(container, checked.value);
      case 'solid-projection': return renderSolidProjection(container, checked.value);
      default: return safeFallback(container);
    }
  }

  window.validateDiagramSpec = validateDiagramSpec;
  window.renderNumberLine = renderNumberLine;
  window.renderTriangle = renderTriangle;
  window.renderSquare = renderSquare;
  window.renderCircle = renderCircle;
  window.renderBullseye = renderBullseye;
  window.renderCoordinatePlane = renderCoordinatePlane;
  window.renderSolidProjection = renderSolidProjection;
  window.renderDiagram = renderDiagram;
})();
