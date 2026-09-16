(() => {
  'use strict';

  const FIREBASE_VERSION = '12.19.0';
  const MODEL = 'gemini-3.8-flash';
  const RECORDS_KEY = 'examRecords.v1';
  const RECAPTCHA_ENTERPRISE_SITE_KEY = '6LcNBb4tAAAAAFTbAdO2VaPxae82eXGLLytwaXsS';

  const firebaseConfig = {
    apiKey: 'AIzaSyDkZOlQjmoVnkIz3Q1ppg_EJnCp5W3qNFQ',
    authDomain: 'chrisexamplatform.firebaseapp.com',
    projectId: 'chrisexamplatform',
    storageBucket: 'chrisexamplatform.firebasestorage.app',
    messagingSenderId: '682858985440',
    appId: '1:682858985440:web:22dfbf5f0c635728675d85',
    measurementId: 'G-WHXW4FDXBB'
  };

  let modelPromise = null;

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  function loadRecords() {
    try { return JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]'); }
    catch { return []; }
  }

  function aggregateWrongAnswers() {
    const map = new Map();
    loadRecords().forEach(r => {
      (r.wrongAnswers || [])
        .filter(a => a && a.selectedIndex !== null && a.selectedIndex !== undefined && a.selectedLetter)
        .forEach(a => {
          const key = `${r.difficulty}|${a.question}`;
          if (!map.has(key)) {
            map.set(key, {
              difficulty: r.difficultyLabel || r.difficulty || '',
              question: a.question || '',
              selectedLetter: a.selectedLetter || '',
              selectedText: a.selectedText || '',
              correctLetter: a.correctLetter || '',
              correctText: a.correctText || '',
              explanation: a.explanation || '',
              count: 0,
              last: r.submittedAt || ''
            });
          }
          const item = map.get(key);
          item.count++;
          if ((r.submittedAt || '') > item.last) {
            item.last = r.submittedAt || '';
            item.selectedLetter = a.selectedLetter || '';
            item.selectedText = a.selectedText || '';
          }
        });
    });
    return [...map.values()].sort((a,b) => b.count - a.count || String(b.last).localeCompare(String(a.last)));
  }

  async function getModel() {
    if (modelPromise) return modelPromise;
    modelPromise = (async () => {
      const appMod = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`);
      const appCheckMod = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-check.js`);
      const aiMod = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-ai.js`);

      const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(firebaseConfig);

      try {
        appCheckMod.initializeAppCheck(app, {
          provider: new appCheckMod.ReCaptchaEnterpriseProvider(RECAPTCHA_ENTERPRISE_SITE_KEY),
          isTokenAutoRefreshEnabled: true
        });
      } catch (error) {
        if (!/already|initialized/i.test(String(error?.message || error))) throw error;
      }

      const ai = aiMod.getAI(app, { backend: new aiMod.GoogleAIBackend() });
      return aiMod.getGenerativeModel(ai, { model: MODEL });
    })();
    return modelPromise;
  }

  async function generate(prompt) {
    const model = await getModel();
    const response = await model.generateContent(prompt);
    return response.response.text();
  }

  function sciencePrompt(wrongAnswers) {
    return `你是台灣國中七年級自然科學習診斷老師。\n\n教材範圍：七年級上學期，單元 1「生命現象與科學探究」，1-2 科學方法。\n\n請根據學生的累積錯題做學習診斷。請使用繁體中文，語氣清楚、適合國一學生，不要責備學生。\n\n請依序輸出：\n1. 主要錯誤概念（2～4 點）\n2. 為什麼容易答錯\n3. 每個概念的正確判斷方式\n4. 最值得優先複習的內容\n5. 最後給 3 題「自我檢查問題」，只出題不要提供答案\n\n不要編造題目未提供的教材內容；若資訊不足，請明確說明。\n\n學生錯題資料：\n${JSON.stringify(wrongAnswers, null, 2)}`;
  }

  function renderScience(text, box) {
    box.innerHTML = `
      <div style="border:1px solid #bfdbfe;background:#eff6ff;border-radius:14px;padding:14px;margin-top:12px">
        <div style="font-weight:800;margin-bottom:8px">🤖 AI 學習診斷</div>
        <div style="white-space:pre-wrap;line-height:1.75">${esc(text)}</div>
        <div class="record-note" style="margin-top:8px">模型：${esc(MODEL)} · Firebase AI Logic</div>
      </div>`;
  }

  async function runScienceDirect(button) {
    const status = document.getElementById('gptAnalysisStatus');
    const resultBox = document.getElementById('gptAnalysisResult');
    if (!status || !resultBox) return;

    const wrongAnswers = aggregateWrongAnswers();
    if (!wrongAnswers.length) {
      alert('目前沒有錯題可以分析。');
      return;
    }

    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = '分析中…';
    status.textContent = 'Gemini 正在直接分析錯題…';
    resultBox.innerHTML = '';

    try {
      const text = await generate(sciencePrompt(wrongAnswers));
      status.textContent = '分析完成。';
      renderScience(text, resultBox);
    } catch (error) {
      console.error('[FirebaseAIDirect] science analysis failed', error);
      status.textContent = `無法完成分析：${error?.message || error}`;
    } finally {
      button.disabled = false;
      button.textContent = oldText;
    }
  }

  function parseGeminiJson(text) {
    const raw = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    try { return JSON.parse(raw); }
    catch {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start >= 0 && end > start) return JSON.parse(raw.slice(start, end + 1));
      throw new Error('Gemini 回傳格式無法解析。');
    }
  }

  async function gradeMathHandwriting(dataUrl) {
    const match = String(dataUrl || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
    if (!match) throw new Error('找不到可判讀的手寫圖片。');

    const prompt = `你是台灣國中數學老師。請判讀學生手寫作答圖片。\n\n題目：x^2 - 5x + 6 = 0，求 x 的所有解。\n標準答案：x = 2 或 x = 3。\n\n判題原則：\n- 依數學意義判斷，不可只做答案字串比較。\n- x=2,3、x=3,2、{2,3}、x=2 或 x=3 都視為完整正確答案。\n- 若完整得到 2 與 3 且計算沒有實質錯誤，verdict 必須為 correct。\n- 漏根、多錯根、或計算有實質錯誤，判 incorrect。\n- 圖片無法可靠辨識，判 unclear。\n\n只回傳 JSON：\n{"verdict":"correct|incorrect|unclear","recognizedAnswer":"","recognizedWork":"","feedback":"繁體中文簡短回饋","confidence":0.0}`;

    const model = await getModel();
    const response = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType: match[1], data: match[2].replace(/\s/g, '') } }
    ]);
    const obj = parseGeminiJson(response.response.text());
    const verdict = ['correct','incorrect','unclear'].includes(String(obj.verdict || '').toLowerCase())
      ? String(obj.verdict).toLowerCase() : 'unclear';
    let confidence = Number(obj.confidence);
    if (!Number.isFinite(confidence)) confidence = null;
    if (confidence !== null && confidence > 1) confidence /= 100;
    if (confidence !== null) confidence = Math.max(0, Math.min(1, confidence));
    return {
      verdict,
      recognizedAnswer: String(obj.recognizedAnswer || ''),
      recognizedWork: String(obj.recognizedWork || ''),
      feedback: String(obj.feedback || ''),
      confidence
    };
  }

  function renderMathResult(result, box) {
    const c = {
      correct:{title:'✓ 作答正確',border:'#86efac',bg:'#f0fdf4',ink:'#166534'},
      incorrect:{title:'✗ 作答需要修正',border:'#fca5a5',bg:'#fef2f2',ink:'#991b1b'},
      unclear:{title:'？AI 無法可靠判讀',border:'#fde68a',bg:'#fffbeb',ink:'#92400e'}
    }[result.verdict] || {title:'？AI 無法可靠判讀',border:'#fde68a',bg:'#fffbeb',ink:'#92400e'};
    const confidence = typeof result.confidence === 'number' ? `${Math.round(result.confidence * 100)}%` : '';
    box.innerHTML = `
      <div style="margin-top:14px;padding:15px;border-radius:14px;border:1px solid ${c.border};background:${c.bg};color:${c.ink}">
        <div style="font-size:1.08rem;font-weight:900;margin-bottom:8px">${c.title}</div>
        ${result.recognizedAnswer ? `<div style="margin:5px 0"><b>AI 辨識答案：</b>${esc(result.recognizedAnswer)}</div>` : ''}
        ${result.recognizedWork ? `<div style="margin:5px 0"><b>AI 辨識過程：</b>${esc(result.recognizedWork)}</div>` : ''}
        ${result.feedback ? `<div style="margin-top:9px;line-height:1.7">${esc(result.feedback)}</div>` : ''}
        <div style="font-size:.78rem;opacity:.68;margin-top:8px">${confidence ? `判讀信心：${confidence}　` : ''}模型：${esc(MODEL)} · Firebase AI Logic</div>
      </div>`;
  }

  async function runMathDirect(button) {
    const status = document.getElementById('paperSubmitStatus');
    const resultBox = document.getElementById('paperAiResult');
    const image = document.getElementById('paperAnswerImage');
    const dataUrl = image?.src || '';
    if (!status || !resultBox) return;
    if (!dataUrl.startsWith('data:image/')) {
      status.textContent = '找不到手寫作答圖片，請重新完成作答。';
      return;
    }

    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = 'AI 判題中…';
    status.textContent = 'Gemini 正在直接判讀手寫作答…';
    resultBox.innerHTML = '';

    try {
      const result = await gradeMathHandwriting(dataUrl);
      status.textContent = 'Gemini 判題完成。';
      renderMathResult(result, resultBox);
    } catch (error) {
      console.error('[FirebaseAIDirect] math grading failed', error);
      status.textContent = `無法完成 AI 判題：${error?.message || error}`;
    } finally {
      button.disabled = false;
      button.textContent = oldText;
    }
  }

  document.addEventListener('click', event => {
    const scienceButton = event.target.closest?.('#gptWrongAnalysisBtn');
    if (scienceButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      runScienceDirect(scienceButton);
      return;
    }

    const mathButton = event.target.closest?.('#submitPaperExamBtn');
    if (mathButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      runMathDirect(mathButton);
    }
  }, true);

  window.ChrisExamAI = {
    generate,
    getModel,
    model: MODEL,
    backend: 'Firebase AI Logic'
  };
})();
