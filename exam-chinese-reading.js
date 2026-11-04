(() => {
  'use strict';

  // Chinese reading comprehension: one passage = one independent question group.
  // Source questions are not answer-verified; keep selections in page memory only.
  const DATA_URL = 'chapter-bank/chinese/reading-comprehension/passages-001-003.json';
  const state = { passages: [], index: 0, choices: new Map(), articleScroll: new Map(), questionScroll: new Map(), returnToChinese: null };
  const $ = (q,root=document) => root.querySelector(q);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const key = id => 'passage-' + id;

  function ensureStyle() {
    if ($('#chineseReadingTrainingStyle')) return;
    const style = document.createElement('style');
    style.id = 'chineseReadingTrainingStyle';
    style.textContent = `
      .crt-shell{display:flex;flex-direction:column;gap:10px}
      .crt-topbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
      .crt-switch{display:flex;align-items:center;gap:10px;justify-content:space-between;flex-wrap:wrap}
      .crt-switch select{font:inherit;padding:8px 12px;border:1px solid #bac8d9;border-radius:9px;background:#fff;max-width:100%}
      .crt-switch button,.crt-actions button{font:inherit;border:1px solid #c4cedc;border-radius:10px;background:#fff;padding:8px 14px;cursor:pointer;color:#172554}
      .crt-switch button:disabled{opacity:.4;cursor:not-allowed}
      .crt-panel{border:1px solid #dce4ee;border-radius:15px;background:#fff;overflow:hidden}
      .crt-panel-header{background:#eef4ff;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;font-weight:750}
      .crt-article{height:clamp(190px,35vh,380px);overflow-y:auto;overscroll-behavior:contain;padding:16px 22px;font-size:1.09rem;line-height:2;white-space:pre-wrap;overflow-wrap:anywhere}
      .crt-questions{height:clamp(280px,43vh,530px);overflow-y:auto;overscroll-behavior:contain;padding:6px 16px 15px}
      .crt-question{padding:14px 2px 18px;border-bottom:1px solid #e3e8f0}
      .crt-question:last-child{border-bottom:0}
      .crt-question legend{font-weight:700;padding:0 0 10px;line-height:1.7}
      .crt-question fieldset{border:0;padding:0;margin:0}
      .crt-choice{display:flex;align-items:flex-start;gap:10px;cursor:pointer;padding:9px 12px;margin:6px 0;border:1px solid #e0e6ef;border-radius:10px}
      .crt-choice:has(input:checked){background:#eff6ff;border-color:#2563eb}
      .crt-choice input{margin-top:6px;accent-color:#1d4ed8;flex-shrink:0}
      .crt-muted{color:#64748b;font-size:.91rem}
      .crt-notice{background:#fff8e7;color:#6a4d1b;border:1px solid #f2dfb9;border-radius:10px;padding:10px 13px;font-size:.88rem}
      .crt-actions{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}
      @media(max-width:600px){
        .crt-article{height:34vh;min-height:175px;padding:12px 14px;font-size:1rem}
        .crt-questions{height:43vh;min-height:265px;padding:4px 10px 12px}
        .crt-switch{gap:6px}
        .crt-switch select{flex:1;min-width:110px}
      }`;
    document.head.appendChild(style);
  }
  function current() { return state.passages[state.index]; }
  function countAnswered(p) {
    const answers = state.choices.get(key(p.id)) || {};
    return p.questions.filter(q => Number.isInteger(answers[q.questionId])).length;
  }
  function rememberScroll() {
    const p = current();
    if (!p) return;
    state.articleScroll.set(key(p.id), $('#crtArticle')?.scrollTop || 0);
    state.questionScroll.set(key(p.id), $('#crtQuestions')?.scrollTop || 0);
  }
  function render() {
    const p = current(), target = $('#catalogContent');
    if (!p || !target) return;
    const answers = state.choices.get(key(p.id)) || {};
    document.title = '第' + p.id + '篇 ' + p.title + '｜國語文閱讀測驗訓練';
    const header = $('#catalogHeaderTitle');
    if (header) header.textContent = '國文科｜國語文閱讀測驗訓練';
    const sub = $('#catalogHeaderSub');
    if (sub) sub.textContent = '閱讀文章在上方，測驗題目在下方';
    target.innerHTML = `
      <div class="crt-shell">
        <div class="crt-topbar">
          <button class="catalog-back" id="crtBack">← 返回國文</button>
          <span class="crt-muted">國文　›　閱讀測驗訓練　›　第 ${p.id} 篇</span>
        </div>
        <div class="crt-switch">
          <button id="crtPrev" ${state.index===0?'disabled':''}>← 上一篇</button>
          <label>文章 <select id="crtSelect" aria-label="選擇文章">
          ${state.passages.map((x,i)=>`<option value="${i}" ${i===state.index?'selected':''}>第 ${x.id} 篇｜${esc(x.title)}</option>`).join('')}
          </select></label>
          <button id="crtNext" ${state.index>=state.passages.length-1?'disabled':''}>下一篇 →</button>
        </div>
        <section class="crt-panel">
          <div class="crt-panel-header"><span>📖 閱讀文章｜第 ${p.id} 篇〈${esc(p.title)}〉</span><span class="crt-muted">${esc(p.author||'作者未註明')}｜上方可獨立捲動</span></div>
          <div id="crtArticle" class="crt-article" tabindex="0" aria-label="閱讀文章">${esc(p.passage)}</div>
        </section>
        <section class="crt-panel">
          <div class="crt-panel-header"><span>✏️ 閱讀測驗｜${p.questions.length} 題</span><span id="crtProgress">已選 ${countAnswered(p)} / ${p.questions.length} 題</span></div>
          <div id="crtQuestions" class="crt-questions" tabindex="0" aria-label="閱讀測驗題目">
            ${p.questions.map((q,i)=>`<div class="crt-question"><fieldset>
              <legend>第 ${i+1} 題　${esc(q.q)}</legend>
              ${q.o.map((option,j)=>`<label class="crt-choice">
                <input type="radio" name="crt-${esc(q.questionId)}" data-qid="${esc(q.questionId)}" value="${j}" ${answers[q.questionId]===j?'checked':''}/>
                <span>（${'ABCD'[j]}）${esc(option)}</span>
              </label>`).join('')}
            </fieldset></div>`).join('')}
          </div>
        </section>
        <div class="crt-notice">試用版：原書答案尚未核對，本階段可選答及切換篇章，但不判分；原圖手寫答案不作為標準答案。離開或重新整理頁面後，選答不會寫入 Firebase。</div>
        <div class="crt-actions">
          <span class="crt-muted">目前收錄前 ${state.passages.length} 篇；題庫架構可持續擴充至第 300 篇。</span>
          <button id="crtClear">清除本篇選答</button>
        </div>
      </div>`;
    $('#crtArticle').scrollTop = state.articleScroll.get(key(p.id)) || 0;
    $('#crtQuestions').scrollTop = state.questionScroll.get(key(p.id)) || 0;
    $('#crtBack')?.addEventListener('click', () => state.returnToChinese?.());
    $('#crtPrev')?.addEventListener('click', () => switchTo(state.index-1));
    $('#crtNext')?.addEventListener('click', () => switchTo(state.index+1));
    $('#crtSelect')?.addEventListener('change', e => switchTo(Number(e.target.value)));
    $('#crtClear')?.addEventListener('click', () => {
      if (!confirm('確定清除這一篇的所有選答嗎？')) return;
      rememberScroll();
      state.choices.delete(key(p.id));
      render();
    });
    $('#crtQuestions')?.addEventListener('change', e => {
      const input = e.target.closest('input[data-qid]');
      if (!input) return;
      const currentAnswers = state.choices.get(key(p.id)) || {};
      currentAnswers[input.dataset.qid] = Number(input.value);
      state.choices.set(key(p.id), currentAnswers);
      $('#crtProgress').textContent = `已選 ${countAnswered(p)} / ${p.questions.length} 題`;
    });
  }
  function switchTo(index) {
    if (!Number.isInteger(index) || index<0 || index>=state.passages.length || index===state.index) return;
    rememberScroll();
    state.index=index;
    render();
  }
  async function open(returnToChinese) {
    ensureStyle();
    state.returnToChinese=returnToChinese;
    const target = $('#catalogContent');
    if (!target) return;
    target.innerHTML='<p class="crt-muted">正在載入閱讀測驗文章……</p>';
    try {
      const res=await fetch(DATA_URL,{cache:'no-store'});
      if(!res.ok)throw new Error('HTTP '+res.status);
      const data=await res.json();
      if(!Array.isArray(data.passages)||!data.passages.length)throw new Error('尚無閱讀題組');
      state.passages=data.passages;
      state.index=0;
      render();
    } catch(err) {
      console.error('[exam-chinese-reading][open]',err);
      target.innerHTML='<button class="catalog-back" id="crtBackError">← 返回國文</button><p>閱讀題庫載入失敗，請確認資料與部署版本後重試。</p>';
      $('#crtBackError')?.addEventListener('click',()=>state.returnToChinese?.());
    }
  }
  window.ChineseReadingTraining={open};
})();
