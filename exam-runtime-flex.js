(() => {
  'use strict';

  window.examContexts = window.examContexts || {};
  window.examContextCurrent = null;

  const $ = (sel, root = document) => root.querySelector(sel);
  let mathReadyPromise = null;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'
    }[ch]));
  }

  function loadScriptOnce(id, src) {
    const existing = document.getElementById(id);
    if (existing) {
      if (existing.dataset.loaded === '1') return Promise.resolve();
      return new Promise((resolve, reject) => {
        existing.addEventListener('load', resolve, { once:true });
        existing.addEventListener('error', reject, { once:true });
      });
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.defer = true;
      script.addEventListener('load', () => {
        script.dataset.loaded = '1';
        resolve();
      }, { once:true });
      script.addEventListener('error', reject, { once:true });
      document.head.appendChild(script);
    });
  }

  function ensureMathRenderer() {
    if (typeof window.renderMathInElement === 'function') return Promise.resolve(true);
    if (mathReadyPromise) return mathReadyPromise;

    mathReadyPromise = new Promise(resolve => {
      if (!document.getElementById('katexStyles')) {
        const link = document.createElement('link');
        link.id = 'katexStyles';
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';
        document.head.appendChild(link);
      }

      loadScriptOnce('katexScript', 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js')
        .then(() => loadScriptOnce('katexAutoRenderScript', 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js'))
        .then(() => resolve(typeof window.renderMathInElement === 'function'))
        .catch(() => resolve(false));
    });

    return mathReadyPromise;
  }

  function renderMath(root) {
    if (!root) return;
    ensureMathRenderer().then(ready => {
      if (!ready || !root.isConnected || typeof window.renderMathInElement !== 'function') return;
      window.renderMathInElement(root, {
        delimiters: [
          { left:'\\[', right:'\\]', display:true },
          { left:'\\(', right:'\\)', display:false }
        ],
        throwOnError:false,
        strict:false,
        ignoredTags:['script','noscript','style','textarea','pre','code']
      });
    });
  }

  function injectStyles() {
    if ($('#flexExamStyles')) return;
    const style = document.createElement('style');
    style.id = 'flexExamStyles';
    style.textContent = `
      .question-text{font-weight:750}
      .question-media{margin:12px 0 14px;border:1px solid #dbe3ef;background:#fff;border-radius:14px;padding:10px;overflow:auto;text-align:center}
      .question-media img{display:block;max-width:100%;height:auto;margin:auto;border-radius:8px}
      .option-media{margin-top:4px}
      .option-media img{max-height:620px;object-fit:contain}
      .option-list.option-layout-grid-2x2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:8px 0}
      .option-list.option-layout-grid-2x2 .option{margin:0;min-width:0}
      label.option.option-has-image{display:flex;align-items:flex-start;gap:8px}
      label.option.option-has-image input[type=radio]{flex:0 0 auto;margin-top:5px}
      .option-choice{display:flex;flex-direction:column;gap:8px;min-width:0;flex:1}
      .option-choice-text{display:block;overflow-wrap:anywhere}
      .option-choice-media{display:flex;align-items:center;justify-content:center;min-height:80px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:10px;padding:8px}
      .option-choice-media img{display:block;max-width:100%;max-height:300px;width:auto;height:auto;object-fit:contain;border-radius:7px}
      .option-choice-media.image-load-failed{display:none}
      .option-choice-diagram{display:block;width:100%;min-height:92px}
      .option-choice-diagram .number-line-diagram{margin:0 auto}
      .katex-display{overflow-x:auto;overflow-y:hidden;padding:2px 0}
      .passage-box{margin:0 0 16px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:14px;padding:14px 15px;font-weight:400;white-space:pre-wrap;line-height:1.8;color:#263244}
      .passage-label{font-size:.82rem;font-weight:800;color:#1d4ed8;margin-bottom:6px;letter-spacing:.02em}
      .past-source-note{margin:8px 0 0;color:#64748b;font-size:.86rem}
      .manual-study-box{margin:12px 0 4px;border:1px dashed #94a3b8;background:#f8fafc;border-radius:12px;padding:12px 14px}
      .manual-study-badge{display:inline-block;font-size:.78rem;font-weight:800;color:#7c3aed;background:#f5f3ff;border-radius:999px;padding:3px 8px;margin-bottom:7px}
      .manual-study-note{font-size:.9rem;color:#64748b;line-height:1.6}
      .handwriting-box{margin:12px 0 4px;border:1px solid #bfdbfe;background:#eff6ff;border-radius:12px;padding:12px 14px}
      .handwriting-badge{display:inline-block;font-size:.78rem;font-weight:800;color:#1d4ed8;background:#dbeafe;border-radius:999px;padding:3px 8px;margin-bottom:7px}
      .handwriting-note{font-size:.9rem;color:#475569;line-height:1.6;margin-bottom:10px}
      .handwriting-open{border:0;border-radius:10px;padding:9px 14px;font-weight:800;background:#2563eb;color:#fff;cursor:pointer}
      .handwriting-preview{display:none;margin-top:10px}
      .handwriting-preview.show{display:block}
      .handwriting-preview img{display:block;max-width:240px;width:100%;height:auto;border:1px solid #cbd5e1;border-radius:10px;background:#fff;padding:5px}
      .handwriting-status{margin-top:8px;font-size:.86rem;color:#64748b}
      .handwriting-grade{display:none;margin-top:12px;border-radius:12px;padding:11px 12px;line-height:1.65}
      .handwriting-grade.show{display:block}
      .handwriting-grade.correct{border:1px solid #86efac;background:#f0fdf4;color:#166534}
      .handwriting-grade.incorrect{border:1px solid #fca5a5;background:#fef2f2;color:#991b1b}
      .handwriting-grade.unclear{border:1px solid #fde68a;background:#fffbeb;color:#92400e}
      @media(max-width:620px){.question-media{padding:7px}.passage-box{padding:12px}.katex{font-size:1.02em}.option-list.option-layout-grid-2x2{grid-template-columns:1fr}.option-choice-media img{max-height:240px}}
    `;
    document.head.appendChild(style);
  }

  function getContext(key = level) {
    const ctx = window.examContexts?.[key];
    if (ctx) return ctx;
    return {
      key,
      title:`1-2 科學方法模擬考｜${names[key] || key}`,
      subtitle:`自然七上｜單元 1 生命現象與科學探究｜${names[key] || ''}程度｜${banks[key]?.length || 0} 題選擇題`,
      subject:'science',
      subjectLabel:'國一自然',
      semester:'7-1',
      semesterLabel:'七年級上學期',
      unitGroup:'unit-1',
      unitGroupLabel:'單元 1 生命現象與科學探究',
      section:'1-2',
      unit:'1-2 科學方法',
      difficulty:key,
      difficultyLabel:names[key] || key,
      scoreMode:'fixed',
      pointsPerQuestion:5,
      analysisEligible:true,
      preserveOptionOrder:false
    };
  }

  function scoreInfo(correct, total, ctx) {
    if (ctx.scoreMode === 'percent') {
      const pct = total ? Math.round(correct * 100 / total) : 0;
      return { score:pct, prominent:`答對 ${correct} / ${total}`, detail:`正答率 ${pct}%` };
    }
    const p = Number(ctx.pointsPerQuestion ?? 5);
    const score = correct * p;
    return { score, prominent:`${score} 分`, detail:`答對 ${correct} / ${total} 題` };
  }

  function questionType(question) {
    return question?.type || 'mcq';
  }

  function isManualStudy(question) {
    return questionType(question) === 'manual-study';
  }

  function isHandwriting(question) {
    return questionType(question) === 'handwriting';
  }

  function handwritingKey(question, questionIndex, ctx = window.examContextCurrent || getContext(level)) {
    const number = question?.number || questionIndex + 1;
    if (window.ExamHandwriting?.answerKey) {
      return window.ExamHandwriting.answerKey(ctx?.key || level || 'exam', number);
    }
    return `${ctx?.key || level || 'exam'}::${number}`;
  }

  function renderOptionList(question, questionIndex) {
    const options = Array.isArray(question?.o) ? question.o : [];
    const images = Array.isArray(question?.optionImages) ? question.optionImages : [];
    const alts = Array.isArray(question?.optionImageAlts) ? question.optionImageAlts : [];
    const diagrams = Array.isArray(question?.optionDiagrams) ? question.optionDiagrams : [];
    const hasMedia = images.some(Boolean) || diagrams.some(Boolean);
    const layoutClass = hasMedia && question?.optionLayout === 'grid-2x2' ? ' option-layout-grid-2x2' : '';

    const labels = options.map((value, optionIndex) => {
      const src = images[optionIndex] || '';
      const diagram = diagrams[optionIndex] || null;
      const alt = alts[optionIndex] || value || `第${question.number || questionIndex + 1}題選項${letters[optionIndex]}`;
      const imageMedia = src
        ? `<span class="option-choice-media"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy"></span>`
        : '';
      const diagramMedia = diagram
        ? `<span class="option-choice-media"><span class="option-choice-diagram" data-option-diagram-question="${questionIndex}" data-option-diagram-index="${optionIndex}"></span></span>`
        : '';
      const mediaClass = (src || diagram) ? ' option-has-image' : '';
      return `<label class="option${mediaClass}" data-opt="${optionIndex}"><input type="radio" name="q${questionIndex}" value="${optionIndex}"><span class="option-choice"><span class="option-choice-text">(${letters[optionIndex]}) ${escapeHtml(value)}</span>${imageMedia}${diagramMedia}</span></label>`;
    }).join('');

    return `<div class="option-list${layoutClass}">${labels}</div>`;
  }

  function bindOptionImageFallbacks(root = document) {
    root.querySelectorAll('.option-choice-media img').forEach(img => {
      if (img.dataset.fallbackBound === '1') return;
      img.dataset.fallbackBound = '1';
      img.addEventListener('error', () => {
        img.closest('.option-choice-media')?.classList.add('image-load-failed');
      });
    });
  }

  function renderQuestionDiagrams(root = quiz) {
    if (!root) return;

    questions.forEach((question, questionIndex) => {
      if (!question?.diagram) return;

      const imageList = Array.isArray(question.images)
        ? question.images.filter(Boolean)
        : (question.image ? [question.image] : []);

      // Existing official/original image flow remains authoritative.
      // If both are present, image wins and diagram is intentionally ignored.
      if (imageList.length) return;

      const host = root.querySelector(`[data-diagram-question="${questionIndex}"]`);
      if (!host) return;

      if (typeof window.renderDiagram !== 'function') {
        console.warn('[ExamRuntime] diagram renderer is unavailable', question.diagram);
        host.innerHTML = '<div class="diagram-fallback">圖形載入失敗</div>';
        return;
      }

      try {
        window.renderDiagram(host, question.diagram);
      } catch (error) {
        console.warn('[ExamRuntime] diagram render failed', error, question.diagram);
        host.innerHTML = '<div class="diagram-fallback">圖形資料格式錯誤</div>';
      }
    });
  }

  function renderOptionDiagrams(root = quiz) {
    if (!root) return;

    questions.forEach((question, questionIndex) => {
      const diagrams = Array.isArray(question?.optionDiagrams) ? question.optionDiagrams : [];
      diagrams.forEach((diagram, optionIndex) => {
        if (!diagram) return;
        const host = root.querySelector(
          `[data-option-diagram-question="${questionIndex}"][data-option-diagram-index="${optionIndex}"]`
        );
        if (!host) return;

        if (typeof window.renderDiagram !== 'function') {
          host.innerHTML = '<div class="diagram-fallback">圖形載入失敗</div>';
          return;
        }

        try {
          window.renderDiagram(host, diagram);
        } catch (error) {
          console.warn('[ExamRuntime] option diagram render failed', error, diagram);
          host.innerHTML = '<div class="diagram-fallback">圖形資料格式錯誤</div>';
        }
      });
    });
  }

  function refreshHandwritingCard(questionIndex) {
    const question = questions[questionIndex];
    if (!isHandwriting(question)) return;
    const card = quiz?.querySelector(`[data-q="${questionIndex}"]`);
    if (!card) return;

    const key = handwritingKey(question, questionIndex);
    const answer = window.ExamHandwriting?.getAnswer?.(key);
    const button = card.querySelector('.handwriting-open');
    const preview = card.querySelector('.handwriting-preview');
    const image = card.querySelector('.handwriting-preview img');
    const status = card.querySelector('.handwriting-status');

    if (answer?.dataUrl) {
      if (button) button.textContent = '✍️ 修改手寫作答';
      if (image) image.src = answer.dataUrl;
      preview?.classList.add('show');
      if (status) status.textContent = '已完成手寫作答；交卷時會送交 Firebase Gemini 判題。';
    } else {
      if (button) button.textContent = '✍️ 開始手寫作答';
      if (image) image.removeAttribute('src');
      preview?.classList.remove('show');
      if (status) status.textContent = '尚未作答。';
    }
  }

  function bindHandwritingButtons(root = quiz) {
    if (!root) return;
    root.querySelectorAll('[data-handwriting-open]').forEach(button => {
      if (button.dataset.bound === '1') return;
      button.dataset.bound = '1';
      button.addEventListener('click', async () => {
        const questionIndex = Number(button.dataset.handwritingOpen);
        const question = questions[questionIndex];
        if (!isHandwriting(question)) return;
        if (!window.ExamHandwriting?.openCanvas) {
          alert('手寫模組尚未載入，請重新整理頁面後再試。');
          return;
        }

        const ctx = window.examContextCurrent || getContext(level);
        const key = handwritingKey(question, questionIndex, ctx);
        await window.ExamHandwriting.openCanvas({
          key,
          title:`第 ${question.number || questionIndex + 1} 題｜${question.q}`,
          subtitle:question.handwritingInstruction || '請寫出完整計算過程與答案'
        });
        refreshHandwritingCard(questionIndex);
        updateProgress();
      });
    });
    questions.forEach((q,i) => {
      if (isHandwriting(q)) refreshHandwritingCard(i);
    });
  }

  function renderHandwritingGrade(questionIndex, gradingResult) {
    const card = quiz?.querySelector(`[data-q="${questionIndex}"]`);
    const box = card?.querySelector('.handwriting-grade');
    if (!box) return;

    const verdict = gradingResult?.verdict || 'unclear';
    const css = verdict === 'correct' ? 'correct' : verdict === 'incorrect' ? 'incorrect' : 'unclear';
    const title = verdict === 'correct'
      ? '✓ Gemini 判定正確'
      : verdict === 'incorrect'
        ? '✗ 作答需要修正'
        : '？Gemini 無法可靠判定';

    const feedback = gradingResult?.feedback || (
      verdict === 'incorrect' ? '答案或計算過程有誤。' : '無法可靠判讀這份手寫作答。'
    );
    const recognizedAnswer = gradingResult?.recognizedAnswer || '';
    const recognizedWork = gradingResult?.recognizedWork || '';
    const errorStep = gradingResult?.errorStep || '';
    const whyWrong = gradingResult?.whyWrong || '';
    const correction = gradingResult?.correction || '';
    const nextHint = gradingResult?.nextHint || '';
    const confidence = typeof gradingResult?.confidence === 'number'
      ? `${Math.round(gradingResult.confidence * 100)}%`
      : '';
    const modelName = gradingResult?.modelName || '';

    box.className = `handwriting-grade show ${css}`;
    box.innerHTML = `<strong>${title}</strong>` +
      (recognizedAnswer ? `<div>辨識答案：${escapeHtml(recognizedAnswer)}</div>` : '') +
      (recognizedWork ? `<div>辨識過程：${escapeHtml(recognizedWork)}</div>` : '') +
      (errorStep ? `<div><b>錯在這一步：</b>${escapeHtml(errorStep)}</div>` : '') +
      (whyWrong ? `<div><b>為什麼錯：</b>${escapeHtml(whyWrong)}</div>` : '') +
      (correction ? `<div><b>應該這樣改：</b>${escapeHtml(correction)}</div>` : '') +
      (nextHint ? `<div><b>接著試試看：</b>${escapeHtml(nextHint)}</div>` : '') +
      `<div>${escapeHtml(feedback)}</div>` +
      ((confidence || modelName)
        ? `<div class="tiny" style="margin-top:6px">${confidence ? `判讀信心：${confidence}` : ''}${confidence && modelName ? '　' : ''}${modelName ? `模型：${escapeHtml(modelName)} · Firebase AI Logic` : ''}</div>`
        : '');
  }

  window.startExam = function(selected) {
    if (!banks[selected]) return;
    level = selected;
    questions = banks[level];
    graded = false;
    const submitButton = $('#submitBtn');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = '交卷看成績';
    }
    window.ExamHandwriting?.reset?.();
    const ctx = getContext(selected);
    window.examContextCurrent = ctx;

    startScreen.classList.add('hidden');
    examScreen.classList.remove('hidden');
    $('#catalogShell')?.classList.add('hidden');

    $('#examTitle').textContent = ctx.title || names[level] || '線上測驗';
    $('#examSub').textContent = ctx.subtitle || `${questions.length} 題`;
    const status = $('#examScreen .status');
    if (status) {
      const handwritingTotal = questions.filter(isHandwriting).length;
      const manualTotal = questions.filter(isManualStudy).length;
      const mcqTotal = questions.length - handwritingTotal - manualTotal;
      const scoredTotal = mcqTotal + handwritingTotal;
      status.innerHTML = `<span class="pill" id="progress">已作答 0 / ${scoredTotal}</span>` +
        (ctx.scoreMode === 'percent'
          ? `<span class="pill">選擇題 ${mcqTotal} 題</span>${handwritingTotal ? `<span class="pill">手寫 ${handwritingTotal} 題｜Firebase Gemini 判題</span>` : ''}<span class="pill">以正答率顯示</span>`
          : `<span class="pill">每題 ${ctx.pointsPerQuestion ?? 5} 分</span><span class="pill">滿分 ${(ctx.pointsPerQuestion ?? 5) * scoredTotal} 分</span>`) +
        (manualTotal ? `<span class="pill">紙筆練習 ${manualTotal} 題｜不計分</span>` : '');
    }
    $('#backBtn').textContent = ctx.backLabel || (ctx.examType ? '返回歷屆考題' : '選擇其他難度');
    render();
    result.style.display = 'none';
    $('#explainBtn').textContent = '顯示詳解';
    document.dispatchEvent(new CustomEvent('exam:started', { detail: ctx }));
    window.scrollTo({top:0,behavior:'smooth'});
  };

  window.render = function() {
    const ctx = window.examContextCurrent || getContext(level);
    quiz.innerHTML = questions.map((x,i) => {
      const type = questionType(x);
      const intro = x.intro ? `<div class="passage-box">${x.introLabel ? `<div class="passage-label">${escapeHtml(x.introLabel)}</div>` : ''}${escapeHtml(x.intro)}</div>` : '';
      const imageList = Array.isArray(x.images)
        ? x.images
        : (x.image ? [x.image] : []);

      const media = imageList.map((src, imageIndex) =>
        `<div class="question-media"><img src="${escapeHtml(src)}" alt="${escapeHtml(x.imageAlt || `第${i+1}題附圖${imageList.length > 1 ? ` ${imageIndex + 1}` : ''}`)}" loading="lazy"></div>`
      ).join('');
      const diagramMedia = !imageList.length && x.diagram
        ? `<div class="question-diagram-host" data-diagram-question="${i}"></div>`
        : '';
      const optionMedia = x.optionImage ? `<div class="question-media option-media"><img src="${escapeHtml(x.optionImage)}" alt="${escapeHtml(x.optionImageAlt || `第${i+1}題選項圖`)}" loading="lazy"></div>` : '';
      const qtitle = `<div class="qtitle"><span class="num">${x.number || i+1}</span><span class="question-text">${escapeHtml(x.q)}</span></div>`;

      if (type === 'manual-study') {
        const instruction = x.manualInstruction || '請在紙上作答；本題不列入自動計分。';
        const answer = x.manualAnswer || x.answer || '';
        return `<section class="card" data-q="${i}" data-question-number="${x.number || i+1}" data-question-type="manual-study">${intro}${qtitle}${media}${diagramMedia}${optionMedia}<div class="manual-study-box"><span class="manual-study-badge">紙筆練習｜不計分</span><div class="manual-study-note">${escapeHtml(instruction)}</div></div><div class="explain"><b>參考答案：${escapeHtml(answer)}</b>${x.e ? `　${escapeHtml(x.e)}` : ''}</div></section>`;
      }

      if (type === 'handwriting') {
        const instruction = x.handwritingInstruction || '請寫出完整計算過程與答案；本題會在交卷時由 Firebase Gemini 判題並計分。';
        const answer = x.expectedAnswer || x.manualAnswer || '';
        return `<section class="card" data-q="${i}" data-question-number="${x.number || i+1}" data-question-type="handwriting">${intro}${qtitle}${media}${diagramMedia}${optionMedia}<div class="handwriting-box"><span class="handwriting-badge">✍️ 手寫計分題｜Firebase Gemini 判題</span><div class="handwriting-note">${escapeHtml(instruction)}</div><button type="button" class="handwriting-open" data-handwriting-open="${i}">✍️ 開始手寫作答</button><div class="handwriting-preview"><img alt="第${x.number || i+1}題手寫作答預覽"></div><div class="handwriting-status">尚未作答。</div><div class="handwriting-grade"></div></div><div class="explain"><b>參考答案：${escapeHtml(answer)}</b>${x.e ? `　${escapeHtml(x.e)}` : ''}</div></section>`;
      }

      const opts = renderOptionList(x, i);
      return `<section class="card" data-q="${i}" data-question-number="${x.number || i+1}" data-question-type="${escapeHtml(type)}">${intro}${qtitle}${media}${diagramMedia}${optionMedia}${opts}<div class="explain"><b>答案：${letters[x.a]}</b>　${escapeHtml(x.e || '')}</div></section>`;
    }).join('');
    bindOptionImageFallbacks(quiz);
    renderQuestionDiagrams(quiz);
    renderOptionDiagrams(quiz);
    bindHandwritingButtons(quiz);
    renderMath(quiz);
    document.querySelectorAll('input[type=radio]').forEach(el=>el.addEventListener('change',updateProgress));
    updateProgress();
    if (ctx.sourceNote && !$('#pastSourceNote')) {
      const note = document.createElement('p');
      note.id = 'pastSourceNote';
      note.className = 'past-source-note';
      note.textContent = ctx.sourceNote;
      quiz.insertAdjacentElement('beforebegin', note);
    } else if (!ctx.sourceNote) {
      $('#pastSourceNote')?.remove();
    }
  };

  window.updateProgress = function() {
    let answered = 0;
    let scoredTotal = 0;
    const ctx = window.examContextCurrent || getContext(level);

    questions.forEach((q,i) => {
      if (isManualStudy(q)) return;
      scoredTotal++;
      if (isHandwriting(q)) {
        const key = handwritingKey(q, i, ctx);
        if (window.ExamHandwriting?.getAnswer?.(key)?.dataUrl) answered++;
      } else if (document.querySelector(`input[name=q${i}]:checked`)) {
        answered++;
      }
    });

    const el = $('#progress');
    if (el) el.textContent=`已作答 ${answered} / ${scoredTotal}`;
  };

  if ($('#submitBtn')) {
    $('#submitBtn').onclick = async function() {
      if (graded) return;
      const submitButton = this;
      const ctx = window.examContextCurrent || getContext(level);
      const handwritingItems = questions
        .map((question, index) => ({ question, index }))
        .filter(item => isHandwriting(item.question));

      if (handwritingItems.length && !window.ExamHandwriting?.uploadAndGrade) {
        alert('手寫判題模組尚未載入，請重新整理頁面後再試。');
        return;
      }

      const oldText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = handwritingItems.length ? 'Firebase Gemini 判題中…' : '計算成績中…';

      try {
        let mcqCorrect = 0;
        let mcqTotal = 0;

        questions.forEach((x,i) => {
          if (isManualStudy(x) || isHandwriting(x)) return;
          mcqTotal++;
          const picked=document.querySelector(`input[name=q${i}]:checked`);
          const labels=[...document.querySelectorAll(`[data-q="${i}"] .option`)];
          labels.forEach((l,j)=>{
            l.classList.remove('correct','wrong');
            if(j===x.a) l.classList.add('correct');
          });
          if(picked){
            const p=Number(picked.value);
            if(p===x.a) mcqCorrect++;
            else labels[p]?.classList.add('wrong');
          }
        });

        const handwritingResults = await Promise.all(handwritingItems.map(async ({question,index}) => {
          const key = handwritingKey(question,index,ctx);
          const status = quiz?.querySelector(`[data-q="${index}"] .handwriting-status`);
          const hasAnswer = !!window.ExamHandwriting?.getAnswer?.(key)?.dataUrl;

          if (!hasAnswer) {
            const missing = {
              status:'completed',
              verdict:'unanswered',
              recognizedAnswer:'',
              recognizedWork:'',
              feedback:'本題未作答。',
              confidence:1
            };
            if (status) status.textContent = '未作答，手寫題本題不計分。';
            renderHandwritingGrade(index, missing);
            return { index, result:missing };
          }

          if (status) status.textContent = 'Firebase Gemini 正在判讀這一題的手寫答案…';
          const gradingResult = await window.ExamHandwriting.uploadAndGrade({
            key,
            question,
            context:ctx
          });
          if (status) status.textContent = gradingResult?.verdict === 'correct'
            ? 'Firebase Gemini 判題完成：正確。'
            : gradingResult?.verdict === 'incorrect'
              ? 'Firebase Gemini 判題完成：需要修正。'
              : 'Firebase Gemini 判題完成：無法可靠判定。';
          renderHandwritingGrade(index, gradingResult);
          return { index, result:gradingResult };
        }));

        const handwritingCorrect = handwritingResults.filter(item => item.result?.verdict === 'correct').length;
        const handwritingTotal = handwritingItems.length;
        const correct = mcqCorrect + handwritingCorrect;
        const scoredTotal = mcqTotal + handwritingTotal;
        const manualTotal = questions.filter(isManualStudy).length;

        graded=true;
        const info=scoreInfo(correct,scoredTotal,ctx);
        const missed=scoredTotal-correct;

        result.innerHTML =
          `<div>${ctx.resultLabel || '本次結果'}</div>` +
          `<strong>${info.prominent}</strong>` +
          `<div>${info.detail}｜錯誤或未答 ${missed} 題</div>` +
          (handwritingTotal
            ? `<div class="tiny" style="margin-top:7px">選擇題 ${mcqCorrect}/${mcqTotal}｜手寫題 ${handwritingCorrect}/${handwritingTotal}（Firebase Gemini 判題）</div>`
            : '') +
          (manualTotal ? `<div class="tiny" style="margin-top:6px">另有紙筆練習 ${manualTotal} 題，不列入正答率。</div>` : '');

        result.style.display='block';
        document.dispatchEvent(new CustomEvent('exam:submitted', {
          detail:{
            ...ctx,
            correct,
            total:scoredTotal,
            mcqCorrect,
            mcqTotal,
            handwritingCorrect,
            handwritingTotal,
            handwritingResults: handwritingResults.map(({ index, result: grading }) => ({
              index,
              verdict: grading?.verdict || 'unclear',
              recognizedAnswer: grading?.recognizedAnswer || '',
              confidence: Number(grading?.confidence ?? 0)
            })),
            manualStudyTotal:manualTotal,
            score:info.score
          }
        }));
        result.scrollIntoView({behavior:'smooth',block:'center'});
      } catch (error) {
        console.error('[ExamRuntime] submission failed', error);
        alert(`交卷尚未完成：${error.message}`);
      } finally {
        submitButton.disabled = graded;
        submitButton.textContent = oldText;
      }
    };
  }

  if ($('#explainBtn')) {
    $('#explainBtn').onclick = function() {
      const els=[...document.querySelectorAll('.explain')];
      const show=!els.every(e=>e.classList.contains('show'));
      els.forEach(e=>e.classList.toggle('show',show));
      this.textContent=show?'隱藏詳解':'顯示詳解';
    };
  }

  if ($('#restartBtn')) {
    $('#restartBtn').onclick = function() {
      if(!confirm('確定重新作答？目前選擇會清除。'))return;
      window.ExamQuestionHistoryUI?.resetForRetry?.();
      graded=false;
      const submitButton = $('#submitBtn');
      if (submitButton) submitButton.disabled = false;
      document.dispatchEvent(new CustomEvent('exam:retry-started', {
        detail: window.examContextCurrent || {}
      }));
      window.ExamHandwriting?.reset?.();
      render();
      result.style.display='none';
      $('#explainBtn').textContent='顯示詳解';
      window.scrollTo({top:0,behavior:'smooth'});
    };
  }

  if ($('#backBtn')) {
    $('#backBtn').onclick = function() {
      const ctx=window.examContextCurrent || getContext(level);

      window.ExamHandwriting?.reset?.();
      examScreen.classList.add('hidden');
      result.style.display='none';
      document.querySelectorAll('.explain').forEach(e=>e.classList.remove('show'));
      $('#explainBtn').textContent='顯示詳解';

      if (typeof ctx.onBack === 'function') {
        $('#catalogShell')?.classList.remove('hidden');
        ctx.onBack();
      } else {
        startScreen.classList.remove('hidden');
      }

      window.scrollTo({top:0,behavior:'smooth'});
    };
  }

  injectStyles();
})();