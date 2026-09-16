(() => {
  'use strict';

  const ENGLISH_CACHE_PREFIX = 'examEnglishAi.cache.';

  function currentEnglishBank() {
    const ctx = window.examContextCurrent || {};
    if (ctx.examType !== 'gept-elementary-reading') return null;
    const key = ctx.key || ctx.difficulty;
    try {
      const bank = typeof banks !== 'undefined' ? banks[key] : null;
      return Array.isArray(bank) ? bank : null;
    } catch {
      return null;
    }
  }

  function findSharedPassage(question, bank) {
    if (!question?.groupId || !Array.isArray(bank)) return '';
    return bank.find(q => q.groupId === question.groupId && q.intro)?.intro || '';
  }

  function payloadKey(payload) {
    const text = JSON.stringify(payload);
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return `en-${(h >>> 0).toString(16)}`;
  }

  function readCache(key) {
    try {
      const raw = sessionStorage.getItem(ENGLISH_CACHE_PREFIX + key);
      if (!raw) return null;
      const cached = JSON.parse(raw);
      return cached?.result?.status === 'completed' ? cached : null;
    } catch {
      return null;
    }
  }

  function writeCache(key, payload, title, analysis) {
    try {
      sessionStorage.setItem(ENGLISH_CACHE_PREFIX + key, JSON.stringify({
        key,
        payload,
        title,
        result: {
          status: 'completed',
          analysis,
          model: 'Firebase AI Logic'
        },
        savedAt: new Date().toISOString()
      }));
    } catch {}
  }

  function clearCache(key) {
    try { sessionStorage.removeItem(ENGLISH_CACHE_PREFIX + key); } catch {}
  }

  function ensureModal() {
    return document.getElementById('englishAiModal');
  }

  function showModal(payload, title) {
    const modal = ensureModal();
    if (!modal) throw new Error('英文 AI 視窗尚未初始化，請重新整理後再試。');

    modal._englishPayload = payload;
    modal._englishTitle = title || '🤖 AI 翻譯分析';
    modal._englishKey = payloadKey(payload);
    modal.style.zIndex = '30050';
    modal.resetEnglishAiPosition?.();

    const titleEl = document.getElementById('englishAiTitle');
    if (titleEl) titleEl.textContent = modal._englishTitle;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    return modal;
  }

  function renderCompleted(modal, analysis) {
    const status = document.getElementById('englishAiStatus');
    const result = document.getElementById('englishAiResult');
    if (status) status.textContent = '分析完成｜Firebase AI Logic｜已保留結果';
    if (result) result.textContent = analysis || '';
  }

  async function waitForSharedAI() {
    for (let i = 0; i < 100; i++) {
      if (window.ChrisExamAI && typeof window.ChrisExamAI.generate === 'function') {
        return window.ChrisExamAI;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error('Firebase AI Logic 尚未載入，請重新整理後再試。');
  }

  function buildPrompt(payload) {
    if (payload.mode === 'passage') {
      return `你是台灣國中英文老師，協助學生理解 GEPT 初級閱讀題組。\n\n請針對下面英文文章，以繁體中文提供學習用分析。\n\n請依序輸出：\n1. 全文自然中文翻譯（保留原文段落結構）\n2. 重要單字與片語：英文、中文意思、在本文中的用法\n3. 重要文法或句型：只挑真正影響理解的內容\n4. 閱讀理解重點：告訴學生本文在說什麼、哪些線索最重要\n\n要求：\n- 不要添加原文沒有的資訊。\n- 翻譯要自然但忠於原文。\n- 解釋程度適合台灣國中生。\n- 使用繁體中文。\n\n英文文章：\n${payload.passage || ''}`;
    }

    const options = Array.isArray(payload.options)
      ? payload.options.map((x, i) => `${String.fromCharCode(65 + i)}. ${x}`).join('\n')
      : '';

    return `你是台灣國中英文老師，協助學生理解 GEPT 初級閱讀選擇題。\n\n請根據題目、選項、正確答案與既有詳解做「翻譯＋用字＋解題」分析。\n\n請依序輸出：\n1. 題目中文翻譯\n2. 若有文章／題組內容，先翻譯與摘要和本題有關的部分\n3. 各選項中文翻譯\n4. 正確答案為什麼正確\n5. 其他選項為什麼不適合\n6. 本題重要單字、片語或文法（只列真正有幫助的）\n7. 給國中生的一句解題提示\n\n要求：\n- 使用繁體中文。\n- 不要改變正確答案。\n- 若既有詳解與題目資訊不足，請明確說明，不要自行補造事實。\n- 解釋要適合台灣國中生。\n\n題號：${payload.questionNumber ?? ''}\n\n題組／文章：\n${payload.passage || '（無）'}\n\n題目：\n${payload.question || ''}\n\n選項：\n${options}\n\n正確答案：\n${payload.correctAnswer || ''}\n\n既有詳解：\n${payload.localExplanation || '（無）'}`;
  }

  async function runDirect(payload, title, triggerButton, options = {}) {
    const force = options.force === true;
    const modal = showModal(payload, title);
    const key = payloadKey(payload);
    const status = document.getElementById('englishAiStatus');
    const resultBox = document.getElementById('englishAiResult');
    const reanalyzeBtn = document.getElementById('englishAiReanalyzeBtn');

    if (!force) {
      const cached = readCache(key);
      if (cached) {
        renderCompleted(modal, cached.result.analysis || '');
        return;
      }
    } else {
      clearCache(key);
    }

    if (triggerButton) triggerButton.disabled = true;
    if (reanalyzeBtn) reanalyzeBtn.disabled = true;
    if (status) status.textContent = force ? 'AI 正在重新分析…' : 'AI 正在直接翻譯分析…';
    if (resultBox) resultBox.textContent = '';

    try {
      const ai = await waitForSharedAI();
      const analysis = await ai.generate(buildPrompt(payload));
      writeCache(key, payload, title, analysis);
      if (modal._englishKey === key) renderCompleted(modal, analysis);
    } catch (error) {
      console.error('[FirebaseEnglishAI] analysis failed', error);
      if (modal._englishKey === key) {
        if (status) status.textContent = '無法完成分析';
        if (resultBox) resultBox.textContent = error?.message || String(error);
      }
    } finally {
      if (triggerButton) triggerButton.disabled = false;
      if (reanalyzeBtn) reanalyzeBtn.disabled = false;
    }
  }

  function questionPayloadFromButton(button) {
    const card = button.closest?.('#quiz .card[data-question-number]');
    const number = Number(card?.dataset?.questionNumber);
    const bank = currentEnglishBank();
    if (!bank || !Number.isFinite(number)) return null;

    const q = bank.find((item, index) => Number(item?.number || index + 1) === number);
    if (!q) return null;

    const letters = ['A','B','C','D','E','F'];
    const correct = Array.isArray(q.o) && Number.isInteger(q.a)
      ? `${letters[q.a] || ''}. ${q.o[q.a] || ''}`
      : '';

    return {
      mode: 'question',
      questionNumber: number,
      question: q.q || '',
      options: q.o || [],
      correctAnswer: correct,
      localExplanation: q.e || '',
      passage: findSharedPassage(q, bank)
    };
  }

  function passagePayload() {
    const passage = document.getElementById('geptPassageBody')?.textContent || '';
    if (!passage.trim()) return null;
    return { mode: 'passage', passage };
  }

  document.addEventListener('click', event => {
    const questionButton = event.target.closest?.('.english-ai-btn');
    if (questionButton) {
      const payload = questionPayloadFromButton(questionButton);
      if (!payload) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      runDirect(payload, `🤖 第 ${payload.questionNumber} 題｜翻譯與用字分析`, questionButton);
      return;
    }

    const passageButton = event.target.closest?.('.english-ai-passage-btn');
    if (passageButton) {
      const payload = passagePayload();
      if (!payload) return;
      const title = document.getElementById('geptPassageTitle')?.textContent || '題組內容';
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      runDirect(payload, `🤖 ${title}｜全文翻譯分析`, passageButton);
      return;
    }

    const reanalyzeButton = event.target.closest?.('#englishAiReanalyzeBtn');
    if (reanalyzeButton) {
      const modal = ensureModal();
      const payload = modal?._englishPayload;
      if (!payload) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      runDirect(payload, modal._englishTitle || '🤖 AI 翻譯分析', null, { force: true });
    }
  }, true);
})();
