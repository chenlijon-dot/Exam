(() => {
  'use strict';

  const FIREBASE_VERSION = '12.19.0';
  const MODEL_CANDIDATES = [
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.7-flash'
  ];
  const MODEL = MODEL_CANDIDATES[0];
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

  let firebaseAIPromise = null;
  const modelPromises = new Map();

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

  async function getFirebaseAI() {
    if (firebaseAIPromise) return firebaseAIPromise;

    firebaseAIPromise = (async () => {
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
      return { aiMod, ai };
    })();

    return firebaseAIPromise;
  }

  async function getModel(modelName = MODEL) {
    if (modelPromises.has(modelName)) return modelPromises.get(modelName);

    const promise = (async () => {
      const { aiMod, ai } = await getFirebaseAI();
      return aiMod.getGenerativeModel(ai, { model: modelName });
    })();

    modelPromises.set(modelName, promise);
    return promise;
  }

  function isTemporaryAIError(error) {
    const text = String(error?.message || error || '').toLowerCase();
    return (
      /\b429\b/.test(text) ||
      /\b500\b/.test(text) ||
      /\b502\b/.test(text) ||
      /\b503\b/.test(text) ||
      /\b504\b/.test(text) ||
      text.includes('high demand') ||
      text.includes('temporarily unavailable') ||
      text.includes('resource exhausted') ||
      text.includes('resource_exhausted') ||
      text.includes('overloaded') ||
      text.includes('rate limit') ||
      text.includes('try again later') ||
      text.includes('ai/fetch-error')
    );
  }

  async function generateWithFallback(contents) {
    let lastError = null;

    for (const modelName of MODEL_CANDIDATES) {
      try {
        const model = await getModel(modelName);
        const response = await model.generateContent(contents);
        return { response, modelName };
      } catch (error) {
        lastError = error;
        console.warn(`[FirebaseAIDirect] ${modelName} failed`, error);
        if (!isTemporaryAIError(error)) throw error;
      }
    }

    throw lastError || new Error('目前所有免費 AI 模型都暫時無法使用，請稍後再試。');
  }

  async function generate(prompt) {
    const { response } = await generateWithFallback(prompt);
    return response.response.text();
  }

  function sciencePrompt(wrongAnswers) {
    return `你是台灣國中七年級自然科學習診斷老師。\n\n教材範圍：七年級上學期，單元 1「生命現象與科學探究」，1-2 科學方法。\n\n請根據學生的累積錯題做學習診斷。請使用繁體中文，語氣清楚、適合國一學生，不要責備學生。\n\n請依序輸出：\n1. 主要錯誤概念（2～4 點）\n2. 為什麼容易答錯\n3. 每個概念的正確判斷方式\n4. 最值得優先複習的內容\n5. 最後給 3 題「自我檢查問題」，只出題不要提供答案\n\n不要編造題目未提供的教材內容；若資訊不足，請明確說明。\n\n學生錯題資料：\n${JSON.stringify(wrongAnswers, null, 2)}`;
  }

  function renderScience(text, box, modelName = MODEL) {
    box.innerHTML = `
      <div style="border:1px solid #bfdbfe;background:#eff6ff;border-radius:14px;padding:14px;margin-top:12px">
        <div style="font-weight:800;margin-bottom:8px">🤖 AI 學習診斷</div>
        <div style="white-space:pre-wrap;line-height:1.75">${esc(text)}</div>
        <div class="record-note" style="margin-top:8px">模型：${esc(modelName)} · Firebase AI Logic</div>
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
    status.textContent = 'AI 正在直接分析錯題…';
    resultBox.innerHTML = '';

    try {
      const { response, modelName } = await generateWithFallback(sciencePrompt(wrongAnswers));
      const text = response.response.text();
      status.textContent = '分析完成。';
      renderScience(text, resultBox, modelName);
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

  function currentMathQuestion() {
    return window.MathPaperQuestionConfig || {
      id: 'math-paper-quadratic-test-001',
      semester: '九年級上學期',
      unit: '一元二次方程式',
      text: 'x^2 - 5x + 6 = 0，求 x 的所有解。',
      expectedAnswer: 'x = 2 或 x = 3',
      gradingInstructions: '請依數學意義判斷，完整解集合為 x = 2 與 x = 3。'
    };
  }

  async function gradeMathHandwriting(dataUrl) {
    const match = String(dataUrl || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
    if (!match) throw new Error('找不到可判讀的手寫圖片。');

    const question = currentMathQuestion();
    const prompt = `你是台灣國中數學老師。請判讀學生手寫作答圖片，除了判斷對錯，也要像老師改作業一樣指出錯在哪一步並教學生如何修正。\n\n題目：${question.text}\n標準答案：${question.expectedAnswer}\n\n額外判分規則：\n${question.gradingInstructions}\n\n判題與教學原則：\n1. 先忠實辨識學生實際寫出的答案與計算步驟，依照書寫順序判讀；看不清楚就不要猜。\n2. 依數學意義判斷，不可只做答案字串比較；數學上等價的寫法視為相同。\n3. 若作答錯誤，必須找出「最早一個可以可靠確認的實質數學錯誤」。不要只說「計算有誤」或「請重新檢查」。\n4. errorStep 要直接指出學生哪一個算式或哪一步出錯；能辨識原算式時，盡量引用該算式。\n5. whyWrong 要用國中學生看得懂的方式說明這一步為什麼不成立，例如等號兩邊沒有做相同運算、正負號改錯、展開括號錯誤、算術計算錯誤等。\n6. correction 要寫出該步正確的改法；必要時可再往下列 1～2 步，讓學生知道怎麼得到正確答案。\n7. nextHint 是簡短的下一步提示，鼓勵學生自己重算；若 correction 已經完整到答案，也可提醒學生代回原式檢查。\n8. 若學生前面的步驟正確、只在後面算錯，不要把前面的正確步驟說成錯誤。\n9. 若學生只有最後答案、沒有足夠過程可定位錯誤，errorStep 請明確寫「目前只看到最後答案，無法定位是哪一步算錯」，不要發明過程。\n10. verdict=correct 時，errorStep、whyWrong、correction、nextHint 請留空，feedback 簡短肯定作答即可。\n11. verdict=unclear 時，不要猜測錯誤位置；說明哪部分無法可靠辨識，建議重寫較清楚。\n12. 不要自行冠上不確定的數學律名稱；只描述實際算式關係。\n13. 所有文字使用台灣繁體中文，語氣像老師批改作業，清楚、具體、不責備。\n\n只回傳 JSON，不要 Markdown：\n{"verdict":"correct|incorrect|unclear","recognizedAnswer":"","recognizedWork":"","errorStep":"","whyWrong":"","correction":"","nextHint":"","feedback":"","confidence":0.0}`;

    const { response, modelName } = await generateWithFallback([
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
      errorStep: String(obj.errorStep || ''),
      whyWrong: String(obj.whyWrong || ''),
      correction: String(obj.correction || ''),
      nextHint: String(obj.nextHint || ''),
      feedback: String(obj.feedback || ''),
      confidence,
      modelName
    };
  }

  function renderMathResult(result, box) {
    const c = {
      correct:{title:'✓ 作答正確',border:'#86efac',bg:'#f0fdf4',ink:'#166534'},
      incorrect:{title:'✗ 作答需要修正',border:'#fca5a5',bg:'#fef2f2',ink:'#991b1b'},
      unclear:{title:'？AI 無法可靠判讀',border:'#fde68a',bg:'#fffbeb',ink:'#92400e'}
    }[result.verdict] || {title:'？AI 無法可靠判讀',border:'#fde68a',bg:'#fffbeb',ink:'#92400e'};

    const confidence = typeof result.confidence === 'number' ? `${Math.round(result.confidence * 100)}%` : '';
    const modelName = result.modelName || MODEL;
    const teaching = result.verdict === 'incorrect' && (
      result.errorStep || result.whyWrong || result.correction || result.nextHint
    );

    box.innerHTML = `
      <div style="margin-top:14px;padding:15px;border-radius:14px;border:1px solid ${c.border};background:${c.bg};color:${c.ink}">
        <div style="font-size:1.08rem;font-weight:900;margin-bottom:8px">${c.title}</div>
        ${result.recognizedAnswer ? `<div style="margin:5px 0"><b>AI 辨識答案：</b>${esc(result.recognizedAnswer)}</div>` : ''}
        ${result.recognizedWork ? `<div style="margin:5px 0"><b>AI 辨識過程：</b>${esc(result.recognizedWork)}</div>` : ''}

        ${teaching ? `
          <div style="margin-top:13px;padding:12px 13px;border-radius:11px;background:rgba(255,255,255,.72);border:1px solid rgba(153,27,27,.18);line-height:1.7">
            <div style="font-weight:900;margin-bottom:6px">📘 老師幫你找錯誤</div>
            ${result.errorStep ? `<div style="margin:5px 0"><b>錯在這一步：</b>${esc(result.errorStep)}</div>` : ''}
            ${result.whyWrong ? `<div style="margin:5px 0"><b>為什麼錯：</b>${esc(result.whyWrong)}</div>` : ''}
            ${result.correction ? `<div style="margin:5px 0"><b>應該這樣改：</b>${esc(result.correction)}</div>` : ''}
            ${result.nextHint ? `<div style="margin:5px 0"><b>接著試試看：</b>${esc(result.nextHint)}</div>` : ''}
          </div>` : ''}

        ${result.feedback ? `<div style="margin-top:10px;line-height:1.7">${esc(result.feedback)}</div>` : ''}
        <div style="font-size:.78rem;opacity:.68;margin-top:8px">${confidence ? `判讀信心：${confidence}　` : ''}模型：${esc(modelName)} · Firebase AI Logic</div>
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
    status.textContent = 'AI 正在判讀答案與計算步驟…';
    resultBox.innerHTML = '';

    try {
      const result = await gradeMathHandwriting(dataUrl);
      status.textContent = result.verdict === 'incorrect'
        ? 'AI 判題完成，已整理錯誤位置與修正方式。'
        : 'AI 判題完成。';
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
    models: [...MODEL_CANDIDATES],
    backend: 'Firebase AI Logic'
  };
})();
