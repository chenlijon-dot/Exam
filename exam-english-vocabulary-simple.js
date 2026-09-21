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
  let vocabularyCurrentAttempt = null;
  let vocabularyRecallAttempts = [];
  let vocabularyRecallIndex = -1;
  let vocabularyRecallLoading = false;

  const $ = (sel, root = document) => root.querySelector(sel);
  const safeJson = (text, fallback) => { try { return JSON.parse(text); } catch { return fallback; } };
  const countOf = value => {
    const n = Number(value || 0);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  };

  function answeredCount(stats) {
    return Number(stats?.correctCount || 0) + Number(stats?.wrongCount || 0);
  }

  function formatActiveHistory(stats) {
    const wrongCount = Number(stats?.wrongCount || 0);
    return wrongCount > 0 ? `錯題 ${wrongCount} 次` : null;
  }

  function formatSubmittedHistory(stats) {
    const answered = answeredCount(stats);
    if (answered <= 0) return null;

    const wrongCount = Number(stats?.wrongCount || 0);
    const firstLine = wrongCount > 0
      ? `作答 ${answered} 次｜錯題 ${wrongCount} 次`
      : `作答 ${answered} 次`;

    const selected = String(stats?.lastSelectedLabel || '').trim();
    const resultLabel = stats?.lastResult === 'correct'
      ? '正確'
      : stats?.lastResult === 'incorrect'
        ? '錯誤'
        : '';

    const secondLine = selected && resultLabel
      ? `上次：選 ${selected}｜${resultLabel}`
      : resultLabel
        ? `上次：${resultLabel}`
        : '';

    return secondLine ? [firstLine, secondLine] : [firstLine];
  }
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
      lastSelectedLabel: '',
      lastResult: '',
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
      lastSelectedLabel: cloud.lastSelectedLabel || a.lastSelectedLabel || '',
      lastResult: cloud.lastResult || a.lastResult || '',
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
      return `${item.answer}：${item.question}`;
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
      return `(${letters[index]}) ${word}${meanings.length ? `：${meanings.join('；')}` : ''}`;
    }).join('\n');
  }

  function apiQuestion(item, number, progress) {
    const stats = progress[progressKey(item)] || blankProgress();
    return {
      number,
      q: item.question,
      o: [...(item.options || [])],
      a: Number(item.answerIndex),
      fixedOptions: true,
      e: buildOptionExplanation(item),
      vocabId: item.vocabId,
      word: item.answer,
      wordNorm: item.wordNorm,
      chinese: item.question,
      reviewCountBefore: Number(stats.reviewCount || 0),
      correctCountBefore: Number(stats.correctCount || 0),
      wrongCountBefore: Number(stats.wrongCount || 0),
      lastSelectedLabelBefore: String(stats.lastSelectedLabel || ''),
      lastResultBefore: String(stats.lastResult || ''),
      sourceLevel: 'elementary'
    };
  }

  function clearVocabularyHistoryAnnotations() {
    document.querySelectorAll('[data-vocab-history]').forEach(el => el.remove());
  }

  function vocabularyStatsBefore(item) {
    return {
      correctCount: Number(item?.correctCountBefore || 0),
      wrongCount: Number(item?.wrongCountBefore || 0),
      lastSelectedLabel: String(item?.lastSelectedLabelBefore || ''),
      lastResult: String(item?.lastResultBefore || '')
    };
  }

  function renderVocabularyHistory(submitted = false) {
    if (!activeSession?.generated?.length) return;
    clearVocabularyHistoryAnnotations();

    activeSession.generated.forEach((item, index) => {
      const card = document.querySelector(`.card[data-q="${index}"]`);
      if (!card) return;

      const before = vocabularyStatsBefore(item);
      let lines = null;

      if (!submitted) {
        const text = formatActiveHistory(before);
        if (!text) return;
        lines = [text];
      } else {
        const picked = document.querySelector(`input[name=q${index}]:checked`);
        const selected = picked ? Number(picked.value) : null;
        const stats = { ...before };

        if (selected !== null) {
          const isCorrect = selected === item.a;
          if (isCorrect) stats.correctCount += 1;
          else stats.wrongCount += 1;
          stats.lastSelectedLabel = ['A','B','C','D'][selected] || '';
          stats.lastResult = isCorrect ? 'correct' : 'incorrect';
        }

        lines = formatSubmittedHistory(stats);
        if (!lines?.length) return;
      }

      const box = document.createElement('div');
      box.setAttribute('data-vocab-history', '1');
      box.className = submitted ? 'vocab-history submitted' : 'vocab-history active';
      box.innerHTML = lines.map((line, lineIndex) =>
        `<div class="${lineIndex === 0 ? 'vocab-history-summary' : 'vocab-history-last'}">${escapeHtml(line)}</div>`
      ).join('');

      const title = card.querySelector('.qtitle');
      if (title) title.insertAdjacentElement('afterend', box);
      else card.insertAdjacentElement('afterbegin', box);
    });
  }


  function formatVocabularyRecallTime(value) {
    if (!value) return '';
    try {
      return new Intl.DateTimeFormat('zh-TW', {
        year:'numeric',
        month:'2-digit',
        day:'2-digit',
        hour:'2-digit',
        minute:'2-digit',
        hour12:false
      }).format(new Date(value));
    } catch {
      return String(value);
    }
  }

  function clearVocabularyRecallControls() {
    document.querySelectorAll('[data-vocab-recall-controls]').forEach(el => el.remove());
  }

  function clearVocabularyRecallButton() {
    document.querySelector('#vocabRecallBtn')?.remove();
  }

  function resetVocabularyRecall({ removeButton = true } = {}) {
    vocabularyRecallAttempts = [];
    vocabularyRecallIndex = -1;
    vocabularyRecallLoading = false;
    clearVocabularyRecallControls();
    document.querySelector('#vocabRecallMessage')?.remove();
    if (removeButton) clearVocabularyRecallButton();
  }

  function showVocabularyRecallMessage(message) {
    let el = document.querySelector('#vocabRecallMessage');
    if (!el) {
      el = document.createElement('div');
      el.id = 'vocabRecallMessage';
      el.className = 'vocab-recall-message';
      document.querySelector('#result')?.insertAdjacentElement('afterend', el);
    }
    if (!el) return;
    el.textContent = message;
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => el.remove(), 3200);
  }

  function updateVocabularyRecallControls() {
    if (vocabularyRecallIndex < 0 || vocabularyRecallIndex >= vocabularyRecallAttempts.length) return;
    const attempt = vocabularyRecallAttempts[vocabularyRecallIndex];
    const time = formatVocabularyRecallTime(attempt?.submittedAt);
    const label = `第 ${vocabularyRecallIndex + 1} / ${vocabularyRecallAttempts.length} 次${time ? `｜${time}` : ''}`;

    document.querySelectorAll('[data-vocab-recall-controls]').forEach(controls => {
      const position = controls.querySelector('[data-vocab-recall-position]');
      const older = controls.querySelector('[data-vocab-recall-older]');
      const newer = controls.querySelector('[data-vocab-recall-newer]');
      if (position) position.textContent = label;
      if (older) older.disabled = vocabularyRecallIndex >= vocabularyRecallAttempts.length - 1;
      if (newer) newer.disabled = vocabularyRecallIndex <= 0;
    });
  }

  function wireVocabularyRecallControls(controls) {
    controls.querySelector('[data-vocab-recall-older]')?.addEventListener('click', () => {
      if (vocabularyRecallIndex >= vocabularyRecallAttempts.length - 1) return;
      vocabularyRecallIndex += 1;
      renderVocabularyRecallAttempt();
    });
    controls.querySelector('[data-vocab-recall-newer]')?.addEventListener('click', () => {
      if (vocabularyRecallIndex <= 0) return;
      vocabularyRecallIndex -= 1;
      renderVocabularyRecallAttempt();
    });
  }

  function createVocabularyRecallControls() {
    const controls = document.createElement('div');
    controls.dataset.vocabRecallControls = '1';
    controls.className = 'vocab-recall-controls';
    controls.innerHTML = `
      <button type="button" class="secondary" data-vocab-recall-older>前一次</button>
      <span class="vocab-recall-position" data-vocab-recall-position></span>
      <button type="button" class="secondary" data-vocab-recall-newer>後一次</button>
    `;
    wireVocabularyRecallControls(controls);
    return controls;
  }

  function ensureVocabularyRecallControls() {
    if (!document.querySelector('#vocabRecallControlsTop')) {
      const top = createVocabularyRecallControls();
      top.id = 'vocabRecallControlsTop';
      document.querySelector('#quiz')?.insertAdjacentElement('beforebegin', top);
    }
    if (!document.querySelector('#vocabRecallControlsBottom')) {
      const bottom = createVocabularyRecallControls();
      bottom.id = 'vocabRecallControlsBottom';
      const actions = document.querySelector('#examScreen .actions');
      if (actions) actions.insertAdjacentElement('beforebegin', bottom);
    }
    updateVocabularyRecallControls();
  }

  function renderVocabularyRecallAttempt() {
    if (window.examContextCurrent?.examType !== 'gept-vocabulary-memory') return;
    if (vocabularyRecallIndex < 0 || vocabularyRecallIndex >= vocabularyRecallAttempts.length) return;
    const attempt = vocabularyRecallAttempts[vocabularyRecallIndex];
    const items = Array.isArray(attempt?.vocabularyItems) ? attempt.vocabularyItems : [];
    const quiz = document.querySelector('#quiz');
    if (!quiz || !items.length) return;

    clearVocabularyHistoryAnnotations();

    quiz.innerHTML = items.map((item, index) => {
      const selectedIndex = item.selectedIndex === null || item.selectedIndex === undefined
        ? null
        : Number(item.selectedIndex);
      const correctIndex = item.correctIndex === null || item.correctIndex === undefined
        ? null
        : Number(item.correctIndex);
      const result = item.result || 'unanswered';
      const resultLabel = result === 'correct' ? '正確' : result === 'incorrect' ? '錯誤' : '未作答';
      const selectedLabel = item.selectedDisplayLabel || (selectedIndex === null ? '' : ['A','B','C','D'][selectedIndex]);
      const historyLabel = selectedLabel
        ? `當時：選 ${selectedLabel}｜${resultLabel}`
        : `當時：${resultLabel}`;
      const cardClass = result === 'incorrect' ? 'card vocab-recall-wrong' : 'card';

      const options = (item.options || []).map((option, optionIndex) => {
        const classes = ['option'];
        if (optionIndex === correctIndex) classes.push('correct');
        if (optionIndex === selectedIndex && result === 'incorrect') classes.push('wrong');
        const checked = optionIndex === selectedIndex ? ' checked' : '';
        return `<label class="${classes.join(' ')}"><input type="radio" disabled${checked}>(${['A','B','C','D'][optionIndex] || '?'}) ${escapeHtml(option)}</label>`;
      }).join('');

      return `<section class="${cardClass}" data-q="${index}">
        <div class="qtitle"><span class="num">${item.number || index + 1}</span><span class="question-text">${escapeHtml(item.question || item.chinese || '')}</span></div>
        <div class="vocab-recall-answer ${result === 'incorrect' ? 'wrong' : result === 'correct' ? 'correct' : 'unanswered'}">${escapeHtml(historyLabel)}</div>
        ${options}
        ${item.explanation ? `<div class="explain show"><b>答案：${escapeHtml(item.correctDisplayLabel || '')}</b>　${escapeHtml(item.explanation)}</div>` : ''}
      </section>`;
    }).join('');

    const result = document.querySelector('#result');
    if (result) {
      result.style.display = 'block';
      const scoreText = attempt.score == null
        ? `${Number(attempt.correct || 0)} / ${Number(attempt.total || items.length)} 題`
        : `${Number(attempt.score || 0)} 分`;
      result.innerHTML = `<div>字庫記憶歷史紀錄</div><strong>${scoreText}</strong><div>答對 ${Number(attempt.correct || 0)} / ${Number(attempt.total || items.length)} 題</div>`;
    }

    ensureVocabularyRecallControls();
    updateVocabularyRecallControls();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function enterVocabularyRecall() {
    if (window.examContextCurrent?.examType !== 'gept-vocabulary-memory') {
      vocabularyCurrentAttempt = null;
      resetVocabularyRecall();
      return;
    }
    if (vocabularyRecallLoading) return;
    const store = window.ChrisExamHistoryStore;
    if (!store?.loadVocabularyAttempts) {
      showVocabularyRecallMessage('字庫歷史紀錄目前無法讀取');
      return;
    }

    vocabularyRecallLoading = true;
    const button = document.querySelector('#vocabRecallBtn');
    if (button) {
      button.disabled = true;
      button.textContent = '載入回溯…';
    }

    try {
      const attempts = await store.loadVocabularyAttempts(50);
      vocabularyRecallAttempts = (attempts || []).filter(attempt => {
        if (attempt?.historyDomain !== 'vocabulary') return false;
        if (!Array.isArray(attempt?.vocabularyItems) || !attempt.vocabularyItems.length) return false;
        if (vocabularyCurrentAttempt?.submittedAt &&
            String(attempt.submittedAt || '') === String(vocabularyCurrentAttempt.submittedAt || '')) return false;
        return true;
      });

      if (!vocabularyRecallAttempts.length) {
        showVocabularyRecallMessage('沒有可回溯的較早字庫考試；舊版紀錄未保存完整題組');
        return;
      }

      vocabularyRecallIndex = 0;
      renderVocabularyRecallAttempt();
    } catch (error) {
      console.warn('[vocab-memory] recall failed', error);
      showVocabularyRecallMessage('字庫歷史紀錄目前無法讀取');
    } finally {
      vocabularyRecallLoading = false;
      const currentButton = document.querySelector('#vocabRecallBtn');
      if (currentButton) {
        currentButton.disabled = false;
        currentButton.textContent = '回溯';
      }
    }
  }

  function ensureVocabularyRecallButton() {
    if (window.examContextCurrent?.examType !== 'gept-vocabulary-memory') {
      clearVocabularyRecallButton();
      return null;
    }
    let button = document.querySelector('#vocabRecallBtn');
    if (button) return button;
    const actions = document.querySelector('#examScreen .actions');
    if (!actions) return null;
    button = document.createElement('button');
    button.type = 'button';
    button.id = 'vocabRecallBtn';
    button.className = 'secondary';
    button.textContent = '回溯';
    button.addEventListener('click', enterVocabularyRecall);
    const restart = actions.querySelector('#restartBtn');
    if (restart) actions.insertBefore(button, restart);
    else actions.appendChild(button);
    return button;
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
      .vocab-history{margin:8px 0 2px;width:max-content;max-width:100%;font-size:.84rem;line-height:1.45}
      .vocab-history.active{padding:4px 9px;border-radius:999px;background:#fef2f2;color:#b91c1c;font-weight:800}
      .vocab-history.submitted{padding:7px 10px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;color:#334155}
      .vocab-history-summary{font-weight:800}.vocab-history-last{margin-top:2px;color:#64748b}
      .vocab-recall-controls{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;margin:12px 0;padding:10px;border:1px solid #e2e8f0;border-radius:12px;background:#fff}
      .vocab-recall-position{font-weight:800;color:#334155}
      .vocab-recall-message{margin:10px 0;padding:9px 12px;border-radius:10px;background:#f8fafc;color:#475569;text-align:center;font-size:.9rem}
      .vocab-recall-answer{margin:7px 0;padding:7px 10px;border-radius:9px;font-size:.84rem;font-weight:800}
      .vocab-recall-answer.correct{background:#f0fdf4;color:#166534}
      .vocab-recall-answer.wrong{background:#fee2e2;color:#991b1b}
      .vocab-recall-answer.unanswered{background:#f8fafc;color:#64748b}
      .card.vocab-recall-wrong{border:2px solid #dc2626!important;background:#fef2f2!important}
      #quiz .explain{white-space:pre-line}
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
        vocabularySource: SOURCE_KEY,
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
      if (selected === null) return;
      const key = progressKey(item);
      const current = local[key] || blankProgress();
      const exposureCount = countOf(markov.exposure[item.wordNorm]);
      const targetCount = countOf(markov.targetCount[item.wordNorm]);

      local[key] = {
        reviewCount: Number(current.reviewCount || 0) + 1,
        wrongCount: Number(current.wrongCount || 0) + (isWrong ? 1 : 0),
        correctCount: Number(current.correctCount || 0) + (isCorrect ? 1 : 0),
        unansweredCount: Number(current.unansweredCount || 0),
        exposureCount,
        targetCount,
        lastSelectedLabel: ['A','B','C','D'][selected] || '',
        lastResult: isCorrect ? 'correct' : 'incorrect',
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
          exposureCount: update.exposureCount,
          targetCount: update.targetCount,
          lastSelectedLabel: ['A','B','C','D'][update.selected] || '',
          lastResult: update.isCorrect ? 'correct' : 'incorrect',
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

  document.addEventListener('exam:started', event => {
    if (event.detail?.examType !== 'gept-vocabulary-memory') {
      vocabularyCurrentAttempt = null;
      resetVocabularyRecall();
      clearVocabularyHistoryAnnotations();
      return;
    }
    if (!activeSession || activeSession.key !== event.detail.key) return;
    vocabularyCurrentAttempt = null;
    resetVocabularyRecall();
    renderVocabularyHistory(false);
  });

  document.addEventListener('exam:submitted', event => {
    if (event.detail?.examType !== 'gept-vocabulary-memory') return;
    if (!activeSession || activeSession.key !== event.detail.key) return;
    renderVocabularyHistory(true);
    persistSessionProgress(activeSession);
  });

  document.addEventListener('exam:attempt-recorded', event => {
    const attempt = event.detail?.attempt || null;
    if (attempt?.historyDomain !== 'vocabulary') return;
    if (window.examContextCurrent?.examType !== 'gept-vocabulary-memory') return;
    vocabularyCurrentAttempt = attempt;
    ensureVocabularyRecallButton();
  });

  document.addEventListener('exam:retry-started', () => {
    if (window.examContextCurrent?.examType !== 'gept-vocabulary-memory') return;
    vocabularyCurrentAttempt = null;
    resetVocabularyRecall();
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
    answeredCount,
    formatActiveHistory,
    formatSubmittedHistory,
    apiUrl: API_URL
  };
})();
