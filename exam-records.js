(() => {
  'use strict';

  const RECORDS_KEY = 'examRecords.v1';
  const TOKEN_KEY = 'examRecords.githubToken.session';
  const RECORD_REPO = 'chenlijon-dot/Exam-Record';
  const LETTERS = ['A','B','C','D'];

  let examStartedAt = null;
  let lastRecordedSignature = '';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function nowIso() { return new Date().toISOString(); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function safeJsonParse(s, fallback) { try { return JSON.parse(s); } catch { return fallback; } }
  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  function loadRecords() {
    return safeJsonParse(localStorage.getItem(RECORDS_KEY) || '[]', []);
  }

  function saveRecords(records) {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  }

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  }

  function setToken(token) {
    if (token) sessionStorage.setItem(TOKEN_KEY, token.trim());
    else sessionStorage.removeItem(TOKEN_KEY);
  }

  function formatLocalTime(iso) {
    try {
      return new Intl.DateTimeFormat('zh-TW', {
        year:'numeric', month:'2-digit', day:'2-digit',
        hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false
      }).format(new Date(iso));
    } catch { return iso; }
  }

  function difficultyFromTitle() {
    const txt = $('#examTitle')?.textContent || '';
    if (txt.includes('簡易')) return { key:'easy', label:'簡易' };
    if (txt.includes('中等')) return { key:'medium', label:'中等' };
    if (txt.includes('困難')) return { key:'hard', label:'困難' };
    return { key:'unknown', label:'未分類' };
  }

  function currentContext() {
    return window.examContextCurrent || {};
  }

  function captureAttempt(submissionDetail = {}) {
    const allCards = $$('.card[data-q]');
    const cards = allCards.filter(card => card.dataset.questionType !== 'manual-study');
    const manualStudyCount = allCards.length - cards.length;
    if (!cards.length) return null;

    const ctx = currentContext();
    const fallbackDiff = difficultyFromTitle();
    const isAccuracyExam = ctx.scoreMode === 'percent' || ctx.examType === true;
    const isVocabularyExam = ctx.examType === 'gept-vocabulary-memory';
    const handwritingByIndex = new Map(
      (submissionDetail.handwritingResults || []).map(item => [Number(item.index), item])
    );

    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    const historyAnswers = [];
    const vocabularyItems = [];

    cards.forEach((card, idx) => {
      const sourceIndex = Number(card.dataset.q ?? idx);
      const source = (typeof questions !== 'undefined' && questions[sourceIndex]) ? questions[sourceIndex] : {};
      const questionType = card.dataset.questionType || 'mcq';
      const questionId = source.questionId == null ? '' : String(source.questionId);
      const questionRevision = Number(source.revision || 1);
      const question = $('.question-text', card)?.textContent.trim()
        || $('.qtitle', card)?.textContent.replace(/^\s*\d+\s*/, '').trim()
        || `第${idx+1}題`;
      const explanation = $('.explain', card)?.textContent.replace(/^答案：\s*[A-D]\s*/,'').trim() || '';
      const number = Number(card.dataset.questionNumber || source.number || idx + 1);

      if (questionType === 'handwriting' || card.dataset.openResponse === '1') {
        const grading = handwritingByIndex.get(sourceIndex) || {};
        const verdict = grading.verdict || 'unanswered';

        if (verdict === 'correct') correct++;
        else if (verdict === 'incorrect') incorrect++;
        else unanswered++;

        if (questionId) {
          historyAnswers.push({
            questionId,
            questionRevision,
            questionType,
            gradingMode: grading.gradingMode || source.gradingMode || '',
            number,
            question,
            prompt: source.prompt || '',
            options: [],
            selectedIndex: null,
            selectedDisplayIndex: null,
            selectedCanonicalIndex: null,
            selectedLetter: null,
            selectedDisplayLabel: null,
            selectedText: grading.recognizedAnswer || '',
            studentAnswer: grading.recognizedAnswer || '',
            recognizedWork: grading.recognizedWork || '',
            correctIndex: null,
            correctCanonicalIndex: null,
            correctLetter: null,
            correctText: source.referenceAnswer || source.expectedAnswer || source.manualAnswer || (Array.isArray(source.acceptedAnswers) ? source.acceptedAnswers[0] : '') || '',
            acceptedAnswers: Array.isArray(source.acceptedAnswers) ? source.acceptedAnswers : [],
            isCorrect: verdict === 'correct',
            result: verdict,
            gradingResult: {
              verdict,
              errorStep: grading.errorStep || '',
              whyWrong: grading.whyWrong || '',
              correction: grading.correction || '',
              nextHint: grading.nextHint || '',
              feedback: grading.feedback || '',
              confidence: Number(grading.confidence ?? 0),
              modelName: grading.modelName || ''
            },
            explanation,
            intro: source.intro || '',
            introLabel: source.introLabel || '',
            image: source.image || '',
            imageAlt: source.imageAlt || ''
          });
        }
        return;
      }

      const selected = $('input[type=radio]:checked', card);
      const selectedIndex = selected ? Number(selected.value) : null;
      const correctLabel = $('.option.correct', card);
      const correctInput = correctLabel ? $('input[type=radio]', correctLabel) : null;
      const correctIndex = correctInput ? Number(correctInput.value) : null;
      const options = $$('.option', card).map(o => o.textContent.trim().replace(/^\([A-D]\)\s*/, ''));
      const isCorrect = selectedIndex !== null && correctIndex !== null && selectedIndex === correctIndex;
      const canonicalIndices = Array.isArray(source.optionCanonicalIndices) &&
        source.optionCanonicalIndices.length === options.length
        ? source.optionCanonicalIndices
        : options.map((_, optionIndex) => optionIndex);
      const selectedCanonicalIndex = selectedIndex === null
        ? null
        : Number(canonicalIndices[selectedIndex] ?? selectedIndex);
      const correctCanonicalIndex = correctIndex === null
        ? null
        : Number(canonicalIndices[correctIndex] ?? correctIndex);

      if (selectedIndex === null) unanswered++;
      else if (isCorrect) correct++;
      else incorrect++;

      if (isVocabularyExam && source.vocabId != null) {
        vocabularyItems.push({
          vocabId: String(source.vocabId),
          number,
          question,
          chinese: source.chinese || question,
          word: source.word || '',
          wordNorm: source.wordNorm || '',
          options,
          selectedIndex,
          selectedDisplayLabel: selectedIndex === null ? '' : LETTERS[selectedIndex],
          correctIndex,
          correctDisplayLabel: correctIndex === null ? '' : LETTERS[correctIndex],
          selectedText: selectedIndex === null ? '' : (options[selectedIndex] || ''),
          correctText: correctIndex === null ? '' : (options[correctIndex] || ''),
          result: selectedIndex === null
            ? 'unanswered'
            : (isCorrect ? 'correct' : 'incorrect'),
          explanation
        });
      }

      if (!questionId || selectedIndex === null || correctIndex === null) return;

      historyAnswers.push({
        questionId,
        questionRevision,
        questionType,
        number,
        question,
        options,
        selectedIndex,
        selectedDisplayIndex: selectedIndex,
        selectedCanonicalIndex,
        selectedLetter: LETTERS[selectedIndex],
        selectedDisplayLabel: LETTERS[selectedIndex],
        selectedText: options[selectedIndex],
        correctIndex,
        correctCanonicalIndex,
        correctLetter: LETTERS[correctIndex],
        correctText: options[correctIndex],
        isCorrect,
        result: isCorrect ? 'correct' : 'incorrect',
        explanation,
        intro: source.intro || '',
        introLabel: source.introLabel || '',
        image: source.image || '',
        imageAlt: source.imageAlt || ''
      });
    });

    const submittedAt = nowIso();
    const durationSeconds = examStartedAt ? Math.max(0, Math.round((Date.now() - examStartedAt) / 1000)) : 0;
    const total = cards.length;
    const accuracyPercent = total ? Number((correct * 100 / total).toFixed(1)) : 0;
    const pointsPerQuestion = Number(ctx.pointsPerQuestion ?? 5);
    const score = isAccuracyExam ? null : correct * pointsPerQuestion;
    const historyDomain = ctx.examType === 'gept-vocabulary-memory' ? 'vocabulary' : 'question';

    return {
      schemaVersion: 3,
      historyDomain,
      recordType: isAccuracyExam ? 'past-exam' : 'practice',
      metricType: isAccuracyExam ? 'accuracy' : 'score',
      examKey: ctx.key || ctx.difficulty || fallbackDiff.key,
      examTypeLabel: ctx.examTypeLabel || '',
      examYear: ctx.examYear ?? null,
      examSession: ctx.examSession || '',
      examSessionLabel: ctx.examSessionLabel || '',
      subject: ctx.subject || (isAccuracyExam ? 'unknown' : 'science'),
      subjectLabel: ctx.subjectLabel || (isAccuracyExam ? '未分類科目' : '國一自然'),
      unit: ctx.unit || (isAccuracyExam ? ($('#examTitle')?.textContent || '歷屆考題') : '科學方法'),
      difficulty: ctx.difficulty || fallbackDiff.key,
      difficultyLabel: ctx.difficultyLabel || fallbackDiff.label,
      analysisEligible: ctx.analysisEligible !== false,
      submittedAt,
      durationSeconds,
      score,
      accuracyPercent,
      correct,
      incorrect,
      unanswered,
      total,
      manualStudyCount,
      vocabularySource: isVocabularyExam ? (ctx.vocabularySource || '') : '',
      vocabularyItems,
      answers: historyAnswers,
      wrongAnswers: historyAnswers.filter(answer => answer.result === 'incorrect')
    };
  }

  function makeSignature(attempt) {
    return `${attempt.examKey}|${attempt.metricType}|${attempt.correct}|${attempt.incorrect}|${attempt.unanswered}|${attempt.answers.map(a => a.selectedIndex ?? 'x').join(',')}`;
  }

  function storeAttemptLocally(attempt) {
    const sig = makeSignature(attempt);
    if (sig === lastRecordedSignature) return false;
    lastRecordedSignature = sig;

    const records = loadRecords();
    records.unshift(attempt);
    saveRecords(records.slice(0, 300));
    return true;
  }

  function utf8ToBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
  }

  async function githubApi(path, options = {}) {
    const token = getToken();
    if (!token) throw new Error('尚未設定 GitHub Token');
    const response = await fetch(`https://api.github.com${path}`, {
      ...options,
      headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {})
      }
    });
    if (!response.ok) {
      let detail = '';
      try { detail = (await response.json()).message || ''; } catch {}
      throw new Error(`GitHub ${response.status}${detail ? `：${detail}` : ''}`);
    }
    return response.status === 204 ? null : response.json();
  }

  function recordPath(attempt) {
    const d = new Date(attempt.submittedAt);
    const ym = `${d.getFullYear()}-${pad(d.getMonth()+1)}`;
    const ts = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    const suffix = Math.random().toString(36).slice(2,7);
    const key = String(attempt.examKey || attempt.difficulty || 'exam').replace(/[^a-zA-Z0-9_-]+/g,'-');
    return `records/${ym}/${ts}_${key}_${suffix}.json`;
  }

  async function syncAttempt(attempt) {
    const path = recordPath(attempt);
    const resultLabel = attempt.metricType === 'accuracy'
      ? `${attempt.correct}/${attempt.total} (${attempt.accuracyPercent}%)`
      : `${attempt.score} points`;
    return githubApi(`/repos/${RECORD_REPO}/contents/${path}`, {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        message: `Record ${attempt.difficultyLabel} result ${resultLabel}`,
        content: utf8ToBase64(JSON.stringify(attempt, null, 2)),
        branch: 'main'
      })
    });
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .record-tools{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
      .record-btn{border:1px solid #dfe5ee;background:#fff;color:#172033;border-radius:12px;padding:12px 10px;font-weight:700;cursor:pointer}
      .record-btn:hover{background:#f8fbff;border-color:#93b4fb}
      .record-modal{position:fixed;inset:0;background:rgba(15,23,42,.62);display:none;align-items:center;justify-content:center;padding:14px;z-index:9999}
      .record-modal.show{display:flex}
      .record-box{background:#fff;width:min(820px,100%);max-height:88vh;overflow:auto;border-radius:18px;padding:18px;box-shadow:0 24px 60px rgba(0,0,0,.25)}
      .record-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}
      .record-close{background:#e2e8f0;color:#1e293b;padding:8px 12px;border-radius:10px}
      .record-table{width:100%;border-collapse:collapse;font-size:.94rem}
      .record-table th,.record-table td{border-bottom:1px solid #e5e7eb;padding:9px 7px;text-align:left;vertical-align:top}
      .record-chip{display:inline-block;padding:3px 8px;border-radius:999px;background:#eef4ff;color:#1d4ed8;font-size:.82rem}
      .record-chip.past{background:#f0fdf4;color:#166534}
      .wrong-item{border:1px solid #e5e7eb;border-radius:12px;padding:12px;margin:9px 0;background:#fff}
      .wrong-count{font-size:.82rem;background:#fef2f2;color:#b91c1c;padding:3px 7px;border-radius:999px;white-space:nowrap}
      .sync-status{margin-top:8px;font-size:.9rem;color:#657089}
      .token-input{width:100%;padding:11px;border:1px solid #cbd5e1;border-radius:10px;font:inherit}
      .record-note{font-size:.88rem;color:#64748b;margin-top:8px}
      .wrong-image{margin:10px 0;border:1px solid #dbe3ef;border-radius:10px;padding:7px;background:#fff;text-align:center}
      .wrong-image img{max-width:100%;height:auto;border-radius:6px}
      .wrong-passage{white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px;margin-top:8px;font-size:.9rem;line-height:1.7}
      @media(max-width:620px){.record-tools{grid-template-columns:1fr}.record-table{font-size:.82rem}.record-table th:nth-child(2),.record-table td:nth-child(2){display:none}}
    `;
    document.head.appendChild(style);
  }

  function makeModal(id, title) {
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'record-modal';
    modal.innerHTML = `<div class="record-box"><div class="record-head"><h2 style="margin:0">${title}</h2><button class="record-close">關閉</button></div><div class="record-content"></div></div>`;
    $('.record-close', modal).addEventListener('click', () => modal.classList.remove('show'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });
    document.body.appendChild(modal);
    return modal;
  }

  function addStartMenuTools() {
    const panel = $('#startScreen .panel');
    if (!panel || $('#recordTools')) return;
    const tools = document.createElement('div');
    tools.id = 'recordTools';
    tools.className = 'record-tools';
    tools.innerHTML = `
      <button class="record-btn" id="historyBtn">📊 作答紀錄</button>
      <button class="record-btn" id="wrongBtn">📝 錯題複習</button>
      <button class="record-btn" id="syncBtn">☁️ GitHub 同步設定</button>
    `;
    panel.appendChild(tools);
    $('#historyBtn').addEventListener('click', showHistory);
    $('#wrongBtn').addEventListener('click', showWrongAnswers);
    $('#syncBtn').addEventListener('click', showSyncSettings);
  }

  function metricTypeOf(r) {
    return r.metricType || (r.recordType === 'past-exam' ? 'accuracy' : 'score');
  }

  function recordTitle(r) {
    if (r.recordType === 'past-exam' || metricTypeOf(r) === 'accuracy') {
      const parts = [];
      if (r.examYear != null) parts.push(`${r.examYear}年`);
      if (r.examSessionLabel) parts.push(r.examSessionLabel);
      if (r.subjectLabel) parts.push(r.subjectLabel);
      return parts.join(' ') || r.unit || r.difficultyLabel || '歷屆考題';
    }
    return `${r.subjectLabel || r.subject || '題庫'}｜${r.unit || r.difficultyLabel || ''}`;
  }

  function resultText(r) {
    if (metricTypeOf(r) === 'accuracy') {
      const pct = Number.isFinite(Number(r.accuracyPercent))
        ? Number(r.accuracyPercent)
        : (r.total ? Number((Number(r.correct || 0) * 100 / Number(r.total)).toFixed(1)) : 0);
      return `<b>${Number(r.correct || 0)} / ${Number(r.total || 0)}</b><div class="record-note">正確率 ${pct}%</div>`;
    }
    return `<b>${Number(r.score || 0)} 分</b>`;
  }

  function showHistory() {
    const records = loadRecords();
    const modal = $('#historyModal');
    const content = $('.record-content', modal);
    if (!records.length) {
      content.innerHTML = '<p>目前還沒有作答紀錄。完成一次考試後，紀錄會出現在這裡。</p>';
    } else {
      const past = records.filter(r => metricTypeOf(r) === 'accuracy');
      const practice = records.filter(r => metricTypeOf(r) !== 'accuracy');
      const summary = [];
      summary.push(`<b>共 ${records.length} 次作答</b>`);
      if (past.length) {
        const avg = past.reduce((s,r) => s + Number(r.accuracyPercent ?? (r.total ? (r.correct * 100 / r.total) : 0)), 0) / past.length;
        summary.push(`歷屆平均正確率 ${avg.toFixed(1)}%`);
      }
      if (practice.length) {
        const scored = practice.filter(r => Number.isFinite(Number(r.score)));
        if (scored.length) summary.push(`練習題平均 ${Math.round(scored.reduce((s,r)=>s+Number(r.score),0)/scored.length)} 分`);
      }
      content.innerHTML = `<p>${summary.join('｜')}</p><table class="record-table"><thead><tr><th>時間</th><th>類型</th><th>測驗</th><th>結果</th><th>答錯</th><th>未答</th><th>時間</th></tr></thead><tbody>${records.map(r => {
        const isPast = metricTypeOf(r) === 'accuracy';
        return `<tr><td>${formatLocalTime(r.submittedAt)}</td><td><span class="record-chip ${isPast?'past':''}">${isPast?'歷屆':'練習'}</span></td><td>${escapeHtml(recordTitle(r))}</td><td>${resultText(r)}</td><td>${Number(r.incorrect || 0)}</td><td>${Number(r.unanswered || 0)}</td><td>${Math.floor((r.durationSeconds||0)/60)}分${(r.durationSeconds||0)%60}秒</td></tr>`;
      }).join('')}</tbody></table>`;
    }
    modal.classList.add('show');
  }

  function aggregateWrongAnswers() {
    const map = new Map();
    loadRecords().forEach(r => {
      (r.wrongAnswers || []).filter(a => a.selectedIndex !== null && a.selectedLetter !== null).forEach(a => {
        const key = `${r.examKey || r.difficulty}|${a.number || ''}|${a.question}`;
        if (!map.has(key)) {
          map.set(key, {
            ...a,
            examKey:r.examKey || r.difficulty,
            recordType:r.recordType || 'practice',
            metricType:metricTypeOf(r),
            examYear:r.examYear,
            examSessionLabel:r.examSessionLabel,
            subjectLabel:r.subjectLabel,
            unit:r.unit,
            difficultyLabel:r.difficultyLabel,
            count:0,
            last:r.submittedAt
          });
        }
        const x = map.get(key);
        x.count++;
        if (r.submittedAt > x.last) {
          x.last = r.submittedAt;
          x.selectedLetter = a.selectedLetter;
          x.selectedText = a.selectedText;
        }
      });
    });
    return [...map.values()].sort((a,b) => b.count - a.count || b.last.localeCompare(a.last));
  }

  function wrongSourceLabel(x) {
    if (x.metricType === 'accuracy' || x.recordType === 'past-exam') {
      const parts = [];
      if (x.examYear != null) parts.push(`${x.examYear}年`);
      if (x.examSessionLabel) parts.push(x.examSessionLabel);
      if (x.subjectLabel) parts.push(x.subjectLabel);
      if (x.number) parts.push(`第${x.number}題`);
      return parts.join('｜') || x.difficultyLabel || '歷屆考題';
    }
    return `${x.difficultyLabel || '練習'}${x.number ? `｜第${x.number}題` : ''}`;
  }

  function showWrongAnswers() {
    const list = aggregateWrongAnswers();
    const modal = $('#wrongModal');
    const content = $('.record-content', modal);
    if (!list.length) {
      content.innerHTML = '<p>目前沒有錯題紀錄。漂亮！</p>';
    } else {
      content.innerHTML = `<p>目前累積 <b>${list.length}</b> 個曾答錯題目，依錯誤次數排序。未作答題目不列入錯題。</p>${list.map(x => `
        <div class="wrong-item">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">
            <div><div class="record-note" style="margin:0 0 4px">${escapeHtml(wrongSourceLabel(x))}</div><b>${escapeHtml(x.question)}</b></div>
            <span class="wrong-count">錯 ${x.count} 次</span>
          </div>
          ${x.intro ? `<details style="margin-top:8px"><summary>查看題組文章</summary><div class="wrong-passage">${escapeHtml(x.intro)}</div></details>` : ''}
          ${x.image ? `<div class="wrong-image"><img src="${escapeHtml(x.image)}" alt="${escapeHtml(x.imageAlt || '題目附圖')}" loading="lazy"></div>` : ''}
          <div style="margin-top:7px">你最近選：${escapeHtml(x.selectedLetter)}. ${escapeHtml(x.selectedText)}</div>
          <div>正解：<b>${escapeHtml(x.correctLetter)}. ${escapeHtml(x.correctText)}</b></div>
          ${x.explanation ? `<div class="record-note">${escapeHtml(x.explanation)}</div>` : ''}
        </div>`).join('')}`;
    }
    modal.classList.add('show');
  }

  function showSyncSettings() {
    const modal = $('#syncModal');
    const content = $('.record-content', modal);
    const hasToken = !!getToken();
    content.innerHTML = `
      <p>資料庫：<b>${RECORD_REPO}</b>（Private）</p>
      <p>請輸入只對這個 repo 有 <b>Contents: Read and write</b> 權限的 fine-grained token。</p>
      <input id="tokenInput" class="token-input" type="password" autocomplete="off" placeholder="github_pat_..." value="">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <button id="saveTokenBtn" class="record-btn">儲存到本次瀏覽工作階段</button>
        <button id="testTokenBtn" class="record-btn">測試連線</button>
        <button id="clearTokenBtn" class="record-btn">清除 Token</button>
      </div>
      <div class="sync-status" id="syncStatus">目前：${hasToken ? '已設定 Token' : '尚未設定 Token'}。本機紀錄仍會正常保存。</div>
      <div class="record-note">安全設計：Token 只放在 sessionStorage，關閉瀏覽器分頁／工作階段後會消失，不寫入 GitHub 程式碼。</div>
    `;
    $('#saveTokenBtn').onclick = () => {
      const v = $('#tokenInput').value.trim();
      setToken(v);
      $('#syncStatus').textContent = v ? '已儲存，本次瀏覽工作階段會自動同步交卷紀錄。' : '未輸入 Token。';
    };
    $('#clearTokenBtn').onclick = () => { setToken(''); $('#tokenInput').value=''; $('#syncStatus').textContent='Token 已清除。'; };
    $('#testTokenBtn').onclick = async () => {
      const v = $('#tokenInput').value.trim(); if (v) setToken(v);
      const status = $('#syncStatus'); status.textContent='測試中…';
      try {
        const data = await githubApi(`/repos/${RECORD_REPO}`);
        status.textContent = `連線成功：${data.full_name}，visibility=${data.visibility}`;
      } catch (e) { status.textContent = `連線失敗：${e.message}`; }
    };
    modal.classList.add('show');
  }

  function showSyncToast(message, ok = true) {
    let el = $('#examSyncToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'examSyncToast';
      el.style.cssText = 'margin:10px 0;padding:10px 12px;border-radius:10px;font-size:.92rem';
      const result = $('#result');
      if (result) result.insertAdjacentElement('afterend', el);
    }
    el.style.background = ok ? '#f0fdf4' : '#fff7ed';
    el.style.color = ok ? '#166534' : '#9a3412';
    el.textContent = message;
  }

  function resetAttemptTimer() {
    examStartedAt = Date.now();
    lastRecordedSignature = '';
    $('#examSyncToast')?.remove();
  }

  function hookExamStart() {
    document.addEventListener('exam:started', resetAttemptTimer);
    document.addEventListener('exam:retry-started', resetAttemptTimer);
    document.querySelectorAll('.difficulty').forEach(btn => btn.addEventListener('click', resetAttemptTimer));
  }

  function hookSubmission() {
    document.addEventListener('exam:submitted', async event => {
      const detail = event.detail || {};
      const attempt = captureAttempt(detail);
      if (!attempt) return;
      const added = storeAttemptLocally(attempt);
      if (!added) return;

      document.dispatchEvent(new CustomEvent('exam:attempt-recorded', {
        detail: { attempt }
      }));

      if (!getToken()) {
        showSyncToast('✓ 作答紀錄與錯題已存到這台裝置。');
        return;
      }
      showSyncToast('本機紀錄已保存，正在同步到 GitHub…');
      try {
        await syncAttempt(attempt);
        showSyncToast('✓ 作答紀錄與錯題已同步到私人 GitHub 資料庫。');
      } catch (err) {
        showSyncToast(`本機紀錄已保存，但 GitHub 同步失敗：${err.message}`, false);
      }
    });
  }
  function init() {
    injectStyles();
    makeModal('historyModal', '作答紀錄');
    makeModal('wrongModal', '錯題複習');
    makeModal('syncModal', 'GitHub 同步設定');
    addStartMenuTools();
    hookExamStart();
    hookSubmission();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
