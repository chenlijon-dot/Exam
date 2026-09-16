(() => {
  'use strict';

  const LOCAL_PROGRESS_KEY = 'englishVocabularyProgress.v1';
  const LOCAL_MARKOV_KEY = 'englishVocabularyMarkovState.v1';
  const FIREBASE_VERSION = '12.19.0';
  const VALID_COUNTS = new Set([10, 20, 50, 100]);
  const SOURCE_KEY = 'gept-elementary';
  const SOURCE_LABEL = '全民英檢初級';
  const MARKOV_STATE_DOC = 'gept-elementary-markov';
  const API_URL = 'https://script.google.com/macros/s/AKfycbwXgNBgVNM-N0JR8KsXeOr8DeregYbmKnT78Ru1cYZXYLor_3moTUdg_0_IydRiXQPTHg/exec';
  const RECENT_WINDOW = 6;

  let firestorePromise = null;
  let activeSession = null;

  const $ = (sel, root = document) => root.querySelector(sel);
  const safeJson = (text, fallback) => { try { return JSON.parse(text); } catch { return fallback; } };
  const countOf = value => {
    const n = Number(value || 0);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  };
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[ch]));

  function normList(value, max = Infinity) {
    if (!Array.isArray(value)) return [];
    const seen = new Set();
    const out = [];
    for (const raw of value) {
      const key = String(raw || '').trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(key);
      if (out.length >= max) break;
    }
    return out;
  }

  function normMap(value) {
    const out = {};
    if (!value || typeof value !== 'object') return out;
    for (const [rawKey, rawCount] of Object.entries(value)) {
      const key = String(rawKey || '').trim().toLowerCase();
      const n = countOf(rawCount);
      if (key && n) out[key] = n;
    }
    return out;
  }

  function maxMaps(a, b) {
    const out = { ...normMap(a) };
    for (const [key, n] of Object.entries(normMap(b))) {
      out[key] = Math.max(countOf(out[key]), n);
    }
    return out;
  }

  function addMaps(a, b) {
    const out = { ...normMap(a) };
    for (const [key, n] of Object.entries(normMap(b))) {
      out[key] = countOf(out[key]) + n;
    }
    return out;
  }

  function loadLocalProgress() {
    const value = safeJson(localStorage.getItem(LOCAL_PROGRESS_KEY) || '{}', {});
    return value && typeof value === 'object' ? value : {};
  }

  function saveLocalProgress(value) {
    localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(value));
  }

  function loadLocalMarkov() {
    const value = safeJson(localStorage.getItem(LOCAL_MARKOV_KEY) || '{}', {});
    return {
      exposure: normMap(value.exposure),
      targetCount: normMap(value.targetCount),
      frontier: normList(value.frontier, 3),
      recentTargets: normList(value.recentTargets, RECENT_WINDOW),
      updatedAt: String(value.updatedAt || '')
    };
  }

  function saveLocalMarkov(value) {
    localStorage.setItem(LOCAL_MARKOV_KEY, JSON.stringify({
      exposure: normMap(value.exposure),
      targetCount: normMap(value.targetCount),
      frontier: normList(value.frontier, 3),
      recentTargets: normList(value.recentTargets, RECENT_WINDOW),
      updatedAt: String(value.updatedAt || new Date().toISOString())
    }));
  }

  function progressKey(item) {
    return `${SOURCE_KEY}:${item.vocabId ?? item.id}`;
  }

  function blankProgress() {
    return {
      reviewCount: 0,
      wrongCount: 0,
      correctCount: 0,
      unansweredCount: 0,
      exposureCount: 0,
      targetCount: 0,
      lastReviewedAt: ''
    };
  }

  function mergeProgress(local, cloud) {
    const a = local || blankProgress();
    if (!cloud) return a;
    return {
      reviewCount: Math.max(countOf(a.reviewCount), countOf(cloud.reviewCount)),
      wrongCount: Math.max(countOf(a.wrongCount), countOf(cloud.wrongCount)),
      correctCount: Math.max(countOf(a.correctCount), countOf(cloud.correctCount)),
      unansweredCount: Math.max(countOf(a.unansweredCount), countOf(cloud.unansweredCount)),
      exposureCount: Math.max(countOf(a.exposureCount), countOf(cloud.exposureCount)),
      targetCount: Math.max(countOf(a.targetCount), countOf(cloud.targetCount)),
      lastReviewedAt: cloud.lastReviewedAt || a.lastReviewedAt || ''
    };
  }

  async function waitForAuth(timeoutMs = 5000) {
    if (window.ChrisExamAuth?.uid) return window.ChrisExamAuth;
    return new Promise(resolve => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        window.removeEventListener('chrisexam-auth-ready', finish);
        resolve(window.ChrisExamAuth || null);
      };
      window.addEventListener('chrisexam-auth-ready', finish, { once:true });
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

    for (let i = 0; i < items.length; i += 20) {
      const chunk = items.slice(i, i + 20);
      const snapshots = await Promise.all(chunk.map(item =>
        api.fs.getDoc(api.fs.doc(api.db, 'users', api.uid, 'vocabularyProgress', progressKey(item))).catch(() => null)
      ));
      snapshots.forEach((snap, index) => {
        if (!snap?.exists?.()) return;
        const key = progressKey(chunk[index]);
        local[key] = mergeProgress(local[key], snap.data());
      });
    }

    saveLocalProgress(local);
    return local;
  }

  async function loadMarkovHistory() {
    const local = loadLocalMarkov();
    const api = await getFirestoreApi();
    if (!api) return {
      exposure: local.exposure,
      targetCount: local.targetCount,
      frontier: local.frontier,
      recentTargets: local.recentTargets
    };

    try {
      const snap = await api.fs.getDoc(
        api.fs.doc(api.db, 'users', api.uid, 'vocabularyState', MARKOV_STATE_DOC)
      );
      if (!snap.exists()) return {
        exposure: local.exposure,
        targetCount: local.targetCount,
        frontier: local.frontier,
        recentTargets: local.recentTargets
      };

      const cloud = snap.data() || {};
      const useCloud = (Date.parse(String(cloud.updatedAtClient || '')) || 0) >= (Date.parse(local.updatedAt) || 0);
      const merged = {
        exposure: maxMaps(local.exposure, cloud.exposure),
        targetCount: maxMaps(local.targetCount, cloud.targetCount),
        frontier: useCloud ? normList(cloud.frontier, 3) : local.frontier,
        recentTargets: useCloud ? normList(cloud.recentTargets, RECENT_WINDOW) : local.recentTargets,
        updatedAt: useCloud ? String(cloud.updatedAtClient || '') : local.updatedAt
      };
      saveLocalMarkov(merged);
      return {
        exposure: merged.exposure,
        targetCount: merged.targetCount,
        frontier: merged.frontier,
        recentTargets: merged.recentTargets
      };
    } catch (error) {
      console.warn('[vocab-memory] history read failed', error);
      return {
        exposure: local.exposure,
        targetCount: local.targetCount,
        frontier: local.frontier,
        recentTargets: local.recentTargets
      };
    }
  }

  async function requestVocabularyExam(count, history) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type':'text/plain;charset=utf-8' },
      body: JSON.stringify({ count:Number(count), mode:'unique-sweep', history:history || {} }),
      cache: 'no-store',
      redirect: 'follow'
    });
    if (!response.ok) throw new Error(`題目服務連線失敗：HTTP ${response.status}`);
    const data = await response.json();
    if (!data?.ok) throw new Error(data?.error || '題目載入失敗');
    if (!Array.isArray(data.questions) || data.questions.length !== Number(count)) {
      throw new Error(`題數異常：${data?.questions?.length ?? 0}/${count}`);
    }
    return data;
  }

  function buildOptionExplanation(item) {
    const letters = ['A', 'B', 'C', 'D'];
    const details = Array.isArray(item.optionDetails) ? item.optionDetails : [];

    if (!details.length) {
      return `<div><b>${escapeHtml(item.answer)}</b>：${escapeHtml(item.question)}</div>`;
    }

    return details.map((detail, index) => {
      const seen = new Set();
      const meanings = (Array.isArray(detail.meanings) ? detail.meanings : [])
        .map(meaning => {
          const pos = String(meaning?.partOfSpeech || '').trim();
          const chinese = String(meaning?.chinese || '').trim();
          return [pos, chinese].filter(Boolean).join(' ');
        })
        .filter(text => {
          if (!text || seen.has(text)) return false;
          seen.add(text);
          return true;
        });

      const word = detail.word || item.options?.[index] || '';
      return `<div style="margin:5px 0"><b>(${letters[index]}) ${escapeHtml(word)}</b>${meanings.length ? `：${escapeHtml(meanings.join('；'))}` : ''}</div>`;
    }).join('');
  }

  function apiQuestion(item, number, progress) {
    const stats = progress[progressKey(item)] || blankProgress();
    return {
      number,
      q: `${item.question}　｜　已複習 ${stats.reviewCount} 次`,
      o: [...(item.options || [])],
      a: Number(item.answerIndex),
      fixedOptions: true,
      e: buildOptionExplanation(item),
      vocabId: item.vocabId,
      word: item.answer,
      wordNorm: item.wordNorm,
      chinese: item.question,
      reviewCountBefore: Number(stats.reviewCount || 0),
      wrongCountBefore: Number(stats.wrongCount || 0),
      sourceLevel: 'elementary'
    };
  }

  function mergeMarkovAfter(history, delta, continuation) {
    return {
      exposure: addMaps(history?.exposure, delta?.exposure),
      targetCount: addMaps(history?.targetCount, delta?.targetCount),
      frontier: normList(continuation?.frontier, 3),
      recentTargets: normList(continuation?.recentTargets, RECENT_WINDOW),
      updatedAt: new Date().toISOString()
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

  function hideLanding(root) {
    [...root.children].forEach(child => {
      if (child.id !== 'vocabMemoryView' && !child.classList.contains('hidden')) {
        child.dataset.vocabHiddenByMemory = '1';
        child.classList.add('hidden');
      }
    });
  }

  function showToast(text) {
    $('.vocab-sync-toast')?.remove();
    const toast = document.createElement('div');
    toast.className = 'vocab-sync-toast';
    toast.textContent = text;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  }

  function injectStyles() {
    if ($('#vocabMemoryStyles')) return;
    const style = document.createElement('style');
    style.id = 'vocabMemoryStyles';
    style.textContent = `
      .vocab-memory-card{border-color:#bfdbfe!important;background:linear-gradient(135deg,#eff6ff,#fff)!important}
      .vocab-memory-card .icon{font-size:1.35rem}
      .vocab-coming-card{opacity:.62;cursor:not-allowed!important}
      .vocab-setup{padding:6px 0 8px}
      .vocab-setup-panel{max-width:760px;margin:18px auto 0;border:1px solid #dbe3ef;background:#fff;border-radius:20px;padding:22px;box-shadow:0 8px 30px rgba(15,23,42,.06)}
      .vocab-setup-title{margin:0 0 6px;font-size:1.45rem;color:#0f2856}
      .vocab-setup-sub{margin:0 0 22px;color:#64748b;line-height:1.7}
      .vocab-field{margin:18px 0}.vocab-field label{display:block;font-weight:800;color:#1e3a5f;margin-bottom:8px}
      .vocab-select{width:100%;max-width:360px;border:1px solid #cbd5e1;border-radius:12px;padding:11px 12px;background:#fff;font-size:1rem}
      .vocab-counts{display:flex;flex-wrap:wrap;gap:10px}
      .vocab-count-btn{border:1px solid #cbd5e1;background:#fff;color:#334155;border-radius:999px;padding:9px 18px;font-weight:800;cursor:pointer}
      .vocab-count-btn.active{border-color:#2563eb;background:#eff6ff;color:#1d4ed8}
      .vocab-start-btn{width:100%;margin-top:10px;border:0;border-radius:14px;background:#1d4ed8;color:#fff;padding:13px 18px;font-size:1.05rem;font-weight:850;cursor:pointer}
      .vocab-start-btn:disabled{opacity:.55;cursor:wait}
      .vocab-data-note{margin-top:12px;color:#64748b;font-size:.86rem;line-height:1.6}
      .vocab-sync-toast{position:fixed;right:18px;bottom:18px;z-index:10000;background:#0f172a;color:#fff;border-radius:12px;padding:10px 14px;box-shadow:0 12px 30px rgba(15,23,42,.28);font-size:.9rem}
      @media(max-width:620px){.vocab-setup-panel{padding:17px;border-radius:16px}.vocab-count-btn{flex:1 1 calc(50% - 10px)}}
    `;
    document.head.appendChild(style);
  }

  function openSetup() {
    const root = $('#catalogContent');
    if (!root || root.dataset.vocabMemoryOpen === '1') return;
    root.dataset.vocabMemoryOpen = '1';
    hideLanding(root);

    const view = document.createElement('div');
    view.id = 'vocabMemoryView';
    view.className = 'vocab-setup';
    view.innerHTML = `
      <button class="catalog-back" id="backVocabMemoryBtn">← 返回全民英檢</button>
      <div class="catalog-path">英文　›　全民英檢（GEPT）　›　字庫記憶</div>
      <div class="vocab-setup-panel">
        <h2 class="vocab-setup-title">🧠 字庫記憶</h2>
        <p class="vocab-setup-sub">中翻英四選一。選擇題數後即可開始測驗，完成後會自動保存個人學習進度。</p>
        <div class="vocab-field"><label>字庫來源</label><select class="vocab-select"><option>全民英檢初級</option></select></div>
        <div class="vocab-field">
          <label>出題數量</label>
          <div class="vocab-counts" id="vocabCountButtons">
            ${[10,20,50,100].map(n => `<button type="button" class="vocab-count-btn${n === 20 ? ' active' : ''}" data-count="${n}">${n} 題</button>`).join('')}
          </div>
        </div>
        <button type="button" id="startVocabExamBtn" class="vocab-start-btn">開始考試</button>
        <div class="vocab-data-note">完成測驗後會保存個人學習進度。</div>
      </div>`;
    root.appendChild(view);

    let count = 20;
    $('#backVocabMemoryBtn', view)?.addEventListener('click', () => restoreLanding(root));
    $('#vocabCountButtons', view)?.addEventListener('click', event => {
      const button = event.target.closest?.('[data-count]');
      if (!button) return;
      const next = Number(button.dataset.count);
      if (!VALID_COUNTS.has(next)) return;
      count = next;
      view.querySelectorAll('.vocab-count-btn').forEach(x => x.classList.toggle('active', x === button));
    });
    $('#startVocabExamBtn', view)?.addEventListener('click', event => startVocabularyExam(count, event.currentTarget));
  }

  async function startVocabularyExam(count, button) {
    if (!VALID_COUNTS.has(Number(count))) return;
    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = '準備題目與學習紀錄…';

    try {
      const history = await loadMarkovHistory();
      const exam = await requestVocabularyExam(count, history);
      const progress = await mergeCloudProgress(exam.questions);
      const generated = exam.questions.map((question, index) => apiQuestion(question, index + 1, progress));

      if (typeof banks === 'undefined' || typeof window.startExam !== 'function') {
        throw new Error('題庫引擎尚未就緒');
      }

      const key = `english-gept-vocabulary-elementary-zh-en-${Date.now()}`;
      banks[key] = generated;
      window.examContexts = window.examContexts || {};
      window.examContexts[key] = {
        key,
        examType: 'gept-vocabulary-memory',
        examTypeLabel: '字庫記憶',
        subject: 'english',
        subjectLabel: '英文',
        title: '字庫記憶｜全民英檢初級｜中翻英',
        subtitle: `${count} 題｜中翻英四選一`,
        unit: '字庫記憶｜初級｜中翻英',
        difficulty: 'elementary-vocabulary',
        difficultyLabel: '初級字庫',
        scoreMode: 'fixed',
        pointsPerQuestion: 100 / count,
        preserveOptionOrder: true,
        analysisEligible: true,
        resultLabel: '字庫記憶結果',
        sourceNote: '全民英檢初級字庫。',
        backLabel: '返回字庫記憶設定',
        onBack: () => {
          $('#catalogShell')?.classList.remove('hidden');
          $('#vocabMemoryView')?.scrollIntoView({ behavior:'smooth', block:'start' });
        }
      };

      activeSession = {
        key,
        generated,
        committed: false,
        historyBefore: history,
        sessionDelta: exam.sessionDelta || {},
        continuation: exam.continuation || {},
        stats: exam.stats || {}
      };
      window.startExam(key);
    } catch (error) {
      console.error('[vocab-memory] start failed', error);
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
    const markov = mergeMarkovAfter(session.historyBefore, session.sessionDelta, session.continuation);
    saveLocalMarkov(markov);

    session.generated.forEach((item, index) => {
      const picked = document.querySelector(`input[name=q${index}]:checked`);
      const selected = picked ? Number(picked.value) : null;
      const isCorrect = selected !== null && selected === item.a;
      const isWrong = selected !== null && selected !== item.a;
      const key = progressKey(item);
      const current = local[key] || blankProgress();
      const exposureCount = countOf(markov.exposure[item.wordNorm]);
      const targetCount = countOf(markov.targetCount[item.wordNorm]);

      local[key] = {
        reviewCount: Number(current.reviewCount || 0) + 1,
        wrongCount: Number(current.wrongCount || 0) + (isWrong ? 1 : 0),
        correctCount: Number(current.correctCount || 0) + (isCorrect ? 1 : 0),
        unansweredCount: Number(current.unansweredCount || 0) + (selected === null ? 1 : 0),
        exposureCount,
        targetCount,
        lastReviewedAt: new Date().toISOString()
      };
      updates.push({ item, selected, isCorrect, isWrong, exposureCount, targetCount });
    });

    saveLocalProgress(local);
    showToast('✓ 字庫學習進度已記錄');

    const api = await getFirestoreApi();
    if (!api) return;

    try {
      const batch = api.fs.writeBatch(api.db);
      for (const update of updates) {
        const ref = api.fs.doc(api.db, 'users', api.uid, 'vocabularyProgress', progressKey(update.item));
        batch.set(ref, {
          source: SOURCE_KEY,
          sourceLabel: SOURCE_LABEL,
          vocabId: update.item.vocabId,
          word: update.item.word,
          wordNorm: update.item.wordNorm,
          chinese: update.item.chinese,
          reviewCount: api.fs.increment(1),
          wrongCount: api.fs.increment(update.isWrong ? 1 : 0),
          correctCount: api.fs.increment(update.isCorrect ? 1 : 0),
          unansweredCount: api.fs.increment(update.selected === null ? 1 : 0),
          exposureCount: update.exposureCount,
          targetCount: update.targetCount,
          lastReviewedAt: api.fs.serverTimestamp(),
          userEmail: api.email || ''
        }, { merge:true });
      }

      const stateRef = api.fs.doc(api.db, 'users', api.uid, 'vocabularyState', MARKOV_STATE_DOC);
      batch.set(stateRef, {
        source: SOURCE_KEY,
        sourceLabel: SOURCE_LABEL,
        exposure: markov.exposure,
        targetCount: markov.targetCount,
        frontier: markov.frontier,
        recentTargets: markov.recentTargets,
        updatedAtClient: markov.updatedAt,
        updatedAt: api.fs.serverTimestamp(),
        userEmail: api.email || ''
      }, { merge:true });

      await batch.commit();
      showToast('✓ 學習進度已同步');
    } catch (error) {
      console.warn('[vocab-memory] progress sync failed', error);
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
      const memory = makeCard('geptVocabularyMemoryBtn', '🧠', '字庫記憶', '初級字庫', '從全民英檢初級字庫出題，累積個人複習進度與錯誤率。', 'vocab-memory-card');
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
    const observer = new MutationObserver(enhanceGeptLanding);
    observer.observe(root, { childList:true, subtree:true });
    enhanceGeptLanding();
  }

  document.addEventListener('exam:submitted', event => {
    if (event.detail?.examType !== 'gept-vocabulary-memory') return;
    if (!activeSession || activeSession.key !== event.detail.key) return;
    persistSessionProgress(activeSession);
  });

  injectStyles();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchCatalog, { once:true });
  } else {
    watchCatalog();
  }

  window.ChrisExamVocabulary = {
    openSetup,
    loadMarkovHistory,
    requestMarkovExam: requestVocabularyExam,
    apiUrl: API_URL
  };
})();
