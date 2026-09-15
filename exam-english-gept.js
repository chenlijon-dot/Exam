(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const content = () => $('#catalogContent');

  const GEPT_ELEMENTARY_ROUNDS = [
    { key: '01', title: '第一回', pages: 'p.1–9', ready: true, total: 35, path: 'chapter-bank/english/gept/elementary/reading/round-01.json' },
    { key: '02', title: '第二回', pages: 'p.11–18', ready: true, total: 26, partial: true, note: '缺 Q7–15', path: 'chapter-bank/english/gept/elementary/reading/round-02.json' },
    { key: '03', title: '第三回', pages: 'p.19–26', ready: false, total: 35 },
    { key: '04', title: '第四回', pages: 'p.27–34', ready: false, total: 35 },
    { key: '05', title: '第五回', pages: 'p.35–42', ready: false, total: 35 },
    { key: '06', title: '第六回', pages: 'p.43–51', ready: false, total: 35 }
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
    if (desc) desc.textContent = '國中階段先以全民英檢初級為主；目前已整理閱讀能力測驗第一回至第六回。';
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
      <p class="catalog-sub">國中階段先建置初級。目前已整理閱讀能力測驗第一回至第六回，後續再逐步擴充其他能力面向。</p>
      <div class="catalog-grid">
        <button class="catalog-card chapter-card" id="geptElementaryBtn">
          <span class="top"><span class="icon">🌱</span><strong>初級</strong><span class="catalog-badge reference">6 回資料已收錄</span></span>
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
      <p class="catalog-sub">目前先建立閱讀能力的知識庫試題入口；六回原始模擬考與 canonical 教材知識庫均已整理。</p>
      <div class="catalog-grid">
        <button class="catalog-card chapter-card" id="geptElementaryKnowledgeBtn">
          <span class="top"><span class="icon">📚</span><strong>知識庫試題</strong><span class="catalog-badge reference">第一回～第六回</span></span>
          <span class="desc">依全民英檢初級閱讀教材知識庫建立線上測驗。</span>
        </button>
      </div>`);

    $('#backGeptLandingBtn')?.addEventListener('click', renderGeptLanding);
    $('#geptElementaryKnowledgeBtn')?.addEventListener('click', renderElementaryRounds);
  }

  function roundCard(round) {
    let badge = '<span class="catalog-badge reference">資料已收錄</span>';
    let desc = `閱讀能力測驗｜35 題｜原書 ${round.pages}｜線上考題待建`;

    if (round.ready && round.partial) {
      badge = `<span class="catalog-badge reference">${round.total} 題已上線</span>`;
      desc = `閱讀能力測驗｜目前 ${round.total} 題｜原書 ${round.pages}｜含逐題詳解與題組共用文章｜${round.note}`;
    } else if (round.ready) {
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
      <p class="catalog-sub">第一回完整 35 題已上線；第二回先依目前已取得資料上線 26 題，原書 p.12 的 Q7–15 尚缺，不臆造題目。其餘回次待逐回建置。</p>
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
      const questions = Array.isArray(data.questions) ? data.questions : [];
      if (!questions.length) throw new Error('題庫內容為空');
      if (typeof banks === 'undefined' || typeof window.startExam !== 'function') throw new Error('題庫引擎尚未就緒');

      const exam = data.exam || {};
      const key = exam.difficulty || exam.key || `english-gept-elementary-reading-round-${round.key}`;
      banks[key] = questions;
      window.examContexts = window.examContexts || {};
      window.examContexts[key] = {
        ...exam,
        key,
        difficulty: key,
        examType: exam.examType || 'gept-elementary-reading',
        preserveOptionOrder: true,
        backLabel: '返回初級六回選單',
        onBack: renderElementaryRounds
      };

      window.startExam(key);
    } catch (error) {
      alert(`${round.title}載入失敗：${error.message}`);
      button.disabled = false;
      button.innerHTML = oldHtml;
    }
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

    const observer = new MutationObserver(enhanceGeptLandingIfNeeded);
    observer.observe(root, { childList: true, subtree: true });
    enhanceGeptLandingIfNeeded();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
