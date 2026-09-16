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
        // Firebase throws if App Check was already initialized on this app.
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

  // Capture before the legacy exam-gpt-analysis.js click handler. This keeps
  // the existing UI but bypasses GitHub Token / Exam-Record / Actions entirely.
  document.addEventListener('click', event => {
    const button = event.target.closest?.('#gptWrongAnalysisBtn');
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    runScienceDirect(button);
  }, true);

  window.ChrisExamAI = {
    generate,
    getModel,
    model: MODEL,
    backend: 'Firebase AI Logic'
  };
})();
