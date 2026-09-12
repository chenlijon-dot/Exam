(() => {
  'use strict';

  const RECORDS_KEY = 'examRecords.v1';

  function loadRecords() {
    try { return JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]'); }
    catch { return []; }
  }

  function aggregateWrongAnswers() {
    const map = new Map();
    loadRecords().forEach(r => {
      (r.wrongAnswers || [])
        .filter(a => a && a.selectedText && a.correctText)
        .forEach(a => {
          const key = `${r.difficulty}|${a.question}`;
          if (!map.has(key)) {
            map.set(key, {
              difficultyLabel: r.difficultyLabel || r.difficulty || '',
              question: a.question,
              selectedText: a.selectedText,
              correctText: a.correctText,
              count: 0,
              last: r.submittedAt || ''
            });
          }
          const x = map.get(key);
          x.count++;
          if ((r.submittedAt || '') > x.last) {
            x.last = r.submittedAt || '';
            x.selectedText = a.selectedText;
            x.correctText = a.correctText;
          }
        });
    });
    return [...map.values()].sort((a,b) => b.count - a.count || b.last.localeCompare(a.last));
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  function renderSimpleWrongList() {
    const modal = document.getElementById('wrongModal');
    const content = modal?.querySelector('.record-content');
    if (!content) return;

    const list = aggregateWrongAnswers();
    if (!list.length) {
      content.innerHTML = '<p>目前沒有錯題紀錄。漂亮！</p>';
      return;
    }

    content.innerHTML = `
      <p>目前累積 <b>${list.length}</b> 個曾答錯題目。未作答不列入錯題。</p>
      ${list.map(x => `
        <div class="wrong-item">
          <div style="display:flex;justify-content:space-between;gap:8px">
            <b>${escapeHtml(x.difficultyLabel)}｜${escapeHtml(x.question)}</b>
            <span class="wrong-count">錯 ${x.count} 次</span>
          </div>
          <div style="margin-top:7px">❌ 寫錯：<b>${escapeHtml(x.selectedText)}</b></div>
          <div>✅ 正確：<b>${escapeHtml(x.correctText)}</b></div>
        </div>
      `).join('')}
    `;
  }

  function init() {
    const wrongBtn = document.getElementById('wrongBtn');
    if (!wrongBtn) return;
    wrongBtn.addEventListener('click', () => setTimeout(renderSimpleWrongList, 0));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
