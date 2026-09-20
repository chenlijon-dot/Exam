(() => {
  'use strict';

  const RECORD_REPO = 'chenlijon-dot/Exam-Record';
  const TOKEN_KEY = 'examRecords.githubToken.session';
  const answers = new Map();

  const $ = (sel, root = document) => root.querySelector(sel);

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  }

  function utf8ToBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    bytes.forEach(b => { binary += String.fromCharCode(b); });
    return btoa(binary);
  }

  function base64ToUtf8(text) {
    const binary = atob(String(text || '').replace(/\n/g, ''));
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  async function githubApi(path, options = {}) {
    const token = getToken();
    if (!token) throw new Error('請先到「GitHub 同步設定」輸入 Token。');

    const res = await fetch(`https://api.github.com${path}`, {
      ...options,
      headers: {
        'Accept':'application/vnd.github+json',
        'X-GitHub-Api-Version':'2022-11-28',
        'Authorization':`Bearer ${token}`,
        ...(options.headers || {})
      }
    });

    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json()).message || ''; } catch {}
      const err = new Error(`GitHub ${res.status}${detail ? '：' + detail : ''}`);
      err.status = res.status;
      throw err;
    }

    return res.status === 204 ? null : res.json();
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

  function showNativeInkForCanvas(canvas) {
    const bridge = nativeBridge();
    if (!bridge || !nativeInkAvailable()) return false;

    const rect = canvas.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth || 1;
    const vh = window.innerHeight || document.documentElement.clientHeight || 1;

    bridge.showNativeInkSurface(
      rect.left / vw,
      rect.top / vh,
      rect.right / vw,
      rect.bottom / vh
    );
    return true;
  }

  function requestId() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return (
      `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-` +
      `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-` +
      Math.random().toString(36).slice(2, 7)
    );
  }

  function answerKey(examKey, questionNumber) {
    return `${examKey || 'exam'}::${questionNumber}`;
  }

  function getAnswer(key) {
    return answers.get(key) || null;
  }

  function setAnswer(key, dataUrl, source) {
    if (!dataUrl) return;
    answers.set(key, { dataUrl, source: source || 'web-canvas' });
  }

  function reset() {
    answers.clear();
  }

  function openCanvas({ key, title, subtitle = '請寫出完整計算過程與答案' }) {
    if (!key) return Promise.reject(new Error('缺少手寫題識別碼。'));
    if ($('#examHandwritingOverlay')) return Promise.resolve(null);

    const previous = getAnswer(key);
    const useNative = nativeInkAvailable() && !previous?.dataUrl;

    return new Promise(resolve => {
      setDrawingMode(true);
      const oldOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const overlay = document.createElement('div');
      overlay.id = 'examHandwritingOverlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#eef2f7;display:flex;flex-direction:column;overscroll-behavior:none;touch-action:none';
      overlay.innerHTML = `
        <div style="flex:0 0 auto;display:flex;align-items:center;gap:8px;padding:8px 10px;background:#0f172a;color:white;box-shadow:0 2px 8px rgba(15,23,42,.2)">
          <button id="examHandwritingCancel" type="button" style="border:0;border-radius:10px;padding:9px 13px;font-weight:800;background:#334155;color:white">取消</button>
          <div style="flex:1;min-width:0">
            <div style="font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(title || '手寫題')}</div>
            <div style="font-size:.78rem;opacity:.78">${escapeHtml(subtitle)}</div>
          </div>
          <button id="examHandwritingClear" type="button" style="border:0;border-radius:10px;padding:9px 13px;font-weight:800;background:#475569;color:white">清除</button>
          <button id="examHandwritingDone" type="button" style="border:0;border-radius:10px;padding:9px 15px;font-weight:800;background:#22c55e;color:#052e16">完成</button>
        </div>
        <div id="examHandwritingStage" style="position:relative;flex:1;min-height:0;padding:10px;background:#e2e8f0;touch-action:none;overflow:hidden">
          <canvas id="examHandwritingCanvas" style="display:block;width:100%;height:100%;background:#fff;border-radius:8px;box-shadow:0 2px 12px rgba(15,23,42,.14);touch-action:none;user-select:none;-webkit-user-select:none"></canvas>
        </div>`;
      document.body.appendChild(overlay);

      const canvas = $('#examHandwritingCanvas', overlay);
      const stage = $('#examHandwritingStage', overlay);
      const ctx = canvas.getContext('2d', { alpha:false });
      let drawing = false;
      let activePointerId = null;
      let lastX = 0;
      let lastY = 0;
      let hasInk = !!previous?.dataUrl;
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
        ctx.fillStyle = '#fff';
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
          const scale = Math.min(canvasSize.cssW / img.width, canvasSize.cssH / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.fillStyle = '#fff';
          ctx.fillRect(0,0,canvasSize.cssW,canvasSize.cssH);
          ctx.drawImage(img,0,0,img.width,img.height,(canvasSize.cssW-w)/2,(canvasSize.cssH-h)/2,w,h);
        };
        img.src = previous.dataUrl;
      }

      if (useNative) {
        requestAnimationFrame(() => showNativeInkForCanvas(canvas));
      }

      function finish(value = null) {
        if (resolved) return;
        resolved = true;
        try {
          if (useNative && nativeInkAvailable()) nativeBridge().hideNativeInkSurface();
        } catch {}
        window.StudentExamNativeInkFinished = null;
        setDrawingMode(false);
        document.body.style.overflow = oldOverflow;
        overlay.remove();
        resolve(value);
      }

      function point(e) {
        const r = canvas.getBoundingClientRect();
        return { x:e.clientX-r.left, y:e.clientY-r.top };
      }

      if (!useNative) {
        canvas.addEventListener('pointerdown', e => {
          if (activePointerId !== null) return;
          activePointerId = e.pointerId;
          drawing = true;
          const p = point(e);
          lastX = p.x; lastY = p.y;
          canvas.setPointerCapture?.(e.pointerId);
          e.preventDefault();
        }, { passive:false });

        canvas.addEventListener('pointermove', e => {
          if (!drawing || e.pointerId !== activePointerId) return;
          const p = point(e);
          ctx.beginPath();
          ctx.moveTo(lastX,lastY);
          ctx.lineTo(p.x,p.y);
          ctx.stroke();
          lastX = p.x; lastY = p.y;
          hasInk = true;
          e.preventDefault();
        }, { passive:false });

        const endPointer = e => {
          if (e.pointerId !== activePointerId) return;
          drawing = false;
          try { canvas.releasePointerCapture?.(e.pointerId); } catch {}
          activePointerId = null;
          e.preventDefault();
        };
        canvas.addEventListener('pointerup', endPointer, { passive:false });
        canvas.addEventListener('pointercancel', endPointer, { passive:false });
        canvas.addEventListener('contextmenu', e => e.preventDefault());
      }

      $('#examHandwritingCancel', overlay)?.addEventListener('click', () => finish(null));

      $('#examHandwritingClear', overlay)?.addEventListener('click', () => {
        if (useNative) {
          try { nativeBridge().clearNativeInkSurface(); } catch {}
          return;
        }
        ctx.fillStyle='#fff';
        ctx.fillRect(0,0,canvasSize.cssW,canvasSize.cssH);
        ctx.strokeStyle='#111827';
        ctx.lineWidth=2.5;
        hasInk=false;
      });

      window.StudentExamNativeInkFinished = dataUrl => {
        if (!dataUrl || !String(dataUrl).startsWith('data:image/')) return;
        setAnswer(key, dataUrl, 'android-native-ink');
        finish(dataUrl);
      };

      $('#examHandwritingDone', overlay)?.addEventListener('click', () => {
        if (useNative) {
          try { nativeBridge().finishNativeInkSurface(); } catch (e) {
            console.error('[ExamHandwriting] native export failed', e);
          }
          return;
        }
        if (!hasInk) {
          alert('畫布還是空白的，請先寫下作答內容。');
          return;
        }
        const dataUrl = canvas.toDataURL('image/png');
        setAnswer(key, dataUrl, 'web-canvas');
        finish(dataUrl);
      });
    });
  }

  async function uploadAndGrade({ key, question, context = {} }) {
    const answer = getAnswer(key);
    if (!answer?.dataUrl) {
      return {
        status:'completed',
        verdict:'incorrect',
        recognizedAnswer:'',
        recognizedWork:'',
        feedback:'本題未作答。',
        confidence:1
      };
    }

    const match = String(answer.dataUrl).match(/^data:image\/png;base64,(.+)$/s);
    if (!match) throw new Error('手寫圖片格式不是 PNG。');

    const id = requestId();
    const imagePath = `math-handwriting-images/${id}.png`;

    await githubApi(`/repos/${RECORD_REPO}/contents/${imagePath}`, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        message:`Save math handwriting ${id}`,
        content:match[1].replace(/\s/g,''),
        branch:'main'
      })
    });

    const request = {
      schemaVersion:2,
      id,
      requestedAt:new Date().toISOString(),
      subject:context.subjectLabel || context.subject || '數學',
      semester:context.semesterLabel || context.semester || '',
      unit:context.unit || '',
      section:context.section || '',
      difficulty:context.difficultyLabel || context.difficulty || '',
      questionId:question.questionId || key,
      question:question.q || '',
      expectedAnswer:question.expectedAnswer || question.manualAnswer || '',
      gradingInstructions:question.gradingInstructions || '請依數學意義判斷學生答案與計算過程。只有答案與主要計算邏輯皆正確時 verdict 才為 correct；若錯誤，請明確指出第一個實質錯誤與正確方向。',
      imagePath,
      source:answer.source || 'web-canvas'
    };

    const requestPath = `math-handwriting-requests/${id}.json`;
    await githubApi(`/repos/${RECORD_REPO}/contents/${requestPath}`, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        message:`Request Gemini math handwriting grading ${id}`,
        content:utf8ToBase64(JSON.stringify(request,null,2)),
        branch:'main'
      })
    });

    for (let i=0;i<40;i+=1) {
      try {
        const data = await githubApi(
          `/repos/${RECORD_REPO}/contents/math-handwriting-results/${id}.json?ref=main`
        );
        const result = JSON.parse(base64ToUtf8(data.content || ''));
        if (result) return result;
      } catch (e) {
        if (e.status !== 404) throw e;
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    throw new Error('Gemini 尚未完成判題，請稍後重新交卷。');
  }

  window.ExamHandwriting = {
    answerKey,
    getAnswer,
    setAnswer,
    reset,
    openCanvas,
    uploadAndGrade,
    hasToken:() => !!getToken(),
    nativeInkAvailable
  };
})();
