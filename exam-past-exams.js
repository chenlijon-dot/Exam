(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);

  function isSubjectMenu() {
    const title = $('#catalogContent .catalog-title');
    return !!title && title.textContent.trim() === '請選擇科目';
  }

  function injectPastExamCard() {
    const grid = $('#catalogContent .catalog-grid');
    if (!grid || !isSubjectMenu() || $('#pastExamsBtn')) return;

    const button = document.createElement('button');
    button.id = 'pastExamsBtn';
    button.className = 'catalog-card';
    button.innerHTML = `
      <span class="top">
        <span class="icon">🧾</span>
        <strong>歷屆考題</strong>
        <span class="catalog-badge">15 年規劃</span>
      </span>
      <span class="desc">整理國中基測與教育會考歷屆試題，依年度與科目練習。</span>
    `;
    button.addEventListener('click', showPastExams);
    grid.appendChild(button);
  }

  function showPastExams() {
    const content = $('#catalogContent');
    const headerTitle = $('#catalogHeaderTitle');
    const headerSub = $('#catalogHeaderSub');
    if (!content) return;

    if (headerTitle) headerTitle.textContent = '歷屆考題';
    if (headerSub) headerSub.textContent = '基測／教育會考｜依年度與科目整理';
    document.title = '歷屆考題｜國中題庫';

    content.innerHTML = `
      <button class="catalog-back" id="backFromPastExamsBtn">← 返回科目</button>
      <div class="catalog-path">歷屆考題</div>
      <h2 class="catalog-title">歷屆考題</h2>
      <p class="catalog-sub">目標整理近 15 年官方試題。實際收錄年度以後續匯入並核對的官方題目為準。</p>
      <div class="catalog-grid">
        <button class="catalog-card" disabled>
          <span class="top">
            <span class="icon">📜</span>
            <strong>國中基本學力測驗（基測）</strong>
            <span class="catalog-badge soon">待匯入</span>
          </span>
          <span class="desc">舊制歷屆試題。後續依年度 → 科目建立題庫。</span>
        </button>
        <button class="catalog-card" disabled>
          <span class="top">
            <span class="icon">📝</span>
            <strong>國中教育會考</strong>
            <span class="catalog-badge soon">待匯入</span>
          </span>
          <span class="desc">現行會考歷屆試題。後續依年度 → 科目建立題庫。</span>
        </button>
      </div>
      <p class="catalog-sub" style="margin-top:18px">
        預定結構：歷屆考題 → 考試制度 → 年度 → 國文／英文／數學／自然／社會。
      </p>
    `;

    $('#backFromPastExamsBtn')?.addEventListener('click', () => {
      window.location.reload();
    });
  }

  function init() {
    const target = $('#catalogContent') || document.body;
    const observer = new MutationObserver(injectPastExamCard);
    observer.observe(target, { childList: true, subtree: true });
    injectPastExamCard();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
