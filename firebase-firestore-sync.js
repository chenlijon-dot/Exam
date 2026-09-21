(() => {
  'use strict';

  const FIREBASE_VERSION = '12.19.0';
  const RECORDS_KEY = 'examRecords.v1';
  let db = null;
  let firestore = null;
  let activeUser = null;
  let lastSyncedFingerprint = '';
  const pendingAttempts = [];

  const firebaseConfig = {
    apiKey: 'AIzaSyDkZOlQjmoVnkIz3Q1ppg_EJnCp5W3qNFQ',
    authDomain: 'chrisexamplatform.firebaseapp.com',
    projectId: 'chrisexamplatform',
    storageBucket: 'chrisexamplatform.firebasestorage.app',
    messagingSenderId: '682858985440',
    appId: '1:682858985440:web:22dfbf5f0c635728675d85',
    measurementId: 'G-WHXW4FDXBB'
  };

  function fingerprint(attempt) {
    if (!attempt) return '';
    const answers = Array.isArray(attempt.answers)
      ? attempt.answers.map(a => a?.selectedIndex ?? 'x').join(',')
      : '';
    return [
      attempt.submittedAt || '',
      attempt.examKey || '',
      attempt.correct ?? '',
      attempt.incorrect ?? '',
      attempt.unanswered ?? '',
      answers
    ].join('|');
  }

  function cleanForFirestore(value) {
    // Firestore rejects undefined. JSON round-trip also gives us a plain object.
    return JSON.parse(JSON.stringify(value));
  }

  function showStatus(message, ok = true) {
    let el = document.getElementById('firebaseLearningSyncStatus');
    if (!el) {
      el = document.createElement('div');
      el.id = 'firebaseLearningSyncStatus';
      el.style.cssText = [
        'position:fixed',
        'left:12px',
        'bottom:12px',
        'z-index:2147482999',
        'max-width:min(420px,calc(100vw - 24px))',
        'padding:8px 11px',
        'border-radius:10px',
        'font:600 12px/1.35 system-ui,-apple-system,"Segoe UI","Noto Sans TC",sans-serif',
        'box-shadow:0 5px 18px rgba(15,23,42,.10)'
      ].join(';');
      document.body.appendChild(el);
    }
    el.style.background = ok ? '#f0fdf4' : '#fff7ed';
    el.style.color = ok ? '#166534' : '#9a3412';
    el.textContent = message;
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => el.remove(), 5000);
  }

  async function writeAttempt(attempt) {
    if (!attempt) return;
    if (!activeUser?.uid || !db || !firestore) {
      pendingAttempts.push(attempt);
      return;
    }

    const fp = fingerprint(attempt);
    if (!fp || fp === lastSyncedFingerprint) return;
    lastSyncedFingerprint = fp;

    const payload = cleanForFirestore({
      ...attempt,
      firebaseUid: activeUser.uid,
      userEmail: activeUser.email || '',
      cloudSchemaVersion: 1,
      syncedAtClient: new Date().toISOString()
    });

    try {
      const attemptsRef = firestore.collection(db, 'users', activeUser.uid, 'attempts');
      await firestore.addDoc(attemptsRef, {
        ...payload,
        syncedAt: firestore.serverTimestamp()
      });
      showStatus('✓ 學習歷程已同步到 Firebase');
      window.dispatchEvent(new CustomEvent('chrisexam-firestore-synced', {
        detail: { attempt: payload }
      }));
    } catch (error) {
      console.error('[FirestoreSync] write failed', error);
      lastSyncedFingerprint = '';
      showStatus(`Firebase 同步失敗：${error?.code || error?.message || error}`, false);
    }
  }

  async function flushPending() {
    if (!activeUser?.uid || !db || !firestore || !pendingAttempts.length) return;
    const queue = pendingAttempts.splice(0, pendingAttempts.length);
    for (const attempt of queue) {
      await writeAttempt(attempt);
    }
  }

  function captureNewestRecord(raw) {
    try {
      const records = JSON.parse(raw || '[]');
      if (!Array.isArray(records) || !records.length) return;
      writeAttempt(records[0]);
    } catch (error) {
      console.warn('[FirestoreSync] unable to parse local records', error);
    }
  }

  function hookLocalRecordWrites() {
    if (window.__chrisExamFirestoreLocalStorageHooked) return;
    window.__chrisExamFirestoreLocalStorageHooked = true;

    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      originalSetItem.call(this, key, value);
      if (this === window.localStorage && key === RECORDS_KEY) {
        setTimeout(() => captureNewestRecord(value), 0);
      }
    };
  }

  function clampHistoryLimit(limitCount = 50) {
    return Math.max(1, Math.min(Number(limitCount) || 50, 50));
  }

  function localAttempts() {
    try {
      const records = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
      return Array.isArray(records) ? records : [];
    } catch {
      return [];
    }
  }

  function historyAttemptKey(attempt) {
    return fingerprint(attempt) || [
      attempt?.examKey || '',
      attempt?.submittedAt || '',
      attempt?.historyDomain || ''
    ].join('|');
  }

  function mergeHistoryAttempts(...sources) {
    const map = new Map();
    for (const source of sources) {
      for (const attempt of source || []) {
        if (!attempt) continue;
        const key = historyAttemptKey(attempt);
        if (!key || map.has(key)) continue;
        map.set(key, attempt);
      }
    }
    return [...map.values()].sort((a, b) =>
      String(b?.submittedAt || '').localeCompare(String(a?.submittedAt || ''))
    );
  }

  async function cloudQuestionAttempts() {
    if (!activeUser?.uid || !db || !firestore) return [];

    const attemptsRef = firestore.collection(db, 'users', activeUser.uid, 'attempts');
    const historyQuery = firestore.query(
      attemptsRef,
      firestore.where('historyDomain', '==', 'question')
    );
    const snapshot = await firestore.getDocs(historyQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async function cloudExamAttempts(examKey) {
    if (!activeUser?.uid || !db || !firestore) return [];

    const attemptsRef = firestore.collection(db, 'users', activeUser.uid, 'attempts');
    const historyQuery = firestore.query(
      attemptsRef,
      firestore.where('examKey', '==', examKey)
    );
    const snapshot = await firestore.getDocs(historyQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async function loadRecentQuestionAttempts(limitCount = 50) {
    const limitValue = clampHistoryLimit(limitCount);
    const local = localAttempts().filter(attempt => attempt?.historyDomain === 'question');

    let cloud = [];
    try {
      cloud = await cloudQuestionAttempts();
    } catch (error) {
      console.warn('[FirestoreSync] recent question history cloud read unavailable; using local fallback', error);
    }

    return mergeHistoryAttempts(cloud, local).slice(0, limitValue);
  }

  async function loadExamAttempts(examKey, limitCount = 50) {
    const normalizedExamKey = String(examKey || '').trim();
    if (!normalizedExamKey) return [];

    const limitValue = clampHistoryLimit(limitCount);
    const local = localAttempts().filter(attempt =>
      attempt?.historyDomain === 'question' &&
      String(attempt?.examKey || '') === normalizedExamKey
    );

    let cloud = [];
    try {
      cloud = (await cloudExamAttempts(normalizedExamKey)).filter(
        attempt => attempt?.historyDomain === 'question'
      );
    } catch (error) {
      console.warn('[FirestoreSync] same-exam history cloud read unavailable; using local fallback', error);
    }

    return mergeHistoryAttempts(cloud, local).slice(0, limitValue);
  }

  async function loadVocabularyAttempts(limitCount = 50) {
    const limitValue = clampHistoryLimit(limitCount);
    const local = localAttempts().filter(attempt =>
      attempt?.historyDomain === 'vocabulary'
    );

    let cloud = [];
    if (activeUser?.uid && db && firestore) {
      try {
        const attemptsRef = firestore.collection(db, 'users', activeUser.uid, 'attempts');
        const historyQuery = firestore.query(
          attemptsRef,
          firestore.where('historyDomain', '==', 'vocabulary')
        );
        const snapshot = await firestore.getDocs(historyQuery);
        cloud = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.warn('[FirestoreSync] vocabulary history cloud read unavailable; using local fallback', error);
      }
    }

    return mergeHistoryAttempts(cloud, local).slice(0, limitValue);
  }

  window.ChrisExamHistoryStore = {
    loadRecentQuestionAttempts,
    loadExamAttempts,
    loadVocabularyAttempts
  };

  async function initFirestore() {
    hookLocalRecordWrites();

    try {
      const appMod = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`);
      firestore = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`);

      const app = appMod.getApps().length
        ? appMod.getApp()
        : appMod.initializeApp(firebaseConfig);

      db = firestore.getFirestore(app);

      if (window.ChrisExamAuth?.authorized) {
        activeUser = window.ChrisExamAuth.user || {
          uid: window.ChrisExamAuth.uid,
          email: window.ChrisExamAuth.email
        };
      }

      window.addEventListener('chrisexam-auth-ready', event => {
        const detail = event.detail || {};
        activeUser = detail.user || {
          uid: detail.uid,
          email: detail.email
        };
        flushPending();
      });

      await flushPending();
      window.dispatchEvent(new CustomEvent('chrisexam-firestore-ready'));
      console.info('[FirestoreSync] ready');
    } catch (error) {
      console.error('[FirestoreSync] init failed', error);
      showStatus('Firebase 學習歷程模組載入失敗', false);
    }
  }

  initFirestore();
})();
