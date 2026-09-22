(() => {
  'use strict';

  const SECTIONS = {
    'science-7-1-2-1': {
      code: '2-1',
      title: '生物體的基本構造',
      root: 'chapter-bank/science/7-1/unit-02/section-01',
      selfStudyCount: 20,
      selfStudyDesc: '新無敵自然自修原題；細胞學說、虎克、單細胞生物與幹細胞。'
    },
    'science-7-1-2-2': {
      code: '2-2',
      title: '細胞的形態和構造',
      root: 'chapter-bank/science/7-1/unit-02/section-02',
      selfStudyCount: 52,
      selfStudyDesc: '新無敵自然自修原題；細胞膜、細胞核、粒線體、葉綠體、細胞壁與細胞功能。'
    },
    'science-7-1-2-3': {
      code: '2-3',
      title: '有關生命的物質',
      root: 'chapter-bank/science/7-1/unit-02/section-03',
      selfStudyCount: 33,
      selfStudyDesc: '新無敵自然自修原題；擴散、滲透、選擇性通透與物質進出細胞。'
    },
    'science-7-1-2-4': {
      code: '2-4',
      title: '從細胞到生物體',
      root: 'chapter-bank/science/7-1/unit-02/section-04',
      selfStudyCount: 46,
      selfStudyDesc: '新無敵自然自修原題；細胞、組織、器官、器官系統與生物體組成層次。'
    },
    'science-7-1-cross-topic-u02': {
      code: '跨科主題',
      title: '微觀與巨觀～尺度建構的世界',
      type: 'cross',
      root: 'chapter-bank/science/7-1/unit-02/cross-topic',
      selfStudyCount: 22,
      selfStudyDesc: '新無敵自然自修跨科主題原題；尺度、單位、比例尺、顯微觀察、仿生科技與奈米科學。',
      referencePath: 'chapter-bank/science/7-1/unit-02/cross-topic/reference.json'
    },
    'science-7-1-assessment-u01-u02': {
      code: '學力測驗',
      title: '單元一～單元二',
      type: 'assessment',
      assessmentPath: 'chapter-bank/science/7-1/unit-02/assessment-u01-u02/assessment.json'
    }
  };

  const LEVELS = {
    easy: { icon:'🌱', label:'簡易', desc:'基礎名詞、構造辨識與核心概念。' },
    medium: { icon:'🌿', label:'中等', desc:'構造與功能、比較、情境判讀與基本應用。' },
    hard: { icon:'🌳', label:'困難', desc:'資料整合、實驗推論與高層次應用。' }
  };

  const $ = (sel, root=document) => root.querySelector(sel);
  let savedUnitView = null;
  let savedHeaderTitle = '';
  let savedHeaderSub = '';
  let savedDocumentTitle = '';

  function paths(section) {
    return {
      easy: `${section.root}/easy.json`,
      medium: `${section.root}/medium.json`,
      hard: `${section.root}/hard.json`,
      school: `${section.root}/school-exams.json`,
      selfStudy: `${section.root}/self-study.json`
    };
  }

  function showCatalog() {
    $('#catalogShell')?.classList.remove('hidden');
    $('#startScreen')?.classList.add('hidden');
    $('#examScreen')?.classList.add('hidden');
    const result = $('#result');
    if (result) result.style.display = 'none';
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function saveUnitView() {
    const content = $('#catalogContent');
    if (!content || savedUnitView) return;
    savedUnitView = document.createDocumentFragment();
    while (content.firstChild) savedUnitView.appendChild(content.firstChild);
    savedHeaderTitle = $('#catalogHeaderTitle')?.textContent || '自然一上｜單元 2';
    savedHeaderSub = $('#catalogHeaderSub')?.textContent || '生物體的構造';
    savedDocumentTitle = document.title;
  }

  function restoreUnitView() {
    const content = $('#catalogContent');
    if (!content || !savedUnitView) return;
    content.replaceChildren();
    content.appendChild(savedUnitView);
    savedUnitView = null;
    if ($('#catalogHeaderTitle')) $('#catalogHeaderTitle').textContent = savedHeaderTitle;
    if ($('#catalogHeaderSub')) $('#catalogHeaderSub').textContent = savedHeaderSub;
    document.title = savedDocumentTitle || '單元 2 生物體的構造｜自然一上';
    showCatalog();
  }

  async function fetchBank(path) {
    const res = await fetch(path, {cache:'no-store'});
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.questions)) throw new Error('題庫格式錯誤');
    return data;
  }

  function makeContext(data, section, key) {
    const isPractice = ['easy','medium','hard'].includes(key);
    const label = key === 'school' ? '各校題庫' : key === 'selfStudy' ? '自修題庫' : LEVELS[key]?.label || key;
    const bankKey = data.exam?.difficulty || `science-7-1-u02-${section.code.replace('-','s')}-${key}`;
    return {
      ...(data.exam || {}),
      key: bankKey,
      title: `${section.code} ${section.title}｜${label}`,
      subtitle: `自然七上｜單元 2 生物體的構造｜${section.code} ${section.title}｜${label}`,
      subject:'science',
      subjectLabel:'自然',
      semester:'7-1',
      semesterLabel:'七年級上學期',
      unitGroup:'unit-02',
      unitGroupLabel:'單元 2 生物體的構造',
      section: ({'2-1':'section-01','2-2':'section-02','2-3':'section-03','2-4':'section-04'})[section.code] || section.code,
      unit: `${section.code} ${section.title}`,
      difficulty:key,
      difficultyLabel:label,
      scoreMode:isPractice ? 'fixed' : 'percent',
      pointsPerQuestion:isPractice ? 5 : undefined,
      analysisEligible:true,
      preserveOptionOrder:!isPractice,
      examType:key === 'school',
      backLabel:`返回 ${section.code} 題庫`,
      onBack:() => renderMenu(section)
    };
  }


  function makeAssessmentContext(data, section) {
    const bankKey = data.exam?.key || 'science-7-1-assessment-u01-u02';
    return {
      ...(data.exam || {}),
      key: bankKey,
      title: '學力診斷評量｜單元一～單元二',
      subtitle: '自然七上｜單元 1 生命現象與科學探究＋單元 2 生物體的構造｜25 題',
      subject:'science',
      subjectLabel:'自然',
      semester:'7-1',
      semesterLabel:'七年級上學期',
      unitGroup:'unit-01-unit-02',
      unitGroupLabel:'單元一～單元二',
      section:'assessment-u01-u02',
      unit:'學力診斷評量｜單元一～單元二',
      difficulty:'assessment',
      difficultyLabel:'學力測驗',
      scoreMode:'percent',
      analysisEligible:true,
      preserveOptionOrder:true,
      backLabel:'返回單元 2',
      onBack:restoreUnitView
    };
  }

  async function openAssessment(section, button) {
    const badge = button?.querySelector('.catalog-badge');
    const oldBadge = badge?.textContent || '';
    if (button) button.disabled = true;
    if (badge) badge.textContent = '載入中';

    try {
      const data = await fetchBank(section.assessmentPath);
      const questions = data.questions.filter(q => !q.imagePending && !q.optionImagePending);
      if (!questions.length) {
        alert('學力測驗尚未完成匯入。');
        restoreUnitView();
        return;
      }
      if (typeof banks === 'undefined' || typeof startExam !== 'function') {
        throw new Error('題庫引擎尚未就緒');
      }
      const bankKey = data.exam?.key || 'science-7-1-assessment-u01-u02';
      banks[bankKey] = questions;
      window.examContexts = window.examContexts || {};
      window.examContexts[bankKey] = makeAssessmentContext(data, section);
      startExam(bankKey);
    } catch (error) {
      restoreUnitView();
      alert(`學力測驗載入失敗：${error.message}`);
    } finally {
      if (button) button.disabled = false;
      if (badge) badge.textContent = oldBadge;
    }
  }

  async function openBank(section, key, button) {
    const bankPath = paths(section)[key];
    const badge = button?.querySelector('.catalog-badge');
    const oldBadge = badge?.textContent || '';
    if (button) button.disabled = true;
    if (badge) badge.textContent = '載入中';

    try {
      const data = await fetchBank(bankPath);
      const questions = data.questions.filter(q => !q.imagePending && !q.optionImagePending);
      if (!questions.length) {
        alert('這個題庫入口已建立，目前題目尚待匯入。');
        return;
      }
      if (typeof banks === 'undefined' || typeof startExam !== 'function') {
        throw new Error('題庫引擎尚未就緒');
      }
      const bankKey = data.exam?.difficulty || `science-7-1-u02-${section.code}-${key}`;
      banks[bankKey] = questions;
      window.examContexts = window.examContexts || {};
      window.examContexts[bankKey] = makeContext(data, section, key);
      startExam(bankKey);
    } catch (error) {
      alert(`${section.code} 題庫載入失敗：${error.message}`);
    } finally {
      if (button) button.disabled = false;
      if (badge) badge.textContent = oldBadge;
    }
  }

  async function updateBadge(section, buttonId, key) {
    const button = $(buttonId);
    const badge = button?.querySelector('.catalog-badge');
    if (!button || !badge) return;
    try {
      const data = await fetchBank(paths(section)[key]);
      const count = data.questions.filter(q => !q.imagePending && !q.optionImagePending).length;
      if (!count) {
        badge.textContent = '待建立';
        badge.classList.add('soon');
      } else {
        badge.textContent = `${count} 題`;
        badge.classList.remove('soon');
        if (key === 'selfStudy') badge.classList.add('school');
      }
    } catch {
      badge.textContent = '載入失敗';
    }
  }

  function bindMenu(section) {
    $('#backScienceUnit2Btn')?.addEventListener('click', restoreUnitView);
    $('#scienceUnit2EasyBtn')?.addEventListener('click', e => openBank(section,'easy',e.currentTarget));
    $('#scienceUnit2MediumBtn')?.addEventListener('click', e => openBank(section,'medium',e.currentTarget));
    $('#scienceUnit2HardBtn')?.addEventListener('click', e => openBank(section,'hard',e.currentTarget));
    $('#scienceUnit2SchoolBtn')?.addEventListener('click', e => openBank(section,'school',e.currentTarget));
    $('#scienceUnit2SelfStudyBtn')?.addEventListener('click', e => openBank(section,'selfStudy',e.currentTarget));
  }

  function renderMenu(section) {
    const content = $('#catalogContent');
    if (!content) return;

    if ($('#catalogHeaderTitle')) $('#catalogHeaderTitle').textContent = `自然七上｜${section.code}`;
    if ($('#catalogHeaderSub')) $('#catalogHeaderSub').textContent = `${section.title}｜選擇題庫`;
    document.title = `${section.code} ${section.title}｜自然七上`;

    content.innerHTML = `
      <button class="catalog-back" id="backScienceUnit2Btn">← 返回單元 2</button>
      <div class="catalog-path">自然　›　七年級上學期（一上）　›　單元 2 生物體的構造　›　${section.code} ${section.title}</div>
      <h2 class="catalog-title">${section.code}　${section.title}</h2>
      <p class="catalog-sub">自編題依難度建立；各校題庫保留真實段考來源；自修題庫依正式教材章節重新分流。</p>
      <div class="catalog-grid">
        <button class="catalog-card" id="scienceUnit2EasyBtn"><span class="top"><span class="icon">🌱</span><strong>簡易</strong><span class="catalog-badge">檢查中</span></span><span class="desc">${LEVELS.easy.desc}</span></button>
        <button class="catalog-card" id="scienceUnit2MediumBtn"><span class="top"><span class="icon">🌿</span><strong>中等</strong><span class="catalog-badge">檢查中</span></span><span class="desc">${LEVELS.medium.desc}</span></button>
        <button class="catalog-card" id="scienceUnit2HardBtn"><span class="top"><span class="icon">🌳</span><strong>困難</strong><span class="catalog-badge">檢查中</span></span><span class="desc">${LEVELS.hard.desc}</span></button>
        <button class="catalog-card" id="scienceUnit2SchoolBtn"><span class="top"><span class="icon">🏫</span><strong>各校題庫</strong><span class="catalog-badge">檢查中</span></span><span class="desc">各校自然科真實段考拆題；保留原始題號、選項順序、圖片與來源。</span></button>
        <button class="catalog-card" id="scienceUnit2SelfStudyBtn"><span class="top"><span class="icon">📘</span><strong>自修題庫</strong><span class="catalog-badge school">檢查中</span></span><span class="desc">${section.selfStudyDesc}</span></button>
      </div>
    `;

    bindMenu(section);
    updateBadge(section,'#scienceUnit2EasyBtn','easy');
    updateBadge(section,'#scienceUnit2MediumBtn','medium');
    updateBadge(section,'#scienceUnit2HardBtn','hard');
    updateBadge(section,'#scienceUnit2SchoolBtn','school');
    updateBadge(section,'#scienceUnit2SelfStudyBtn','selfStudy');
    showCatalog();
  }

  async function openCrossTopicReference(section) {
    const content = $('#catalogContent');
    if (!content) return;
    if ($('#catalogHeaderTitle')) $('#catalogHeaderTitle').textContent = '自然七上｜跨科主題';
    if ($('#catalogHeaderSub')) $('#catalogHeaderSub').textContent = '微觀與巨觀～尺度建構的世界｜教材參考資料';
    document.title = '跨科主題 教材參考資料｜自然七上';

    content.innerHTML = `
      <button class="catalog-back" id="backCrossTopicMenuBtn">← 返回跨科主題</button>
      <div class="catalog-path">自然　›　七年級上學期（一上）　›　單元 2 生物體的構造　›　跨科主題　›　教材參考資料</div>
      <h2 class="catalog-title">跨科主題　微觀與巨觀～尺度建構的世界</h2>
      <p class="catalog-sub">教材參考資料載入中…</p>`;
    $('#backCrossTopicMenuBtn')?.addEventListener('click', () => renderCrossTopicMenu(section));

    try {
      const res = await fetch(section.referencePath, {cache:'no-store'});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      content.innerHTML = `
        <button class="catalog-back" id="backCrossTopicMenuBtn">← 返回跨科主題</button>
        <div class="catalog-path">自然　›　七年級上學期（一上）　›　單元 2 生物體的構造　›　跨科主題　›　教材參考資料</div>
        <h2 class="catalog-title">${data.title || section.title}</h2>
        <p class="catalog-sub">${data.subtitle || '教材重點整理'}</p>
        <section class="english-reference-section">
          <h3>學習重點</h3>
          <ul class="english-reference-list">${(data.learningGoals || []).map(x => `<li>${x}</li>`).join('')}</ul>
        </section>
        ${(data.sections || []).map(s => `
          <section class="english-reference-section">
            <h3>${s.title || ''}</h3>
            ${s.summary ? `<p>${s.summary}</p>` : ''}
            ${Array.isArray(s.items) ? `<ul class="english-reference-list">${s.items.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
          </section>`).join('')}
        ${data.sourceNote ? `<div class="english-reference-source">${data.sourceNote}</div>` : ''}`;
      $('#backCrossTopicMenuBtn')?.addEventListener('click', () => renderCrossTopicMenu(section));
      window.scrollTo({top:0,behavior:'smooth'});
    } catch (error) {
      content.innerHTML = `
        <button class="catalog-back" id="backCrossTopicMenuBtn">← 返回跨科主題</button>
        <h2 class="catalog-title">教材參考資料載入失敗</h2>
        <p class="catalog-sub">${error.message}</p>`;
      $('#backCrossTopicMenuBtn')?.addEventListener('click', () => renderCrossTopicMenu(section));
    }
  }

  function renderCrossTopicMenu(section) {
    const content = $('#catalogContent');
    if (!content) return;
    if ($('#catalogHeaderTitle')) $('#catalogHeaderTitle').textContent = '自然七上｜跨科主題';
    if ($('#catalogHeaderSub')) $('#catalogHeaderSub').textContent = section.title;
    document.title = `跨科主題 ${section.title}｜自然七上`;

    content.innerHTML = `
      <button class="catalog-back" id="backScienceUnit2Btn">← 返回單元 2</button>
      <div class="catalog-path">自然　›　七年級上學期（一上）　›　單元 2 生物體的構造　›　跨科主題</div>
      <h2 class="catalog-title">跨科主題　${section.title}</h2>
      <p class="catalog-sub">教材重點與新無敵自然自修跨科主題題庫。</p>
      <div class="catalog-grid">
        <button class="catalog-card" id="scienceCrossTopicReferenceBtn">
          <span class="top"><span class="icon">📖</span><strong>教材參考資料</strong><span class="catalog-badge reference">已整理</span></span>
          <span class="desc">尺度、單位與科學記號、比例尺、顯微鏡測量、水中微生物、仿生科技與奈米科學。</span>
        </button>
        <button class="catalog-card" id="scienceCrossTopicBankBtn">
          <span class="top"><span class="icon">📝</span><strong>章節題庫</strong><span class="catalog-badge school">22 題</span></span>
          <span class="desc">新無敵自然自修原題；官方答案已核對，附圖與逐題詳解皆已完成。</span>
        </button>
      </div>`;

    $('#backScienceUnit2Btn')?.addEventListener('click', restoreUnitView);
    $('#scienceCrossTopicReferenceBtn')?.addEventListener('click', () => openCrossTopicReference(section));
    $('#scienceCrossTopicBankBtn')?.addEventListener('click', e => openBank(section,'selfStudy',e.currentTarget));
    showCatalog();
  }

  function openMenu(sectionKey) {
    const section = SECTIONS[sectionKey];
    if (!section) return;
    saveUnitView();
    if (section.type === 'cross') {
      renderCrossTopicMenu(section);
      return;
    }
    renderMenu(section);
  }

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const card = target?.closest('[data-science-section]');
    const key = card?.getAttribute('data-science-section');
    if (!key || !SECTIONS[key]) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const section = SECTIONS[key];
    if (section.type === 'assessment') {
      saveUnitView();
      openAssessment(section, card);
      return;
    }
    openMenu(key);
  }, true);
})();
