(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const content = () => $('#catalogContent');

  const GEPT_ELEMENTARY_ROUNDS = [
    { key: '01', title: '第一回', pages: 'p.1–9', ready: true, total: 35, path: 'chapter-bank/english/gept/elementary/reading/round-01.json' },
    { key: '02', title: '第二回', pages: 'p.11–18', ready: true, total: 35, path: 'chapter-bank/english/gept/elementary/reading/round-02.json', supplementPath: 'chapter-bank/english/gept/elementary/reading/round-02-q07-15.json' },
    { key: '03', title: '第三回', pages: 'p.19–26', ready: true, total: 35, path: 'chapter-bank/english/gept/elementary/reading/round-03.json' },
    { key: '04', title: '第四回', pages: 'p.27–34', ready: true, total: 35, path: 'chapter-bank/english/gept/elementary/reading/round-04.json' },
    { key: '05', title: '第五回', pages: 'p.35–42', ready: true, total: 35, path: 'chapter-bank/english/gept/elementary/reading/round-05.json' },
    { key: '06', title: '第六回', pages: 'p.43–51', ready: true, total: 35, path: 'chapter-bank/english/gept/elementary/reading/round-06.json' },
    { key: '07', title: '第七回', pages: 'p.53–60', ready: true, total: 35, path: 'chapter-bank/english/gept/elementary/reading/round-07.json' },
    { key: '08', title: '第八回', pages: 'p.61–68', ready: true, total: 35, path: 'chapter-bank/english/gept/elementary/reading/round-08.json' },
    { key: '09', title: '第九回', pages: 'p.69–76', ready: true, total: 35, path: 'chapter-bank/english/gept/elementary/reading/round-09.json' },
    { key: '10', title: '第十回', pages: 'p.77–84', ready: true, total: 35, path: 'chapter-bank/english/gept/elementary/reading/round-10.json' },
    { key: '11', title: '第十一回', pages: 'p.85–92', ready: true, total: 35, path: 'chapter-bank/english/gept/elementary/reading/round-11.json' }
  ];

  function setHeader(title, sub) {
    if ($('#catalogHeaderTitle')) $('#catalogHeaderTitle').textContent = title;
    if ($('#catalogHeaderSub')) $('#catalogHeaderSub').textContent = sub;
  }

  function resetToEnglishBackButton() {
    const root = content();
    if (!root) return null;
    const back = $('#backEnglishSemestersBtn', root);
    if (!back) return null;

    [...root.children].forEach(node => {
      if (node !== back) node.remove();
    });
    return back;
  }

  function enhanceEnglishEntry() {
    const button = $('#englishGeptBtn');
    if (!button || button.dataset.geptEnhanced === '1') return;

    button.dataset.geptEnhanced = '1';
    const badge = $('.catalog-badge', button);
    const desc = $('.desc', button);
    if (badge) {
      badge.textContent = '初級已收錄';
      badge.classList.add('reference');
    }
    if (desc) desc.textContent = '國中階段先以全民英檢初級為主；目前已整理閱讀能力測驗第一回至第十一回。';
  }

  function renderGeptLanding() {
    const root = content();
    const back = resetToEnglishBackButton();
    if (!root || !back) return;

    root.dataset.geptView = 'landing';
    setHeader('英文科｜全民英檢', '國中階段以初級為主');
    document.title = '全民英檢 GEPT｜英文題庫';

    root.insertAdjacentHTML('beforeend', `
      <div class="catalog-path">英文　›　全民英檢（GEPT）</div>
      <h2 class="catalog-title">全民英檢（GEPT）</h2>
      <p class="catalog-sub">國中階段先建置初級。目前已整理閱讀能力測驗第一回至第十一回，後續再逐步擴充其他能力面向。</p>
      <div class="catalog-grid">
        <button class="catalog-card chapter-card" id="geptElementaryBtn">
          <span class="top"><span class="icon">🌱</span><strong>初級</strong><span class="catalog-badge reference">11 回資料已收錄</span></span>
          <span class="desc">進入全民英檢初級題庫架構。</span>
        </button>
      </div>`);

    $('#geptElementaryBtn')?.addEventListener('click', renderElementaryBanks);
  }

  function renderElementaryBanks() {
    const root = content();
    const back = resetToEnglishBackButton();
    if (!root || !back) return;

    root.dataset.geptView = 'elementary';
    setHeader('英文科｜全民英檢初級', '選擇題庫');
    document.title = '全民英檢初級｜英文題庫';

    root.insertAdjacentHTML('beforeend', `
      <button class="catalog-back" id="backGeptLandingBtn">← 返回全民英檢</button>
      <div class="catalog-path">英文　›　全民英檢（GEPT）　›　初級</div>
      <h2 class="catalog-title">全民英檢初級</h2>
      <p class="catalog-sub">目前先建立閱讀能力的知識庫試題入口；十一回原始模擬考與 canonical 教材知識庫均已整理。</p>
      <div class="catalog-grid">
        <button class="catalog-card chapter-card" id="geptElementaryKnowledgeBtn">
          <span class="top"><span class="icon">📚</span><strong>知識庫試題</strong><span class="catalog-badge reference">第一回～第十一回</span></span>
          <span class="desc">依全民英檢初級閱讀教材知識庫建立線上測驗。</span>
        </button>
      </div>`);

    $('#backGeptLandingBtn')?.addEventListener('click', renderGeptLanding);
    $('#geptElementaryKnowledgeBtn')?.addEventListener('click', renderElementaryRounds);
  }

  function roundCard(round) {
    let badge = '<span class="catalog-badge reference">資料已收錄</span>';
    let desc = `閱讀能力測驗｜35 題｜原書 ${round.pages}｜線上考題待建`;

    if (round.ready) {
      badge = `<span class="catalog-badge reference">${round.total || 35} 題已上線</span>`;
      desc = `閱讀能力測驗｜${round.total || 35} 題｜原書 ${round.pages}｜含逐題詳解與題組共用文章`;
    }

    const disabled = round.ready ? '' : 'disabled';
    return `
      <button class="catalog-card chapter-card" ${disabled} data-gept-round="${round.key}">
        <span class="top"><span class="icon">📝</span><strong>${round.title}</strong>${badge}</span>
        <span class="desc">${desc}</span>
      </button>`;
  }

  function renderElementaryRounds() {
    const root = content();
    const back = resetToEnglishBackButton();
    if (!root || !back) return;

    root.dataset.geptView = 'rounds';
    setHeader('全民英檢初級｜知識庫試題', '選擇回次');
    document.title = '全民英檢初級｜知識庫試題';

    root.insertAdjacentHTML('beforeend', `
      <button class="catalog-back" id="backGeptElementaryBtn">← 返回初級</button>
      <div class="catalog-path">英文　›　全民英檢（GEPT）　›　初級　›　知識庫試題</div>
      <h2 class="catalog-title">請選擇回次</h2>
      <p class="catalog-sub">第一回至第十一回完整 35 題均已上線。</p>
      <div class="catalog-grid">
        ${GEPT_ELEMENTARY_ROUNDS.map(roundCard).join('')}
      </div>`);

    $('#backGeptElementaryBtn')?.addEventListener('click', renderElementaryBanks);
    GEPT_ELEMENTARY_ROUNDS.filter(round => round.ready).forEach(round => {
      $(`[data-gept-round="${round.key}"]`)?.addEventListener('click', event => openRound(round, event.currentTarget));
    });
  }

  async function openRound(round, button) {
    if (!round?.ready || !round.path || !button) return;

    const oldHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="top"><span class="icon">⏳</span><strong>載入${round.title}…</strong></span><span class="desc">正在準備題目與詳解</span>`;

    try {
      const response = await fetch(round.path, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      let questions = Array.isArray(data.questions) ? [...data.questions] : [];

      if (round.supplementPath) {
        const supplementResponse = await fetch(round.supplementPath, { cache: 'no-store' });
        if (!supplementResponse.ok) throw new Error(`補充題目載入失敗 HTTP ${supplementResponse.status}`);
        const supplement = await supplementResponse.json();
        const extraQuestions = Array.isArray(supplement.questions) ? supplement.questions : [];
        questions = questions.concat(extraQuestions).sort((a, b) => Number(a.number) - Number(b.number));
      }

      if (!questions.length) throw new Error('題庫內容為空');
      if (typeof banks === 'undefined' || typeof window.startExam !== 'function') throw new Error('題庫引擎尚未就緒');

      const exam = data.exam || {};
      const key = exam.difficulty || exam.key || `english-gept-elementary-reading-round-${round.key}`;
      banks[key] = questions;
      window.examContexts = window.examContexts || {};
      window.examContexts[key] = {
        ...exam,
        subtitle: `${questions.length} 題｜含逐題詳解`,
        sourceNote: round.supplementPath
          ? '第二回 Q1–35 均已依原書照片建立；Q7–15 由補上的 p.12 原始頁面補齊。題組文章只在題組第一題顯示一次。'
          : exam.sourceNote,
        key,
        difficulty: key,
        examType: exam.examType || 'gept-elementary-reading',
        preserveOptionOrder: true,
        backLabel: '返回初級十一回選單',
        onBack: renderElementaryRounds
      };

      window.startExam(key);
    } catch (error) {
      alert(`${round.title}載入失敗：${error.message}`);
      button.disabled = false;
      button.innerHTML = oldHtml;
    }
  }

  function injectPassagePopupStyles() {
    if ($('#geptPassagePopupStyles')) return;
    const style = document.createElement('style');
    style.id = 'geptPassagePopupStyles';
    style.textContent = `
      .gept-passage-btn{flex:0 0 auto;margin-left:auto;border:1px solid #93c5fd;background:#eff6ff;color:#1d4ed8;border-radius:999px;padding:5px 10px;font-size:.78rem;font-weight:800;line-height:1.2;cursor:pointer;white-space:nowrap}
      .gept-passage-btn:hover{background:#dbeafe}
      .gept-passage-btn:active{transform:translateY(1px)}
      #geptPassageModal{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;padding:18px}
      #geptPassageModal.hidden{display:none}
      .gept-passage-dialog{width:min(760px,100%);max-height:min(78vh,780px);background:#fff;border-radius:18px;box-shadow:0 24px 70px rgba(15,23,42,.32);display:flex;flex-direction:column;overflow:hidden;will-change:transform}
      .gept-passage-head{display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #e2e8f0;background:#f8fafc;cursor:grab;user-select:none;touch-action:none}
      .gept-passage-head.dragging{cursor:grabbing}
      .gept-passage-title{font-weight:850;color:#1e3a8a;flex:1;pointer-events:none}
      .gept-passage-close{border:0;background:#e2e8f0;color:#334155;border-radius:999px;width:34px;height:34px;font-size:20px;cursor:pointer;touch-action:manipulation}
      .gept-passage-body{padding:18px 20px;overflow:auto;white-space:pre-wrap;line-height:1.9;color:#1f2937;font-size:1rem}
      @media(max-width:620px){.gept-passage-btn{padding:4px 8px;font-size:.72rem}.gept-passage-dialog{max-height:84vh}.gept-passage-body{padding:15px 16px;font-size:.96rem}}
    `;
    document.head.appendChild(style);
  }

  function makePassageDialogDraggable(modal) {
    const dialog = $('.gept-passage-dialog', modal);
    const head = $('.gept-passage-head', modal);
    if (!dialog || !head || head.dataset.dragReady === '1') return;
    head.dataset.dragReady = '1';

    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let baseX = 0;
    let baseY = 0;
    let x = 0;
    let y = 0;

    const apply = () => {
      dialog.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
    };

    const clampPosition = (nextX, nextY) => {
      const rect = dialog.getBoundingClientRect();
      const dx = nextX - x;
      const dy = nextY - y;
      const margin = 8;
      let adjustedX = nextX;
      let adjustedY = nextY;

      if (rect.left + dx < margin) adjustedX += margin - (rect.left + dx);
      if (rect.right + dx > window.innerWidth - margin) adjustedX -= (rect.right + dx) - (window.innerWidth - margin);
      if (rect.top + dy < margin) adjustedY += margin - (rect.top + dy);
      if (rect.bottom + dy > window.innerHeight - margin) adjustedY -= (rect.bottom + dy) - (window.innerHeight - margin);

      return { x: adjustedX, y: adjustedY };
    };

    head.addEventListener('pointerdown', event => {
      if (event.button !== undefined && event.button !== 0) return;
      if (event.target.closest('.gept-passage-close')) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      baseX = x;
      baseY = y;
      head.classList.add('dragging');
      head.setPointerCapture?.(pointerId);
      event.preventDefault();
    });

    head.addEventListener('pointermove', event => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      const proposed = clampPosition(
        baseX + (event.clientX - startX),
        baseY + (event.clientY - startY)
      );
      x = proposed.x;
      y = proposed.y;
      apply();
      event.preventDefault();
    });

    const finishDrag = event => {
      if (pointerId === null || (event?.pointerId !== undefined && event.pointerId !== pointerId)) return;
      try { head.releasePointerCapture?.(pointerId); } catch (_) {}
      pointerId = null;
      head.classList.remove('dragging');
    };

    head.addEventListener('pointerup', finishDrag);
    head.addEventListener('pointercancel', finishDrag);
    head.addEventListener('lostpointercapture', finishDrag);

    modal.resetPassageDialogPosition = () => {
      pointerId = null;
      x = 0;
      y = 0;
      head.classList.remove('dragging');
      apply();
    };
  }

  function ensurePassageModal() {
    let modal = $('#geptPassageModal');
    if (modal) {
      makePassageDialogDraggable(modal);
      return modal;
    }

    modal = document.createElement('div');
    modal.id = 'geptPassageModal';
    modal.className = 'hidden';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="gept-passage-dialog" role="dialog" aria-modal="true" aria-labelledby="geptPassageTitle">
        <div class="gept-passage-head" title="可用滑鼠或觸控拖曳移動">
          <div class="gept-passage-title" id="geptPassageTitle">題組內容</div>
          <button type="button" class="gept-passage-close" aria-label="關閉題組內容">×</button>
        </div>
        <div class="gept-passage-body" id="geptPassageBody"></div>
      </div>`;
    document.body.appendChild(modal);
    makePassageDialogDraggable(modal);

    const close = () => {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      modal.resetPassageDialogPosition?.();
    };
    $('.gept-passage-close', modal)?.addEventListener('click', close);
    modal.addEventListener('click', event => {
      if (event.target === modal) close();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !modal.classList.contains('hidden')) close();
    });
    return modal;
  }

  function showPassagePopup(title, passage) {
    const modal = ensurePassageModal();
    modal.resetPassageDialogPosition?.();
    $('#geptPassageTitle', modal).textContent = title || '題組內容';
    $('#geptPassageBody', modal).textContent = passage || '';
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function decorateGroupedQuestions(key) {
    if (typeof banks === 'undefined') return;
    const bank = banks[key];
    if (!Array.isArray(bank) || !bank.length) return;

    const groups = new Map();
    bank.forEach(question => {
      if (!question?.groupId) return;
      const current = groups.get(question.groupId) || { title: '', passage: '' };
      if (question.introLabel) current.title = question.introLabel;
      if (question.intro) current.passage = question.intro;
      groups.set(question.groupId, current);
    });

    bank.forEach((question, index) => {
      if (!question?.groupId) return;
      const shared = groups.get(question.groupId);
      if (!shared?.passage) return;

      const number = question.number || index + 1;
      const card = document.querySelector(`#quiz .card[data-question-number="${number}"]`);
      const qtitle = card?.querySelector('.qtitle');
      if (!qtitle || qtitle.querySelector('.gept-passage-btn')) return;

      qtitle.style.display = 'flex';
      qtitle.style.alignItems = 'flex-start';
      qtitle.style.gap = '8px';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'gept-passage-btn';
      button.textContent = '📖 題組內容';
      button.title = '顯示本題共用的題組文章';
      button.addEventListener('click', () => showPassagePopup(shared.title || '題組內容', shared.passage));
      qtitle.appendChild(button);
    });
  }

  function enhanceGeptLandingIfNeeded() {
    const root = content();
    if (!root) return;

    enhanceEnglishEntry();

    const title = $('.catalog-title', root)?.textContent?.trim();
    const path = $('.catalog-path', root)?.textContent?.replace(/\s+/g, ' ').trim();
    const hasOriginalBack = !!$('#backEnglishSemestersBtn', root);

    if (
      hasOriginalBack &&
      title === '全民英檢（GEPT）' &&
      path?.includes('全民英檢（GEPT）') &&
      root.dataset.geptView !== 'landing'
    ) {
      renderGeptLanding();
    }
  }

  function init() {
    const root = content();
    if (!root) return;

    injectPassagePopupStyles();
    ensurePassageModal();

    const observer = new MutationObserver(enhanceGeptLandingIfNeeded);
    observer.observe(root, { childList: true, subtree: true });
    enhanceGeptLandingIfNeeded();

    document.addEventListener('exam:started', event => {
      const ctx = event.detail || {};
      if (ctx.examType !== 'gept-elementary-reading') return;
      requestAnimationFrame(() => decorateGroupedQuestions(ctx.key || ctx.difficulty));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();