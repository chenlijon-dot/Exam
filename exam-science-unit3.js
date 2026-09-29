(() => {
  'use strict';

  const SECTIONS = {
    'science-7-1-3-1': {
      code: '3-1',
      title: '食物和養分',
      root: 'chapter-bank/science/7-1/unit-03/section-01',
      sectionSlug: 'section-01',
      selfStudyCount: 50,
      censusCount: 50,
      pendingCount: 0,
      selfStudyDesc: '新無敵自然自修原題；養分種類、熱量、營養標示、維生素礦物質與食物成分檢測。'
    },
    'science-7-1-3-2': {
      code: '3-2',
      title: '酵素的作用',
      root: 'chapter-bank/science/7-1/unit-03/section-02',
      sectionSlug: 'section-02',
      selfStudyCount: 54,
      censusCount: 54,
      pendingCount: 0,
      selfStudyDesc: '新無敵自然自修原題；酵素特性、專一性、溫度與酸鹼度、唾液澱粉酶實驗與科學素養。'
    }
  };

  const $ = (sel, root=document) => root.querySelector(sel);
  let savedUnitView = null;
  let savedHeaderTitle = '';
  let savedHeaderSub = '';
  let savedDocumentTitle = '';

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
    savedHeaderTitle = $('#catalogHeaderTitle')?.textContent || '自然一上｜單元 3';
    savedHeaderSub = $('#catalogHeaderSub')?.textContent || '生物體內的營養';
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
    document.title = savedDocumentTitle || '單元 3 生物體內的營養｜自然一上';
    showCatalog();
  }

  async function fetchBank(path) {
    const res = await fetch(path, {cache:'no-store'});
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.questions)) throw new Error('題庫格式錯誤');
    return data;
  }

  function makeContext(data, section) {
    const bankKey = data.exam?.difficulty || `science-7-1-u03-${section.sectionSlug === 'section-02' ? 's02' : 's01'}-self-study`;
    return {
      ...(data.exam || {}),
      key: bankKey,
      title: `${section.code} ${section.title}｜自修題庫`,
      subtitle: `自然七上｜單元 3 生物體內的營養｜${section.code} ${section.title}｜自修題庫`,
      subject:'science',
      subjectLabel:'自然',
      semester:'7-1',
      semesterLabel:'七年級上學期',
      unitGroup:'unit-03',
      unitGroupLabel:'單元 3 生物體內的營養',
      section:section.sectionSlug || 'section-01',
      unit:`${section.code} ${section.title}`,
      difficulty:'selfStudy',
      difficultyLabel:'自修題庫',
      scoreMode:'percent',
      analysisEligible:true,
      preserveOptionOrder:true,
      backLabel:`返回 ${section.code} 題庫`,
      onBack:() => renderMenu(section)
    };
  }

  async function openSelfStudy(section, button) {
    const badge = button?.querySelector('.catalog-badge');
    const oldBadge = badge?.textContent || '';
    if (button) button.disabled = true;
    if (badge) badge.textContent = '載入中';

    try {
      const data = await fetchBank(`${section.root}/self-study.json`);
      const questions = data.questions.filter(q => !q.imagePending && !q.optionImagePending);
      if (!questions.length) {
        alert(`${section.code} 自修題庫目前沒有可作答題目。`);
        return;
      }
      if (typeof banks === 'undefined' || typeof startExam !== 'function') {
        throw new Error('題庫引擎尚未就緒');
      }
      const bankKey = data.exam?.difficulty || `science-7-1-u03-${section.sectionSlug === 'section-02' ? 's02' : 's01'}-self-study`;
      banks[bankKey] = questions;
      window.examContexts = window.examContexts || {};
      window.examContexts[bankKey] = makeContext(data, section);
      startExam(bankKey);
    } catch (error) {
      alert(`${section.code} 自修題庫載入失敗：${error.message}`);
    } finally {
      if (button) button.disabled = false;
      if (badge) badge.textContent = oldBadge;
    }
  }

  async function updateSelfStudyBadge(section) {
    const button = $('#scienceUnit3SelfStudyBtn');
    const badge = button?.querySelector('.catalog-badge');
    if (!button || !badge) return;
    try {
      const data = await fetchBank(`${section.root}/self-study.json`);
      const count = data.questions.filter(q => !q.imagePending && !q.optionImagePending).length;
      const pending = Array.isArray(data.pendingQuestions) ? data.pendingQuestions.length : 0;
      const manual = data.questions.filter(q => q.type === 'manual-study').length;
      const scored = count - manual;
      badge.textContent = pending
        ? `${scored} 題可評量｜${manual} 題紙筆｜${pending} 題待解答`
        : (manual ? `${scored} 題可評量｜${manual} 題紙筆` : `${count} 題`);
      badge.classList.remove('soon');
      badge.classList.add('school');
    } catch {
      badge.textContent = '載入失敗';
    }
  }

  function renderMenu(section) {
    const content = $('#catalogContent');
    if (!content) return;

    if ($('#catalogHeaderTitle')) $('#catalogHeaderTitle').textContent = `自然七上｜${section.code}`;
    if ($('#catalogHeaderSub')) $('#catalogHeaderSub').textContent = `${section.title}｜選擇題庫`;
    document.title = `${section.code} ${section.title}｜自然七上`;

    content.innerHTML = `
      <button class="catalog-back" id="backScienceUnit3Btn">← 返回單元 3</button>
      <div class="catalog-path">自然　›　七年級上學期（一上）　›　單元 3 生物體內的營養　›　${section.code} ${section.title}</div>
      <h2 class="catalog-title">${section.code}　${section.title}</h2>
      <p class="catalog-sub">本節目前先啟用新無敵自然自修題庫；自編三級題庫與各校題庫後續建立。</p>
      <div class="catalog-grid">
        <button class="catalog-card" disabled><span class="top"><span class="icon">🌱</span><strong>簡易</strong><span class="catalog-badge soon">待建立</span></span><span class="desc">自編基礎題庫後續建立。</span></button>
        <button class="catalog-card" disabled><span class="top"><span class="icon">🌿</span><strong>中等</strong><span class="catalog-badge soon">待建立</span></span><span class="desc">自編應用題庫後續建立。</span></button>
        <button class="catalog-card" disabled><span class="top"><span class="icon">🌳</span><strong>困難</strong><span class="catalog-badge soon">待建立</span></span><span class="desc">自編整合題庫後續建立。</span></button>
        <button class="catalog-card" disabled><span class="top"><span class="icon">🏫</span><strong>各校題庫</strong><span class="catalog-badge soon">待建立</span></span><span class="desc">各校自然科真實段考拆題後續匯入。</span></button>
        <button class="catalog-card" id="scienceUnit3SelfStudyBtn"><span class="top"><span class="icon">📘</span><strong>自修題庫</strong><span class="catalog-badge school">檢查中</span></span><span class="desc">${section.selfStudyDesc}</span></button>
      </div>`;

    $('#backScienceUnit3Btn')?.addEventListener('click', restoreUnitView);
    $('#scienceUnit3SelfStudyBtn')?.addEventListener('click', e => openSelfStudy(section, e.currentTarget));
    updateSelfStudyBadge(section);
    showCatalog();
  }

  function openMenu(sectionKey) {
    const section = SECTIONS[sectionKey];
    if (!section) return;
    saveUnitView();
    renderMenu(section);
  }

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const card = target?.closest('[data-science-section]');
    const key = card?.getAttribute('data-science-section');
    if (!key || !SECTIONS[key]) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openMenu(key);
  }, true);
})();
