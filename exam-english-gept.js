(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const content = () => $('#catalogContent');

  const GEPT_ELEMENTARY_ROUNDS = [
    { key: '01', title: '第一回', pages: 'p.1–9' },
    { key: '02', title: '第二回', pages: 'p.11–18' },
    { key: '03', title: '第三回', pages: 'p.19–26' },
    { key: '04', title: '第四回', pages: 'p.27–34' },
    { key: '05', title: '第五回', pages: 'p.35–42' },
    { key: '06', title: '第六回', pages: 'p.43–51' }
  ];

  function setHeader(title, sub) {
    if ($('#catalogHeaderTitle')) $('#catalogHeaderTitle').textContent = title;
    if ($('#catalogHeaderSub')) $('#catalogHeaderSub').textContent = sub;
  }

  function keepEnglishBackButton() {
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
    if (badge) badge.textContent = '初級已收錄';
    if (desc) desc.textContent = '國中階段先以全民英檢初級為主；目前已整理閱讀能力測驗第一回至第六回。';
  }

  function renderGeptLanding() {
    const root = content();
    const back = keepEnglishBackButton();
    if (!root || !back) return;

    root.dataset.geptView = 'landing';
    setHeader('英文科｜全民英檢', '國中階段以初級為主');
    document.title = '全民英檢初級｜英文題庫';

    root.insertAdjacentHTML('beforeend', `
      <div class="catalog-path">英文　›　全民英檢（GEPT）</div>
      <h2 class="catalog-title">全民英檢（GEPT）</h2>
      <p class="catalog-sub">國中階段先建置初級題庫。目前已有閱讀能力測驗第一回至第六回的原始資料與教材知識庫。</p>
      <div class="catalog-grid">
        <button class="catalog-card chapter-card" id="geptElementaryBtn">
          <span class="top"><span class="icon">🌱</span><strong>初級</strong><span class="catalog-badge reference">6 回資料已收錄</span></span>
          <span class="desc">進入知識庫試題；第一回至第六回選單已建立。</span>
        </button>
      </div>`);

    $('#geptElementaryBtn')?.addEventListener('click', renderElementaryRounds);
  }

  function renderElementaryRounds() {
    const root = content();
    const back = keepEnglishBackButton();
    if (!root || !back) return;

    root.dataset.geptView = 'rounds';
    setHeader('英文科｜全民英檢初級', '知識庫試題｜第一回～第六回');
    document.title = '全民英檢初級｜知識庫試題';

    root.insertAdjacentHTML('beforeend', `
      <button class="catalog-back" id="backGeptLandingBtn">← 返回全民英檢</button>
      <div class="catalog-path">英文　›　全民英檢（GEPT）　›　初級</div>
      <h2 class="catalog-title">知識庫試題</h2>
      <p class="catalog-sub">六回模擬考原始資料與教材知識庫均已整理完成；目前先建立選單，線上考題內容下一階段再匯入。</p>
      <div class="catalog-grid">
        ${GEPT_ELEMENTARY_ROUNDS.map(round => `
          <button class="catalog-card chapter-card" disabled data-gept-round="${round.key}">
            <span class="top"><span class="icon">📝</span><strong>${round.title}</strong><span class="catalog-badge reference">資料已收錄</span></span>
            <span class="desc">閱讀能力測驗｜35 題｜原書 ${round.pages}｜線上考題待建</span>
          </button>`).join('')}
      </div>`);

    $('#backGeptLandingBtn')?.addEventListener('click', renderGeptLanding);
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
