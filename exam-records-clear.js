(() => {
  'use strict';

  const RECORDS_KEY = 'examRecords.v1';

  function loadRecords() {
    try { return JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]'); }
    catch { return []; }
  }

  function saveRecords(records) {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  }

  function clearWrongAnswerHistory() {
    const records = loadRecords();
    if (!records.length) {
      alert('目前沒有作答紀錄。');
      return;
    }

    const wrongCount = records.reduce((n, r) => n + ((r.wrongAnswers || []).length), 0);
    if (!wrongCount) {
      alert('目前沒有錯題紀錄。');
      return;
    }

    const ok = confirm(
      `確定要清除目前累積的錯題紀錄嗎？\n\n` +
      `共 ${wrongCount} 筆錯題紀錄。\n` +
      `歷次成績與分數會保留，只清除「錯題複習」清單。\n` +
      `GitHub 私人資料庫中的歷史考卷也不會刪除。`
    );
    if (!ok) return;

    const cleaned = records.map(r => ({ ...r, wrongAnswers: [] }));
    saveRecords(cleaned);

    const content = document.querySelector('#wrongModal .record-content');
    if (content) {
      content.innerHTML = `
        <p><b>錯題紀錄已清除。</b></p>
        <p class="record-note">歷次成績仍然保留；之後新答錯的題目會重新累積。</p>
        <div style="margin-top:12px">
          <button id="clearWrongAnswersBtn" class="record-btn" disabled>錯題紀錄已清空</button>
        </div>
      `;
    }
  }

  function addClearButton() {
    const modal = document.getElementById('wrongModal');
    if (!modal) return;

    const observer = new MutationObserver(() => {
      const content = modal.querySelector('.record-content');
      if (!content || document.getElementById('clearWrongAnswersBtn')) return;

      const area = document.createElement('div');
      area.style.cssText = 'margin-top:14px;padding-top:12px;border-top:1px solid #e5e7eb';
      area.innerHTML = `
        <button id="clearWrongAnswersBtn" class="record-btn" style="border-color:#fecaca;color:#b91c1c">🗑️ 清除錯題紀錄</button>
        <div class="record-note">只清除這台裝置的錯題複習清單；成績紀錄與 GitHub 歷史考卷保留。</div>
      `;
      content.appendChild(area);
      document.getElementById('clearWrongAnswersBtn').addEventListener('click', clearWrongAnswerHistory);
    });

    observer.observe(modal, { childList:true, subtree:true });
  }

  function init() {
    addClearButton();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
