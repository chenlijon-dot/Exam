(() => {
  'use strict';

  const DATA_BASE = 'chapter-bank/english/gept/elementary/vocabulary';
  const DATA_PARTS = [
    `${DATA_BASE}/gept-beginner-vocabulary.b64.part1.txt`,
    `${DATA_BASE}/gept-beginner-vocabulary.b64.part2.txt`,
    `${DATA_BASE}/gept-beginner-vocabulary.b64.part3.txt`
  ];
  const LOCAL_PROGRESS_KEY = 'englishVocabularyProgress.v1';
  const FIREBASE_VERSION = '12.19.0';
  const VALID_COUNTS = new Set([10, 20, 50, 100]);
  const SOURCE_KEY = 'gept-elementary';
  const SOURCE_LABEL = '全民英檢初級';

  let vocabularyPromise = null;
  let firestorePromise = null;
  let activeSession = null;

  const $ = (sel, root = document) => root.querySelector(sel);

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  function safeJsonParse(text, fallback) {
    try { return JSON.parse(text); } catch { return fallback; }
  }

  function loadLocalProgress() {
    const parsed = safeJsonParse(localStorage.getItem(LOCAL_PROGRESS_KEY) || '{}', {});
    return parsed && typeof parsed === 'object' ? parsed : {};
  }

  function saveLocalProgress(progress) {
    localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(progress));
  }

  function progressKey(item) {
    return `${SOURCE_KEY}:${item.vocabId ?? item.id}`;
  }

  function blankProgress() {
    return { reviewCount:0, wrongCount:0, correctCount:0, unansweredCount:0, lastReviewedAt:'' };
  }

  function mergeProgress(local, cloud) {
    if (!cloud) return local || blankProgress();
    const a = local || blankProgress();
    return {
      reviewCount: Math.max(Number(a.reviewCount || 0), Number(cloud.reviewCount || 0)),
      wrongCount: Math.max(Number(a.wrongCount || 0), Number(cloud.wrongCount || 0)),
      correctCount: Math.max(Number(a.correctCount || 0), Number(cloud.correctCount || 0)),
      unansweredCount: Math.max(Number(a.unansweredCount || 0), Number(cloud.unansweredCount || 0)),
      lastReviewedAt: cloud.lastReviewedAt || a.lastReviewedAt || ''
    };
  }

  function randomInt(maxExclusive) {
    if (maxExclusive <= 1) return 0;
    if (window.crypto?.getRandomValues) {
      const range = 0x100000000;
      const limit = range - (range % maxExclusive);
      const buf = new Uint32Array(1);
      do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
      return buf[0] % maxExclusive;
    }
    return Math.floor(Math.random() * maxExclusive);
  }

  function shuffledCopy(items) {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  async function decodeCompressedVocabulary(base64Text) {
    if (typeof DecompressionStream !== 'function') {
      throw new Error('此瀏覽器不支援字庫解壓縮，請使用最新版 Chrome / Edge。');
    }
    const binary = atob(base64Text.replace(/\s+/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const text = await new Response(stream).text();
    const data = JSON.parse(text);
    if (!Array.isArray(data) || !data.length) throw new Error('字庫資料為空');
    return data;
  }

  async function loadVocabulary() {
    if (vocabularyPromise) return vocabularyPromise;
    vocabularyPromise = (async () => {
      const responses = await Promise.all(DATA_PARTS.map(path => fetch(path, { cache:'no-store' })));
      const bad = responses.find(r => !r.ok);
      if (bad) throw new Error(`字庫資料載入失敗 HTTP ${bad.status}`);
      const parts = await Promise.all(responses.map(r => r.text()));
      const rows = await decodeCompressedVocabulary(parts.join(''));
      return rows.filter(row => row?.id && row?.w && row?.n && row?.c);
    })();
    return vocabularyPromise;
  }

  async function waitForAuth(timeoutMs = 5000) {
    if (window.ChrisExamAuth?.uid) return window.ChrisExamAuth;
    return new Promise(resolve => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        window.removeEventListener('chrisexam-auth-ready', onReady);
        resolve(window.ChrisExamAuth || null);
      };
      const onReady = () => finish();
      window.addEventListener('chrisexam-auth-ready', onReady, { once:true });
      setTimeout(finish, timeoutMs);
    });
  }

  async function getFirestoreApi() {
    if (firestorePromise) return firestorePromise;
    firestorePromise = (async () => {
      const auth = await waitForAuth();
      if (!auth?.uid) return null;
      const appMod = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`);
      const fs = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`);
      const app = appMod.getApps().length ? appMod.getApp() : null;
      if (!app) return null;
      return { uid:auth.uid, email:auth.email || '', db:fs.getFirestore(app), fs };
    })().catch(() => null);
    return firestorePromise;
  }

  async function mergeCloudProgress(items) {
    const local = loadLocalProgress();
    const api = await getFirestoreApi();
    if (!api) return local;

    const chunks = [];
    for (let i = 0; i < items.length; i += 20) chunks.push(items.slice(i, i + 20));
    for (const chunk of chunks) {
      const snapshots = await Promise.all(chunk.map(item =>
        api.fs.getDoc(api.fs.doc(api.db, 'users', api.uid, 'vocabularyProgress', progressKey(item)))
          .catch(() => null)
      ));
      snapshots.forEach((snap, index) => {
        if (!snap?.exists?.()) return;
        const item = chunk[index];
        const key = progressKey(item);
        local[key] = mergeProgress(local[key], snap.data());
      });
    }
    saveLocalProgress(local);
    return local;
  }

  function distractorsFor(target, allRows, count = 3) {
    const firstChar = String(target.n || '').charAt(0).toLowerCase();
    let pool = allRows.filter(row => row.id !== target.id && row.n !== target.n && String(row.n || '').charAt(0).toLowerCase() === firstChar);
    if (pool.length < count) pool = allRows.filter(row => row.id !== target.id && row.n !== target.n);
    return shuffledCopy(pool).slice(0, count);
  }

  function buildQuestion(item, number, allRows, progress) {
    const stats = progress[progressKey(item)] || blankProgress();
    const distractors = distractorsFor(item, allRows, 3);
    const choices = shuffledCopy([item, ...distractors]);
    const correctIndex = choices.findIndex(x => x.id === item.id);
    const errorRate = stats.reviewCount ? Math.round(stats.wrongCount * 1000 / stats.reviewCount) / 10 : 0;
    return {
      number,
      q:`${item.c}　｜　已複習 ${stats.reviewCount} 次`,
      o: choices.map(x => x.w),
      a: correctIndex,
      fixedOptions: true,
      e:`${item.w}｜累積複習 ${stats.reviewCount} 次、答錯 ${stats.wrongCount} 次、錯誤率 ${errorRate}%`,
      vocabId:item.id,
      word:item.w,
      wordNorm:item.n,
      chinese:item.c,
      reviewCountBefore:Number(stats.reviewCount || 0),
      wrongCountBefore:Number(stats.wrongCount || 0),
      sourceLevel:'elementary'
    };
  }

  function restoreLanding(root) {
    $('#vocabMemoryView', root)?.remove();
    [...root.children].forEach(child => {
      if (child.dataset.vocabHiddenByMemory === '1') {
        child.classList.remove('hidden');
        delete child.dataset.vocabHiddenByMemory;
      }
    });
    root.dataset.vocabMemoryOpen = '0';
  }

  function hideLandingChildren(root) {
    [...root.children].forEach(child => {
      if (child.id === 'vocabMemoryView') return;
      if (!child.classList.contains('hidden')) {
        child.dataset.vocabHiddenByMemory = '1';
        child.classList.add('hidden');
      }
    });
  }

  function injectStyles() {
    if ($('#vocabMemoryStyles')) return;
    const style = document.createElement('style');
    style.id = 'vocabMemoryStyles';
    style.textContent = `
      .vocab-memory-card{border-color:#bfdbfe!important;background:linear-gradient(135deg,#eff6ff,#ffffff)!important}
      .vocab-memory-card .icon{font-size:1.35rem}
      .vocab-coming-card{opacity:.62;cursor:not-allowed!important}
      .vocab-setup{padding:6px 0 8px}
      .vocab-setup-panel{max-width:760px;margin:18px auto 0;border:1px solid #dbe3ef;background:#fff;border-radius:20px;padding:22px;box-shadow:0 8px 30px rgba(15,23,42,.06)}
      .vocab-setup-title{margin:0 0 6px;font-size:1.45rem;color:#0f2856}
      .vocab-setup-sub{margin:0 0 22px;color:#64748b;line-height:1.7}
      .vocab-field{margin:18px 0}
      .vocab-field label{display:block;font-weight:800;color:#1e3a5f;margin-bottom:8px}
      .vocab-select{width:100%;max-width:360px;border:1px solid #cbd5e1;border-radius:12px;padding:11px 12px;background:#fff;font-size:1rem}
      .vocab-counts{display:flex;flex-wrap:wrap;gap:10px}
      .vocab-count-btn{border:1px solid #cbd5e1;background:#fff;color:#334155;border-radius:999px;padding:9px 18px;font-weight:800;cursor:pointer}
      .vocab-count-btn.active{border-color:#2563eb;background:#eff6ff;color:#1d4ed8;box-shadow:0 0 0 2px rgba(37,99,235,.08)}
      .vocab-start-btn{width:100%;margin-top:10px;border:0;border-radius:14px;background:#1d4ed8;color:#fff;padding:13px 18px;font-size:1.05rem;font-weight:850;cursor:pointer}
      .vocab-start-btn:disabled{opacity:.55;cursor:wait}
      .vocab-data-note{margin-top:12px;color:#64748b;font-size:.86rem;line-height:1.6}
      .vocab-sync-toast{position:fixed;right:18px;bottom:18px;z-index:10000;background:#0f172a;color:#fff;border-radius:12px;padding:10px 14px;box-shadow:0 12px 30px rgba(15,23,42,.28);font-size:.9rem}
      @media(max-width:620px){.vocab-setup-panel{padding:17px;border-radius:16px}.vocab-count-btn{flex:1 1 calc(50% - 10px)}}
    `;
    document.head.appendChild(style);
  }

  function showToast(text) {
    $('.vocab-sync-toast')?.remove();
    const toast = document.createElement('div');
    toast.className = 'vocab-sync-toast';
    toast.textContent = text;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }

  function openSetup() {
    const root = $('#catalogContent');
    if (!root || root.dataset.vocabMemoryOpen === '1') return;
    root.dataset.vocabMemoryOpen = '1';
    hideLandingChildren(root);

    const view = document.createElement('div');
    view.id = 'vocabMemoryView';
    view.className = 'vocab-setup';
    view.innerHTML = `
      <button class="catalog-back" id="backVocabMemoryBtn">← 返回全民英檢</button>
      <div class="catalog-path">英文　›　全民英檢（GEPT）　›　字庫記憶</div>
      <div class="vocab-setup-panel">
        <h2 class="vocab-setup-title">🧠 字庫記憶</h2>
        <p class="vocab-setup-sub">先做「中翻英」選擇題。每次從字庫隨機抽題，同一份試卷不重複單字；交卷後會累積複習次數、答錯次數與錯誤率。</p>
        <div class="vocab-field">
          <label for="vocabSourceSelect">字庫來源</label>
          <select id="vocabSourceSelect" class="vocab-select">
            <option value="elementary">全民英檢初級</option>
          </select>
        </div>
        <div class="vocab-field">
          <label>出題數量</label>
          <div class="vocab-counts" id="vocabCountButtons">
            ${[10,20,50,100].map(n => `<button type="button" class="vocab-count-btn${n === 20 ? ' active' : ''}" data-count="${n}">${n} 題</button>`).join('')}
          </div>
        </div>
        <button type="button" id="startVocabExamBtn" class="vocab-start-btn">開始考試</button>
        <div class="vocab-data-note">字彙內容由 GEPT 初級 SQL authority 產生前端唯讀資料；個人複習統計寫入自己的學習歷程／Firestore，不回寫共用字庫。</div>
      </div>`;
    root.appendChild(view);

    let count = 20;
    $('#backVocabMemoryBtn', view)?.addEventListener('click', () => restoreLanding(root));
    $('#vocabCountButtons', view)?.addEventListener('click', event => {
      const btn = event.target.closest?.('[data-count]');
      if (!btn) return;
      const next = Number(btn.dataset.count);
      if (!VALID_COUNTS.has(next)) return;
      count = next;
      view.querySelectorAll('.vocab-count-btn').forEach(x => x.classList.toggle('active', x === btn));
    });
    $('#startVocabExamBtn', view)?.addEventListener('click', event => startVocabularyExam(count, event.currentTarget));
  }

  async function startVocabularyExam(count, button) {
    if (!VALID_COUNTS.has(Number(count))) return;
    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = '載入字庫與學習紀錄…';

    try {
      const allRows = await loadVocabulary();
      if (allRows.length < count) throw new Error(`字庫只有 ${allRows.length} 個可用字彙`);
      const selected = shuffledCopy(allRows).slice(0, count);
      const progress = await mergeCloudProgress(selected);
      const generated = selected.map((item, index) => buildQuestion(item, index + 1, allRows, progress));

      if (typeof banks === 'undefined' || typeof window.startExam !== 'function') throw new Error('題庫引擎尚未就緒');
      const sessionId = Date.now();
      const key = `english-gept-vocabulary-elementary-zh-en-${sessionId}`;
      banks[key] = generated;
      window.examContexts = window.examContexts || {};
      window.examContexts[key] = {
        key,
        examType:'gept-vocabulary-memory',
        examTypeLabel:'字庫記憶',
        subject:'english',
        subjectLabel:'英文',
        title:'字庫記憶｜全民英檢初級｜中翻英',
        subtitle:`${count} 題｜SQL 字庫隨機抽題｜不重複`,
        unit:'字庫記憶｜初級｜中翻英',
        difficulty:'elementary-vocabulary',
        difficultyLabel:'初級字庫',
        scoreMode:'fixed',
        pointsPerQuestion:100 / count,
        preserveOptionOrder:true,
        analysisEligible:true,
        resultLabel:'字庫記憶結果',
        sourceNote:'題目由 GEPT 初級字彙 SQL 資料庫衍生；每題顯示交卷前的累積複習次數。',
        backLabel:'返回字庫記憶設定',
        onBack:() => {
          $('#catalogShell')?.classList.remove('hidden');
          $('#vocabMemoryView')?.scrollIntoView({ behavior:'smooth', block:'start' });
        }
      };
      activeSession = { key, generated, committed:false };
      window.startExam(key);
    } catch (error) {
      alert(`字庫記憶載入失敗：${error.message}`);
    } finally {
      button.disabled = false;
      button.textContent = oldText;
    }
  }

  async function persistSessionProgress(session) {
    if (!session || session.committed) return;
    session.committed = true;

    const local = loadLocalProgress();
    const updates = [];
    session.generated.forEach((item, index) => {
      const picked = document.querySelector(`input[name=q${index}]:checked`);
      const selectedIndex = picked ? Number(picked.value) : null;
      const isCorrect = selectedIndex !== null && selectedIndex === item.a;
      const isWrong = selectedIndex !== null && selectedIndex !== item.a;
      const key = progressKey(item);
      const current = local[key] || blankProgress();
      local[key] = {
        reviewCount:Number(current.reviewCount || 0) + 1,
        wrongCount:Number(current.wrongCount || 0) + (isWrong ? 1 : 0),
        correctCount:Number(current.correctCount || 0) + (isCorrect ? 1 : 0),
        unansweredCount:Number(current.unansweredCount || 0) + (selectedIndex === null ? 1 : 0),
        lastReviewedAt:new Date().toISOString()
      };
      updates.push({ item, selectedIndex, isCorrect, isWrong });
    });
    saveLocalProgress(local);
    showToast('✓ 字庫複習次數已記錄');

    const api = await getFirestoreApi();
    if (!api) return;
    try {
      const batch = api.fs.writeBatch(api.db);
      updates.forEach(({ item, selectedIndex, isCorrect, isWrong }) => {
        const ref = api.fs.doc(api.db, 'users', api.uid, 'vocabularyProgress', progressKey(item));
        batch.set(ref, {
          source:SOURCE_KEY,
          sourceLabel:SOURCE_LABEL,
          vocabId:item.vocabId,
          word:item.word,
          wordNorm:item.wordNorm,
          chinese:item.chinese,
          reviewCount:api.fs.increment(1),
          wrongCount:api.fs.increment(isWrong ? 1 : 0),
          correctCount:api.fs.increment(isCorrect ? 1 : 0),
          unansweredCount:api.fs.increment(selectedIndex === null ? 1 : 0),
          lastReviewedAt:api.fs.serverTimestamp(),
          userEmail:api.email || ''
        }, { merge:true });
      });
      await batch.commit();
      showToast('✓ 字庫學習歷程已同步到 Firebase');
    } catch (error) {
      console.warn('[vocab-memory] Firestore progress sync failed', error);
    }
  }

  function makeCard(id, icon, title, badge, desc, extraClass = '') {
    const button = document.createElement('button');
    button.className = `catalog-card chapter-card ${extraClass}`.trim();
    button.id = id;
    button.innerHTML = `<span class="top"><span class="icon">${icon}</span><strong>${escapeHtml(title)}</strong><span class="catalog-badge reference">${escapeHtml(badge)}</span></span><span class="desc">${escapeHtml(desc)}</span>`;
    return button;
  }

  function enhanceGeptLanding() {
    const root = $('#catalogContent');
    const elementary = $('#geptElementaryBtn', root || document);
    if (!root || !elementary || root.dataset.geptView !== 'landing') return;
    const grid = elementary.parentElement;
    if (!grid) return;

    if (!$('#geptVocabularyMemoryBtn', root)) {
      const memory = makeCard('geptVocabularyMemoryBtn', '🧠', '字庫記憶', '初級字庫已收錄', '從 GEPT 字庫隨機出題，累積個人複習次數與錯誤率。', 'vocab-memory-card');
      memory.addEventListener('click', openSetup);
      grid.insertBefore(memory, elementary);
    }

    if (!$('#geptIntermediateBtn', root)) {
      const middle = makeCard('geptIntermediateBtn', '🌿', '中級', '待建置', '全民英檢中級題庫與字庫後續擴充。', 'vocab-coming-card');
      middle.disabled = true;
      grid.appendChild(middle);
    }

    if (!$('#geptHighIntermediateBtn', root)) {
      const high = makeCard('geptHighIntermediateBtn', '🌳', '中高級', '待建置', '全民英檢中高級題庫與字庫後續擴充。', 'vocab-coming-card');
      high.disabled = true;
      grid.appendChild(high);
    }
  }

  function watchCatalog() {
    const root = $('#catalogContent');
    if (!root) return;
    const observer = new MutationObserver(() => enhanceGeptLanding());
    observer.observe(root, { childList:true, subtree:true });
    enhanceGeptLanding();
  }

  document.addEventListener('exam:submitted', event => {
    if (event.detail?.examType !== 'gept-vocabulary-memory') return;
    if (!activeSession || activeSession.key !== event.detail.key) return;
    persistSessionProgress(activeSession);
  });

  injectStyles();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchCatalog, { once:true });
  else watchCatalog();

  window.ChrisExamVocabulary = { openSetup, loadVocabulary };
})();
