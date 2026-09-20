(() => {
  'use strict';

  const SCHOOL_BANK_PATH = 'chapter-bank/science/7-1/unit-01/section-02/school-exams.json';
  const SELF_STUDY_BANK_PATH = 'chapter-bank/science/7-1/unit-01/section-02/self-study.json';
  const $ = (sel, root = document) => root.querySelector(sel);

  let unitViewFragment = null;
  let savedHeaderTitle = '';
  let savedHeaderSub = '';
  let savedDocumentTitle = '';

  const PRACTICE_LEVELS = {
    easy: {
      label: '簡易',
      icon: '🌱',
      desc: '基本觀念、科學方法步驟、簡單變因判讀。'
    },
    medium: {
      label: '中等',
      icon: '🌿',
      desc: '情境應用、實驗組與對照組、變因與結果判讀。'
    },
    hard: {
      label: '困難',
      icon: '🌳',
      desc: '資料判讀、實驗缺陷、控制變因與結論有效性。'
    }
  };

  function showCatalog() {
    $('#catalogShell')?.classList.remove('hidden');
    $('#startScreen')?.classList.add('hidden');
    $('#examScreen')?.classList.add('hidden');
    const result = $('#result');
    if (result) result.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function saveUnitView() {
    const content = $('#catalogContent');
    if (!content || unitViewFragment) return;

    unitViewFragment = document.createDocumentFragment();
    while (content.firstChild) unitViewFragment.appendChild(content.firstChild);

    savedHeaderTitle = $('#catalogHeaderTitle')?.textContent || '自然一上｜單元 1';
    savedHeaderSub = $('#catalogHeaderSub')?.textContent || '生命現象與科學探究';
    savedDocumentTitle = document.title;
  }

  function restoreUnitView() {
    const content = $('#catalogContent');
    if (!content || !unitViewFragment) return;

    content.replaceChildren();
    content.appendChild(unitViewFragment);
    unitViewFragment = null;

    const title = $('#catalogHeaderTitle');
    const sub = $('#catalogHeaderSub');
    if (title) title.textContent = savedHeaderTitle;
    if (sub) sub.textContent = savedHeaderSub;
    document.title = savedDocumentTitle || '單元 1 生命現象與科學探究｜自然一上';
    showCatalog();
  }

  function setPracticeContext(key) {
    const item = PRACTICE_LEVELS[key];
    if (!item) return;

    window.examContexts = window.examContexts || {};
    window.examContexts[key] = {
      key,
      title: `1-2 科學方法｜${item.label}`,
      subtitle: `自然七上｜單元 1 生命現象與科學探究｜1-2 科學方法｜${item.label}題庫`,
      subject: 'science',
      subjectLabel: '自然',
      semester: '7-1',
      semesterLabel: '七年級上學期',
      unitGroup: 'unit-01',
      unitGroupLabel: '單元 1 生命現象與科學探究',
      section: 'section-02',
      unit: '1-2 科學方法',
      difficulty: key,
      difficultyLabel: item.label,
      scoreMode: 'fixed',
      pointsPerQuestion: 5,
      analysisEligible: true,
      preserveOptionOrder: false,
      backLabel: '返回 1-2 題庫',
      onBack: showScienceMethodMenuAfterExam
    };
  }

  function openPractice(key) {
    if (typeof startExam !== 'function' || typeof banks === 'undefined' || !banks[key]) {
      alert('題庫引擎尚未就緒，請重新整理後再試。');
      return;
    }
    setPracticeContext(key);
    startExam(key);
  }

  async function openSchoolBank(button) {
    const badge = button?.querySelector('.catalog-badge');
    const desc = button?.querySelector('.desc');
    const oldBadge = badge?.textContent || '';
    const oldDesc = desc?.textContent || '';

    if (button) button.disabled = true;
    if (badge) badge.textContent = '載入中';
    if (desc) desc.textContent = '正在載入各校段考題…';

    try {
      const res = await fetch(SCHOOL_BANK_PATH, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const questions = Array.isArray(data.questions) ? data.questions : [];

      if (!questions.length) {
        alert('1-2 科學方法的各校題庫入口已建立，目前尚未匯入段考題。之後依題目卷與官方答案卷整理完成後，會直接出現在這裡。');
        return;
      }

      if (typeof banks === 'undefined' || typeof startExam !== 'function') {
        throw new Error('題庫引擎尚未就緒');
      }

      const key = data.exam?.difficulty || 'science-7-1-u01-s02-school';
      banks[key] = questions;
      window.examContexts = window.examContexts || {};
      window.examContexts[key] = {
        ...(data.exam || {}),
        key,
        examType: true,
        backLabel: '返回 1-2 題庫',
        onBack: showScienceMethodMenuAfterExam
      };

      startExam(key);
    } catch (error) {
      alert(`各校題庫載入失敗：${error.message}`);
    } finally {
      if (button) button.disabled = false;
      if (badge) badge.textContent = oldBadge;
      if (desc) desc.textContent = oldDesc;
    }
  }


  async function openSelfStudyBank(button) {
    const badge = button?.querySelector('.catalog-badge');
    const oldBadge = badge?.textContent || '';
    if (button) button.disabled = true;
    if (badge) badge.textContent = '載入中';

    try {
      const res = await fetch(SELF_STUDY_BANK_PATH, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const questions = Array.isArray(data.questions) ? data.questions : [];
      if (!questions.length) {
        alert('1-2 科學方法的自修題庫目前尚未匯入題目。');
        return;
      }
      if (typeof banks === 'undefined' || typeof startExam !== 'function') {
        throw new Error('題庫引擎尚未就緒');
      }

      const key = data.exam?.difficulty || 'science-7-1-u01-s02-self-study';
      banks[key] = questions;
      window.examContexts = window.examContexts || {};
      window.examContexts[key] = {
        ...(data.exam || {}),
        key,
        title: '1-2 科學方法｜自修題庫',
        subtitle: '自然七上｜單元 1 生命現象與科學探究｜1-2 科學方法｜新無敵自然自修',
        subject: 'science',
        subjectLabel: '自然',
        semester: '7-1',
        semesterLabel: '七年級上學期',
        unitGroup: 'unit-01',
        unitGroupLabel: '單元 1 生命現象與科學探究',
        section: 'section-02',
        unit: '1-2 科學方法',
        difficulty: 'selfStudy',
        difficultyLabel: '自修題庫',
        scoreMode: 'percent',
        analysisEligible: true,
        preserveOptionOrder: true,
        backLabel: '返回 1-2 題庫',
        onBack: showScienceMethodMenuAfterExam
      };
      startExam(key);
    } catch (error) {
      alert(`自修題庫載入失敗：${error.message}`);
    } finally {
      if (button) button.disabled = false;
      if (badge) badge.textContent = oldBadge;
    }
  }

  async function updateSchoolBankBadge() {
    const badge = $('#scienceMethodSchoolBankBtn .catalog-badge');
    if (!badge) return;

    try {
      const res = await fetch(SCHOOL_BANK_PATH, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const count = Array.isArray(data.questions) ? data.questions.length : 0;
      badge.textContent = count ? `${count} 題已收錄` : '待匯入';
      badge.classList.toggle('soon', count === 0);
      badge.classList.toggle('school', count > 0);
    } catch {}
  }

  function bindMenuButtons() {
    $('#backScienceMethodBtn')?.addEventListener('click', restoreUnitView);
    $('#scienceMethodEasyBtn')?.addEventListener('click', () => openPractice('easy'));
    $('#scienceMethodMediumBtn')?.addEventListener('click', () => openPractice('medium'));
    $('#scienceMethodHardBtn')?.addEventListener('click', () => openPractice('hard'));
    $('#scienceMethodSchoolBankBtn')?.addEventListener('click', event => openSchoolBank(event.currentTarget));
    $('#scienceMethodSelfStudyBtn')?.addEventListener('click', event => openSelfStudyBank(event.currentTarget));
  }

  function renderScienceMethodMenu() {
    const content = $('#catalogContent');
    if (!content) return;

    const headerTitle = $('#catalogHeaderTitle');
    const headerSub = $('#catalogHeaderSub');
    if (headerTitle) headerTitle.textContent = '自然七上｜1-2';
    if (headerSub) headerSub.textContent = '科學方法｜選擇題庫';
    document.title = '1-2 科學方法｜自然七上';

    content.innerHTML = `
      <button class="catalog-back" id="backScienceMethodBtn">← 返回單元 1</button>
      <div class="catalog-path">自然　›　七年級上學期（一上）　›　單元 1 生命現象與科學探究　›　1-2 科學方法</div>
      <h2 class="catalog-title">1-2　科學方法</h2>
      <p class="catalog-sub">自編題依難度建立；各校題庫保留真實段考來源與原始題型。</p>
      <div class="catalog-grid">
        <button class="catalog-card" id="scienceMethodEasyBtn">
          <span class="top">
            <span class="icon">🌱</span>
            <strong>簡易</strong>
            <span class="catalog-badge">20 題</span>
          </span>
          <span class="desc">基本觀念、科學方法步驟、簡單變因判讀。</span>
        </button>
        <button class="catalog-card" id="scienceMethodMediumBtn">
          <span class="top">
            <span class="icon">🌿</span>
            <strong>中等</strong>
            <span class="catalog-badge">20 題</span>
          </span>
          <span class="desc">情境應用、實驗組與對照組、變因與結果判讀。</span>
        </button>
        <button class="catalog-card" id="scienceMethodHardBtn">
          <span class="top">
            <span class="icon">🌳</span>
            <strong>困難</strong>
            <span class="catalog-badge">20 題</span>
          </span>
          <span class="desc">資料判讀、實驗缺陷、控制變因與結論有效性。</span>
        </button>
        <button class="catalog-card" id="scienceMethodSchoolBankBtn">
          <span class="top">
            <span class="icon">🏫</span>
            <strong>各校題庫</strong>
            <span class="catalog-badge school">檢查中</span>
          </span>
          <span class="desc">由各校自然科真實段考拆題；保留原始題號、選項順序、圖片與來源。</span>
        </button>
        <button class="catalog-card" id="scienceMethodSelfStudyBtn">
          <span class="top">
            <span class="icon">📘</span>
            <strong>自修題庫</strong>
            <span class="catalog-badge school">36 題</span>
          </span>
          <span class="desc">新無敵自然自修原題；已依正式教材章節重新分流，答案均已核對。</span>
        </button>
      </div>
    `;

    bindMenuButtons();
    updateSchoolBankBadge();
    showCatalog();
  }

  function openScienceMethodMenu() {
    saveUnitView();
    renderScienceMethodMenu();
  }

  function showScienceMethodMenuAfterExam() {
    renderScienceMethodMenu();
  }

  // 攔截 exam-catalog.js 原本直接開啟舊的難度畫面，改成和國文一致的四格題庫選單。
  document.addEventListener('click', event => {
    const section = event.target.closest?.('[data-science-section="science-method"]');
    if (!section) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openScienceMethodMenu();
  }, true);
})();
