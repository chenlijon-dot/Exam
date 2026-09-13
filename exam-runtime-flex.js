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
      .katex-display{overflow-x:auto;overflow-y:hidden;padding:2px 0}
      .passage-box{margin:0 0 16px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:14px;padding:14px 15px;font-weight:400;white-space:pre-wrap;line-height:1.8;color:#263244}
      .passage-label{font-size:.82rem;font-weight:800;color:#1d4ed8;margin-bottom:6px;letter-spacing:.02em}
      .past-source-note{margin:8px 0 0;color:#64748b;font-size:.86rem}
      @media(max-width:620px){.question-media{padding:7px}.passage-box{padding:12px}.katex{font-size:1.02em}}
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

  window.startExam = function(selected) {
    if (!banks[selected]) return;
    level = selected;
    questions = banks[level];
    graded = false;
    const ctx = getContext(selected);
    window.examContextCurrent = ctx;

    startScreen.classList.add('hidden');
    examScreen.classList.remove('hidden');
    $('#catalogShell')?.classList.add('hidden');

    $('#examTitle').textContent = ctx.title || names[level] || '線上測驗';
    $('#examSub').textContent = ctx.subtitle || `${questions.length} 題選擇題`;
    const status = $('#examScreen .status');
    if (status) {
      status.innerHTML = `<span class="pill" id="progress">已作答 0 / ${questions.length}</span>` +
        (ctx.scoreMode === 'percent'
          ? `<span class="pill">共 ${questions.length} 題</span><span class="pill">以正答率顯示</span>`
          : `<span class="pill">每題 ${ctx.pointsPerQuestion ?? 5} 分</span><span class="pill">滿分 ${(ctx.pointsPerQuestion ?? 5) * questions.length} 分</span>`);
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
      const intro = x.intro ? `<div class="passage-box">${x.introLabel ? `<div class="passage-label">${escapeHtml(x.introLabel)}</div>` : ''}${escapeHtml(x.intro)}</div>` : '';
      const media = x.image ? `<div class="question-media"><img src="${escapeHtml(x.image)}" alt="${escapeHtml(x.imageAlt || `第${i+1}題附圖`)}" loading="lazy"></div>` : '';
      const optionMedia = x.optionImage ? `<div class="question-media option-media"><img src="${escapeHtml(x.optionImage)}" alt="${escapeHtml(x.optionImageAlt || `第${i+1}題選項圖`)}" loading="lazy"></div>` : '';
      const opts = x.o.map((v,j) => `<label class="option" data-opt="${j}"><input type="radio" name="q${i}" value="${j}">(${letters[j]}) ${escapeHtml(v)}</label>`).join('');
      return `<section class="card" data-q="${i}" data-question-number="${x.number || i+1}">${intro}<div class="qtitle"><span class="num">${x.number || i+1}</span><span class="question-text">${escapeHtml(x.q)}</span></div>${media}${optionMedia}${opts}<div class="explain"><b>答案：${letters[x.a]}</b>　${escapeHtml(x.e || '')}</div></section>`;
    }).join('');
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
    let n=0;
    questions.forEach((_,i)=>{if(document.querySelector(`input[name=q${i}]:checked`))n++;});
    const el = $('#progress');
    if (el) el.textContent=`已作答 ${n} / ${questions.length}`;
  };

  const originalSubmit = $('#submitBtn')?.onclick;
  if ($('#submitBtn')) {
    $('#submitBtn').onclick = function() {
      let correct=0;
      questions.forEach((x,i)=>{
        const picked=document.querySelector(`input[name=q${i}]:checked`);
        const labels=[...document.querySelectorAll(`[data-q="${i}"] .option`)];
        labels.forEach((l,j)=>{l.classList.remove('correct','wrong');if(j===x.a)l.classList.add('correct')});
        if(picked){const p=Number(picked.value);if(p===x.a)correct++;else labels[p]?.classList.add('wrong')}
      });
      graded=true;
      const ctx = window.examContextCurrent || getContext(level);
      const info=scoreInfo(correct,questions.length,ctx);
      const missed=questions.length-correct;
      result.innerHTML=`<div>${ctx.resultLabel || '本次結果'}</div><strong>${info.prominent}</strong><div>${info.detail}｜錯誤或未答 ${missed} 題</div>`;
      result.style.display='block';
      document.dispatchEvent(new CustomEvent('exam:submitted', {detail:{...ctx,correct,total:questions.length,score:info.score}}));
      result.scrollIntoView({behavior:'smooth',block:'center'});
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
      graded=false;
      render();
      result.style.display='none';
      $('#explainBtn').textContent='顯示詳解';
      window.scrollTo({top:0,behavior:'smooth'});
    };
  }

  if ($('#backBtn')) {
    $('#backBtn').onclick = function() {
      const ctx=window.examContextCurrent || getContext(level);
      if (typeof ctx.onBack === 'function') return ctx.onBack();
      examScreen.classList.add('hidden');
      startScreen.classList.remove('hidden');
      result.style.display='none';
      document.querySelectorAll('.explain').forEach(e=>e.classList.remove('show'));
      $('#explainBtn').textContent='顯示詳解';
      window.scrollTo({top:0,behavior:'smooth'});
    };
  }

  injectStyles();
})();
