(() => {
  'use strict';

  const CHAPTERS = {
    'geo-01': {
      title: '第1章　認識位置與地圖',
      subtitle: '認識位置與地圖｜選擇難度',
      path: 'chapter-bank/social/7-1/geography/chapter-01',
      questionCount: 10,
      pointsPerQuestion: 10
    },
    'geo-02': {
      title: '第2章　世界中的臺灣',
      subtitle: '世界中的臺灣｜選擇難度',
      path: 'chapter-bank/social/7-1/geography/chapter-02',
      questionCount: 20,
      pointsPerQuestion: 5
    },
    'geo-03': {
      title: '第3章　地形',
      subtitle: '地形｜選擇難度',
      path: 'chapter-bank/social/7-1/geography/chapter-03',
      questionCount: 20,
      pointsPerQuestion: 5
    },
    'geo-04': {
      title: '第4章　海岸與島嶼',
      subtitle: '海岸與島嶼｜選擇難度',
      path: 'chapter-bank/social/7-1/geography/chapter-04',
      questionCount: 20,
      pointsPerQuestion: 5
    },
    'hist-01': {
      title: '第1章　史前臺灣與原住民文化',
      subtitle: '導言＋第1章｜選擇難度',
      path: 'chapter-bank/social/7-1/history/chapter-01',
      questionCount: 20,
      pointsPerQuestion: 5,
      subjectName: '歷史',
      backText: '歷史章節',
      pathLabel: '歷史'
    },
    'hist-02': {
      title: '第2章　大航海時代各方勢力的競逐',
      subtitle: '第2章｜選擇難度',
      path: 'chapter-bank/social/7-1/history/chapter-02',
      questionCount: 20,
      pointsPerQuestion: 5,
      subjectName: '歷史',
      backText: '歷史章節',
      pathLabel: '歷史'
    },
    'hist-03': {
      title: '第3章　大航海時代臺灣原住民與外來者',
      subtitle: '第3章｜選擇難度',
      path: 'chapter-bank/social/7-1/history/chapter-03',
      questionCount: 20,
      pointsPerQuestion: 5,
      subjectName: '歷史',
      backText: '歷史章節',
      pathLabel: '歷史'
    },
    'civics-01': {
      title: '第1章　公民與公民德性',
      subtitle: '第1章｜選擇難度',
      path: 'chapter-bank/social/7-1/civics/chapter-01',
      questionCount: 20,
      pointsPerQuestion: 5,
      subjectName: '公民',
      backText: '公民章節',
      pathLabel: '公民'
    },
    'civics-02': {
      title: '第2章　人性尊嚴與人權保障',
      subtitle: '第2章｜選擇難度',
      path: 'chapter-bank/social/7-1/civics/chapter-02',
      questionCount: 20,
      pointsPerQuestion: 5,
      subjectName: '公民',
      backText: '公民章節',
      pathLabel: '公民'
    }
  };
  const $ = (sel, root = document) => root.querySelector(sel);
  const LEVELS = {
    easy: { label: '簡易', icon: '🌱', desc: '基本名詞、直接判讀與單一步驟概念。' },
    medium: { label: '中等', icon: '🌿', desc: '比較、時差、比例尺換算與生活情境。' },
    hard: { label: '困難', icon: '🌳', desc: '跨概念整合、多步驟計算與條件推理。' }
  };

  let chapterViewFragment = null;
  let savedHeaderTitle = '';
  let savedHeaderSub = '';
  let savedDocumentTitle = '';

  function showCatalog() {
    $('#catalogShell')?.classList.remove('hidden');
    $('#startScreen')?.classList.add('hidden');
    $('#examScreen')?.classList.add('hidden');
    const result = $('#result');
    if (result) result.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function saveChapterView() {
    const content = $('#catalogContent');
    if (!content || chapterViewFragment) return;
    chapterViewFragment = document.createDocumentFragment();
    while (content.firstChild) chapterViewFragment.appendChild(content.firstChild);
    savedHeaderTitle = $('#catalogHeaderTitle')?.textContent || '社會七上｜地理';
    savedHeaderSub = $('#catalogHeaderSub')?.textContent || '臺灣的環境（上）';
    savedDocumentTitle = document.title;
  }

  function restoreChapterView() {
    const content = $('#catalogContent');
    if (!content || !chapterViewFragment) return;
    content.replaceChildren();
    content.appendChild(chapterViewFragment);
    chapterViewFragment = null;
    if ($('#catalogHeaderTitle')) $('#catalogHeaderTitle').textContent = savedHeaderTitle;
    if ($('#catalogHeaderSub')) $('#catalogHeaderSub').textContent = savedHeaderSub;
    document.title = savedDocumentTitle || '地理第一冊｜七年級上學期';
    showCatalog();
  }

  let currentChapterKey = 'geo-01';

  async function openPractice(level, button) {
    const item = LEVELS[level];
    if (!item) return;
    const badge = button?.querySelector('.catalog-badge');
    const chapter = CHAPTERS[currentChapterKey];
    const oldBadge = badge?.textContent || `${chapter.questionCount} 題`;
    if (button) button.disabled = true;
    if (badge) badge.textContent = '載入中';
    try {
      const res = await fetch(`${chapter.path}/practice-${level}.json`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const questions = Array.isArray(data.questions) ? data.questions : [];
      if (questions.length !== chapter.questionCount) {
        throw new Error(`題庫題數異常：預期 ${chapter.questionCount} 題，實際 ${questions.length} 題`);
      }
      if (typeof banks === 'undefined' || typeof startExam !== 'function') throw new Error('題庫引擎尚未就緒');

      const key = data.exam?.difficulty || `social-7-1-${currentChapterKey.replace('-', '')}-${level}`;
      banks[key] = questions;
      window.examContexts = window.examContexts || {};
      window.examContexts[key] = {
        ...(data.exam || {}),
        key,
        backLabel: `返回${chapter.title.split('　')[0]}題庫`,
        onBack: showSocialGeo01MenuAfterExam
      };
      startExam(key);
    } catch (error) {
      alert(`題庫載入失敗：${error.message}`);
    } finally {
      if (button) button.disabled = false;
      if (badge) badge.textContent = oldBadge;
    }
  }

  function bindMenuButtons() {
    $('#backSocialGeo01Btn')?.addEventListener('click', restoreChapterView);
    $('#socialGeo01EasyBtn')?.addEventListener('click', event => openPractice('easy', event.currentTarget));
    $('#socialGeo01MediumBtn')?.addEventListener('click', event => openPractice('medium', event.currentTarget));
    $('#socialGeo01HardBtn')?.addEventListener('click', event => openPractice('hard', event.currentTarget));
  }

  function renderSocialGeo01Menu() {
    const content = $('#catalogContent');
    if (!content) return;
    const chapter = CHAPTERS[currentChapterKey];
    const subjectName = chapter.subjectName || '地理';
    const backText = chapter.backText || '地理章節';
    const pathLabel = chapter.pathLabel || '地理';
    if ($('#catalogHeaderTitle')) $('#catalogHeaderTitle').textContent = `社會七上｜${subjectName}${chapter.title.split('　')[0]}`;
    if ($('#catalogHeaderSub')) $('#catalogHeaderSub').textContent = chapter.subtitle;
    document.title = `${chapter.title.replace('　',' ')}｜社會七上`;
    content.innerHTML = `
      <button class="catalog-back" id="backSocialGeo01Btn">← 返回${backText}</button>
      <div class="catalog-path">社會　›　${pathLabel}　›　七年級上學期（一上）　›　第一冊　›　${chapter.title}</div>
      <h2 class="catalog-title">${chapter.title}</h2>
      <p class="catalog-sub">目前先以文字選擇題為主；每個難度 ${chapter.questionCount} 題，每題 ${chapter.pointsPerQuestion} 分。</p>
      <div class="catalog-grid">
        ${Object.entries(LEVELS).map(([key, item]) => `
          <button class="catalog-card" id="socialGeo01${key[0].toUpperCase() + key.slice(1)}Btn">
            <span class="top"><span class="icon">${item.icon}</span><strong>${item.label}</strong><span class="catalog-badge">${chapter.questionCount} 題</span></span>
            <span class="desc">${item.desc}</span>
          </button>`).join('')}
      </div>`;
    bindMenuButtons();
    showCatalog();
  }

  function openSocialGeo01Menu(chapterKey = 'geo-01') {
    currentChapterKey = chapterKey;
    saveChapterView();
    renderSocialGeo01Menu();
  }

  function showSocialGeo01MenuAfterExam() {
    renderSocialGeo01Menu();
  }

  document.addEventListener('click', event => {
    const chapter = event.target.closest?.('[data-social-chapter="geo-01"], [data-social-chapter="geo-02"], [data-social-chapter="geo-03"], [data-social-chapter="geo-04"], [data-social-chapter="hist-01"], [data-social-chapter="hist-02"], [data-social-chapter="hist-03"], [data-social-chapter="civics-01"], [data-social-chapter="civics-02"]');
    if (!chapter) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openSocialGeo01Menu(chapter.getAttribute('data-social-chapter'));
  }, true);
})();