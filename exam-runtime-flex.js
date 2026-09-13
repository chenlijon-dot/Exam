(() => {
  'use strict';

  window.examContexts = window.examContexts || {};
  window.examContextCurrent = null;

  const $ = (sel, root = document) => root.querySelector(sel);

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  function injectStyles() {
    if ($('#flexExamStyles')) return;
    const style = document.createElement('style');
    style.id = 'flexExamStyles';
    style.textContent = `
      .question-text{font-weight:750}
      .question-media{margin:12px 0 14px;border:1px solid #dbe3ef;background:#fff;border-radius:14px;padding:10px;overflow:auto;text-align:center}
      .question-media img{display:block;max-width:100%;height:auto;margin:auto;border-radius:8px}
      .passage-box{margin:0 0 16px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:14px;padding:14px 15px;font-weight:400;white-space:pre-wrap;line-height:1.8;color:#263244}
      .passage-label{font-size:.82rem;font-weight:800;color:#1d4ed8;margin-bottom:6px;letter-spacing:.02em}
      .past-source-note{margin:8px 0 0;color:#64748b;font-size:.86rem}
      @media(max-width:620px){.question-media{padding:7px}.passage-box{padding:12px}}
    `;
    document.head.appendChild(style);
  }

  function getContext(key = level) {
    const ctx = window.examContexts?.[key];
    if (ctx) return ctx;
    return {
      key,
      title:`科學方法模擬考｜${names[key] || key}`,
      subtitle:`${names[key] || ''}程度｜${banks[key]?.length || 0} 題選擇題`,
      subject:'science',
      subjectLabel:'國一自然',
      unit:'科學方法',
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
      const opts = x.o.map((v,j) => `<label class="option" data-opt="${j}"><input type="radio" name="q${i}" value="${j}">(${letters[j]}) ${escapeHtml(v)}</label>`).join('');
      return `<section class="card" data-q="${i}" data-question-number="${x.number || i+1}">${intro}<div class="qtitle"><span class="num">${x.number || i+1}</span><span class="question-text">${escapeHtml(x.q)}</span></div>${media}${opts}<div class="explain"><b>答案：${letters[x.a]}</b>　${escapeHtml(x.e || '')}</div></section>`;
    }).join('');
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

  window.grade = function() {
    const ctx = window.examContextCurrent || getContext(level);
    let correct=0, answered=0;
    graded=true;
    questions.forEach((x,i)=>{
      const card=document.querySelector(`[data-q="${i}"]`);
      const picked=document.querySelector(`input[name=q${i}]:checked`);
      card.querySelectorAll('.option').forEach(l=>l.classList.remove('correct','wrong'));
      card.querySelector(`[data-opt="${x.a}"]`)?.classList.add('correct');
      if(picked){
        answered++;
        if(Number(picked.value)===x.a) correct++;
        else card.querySelector(`[data-opt="${picked.value}"]`)?.classList.add('wrong');
      }
    });
    const info = scoreInfo(correct, questions.length, ctx);
    const unanswered = questions.length - answered;
    let msg;
    if (ctx.scoreMode === 'percent') {
      msg = info.score >= 90 ? '非常穩！' : info.score >= 70 ? '整體掌握不錯，回頭看錯題會更有效。' : info.score >= 60 ? '有抓到不少重點，建議把錯題重新看一輪。' : '先把錯題與題組文章重新讀過，再挑戰一次。';
    } else {
      msg = info.score>=90?'非常穩！':info.score>=70?'基礎不錯，再看一下錯題。':info.score>=60?'有抓到重點，錯題值得再複習。':'建議先看詳解，再重新挑戰一次。';
    }
    result.style.display='block';
    result.innerHTML=`<strong>${info.prominent}</strong><div>${escapeHtml(ctx.difficultyLabel || '')}｜${info.detail}${unanswered?`，未作答 ${unanswered} 題`:''}</div><div class="tiny" style="margin-top:6px">${msg}</div>`;
    result.dataset.score = String(info.score);
    result.scrollIntoView({behavior:'smooth',block:'center'});
  };

  window.toggleExplain = function() {
    const boxes=[...document.querySelectorAll('.explain')];
    const show=boxes.some(x=>!x.classList.contains('show'));
    boxes.forEach(x=>x.classList.toggle('show',show));
    $('#explainBtn').textContent=show?'隱藏詳解':'顯示詳解';
  };

  window.restart = function() {
    if(!confirm('確定要清除目前答案，重新作答嗎？')) return;
    graded=false;
    render();
    result.style.display='none';
    $('#explainBtn').textContent='顯示詳解';
    document.dispatchEvent(new CustomEvent('exam:started', { detail: window.examContextCurrent || getContext(level) }));
    window.scrollTo({top:0,behavior:'smooth'});
  };

  window.backToLevels = function() {
    const ctx = window.examContextCurrent;
    result.style.display='none';
    examScreen.classList.add('hidden');
    $('#pastSourceNote')?.remove();

    if (ctx && typeof ctx.onBack === 'function') {
      window.examContextCurrent = null;
      startScreen.classList.add('hidden');
      const catalog = $('#catalogShell');
      if (catalog) catalog.classList.remove('hidden');
      ctx.onBack();
      window.scrollTo({top:0,behavior:'smooth'});
      return;
    }

    window.examContextCurrent = null;
    $('#catalogShell')?.classList.add('hidden');
    startScreen.classList.remove('hidden');
    window.scrollTo({top:0,behavior:'smooth'});
  };

  function replaceButton(id, handler) {
    const old = document.getElementById(id);
    if (!old) return;
    const fresh = old.cloneNode(true);
    old.replaceWith(fresh);
    fresh.addEventListener('click', handler);
  }

  function guardUnsupportedAiAnalysis() {
    document.addEventListener('click', e => {
      if (e.target?.id !== 'gptWrongAnalysisBtn') return;
      let records = [];
      try { records = JSON.parse(localStorage.getItem('examRecords.v1') || '[]'); } catch {}
      const hasPastWrong = records.some(r => r.analysisEligible === false && Array.isArray(r.wrongAnswers) && r.wrongAnswers.length);
      if (!hasPastWrong) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      alert('目前錯題中包含歷屆考題；歷屆題尚未建立專屬 curriculum，因此暫不送入科學方法的 AI 診斷。');
    }, true);
  }

  function init() {
    injectStyles();
    guardUnsupportedAiAnalysis();
    replaceButton('submitBtn', () => window.grade());
    replaceButton('explainBtn', () => window.toggleExplain());
    replaceButton('restartBtn', () => window.restart());
    replaceButton('backBtn', () => window.backToLevels());
  }

  init();
})();
