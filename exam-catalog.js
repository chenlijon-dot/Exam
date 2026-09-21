(() => {
  'use strict';

  const SUBJECTS = [
    { key: 'chinese', name: '國文', icon: '📖', enabled: true },
    { key: 'english', name: '英文', icon: '🔤', enabled: true },
    { key: 'math', name: '數學', icon: '📐', enabled: false },
    { key: 'science', name: '自然', icon: '🔬', enabled: true },
    { key: 'social', name: '社會', icon: '🌏', enabled: true }
  ];

  const CHINESE_SEMESTERS = [
    { key: '7-1', title: '七年級上學期', short: '一上' },
    { key: '7-2', title: '七年級下學期', short: '一下' },
    { key: '8-1', title: '八年級上學期', short: '二上' },
    { key: '8-2', title: '八年級下學期', short: '二下' },
    { key: '9-1', title: '九年級上學期', short: '三上' },
    { key: '9-2', title: '九年級下學期', short: '三下' }
  ];

  const ENGLISH_SEMESTERS = [
    { key: '7-1', title: '七年級上學期', short: '一上' },
    { key: '7-2', title: '七年級下學期', short: '一下' },
    { key: '8-1', title: '八年級上學期', short: '二上' },
    { key: '8-2', title: '八年級下學期', short: '二下' },
    { key: '9-1', title: '九年級上學期', short: '三上' },
    { key: '9-2', title: '九年級下學期', short: '三下' }
  ];

  // 英文七上依 2026-09-16 使用者提供的實體課本目錄、課程大綱與 Reading Skills 建立。
  const ENGLISH_7_1_LESSONS = [
    {
      key: 'english-7-1-get-ready', code: 'Get Ready', title: '哈囉你好嗎？', page: 1,
      type: 'ready', referenceReady: true, bankMenuReady: false,
      referencePath: 'chapter-bank/english/7-1/get-ready/reference.json',
      desc: '字母、招呼、基本介紹、姓名、年齡與英文書寫原則；僅提供教材參考資料，不建立章節題庫。'
    },
    {
      key: 'english-7-1-lesson-01', code: 'Lesson 1', title: 'Who’s That Young Man?', page: 9,
      type: 'lesson', referenceReady: true, bankMenuReady: true,
      referencePath: 'chapter-bank/english/7-1/lesson-01/reference.json',
      banks: {
        easy: 'chapter-bank/english/7-1/lesson-01/easy.json',
        medium: 'chapter-bank/english/7-1/lesson-01/medium.json',
        hard: 'chapter-bank/english/7-1/lesson-01/hard.json'
      },
      detail: '初次見面．請多指教｜Nick 這一家', readingSkill: 'Scanning 掃讀',
      desc: '親屬、職業；be 動詞、形容詞、Who 問答；教材參考資料已整理。'
    },
    {
      key: 'english-7-1-lesson-02', code: 'Lesson 2', title: 'What Are These?', page: 23,
      type: 'lesson', referenceReady: true, bankMenuReady: true,
      referencePath: 'chapter-bank/english/7-1/lesson-02/reference.json',
      banks: {
        easy: 'chapter-bank/english/7-1/lesson-02/easy.json',
        medium: 'chapter-bank/english/7-1/lesson-02/medium.json',
        hard: 'chapter-bank/english/7-1/lesson-02/hard.json'
      },
      detail: '動物公仔大集合｜亞洲象？非洲象？傻傻分不清', readingSkill: 'Making Inferences 推論',
      desc: '動物、十二生肖；指示詞、名詞複數、What 問句、所有格與大象比較；教材與分級題庫已整理。'
    },
    {
      key: 'english-7-1-review-01', code: 'Review 1', title: 'Lesson 1–2 複習', page: 37,
      type: 'review', referenceReady: false, bankMenuReady: false,
      desc: 'Lesson 1–2 綜合複習；目錄位置已確認。'
    },
    {
      key: 'english-7-1-lesson-03', code: 'Lesson 3', title: 'Let’s Get Some Ideas from RoomGPT', page: 41,
      type: 'lesson', referenceReady: false, bankMenuReady: false,
      detail: 'AI 工具設計你的夢想空間｜世界各地床鋪大不同', readingSkill: 'Scanning 掃讀',
      desc: '位置、房間；Where 問答、介系詞、祈使句。'
    },
    {
      key: 'english-7-1-lesson-04', code: 'Lesson 4', title: 'I Can Listen to Their Songs Again and Again', page: 55,
      type: 'lesson', referenceReady: false, bankMenuReady: false,
      detail: '道路安全人人有責｜讓你抬頭的新點子', readingSkill: 'Using a Graphic Organizer 圖像式整理',
      desc: '行人交通安全、生活中的新點子；助動詞 can 問答句。'
    },
    {
      key: 'english-7-1-review-02', code: 'Review 2', title: 'Lesson 3–4 複習', page: 67,
      type: 'review', referenceReady: false, bankMenuReady: false,
      desc: 'Lesson 3–4 綜合複習；目錄位置已確認。'
    },
    {
      key: 'english-7-1-lesson-05', code: 'Lesson 5', title: 'What Are You Doing?', page: 71,
      type: 'lesson', referenceReady: false, bankMenuReady: false,
      detail: '你那裡現在幾點？｜我的白天是你的黑夜', readingSkill: 'Using Context Clues 上下文線索',
      desc: '時間、星期、視訊交流；現在進行式、What time / day 問答。'
    },
    {
      key: 'english-7-1-lesson-06', code: 'Lesson 6', title: 'Are There Any Shelves Outside the Door?', page: 85,
      type: 'lesson', referenceReady: false, bankMenuReady: false,
      detail: '轉學生的第一天｜各國手勢學問大！', readingSkill: 'Making Inferences 推論',
      desc: '學校設施、文化差異；There is / are 問答句。'
    },
    {
      key: 'english-7-1-review-03', code: 'Review 3', title: 'Lesson 5–6 複習', page: 101,
      type: 'review', referenceReady: false, bankMenuReady: false,
      desc: 'Lesson 5–6 綜合複習；目錄位置已確認。'
    }
  ];

  // 國文第一冊依 2026-09-14 使用者提供的實體課本目錄建立。
  const CHINESE_7_1_LESSONS = [
    {
      key: 'chinese-7-1-lesson-01', code: '第一課', title: '夏夜', author: '楊喚', page: 6,
      type: 'lesson', referenceReady: true, bankMenuReady: true,
      desc: '童詩；教材知識庫與各校段考題庫已開始收錄。'
    },
    {
      key: 'chinese-7-1-lesson-02', code: '第二課', title: '生之歌選', author: '杏林子', page: 18,
      type: 'lesson', referenceReady: true, bankMenuReady: false,
      detail: '（一）一顆珍珠（p.20）｜（二）手的故事（p.22）',
      desc: '正式課名為〈生之歌選〉；目前已收錄〈手的故事〉教材內容，〈一顆珍珠〉待補。'
    },
    {
      key: 'chinese-7-1-lesson-03', code: '第三課', title: '吃冰的滋味', author: '古蒙仁', page: 30,
      type: 'lesson', referenceReady: false, bankMenuReady: false,
      desc: '課次與頁碼已由實體課本目錄確認；題庫待建。'
    },
    {
      key: 'chinese-7-1-language-01', code: '語文天地一', title: '標點符號使用法', author: '', page: 46,
      type: 'language', referenceReady: false, bankMenuReady: false,
      desc: '語文知識單元；目錄已確認，題庫待建。'
    },
    {
      key: 'chinese-7-1-lesson-04', code: '第四課', title: '差不多先生傳', author: '胡適', page: 58,
      type: 'lesson', referenceReady: false, bankMenuReady: false,
      desc: '課次與頁碼已由實體課本目錄確認；題庫待建。'
    },
    {
      key: 'chinese-7-1-lesson-05', code: '第五課', title: '論語選', author: '孔子弟子及再傳弟子', page: 70,
      type: 'lesson', referenceReady: false, bankMenuReady: false,
      desc: '課次與頁碼已由實體課本目錄確認；題庫待建。'
    },
    {
      key: 'chinese-7-1-lesson-06', code: '第六課', title: '那默默的一群', author: '張騰蛟', page: 80,
      type: 'lesson', referenceReady: false, bankMenuReady: false,
      desc: '課次與頁碼已由實體課本目錄確認；題庫待建。'
    },
    {
      key: 'chinese-7-1-language-02', code: '語文天地二', title: '閱讀策略與資料檢索', author: '', page: 94,
      type: 'language', referenceReady: false, bankMenuReady: false,
      desc: '閱讀與資料檢索單元；目錄已確認，題庫待建。'
    },
    {
      key: 'chinese-7-1-lesson-07', code: '第七課', title: '兒時記趣', author: '沈復', page: 110,
      type: 'lesson', referenceReady: false, bankMenuReady: false,
      desc: '課次與頁碼已由實體課本目錄確認；題庫待建。'
    },
    {
      key: 'chinese-7-1-lesson-08', code: '第八課', title: '紙船印象', author: '洪醒夫', page: 122,
      type: 'lesson', referenceReady: false, bankMenuReady: false,
      desc: '課次與頁碼已由實體課本目錄確認；題庫待建。'
    },
    {
      key: 'chinese-7-1-lesson-09', code: '第九課', title: '下雨天，真好', author: '琦君', page: 134,
      type: 'lesson', referenceReady: false, bankMenuReady: false,
      desc: '課次與頁碼已由實體課本目錄確認；題庫待建。'
    },
    {
      key: 'chinese-7-1-lesson-10', code: '第十課', title: '鬧元宵', author: '朱天衣', page: 148,
      type: 'lesson', referenceReady: false, bankMenuReady: false,
      desc: '課次與頁碼已由實體課本目錄確認；題庫待建。'
    },
    {
      key: 'chinese-7-1-self-01', code: '自學一', title: '善用時間的方法', author: '李偉文', page: 162,
      type: 'self', referenceReady: false, bankMenuReady: false,
      desc: '自學篇章；目錄已確認，題庫待建。'
    },
    {
      key: 'chinese-7-1-self-02', code: '自學二', title: '拄柺杖的小男孩', author: '簡媜', page: 172,
      type: 'self', referenceReady: false, bankMenuReady: false,
      desc: '自學篇章；目錄已確認，題庫待建。'
    },
    {
      key: 'chinese-7-1-self-03', code: '自學三', title: '曹操掉下去了', author: '王文華', page: 184,
      type: 'self', referenceReady: false, bankMenuReady: false,
      desc: '自學篇章；目錄已確認，題庫待建。'
    }
  ];

  // 第一課〈夏夜〉目前已確認的各校段考來源。
  const CHINESE_7_1_LESSON_01_SCHOOLS = [
    { key: 'chengzheng', name: '臺北市立誠正國中', exam: '114 學年度第一學期七年級第一次段考' },
    { key: 'yichang', name: '花蓮縣宜昌國中', exam: '114 學年度第一學期七年級第一次段考' },
    { key: 'siyu', name: '臺中市立四育國中', exam: '114 學年度第一學期七年級第一次段考' },
    { key: 'zhongxiao', name: '新北市立忠孝國中', exam: '114 學年度第一學期七年級第一次段考' },
    { key: 'fengjia', name: '高雄市立鳳甲國中', exam: '114 學年度第一學期七年級第一次段考' }
  ];

  const SCIENCE_SEMESTERS = [
    { key: '7-1', title: '七年級上學期', short: '一上', enabled: true },
    { key: '7-2', title: '七年級下學期', short: '一下', enabled: false },
    { key: '8-1', title: '八年級上學期', short: '二上', enabled: false },
    { key: '8-2', title: '八年級下學期', short: '二下', enabled: false },
    { key: '9-1', title: '九年級上學期', short: '三上', enabled: false },
    { key: '9-2', title: '九年級下學期', short: '三下', enabled: false }
  ];

  const SCIENCE_7_1_UNITS = [
    {
      key: 'unit-1', number: '單元 1', title: '生命現象與科學探究',
      sections: [
        { key: 'science-7-1-1-1', code: '1-1', title: '生命現象和生物圈', enabled: true, desc: '生命現象、生物圈、環境限制因子與生物適應' },
        { key: 'science-method', code: '1-2', title: '科學方法', enabled: true, desc: '科學方法步驟、實驗組與對照組、變因與資料判讀' },
        { key: 'science-7-1-1-3', code: '1-3', title: '認識實驗室', enabled: true, desc: '實驗器材、量筒、複式與解剖顯微鏡、倍率、成像與操作' },
        { key: 'science-7-1-core-1', code: '核心素養', title: '生活在沙漠中的生物', enabled: false, type: 'literacy' }
      ]
    },
    {
      key: 'unit-2', number: '單元 2', title: '生物體的構造',
      sections: [
        { key: 'science-7-1-2-1', code: '2-1', title: '生物體的基本構造', enabled: true, desc: '細胞學說、虎克、單細胞生物、細胞來源與幹細胞' },
        { key: 'science-7-1-2-2', code: '2-2', title: '細胞的形態和構造', enabled: true, desc: '細胞膜、細胞核、粒線體、葉綠體、細胞壁與細胞功能' },
        { key: 'science-7-1-2-3', code: '2-3', title: '有關生命的物質', enabled: true, desc: '擴散、滲透、選擇性通透與物質進出細胞' },
        { key: 'science-7-1-2-4', code: '2-4', title: '從細胞到生物體', enabled: true, desc: '細胞、組織、器官、器官系統與生物體組成層次' },
        { key: 'science-7-1-assessment-u01-u02', code: '學力測驗', title: '單元一～單元二', enabled: true, type: 'assessment', desc: '第1次學力診斷評量｜單元 1～2 綜合測驗，共25題，含原題附圖與逐題詳解。' },
        { key: 'science-7-1-core-2', code: '核心素養', title: '生命的起源', enabled: false, type: 'literacy' }
      ]
    },
    {
      key: 'unit-3', number: '單元 3', title: '生物體內的營養',
      sections: [
        { key: 'science-7-1-3-1', code: '3-1', title: '食物和養分', enabled: false },
        { key: 'science-7-1-3-2', code: '3-2', title: '酵素的作用', enabled: false },
        { key: 'science-7-1-3-3', code: '3-3', title: '光合作用', enabled: false },
        { key: 'science-7-1-3-4', code: '3-4', title: '人體的消化系統', enabled: false },
        { key: 'science-7-1-core-3', code: '核心素養', title: '養分的消化與吸收', enabled: false, type: 'literacy' }
      ]
    },
    {
      key: 'unit-4', number: '單元 4', title: '生物體內的運輸作用',
      sections: [
        { key: 'science-7-1-4-1', code: '4-1', title: '植物的維管束', enabled: false },
        { key: 'science-7-1-4-2', code: '4-2', title: '蒸散作用與養分運輸', enabled: false },
        { key: 'science-7-1-4-3', code: '4-3', title: '人體的血液循環', enabled: false },
        { key: 'science-7-1-4-4', code: '4-4', title: '人體的循環系統', enabled: false },
        { key: 'science-7-1-core-4', code: '核心素養', title: '人體的專一性防禦作用', enabled: false, type: 'literacy' }
      ]
    },
    {
      key: 'unit-5', number: '單元 5', title: '生物體內的協調作用',
      sections: [
        { key: 'science-7-1-5-1', code: '5-1', title: '刺激與反應', enabled: false },
        { key: 'science-7-1-5-2', code: '5-2', title: '神經系統', enabled: false },
        { key: 'science-7-1-5-3', code: '5-3', title: '內分泌系統', enabled: false },
        { key: 'science-7-1-5-4', code: '5-4', title: '行為與感應', enabled: false },
        { key: 'science-7-1-core-5', code: '核心素養', title: '動物印痕', enabled: false, type: 'literacy' }
      ]
    },
    {
      key: 'unit-6', number: '單元 6', title: '生物體內的恆定性',
      sections: [
        { key: 'science-7-1-6-1', code: '6-1', title: '呼吸運動與氣體恆定', enabled: false },
        { key: 'science-7-1-6-2', code: '6-2', title: '排泄作用與水分恆定', enabled: false },
        { key: 'science-7-1-6-3', code: '6-3', title: '體溫恆定與血糖恆定', enabled: false },
        { key: 'science-7-1-core-6', code: '核心素養', title: '糖尿病', enabled: false, type: 'literacy' }
      ]
    },
    {
      key: 'cross-topic', number: '跨科主題', title: '尺度的認識與應用',
      sections: [
        { key: 'science-7-1-cross-scale', code: '跨科主題', title: '尺度的認識與應用', enabled: false, type: 'cross' }
      ]
    }
  ];


  const SOCIAL_SEMESTERS = [
    { key: '7-1', title: '七年級上學期', short: '一上', enabled: true },
    { key: '7-2', title: '七年級下學期', short: '一下', enabled: false },
    { key: '8-1', title: '八年級上學期', short: '二上', enabled: false },
    { key: '8-2', title: '八年級下學期', short: '二下', enabled: false },
    { key: '9-1', title: '九年級上學期', short: '三上', enabled: false },
    { key: '9-2', title: '九年級下學期', short: '三下', enabled: false }
  ];

  // 社會七上第一冊依 2026-09-19 使用者提供的實體課本目錄建立。
  // 出版社／學年度版本待封面或版權頁確認。
  const SOCIAL_7_1_AREAS = {
    geography: {
      name: '地理', icon: '🗺️', partTitle: '臺灣的環境（上）',
      chapters: [
        { key: 'geo-01', code: '第1章', title: '認識位置與地圖', page: 8, type: 'chapter', referenceReady: true, detail: 'p.6～21 教材已收錄；辨識檔與 canonical 教材知識庫已建立' },
        { key: 'geo-02', code: '第2章', title: '世界中的臺灣', page: 22, type: 'chapter', referenceReady: true, detail: 'p.22～33 教材已收錄；辨識檔與 canonical 教材知識庫已建立' },
        { key: 'geo-inquiry-01', code: '問題探究', title: '立足臺灣、連結世界', page: 32, type: 'inquiry' },
        { key: 'geo-03', code: '第3章', title: '地形', page: 34, type: 'chapter', referenceReady: true, detail: 'p.34～47 教材已收錄；辨識檔與 canonical 教材知識庫已建立' },
        { key: 'geo-04', code: '第4章', title: '海岸與島嶼', page: 48, type: 'chapter', referenceReady: true, detail: 'p.48～59 教材已收錄；辨識檔與 canonical 教材知識庫已建立' },
        { key: 'geo-inquiry-02', code: '問題探究', title: '從高山高麗菜看臺灣山地的開發與影響', page: 58, type: 'inquiry' },
        { key: 'geo-05', code: '第5章', title: '天氣與氣候', page: 60, type: 'chapter' },
        { key: 'geo-06', code: '第6章', title: '水文', page: 76, type: 'chapter' },
        { key: 'geo-inquiry-03', code: '問題探究', title: '颱風與生活', page: 88, type: 'inquiry' }
      ]
    },
    history: {
      name: '歷史', icon: '📜', partTitle: '臺灣的歷史（上）',
      chapters: [
        {
          key: 'hist-intro', code: '導言', title: '認識歷史', page: 92, type: 'intro',
          referenceReady: true,
          detail: '歷史的基礎概念（p.92）｜歷史紀年方式（p.93）｜歷史熱身操（p.94～95）；已併入第1章 canonical 與後續題庫範圍'
        },
        {
          key: 'hist-01', code: '第1章', title: '史前臺灣與原住民文化', page: 96, type: 'chapter',
          referenceReady: true,
          detail: '建置範圍含導言 p.92～95；第1章 p.96～105。1-1 考古發掘與史前文化（p.98）｜1-2 臺灣原住民的遷徙與傳說（p.101）；辨識檔與 canonical 教材知識庫已建立'
        },
        {
          key: 'hist-02', code: '第2章', title: '大航海時代各方勢力的競逐', page: 106, type: 'chapter',
          referenceReady: true,
          detail: 'p.106～117 教材已收錄；2-1 大航海時代的到來（p.108）｜2-2 各方勢力在臺灣的競逐（p.110）｜歷史探查 外國人眼中的臺灣（p.116～117）；辨識檔、canonical 與簡易／中等／困難各20題已建立'
        },
        { key: 'hist-inquiry-01', code: '歷史探查', title: '外國人眼中的臺灣', page: 116, type: 'inquiry' },
        {
          key: 'hist-03', code: '第3章', title: '大航海時代臺灣原住民與外來者', page: 118, type: 'chapter',
          referenceReady: true,
          detail: 'p.118～125 教材已收錄；3-1 歐洲人與原住民（p.120）｜3-2 鄭氏政權與原住民（p.123）｜課後閱讀 臺灣梅花鹿（p.124）｜歷史漫談 第3章回顧（p.125）；辨識檔、canonical 與簡易／中等／困難各20題已建立'
        },
        {
          key: 'hist-04', code: '第4章', title: '清帝國統治政策的變遷', page: 126, type: 'chapter',
          detail: '4-1 清初治臺政策與措施（p.128）｜4-2 外力入侵與現代化建設（p.132）'
        },
        { key: 'hist-inquiry-02', code: '歷史探查', title: '面對臺灣——從被動到積極的清帝國', page: 138, type: 'inquiry' },
        {
          key: 'hist-05', code: '第5章', title: '清帝國時期農商業的發展', page: 140, type: 'chapter',
          detail: '5-1 農業發展（p.142）｜5-2 商業活動（p.144）'
        },
        {
          key: 'hist-06', code: '第6章', title: '清帝國時期社會文化的變遷', page: 150, type: 'chapter',
          detail: '6-1 漢人社會與文教的發展（p.152）｜6-2 原住民的社會文化變遷（p.156）'
        },
        { key: 'hist-inquiry-03', code: '歷史探查', title: '開港通商前後的臺灣社會', page: 160, type: 'inquiry' },
        { key: 'hist-people', code: '人物調查', title: '臺灣歷史人物調查', page: 162, type: 'inquiry' }
      ]
    },
    civics: {
      name: '公民', icon: '🏛️', partTitle: '公民身分及社群',
      chapters: [
        {
          key: 'civics-01', code: '第1章', title: '公民與公民德性', page: 166, type: 'chapter',
          referenceReady: true,
          detail: 'p.166～173 教材已收錄；1-1 什麼是公民？（p.168）｜1-2 現代公民應具備的基本德性（p.170）｜課後閱讀與圖解公民已納入；辨識檔、canonical 與簡易／中等／困難各20題已建立'
        },
        {
          key: 'civics-02', code: '第2章', title: '人性尊嚴與人權保障', page: 174, type: 'chapter',
          referenceReady: true,
          detail: 'p.174～183 教材已收錄；2-1 人性尊嚴與人權（p.176）｜2-2 人權保障的落實（p.178）｜實作與練習、課後閱讀與圖解公民已納入；辨識檔、canonical 與簡易／中等／困難各20題已建立'
        },
        {
          key: 'civics-03', code: '第3章', title: '家庭生活', page: 184, type: 'chapter',
          referenceReady: true,
          detail: 'p.184～193 教材已收錄；3-1 家庭中的親屬關係（p.186）｜3-2 家庭型態與生活模式（p.188）｜3-3 家庭成員的權利與義務（p.190）｜課後閱讀與圖解公民已納入；辨識檔、canonical 與簡易／中等／困難各20題已建立'
        },
        {
          key: 'civics-04', code: '第4章', title: '變遷中的家庭', page: 194, type: 'chapter',
          detail: '4-1 家庭的功能與轉變（p.196）｜4-2 政府如何協助家庭發揮功能？（p.198）'
        },
        {
          key: 'civics-05', code: '第5章', title: '學生權利與校園生活', page: 204, type: 'chapter',
          detail: '5-1 校園中的權利與維護（p.206）｜5-2 如何參與校園公共事務？（p.210）'
        },
        {
          key: 'civics-06', code: '第6章', title: '部落與公民參與', page: 216, type: 'chapter',
          detail: '6-1 部落的意義與重要性（p.218）｜6-2 部落的挑戰與公民參與（p.221）'
        },
        { key: 'civics-fieldwork', code: '資料活動', title: '如何進行田野觀察', page: 226, type: 'activity' },
        { key: 'civics-image-source', code: '附錄', title: '圖片來源', page: 228, type: 'appendix' }
      ]
    }
  };

  const $ = (sel, root = document) => root.querySelector(sel);

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .catalog-shell{max-width:840px;margin:auto}
      .catalog-header{background:linear-gradient(135deg,#172554,#1d4ed8);color:#fff;border-radius:20px;padding:24px 20px;margin-bottom:16px;box-shadow:0 10px 28px rgba(15,23,42,.14)}
      .catalog-header h1{margin:0 0 4px;font-size:1.65rem}
      .catalog-header p{margin:0;opacity:.9}
      .catalog-panel{background:#fff;border:1px solid #dfe5ee;border-radius:16px;box-shadow:0 4px 14px rgba(15,23,42,.04);padding:22px;margin:14px 0}
      .catalog-title{text-align:center;margin:0 0 6px}
      .catalog-sub{text-align:center;color:#657089;font-size:.92rem;margin:0 0 18px}
      .catalog-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .catalog-card{width:100%;border:2px solid #dfe5ee;background:#fff;border-radius:16px;padding:17px 16px;text-align:left;cursor:pointer;transition:.16s;color:#172033}
      .catalog-card:hover:not(:disabled){transform:translateY(-2px);border-color:#93b4fb;box-shadow:0 7px 20px rgba(37,99,235,.1)}
      .catalog-card:disabled{cursor:default;background:#f8fafc;color:#94a3b8}
      .catalog-card .top{display:flex;align-items:center;gap:11px}
      .catalog-card .icon{font-size:1.6rem;line-height:1}
      .catalog-card strong{font-size:1.16rem}
      .catalog-card .desc{display:block;color:#657089;font-size:.9rem;margin-top:7px}
      .catalog-card:disabled .desc{color:#94a3b8}
      .catalog-badge{display:inline-block;margin-left:auto;border-radius:999px;padding:3px 8px;font-size:.76rem;font-weight:700;background:#eef4ff;color:#1d4ed8;white-space:nowrap}
      .catalog-badge.soon{background:#f1f5f9;color:#64748b}
      .catalog-badge.core{background:#fff7ed;color:#c2410c}
      .catalog-badge.reference{background:#ecfdf5;color:#047857}
      .catalog-badge.school{background:#f5f3ff;color:#6d28d9}
      .catalog-back{border:0;background:#e2e8f0;color:#1e293b;border-radius:10px;padding:9px 12px;font-weight:700;cursor:pointer;margin-bottom:14px}
      .catalog-path{color:#64748b;font-size:.88rem;margin-bottom:10px}
      .chapter-card{grid-column:1/-1}
      .chapter-card strong{font-size:1.12rem}
      #catalogShell.hidden{display:none!important}
      .chapter-back-row{display:flex;justify-content:flex-start;margin-top:14px}
      #chapterBackBtn{background:#e2e8f0;color:#1e293b}
      .english-reference-section{border:1px solid #dfe5ee;background:#fff;border-radius:14px;padding:16px;margin:12px 0}
      .english-reference-section h3{margin:0 0 8px;color:#172554;font-size:1.08rem}
      .english-reference-page{display:inline-block;margin-left:8px;color:#64748b;font-size:.82rem;font-weight:600}
      .english-reference-list{margin:7px 0 0;padding-left:1.25rem}
      .english-reference-list li{margin:5px 0}
      .english-reference-group{margin:10px 0;padding:10px 12px;background:#f8fafc;border-radius:10px}
      .english-reference-group strong{display:block;margin-bottom:5px;color:#334155}
      .english-reference-chips{display:flex;flex-wrap:wrap;gap:6px}
      .english-reference-chip{display:inline-block;padding:4px 8px;border-radius:999px;background:#eef4ff;color:#1e3a8a;font-size:.86rem}
      .english-reference-pattern{margin:9px 0;padding:10px 12px;border-left:4px solid #93c5fd;background:#f8fbff;border-radius:8px}
      .english-reference-pattern strong{display:block;margin-bottom:5px}
      .english-reference-example{display:block;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;margin:3px 0;color:#334155}
      .english-reference-table-wrap{overflow-x:auto;margin-top:8px}
      .english-reference-table{width:100%;border-collapse:collapse;font-size:.92rem}
      .english-reference-table th,.english-reference-table td{border:1px solid #dfe5ee;padding:8px 10px;text-align:left;vertical-align:top}
      .english-reference-table th{background:#f1f5f9;color:#334155}
      .english-reference-note{margin-top:10px;padding:10px 12px;background:#fffbeb;border-left:4px solid #fbbf24;border-radius:8px;color:#713f12}
      .english-reference-source{margin-top:16px;color:#64748b;font-size:.86rem;line-height:1.65}
      @media(max-width:620px){
        .catalog-grid{grid-template-columns:1fr}
        .catalog-panel{padding:17px 14px}
        .catalog-header h1{font-size:1.38rem}
      }
    `;
    document.head.appendChild(style);
  }

  function makeShell() {
    const startScreen = $('#startScreen');
    if (!startScreen || $('#catalogShell')) return null;
    const shell = document.createElement('section');
    shell.id = 'catalogShell';
    shell.className = 'catalog-shell';
    shell.innerHTML = `
      <header class="catalog-header">
        <h1 id="catalogHeaderTitle">國中題庫</h1>
        <p id="catalogHeaderSub">選擇科目開始練習</p>
      </header>
      <div class="catalog-panel"><div id="catalogContent"></div></div>
    `;
    startScreen.parentNode.insertBefore(shell, startScreen);
    return shell;
  }

  function setHeader(title, sub) {
    const titleEl = $('#catalogHeaderTitle');
    const subEl = $('#catalogHeaderSub');
    if (titleEl) titleEl.textContent = title;
    if (subEl) subEl.textContent = sub;
  }

  function showSubjects() {
    const shell = $('#catalogShell');
    if (!shell) return;
    shell.classList.remove('hidden');
    $('#startScreen')?.classList.add('hidden');
    $('#examScreen')?.classList.add('hidden');
    setHeader('國中題庫', '先選科目，再選學期與章節');
    document.title = '國中題庫';
    $('#catalogContent').innerHTML = `
      <h2 class="catalog-title">請選擇科目</h2>
      <p class="catalog-sub">目前國文、英文、自然與社會已建立科目入口；教材與題庫內容持續擴充。</p>
      <div class="catalog-grid">
        ${SUBJECTS.map(s => `
          <button class="catalog-card" data-subject="${s.key}" ${s.enabled ? '' : 'disabled'}>
            <span class="top"><span class="icon">${s.icon}</span><strong>${s.name}</strong><span class="catalog-badge ${s.enabled ? '' : 'soon'}">${s.enabled ? '已建立' : '建置中'}</span></span>
            <span class="desc">${s.enabled ? '進入科目選擇學期與章節' : '題庫尚未建立'}</span>
          </button>`).join('')}
      </div>`;
    $('[data-subject="chinese"]')?.addEventListener('click', showChineseSemesters);
    $('[data-subject="english"]')?.addEventListener('click', showEnglishSemesters);
    $('[data-subject="science"]')?.addEventListener('click', showScienceSemesters);
    $('[data-subject="social"]')?.addEventListener('click', showSocialCategories);
  }

  function showSocialCategories() {
    setHeader('社會科', '選擇領域');
    document.title = '社會科｜國中題庫';
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backSubjectsBtn">← 返回科目</button>
      <div class="catalog-path">社會</div>
      <h2 class="catalog-title">請選擇領域</h2>
      <p class="catalog-sub">國中社會科依實體課本分為地理、歷史、公民三大領域；七年級上學期第一冊目錄已確認。</p>
      <div class="catalog-grid">
        ${Object.entries(SOCIAL_7_1_AREAS).map(([key, area]) => `
          <button class="catalog-card" data-social-area="${key}">
            <span class="top"><span class="icon">${area.icon}</span><strong>${area.name}</strong><span class="catalog-badge reference">七上目錄已確認</span></span>
            <span class="desc">${area.partTitle}｜進入年級與學期。</span>
          </button>`).join('')}
      </div>`;
    $('#backSubjectsBtn')?.addEventListener('click', showSubjects);
    Object.keys(SOCIAL_7_1_AREAS).forEach(key =>
      $("[data-social-area=\"" + key + "\"]")?.addEventListener('click', () => showSocialSemesters(key))
    );
  }

  function showSocialSemesters(areaKey) {
    const area = SOCIAL_7_1_AREAS[areaKey];
    if (!area) return;
    setHeader(`社會科｜${area.name}`, '選擇年級與學期');
    document.title = `${area.name}｜社會科題庫`;
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backSocialCategoriesBtn">← 返回社會科</button>
      <div class="catalog-path">社會　›　${area.name}</div>
      <h2 class="catalog-title">請選擇學期</h2>
      <p class="catalog-sub">七年級上學期第一冊已依實體課本目錄建立；其他學期等待教材確認。</p>
      <div class="catalog-grid">
        ${SOCIAL_SEMESTERS.map(s => `
          <button class="catalog-card" data-social-semester="${s.key}" ${s.enabled ? '' : 'disabled'}>
            <span class="top"><strong>${s.title}</strong><span class="catalog-badge ${s.enabled ? 'reference' : 'soon'}">${s.enabled ? '第一冊已確認' : '待建'}</span></span>
            <span class="desc">${s.enabled ? area.partTitle + '｜查看章節目錄' : '尚未建立教材目錄'}</span>
          </button>`).join('')}
      </div>`;
    $('#backSocialCategoriesBtn')?.addEventListener('click', showSocialCategories);
    $('[data-social-semester="7-1"]')?.addEventListener('click', () => showSocial71Chapters(areaKey));
  }

  function showSocial71Chapters(areaKey) {
    const area = SOCIAL_7_1_AREAS[areaKey];
    if (!area) return;
    setHeader(`社會七上｜${area.name}`, area.partTitle);
    document.title = `${area.name}第一冊｜七年級上學期`;
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backSocialSemestersBtn">← 返回學期</button>
      <div class="catalog-path">社會　›　${area.name}　›　七年級上學期（一上）　›　第一冊</div>
      <h2 class="catalog-title">${area.partTitle}</h2>
      <p class="catalog-sub">章名與起始頁碼已由 2026-09-19 提供的實體課本目錄確認；出版社／學年度版本待封面或版權頁確認。</p>
      <div class="catalog-grid">
        ${area.chapters.map(chapter => `
          <button class="catalog-card chapter-card" data-social-chapter="${chapter.key}">
            <span class="top"><strong>${chapter.code}　${chapter.title}</strong><span class="catalog-badge ${chapter.referenceReady ? 'reference' : 'reference'}">${chapter.referenceReady ? '教材已收錄' : '目錄已確認'}</span></span>
            <span class="desc">課本起始頁 p.${chapter.page}${chapter.detail ? '｜' + chapter.detail : ''}</span>
          </button>`).join('')}
      </div>`;
    $('#backSocialSemestersBtn')?.addEventListener('click', () => showSocialSemesters(areaKey));
    area.chapters.forEach(chapter =>
      $("[data-social-chapter=\"" + chapter.key + "\"]")?.addEventListener('click', () => showSocial71Chapter(areaKey, chapter.key))
    );
  }

  function showSocial71Chapter(areaKey, chapterKey) {
    const area = SOCIAL_7_1_AREAS[areaKey];
    const chapter = area?.chapters.find(item => item.key === chapterKey);
    if (!area || !chapter) return;
    setHeader(`${area.name}第一冊｜${chapter.code}`, chapter.title);
    document.title = `${chapter.code} ${chapter.title}｜${area.name}第一冊`;
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backSocial71ChaptersBtn">← 返回章節</button>
      <div class="catalog-path">社會　›　${area.name}　›　七年級上學期（一上）　›　第一冊　›　${chapter.code} ${chapter.title}</div>
      <h2 class="catalog-title">${chapter.code}　${chapter.title}</h2>
      <p class="catalog-sub">課本起始頁 p.${chapter.page}｜${chapter.referenceReady ? '教材原圖、辨識檔與 canonical 教材知識庫已建立；題庫待後續建置。' : '目前僅完成目錄定位，教材內容與題庫待後續收錄。'}</p>
      <div class="catalog-grid">
        <button class="catalog-card chapter-card" disabled>
          <span class="top"><strong>📚 教材參考資料</strong><span class="catalog-badge ${chapter.referenceReady ? 'reference' : 'soon'}">${chapter.referenceReady ? '已收錄' : '待收錄'}</span></span>
          <span class="desc">${chapter.referenceReady ? '原始教材影像已歸檔，教材辨識檔與 canonical 教材知識庫已建立。' : '收到本章課本／講義後，依教材整理 SOP 建立辨識檔與 canonical 教材知識庫。'}</span>
        </button>
        <button class="catalog-card chapter-card" disabled>
          <span class="top"><strong>📝 章節題庫</strong><span class="catalog-badge soon">待建</span></span>
          <span class="desc">教材內容確認後，再建立自編題與各校段考拆解題。</span>
        </button>
      </div>`;
    $('#backSocial71ChaptersBtn')?.addEventListener('click', () => showSocial71Chapters(areaKey));
  }

  function showEnglishSemesters() {
    setHeader('英文科', '選擇年級、學期或全民英檢');
    document.title = '英文科｜國中題庫';
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backSubjectsBtn">← 返回科目</button>
      <div class="catalog-path">英文</div>
      <h2 class="catalog-title">請選擇學期</h2>
      <p class="catalog-sub">七年級上學期已依實體課本目錄建立 Get Ready、Lesson 1–6 與 Review 1–3；全民英檢（GEPT）保留獨立練習入口。</p>
      <div class="catalog-grid">
        ${ENGLISH_SEMESTERS.map(s => `
          <button class="catalog-card" data-english-semester="${s.key}">
            <span class="top"><strong>${s.title}</strong><span class="catalog-badge ${s.key === '7-1' ? 'reference' : ''}">${s.short}</span></span>
            <span class="desc">${s.key === '7-1' ? 'Get Ready、Lesson 1–6、Review 1–3｜目錄已確認' : '查看章節建置狀態'}</span>
          </button>`).join('')}
        <button class="catalog-card chapter-card" id="englishGeptBtn">
          <span class="top"><span class="icon">🎧</span><strong>全民英檢（GEPT）</strong><span class="catalog-badge reference">GEPT</span></span>
          <span class="desc">獨立於校內學期教材，規劃初級、中級與中高級等級練習。</span>
        </button>
      </div>`;
    $('#backSubjectsBtn')?.addEventListener('click', showSubjects);
    ENGLISH_SEMESTERS.forEach(s => $(`[data-english-semester="${s.key}"]`)?.addEventListener('click', () => showEnglishSemester(s.key)));
    $('#englishGeptBtn')?.addEventListener('click', showEnglishGept);
  }

  function showEnglishSemester(semesterKey) {
    const semester = ENGLISH_SEMESTERS.find(s => s.key === semesterKey);
    if (!semester) return;
    if (semesterKey === '7-1') return showEnglish71Lessons();
    setHeader(`英文科｜${semester.title}`, '章節建置中');
    document.title = `英文${semester.short}｜國中題庫`;
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backEnglishSemestersBtn">← 返回學期</button>
      <div class="catalog-path">英文　›　${semester.title}（${semester.short}）</div>
      <h2 class="catalog-title">章節尚待建立</h2>
      <p class="catalog-sub">等實際英文課本／講義確認後，再依版本建立 Lesson、單字、文法、閱讀、聽力與題庫架構。</p>`;
    $('#backEnglishSemestersBtn')?.addEventListener('click', showEnglishSemesters);
  }

  function englishBadge(lesson) {
    if (lesson.bankMenuReady) return '<span class="catalog-badge reference">題庫架構已建</span>';
    if (lesson.referenceReady) return '<span class="catalog-badge reference">教材已收錄</span>';
    return '<span class="catalog-badge soon">目錄已確認</span>';
  }

  function showEnglish71Lessons() {
    setHeader('英文科｜七年級上學期', '第一冊｜選擇課次');
    document.title = '英文第一冊｜七年級上學期';
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backEnglishSemestersBtn">← 返回學期</button>
      <div class="catalog-path">英文　›　七年級上學期（一上）　›　第一冊</div>
      <h2 class="catalog-title">請選擇課次</h2>
      <p class="catalog-sub">依實體課本目錄建立：Get Ready、Lesson 1–6、Review 1–3。出版社／版次待封面或版權頁確認。</p>
      <div class="catalog-grid">
        ${ENGLISH_7_1_LESSONS.map(lesson => `
          <button class="catalog-card chapter-card" data-english-lesson="${lesson.key}">
            <span class="top"><strong>${lesson.code}　${lesson.title}</strong>${englishBadge(lesson)}</span>
            <span class="desc">p.${lesson.page}${lesson.detail ? `｜${lesson.detail}` : ''}</span>
            <span class="desc">${lesson.readingSkill ? `閱讀技巧：${lesson.readingSkill}｜` : ''}${lesson.desc}</span>
          </button>`).join('')}
      </div>`;
    $('#backEnglishSemestersBtn')?.addEventListener('click', showEnglishSemesters);
    ENGLISH_7_1_LESSONS.forEach(lesson => $(`[data-english-lesson="${lesson.key}"]`)?.addEventListener('click', () => showEnglish71Lesson(lesson.key)));
  }

  function showEnglish71Lesson(lessonKey) {
    const lesson = ENGLISH_7_1_LESSONS.find(item => item.key === lessonKey);
    if (!lesson) return;
    setHeader(`英文第一冊｜${lesson.code}`, lesson.title);
    document.title = `${lesson.code} ${lesson.title}｜英文第一冊`;
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backEnglish71LessonsBtn">← 返回課次</button>
      <div class="catalog-path">英文　›　七年級上學期（一上）　›　第一冊　›　${lesson.code} ${lesson.title}</div>
      <h2 class="catalog-title">${lesson.code}　${lesson.title}</h2>
      <p class="catalog-sub">課本起始頁 p.${lesson.page}${lesson.detail ? `｜${lesson.detail}` : ''}${lesson.readingSkill ? `｜Reading Skills：${lesson.readingSkill}` : ''}</p>
      <div class="catalog-grid">
        <button class="catalog-card chapter-card" id="englishLessonReferenceBtn" ${lesson.referenceReady && lesson.referencePath ? '' : 'disabled'}>
          <span class="top"><strong>📚 教材參考資料</strong><span class="catalog-badge ${lesson.referenceReady ? 'reference' : 'soon'}">${lesson.referenceReady ? '已整理' : '待收錄'}</span></span>
          <span class="desc">${lesson.referenceReady
            ? (lesson.type === 'ready'
              ? '查看字母、招呼、自我介紹、姓名、年齡與英文書寫原則整理。'
              : '查看本課字彙、文法、閱讀、發音與考試重點整理。')
            : lesson.desc + ' 後續依實體課本逐頁建立教材辨識檔與 canonical 教材知識庫。'}</span>
        </button>
        ${lesson.type === 'ready' ? '' : `
        <button class="catalog-card chapter-card" id="englishLessonBankBtn" ${lesson.bankMenuReady && lesson.banks ? '' : 'disabled'}>
          <span class="top"><strong>📝 章節題庫</strong><span class="catalog-badge ${lesson.bankMenuReady ? 'reference' : 'soon'}">${lesson.bankMenuReady ? '45 題已建立' : '待建'}</span></span>
          <span class="desc">${lesson.bankMenuReady ? '簡易、中等、困難各 15 題；四選一並附逐題詳解。' : '教材內容確認後，再建立單字、文法、閱讀與各校段考拆解題。'}</span>
        </button>`}
      </div>`;
    $('#backEnglish71LessonsBtn')?.addEventListener('click', showEnglish71Lessons);
    if (lesson.referenceReady && lesson.referencePath) {
      $('#englishLessonReferenceBtn')?.addEventListener('click', () => showEnglishLessonReference(lessonKey));
    }
    if (lesson.type !== 'ready' && lesson.bankMenuReady && lesson.banks) {
      $('#englishLessonBankBtn')?.addEventListener('click', () => showEnglishLessonBanks(lessonKey));
    }
  }

  function showEnglishLessonBanks(lessonKey) {
    const lesson = ENGLISH_7_1_LESSONS.find(item => item.key === lessonKey);
    if (!lesson?.banks) return;

    setHeader(`${lesson.code}｜章節題庫`, lesson.title);
    document.title = `${lesson.code} 章節題庫｜英文第一冊`;

    const levels = [
      { key:'easy', icon:'🌱', label:'簡易', desc:'基礎單字、親屬關係、be 動詞與 Who 基本句型。' },
      { key:'medium', icon:'🌿', label:'中等', desc:'情境式字彙與文法、人物職業、Scanning 與句型應用。' },
      { key:'hard', icon:'🌳', label:'困難', desc:'多步驟親屬推理、整合語意、閱讀定位與發音判讀。' }
    ];

    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backEnglishLessonBtn">← 返回 ${lesson.code}</button>
      <div class="catalog-path">英文　›　七年級上學期（一上）　›　第一冊　›　${lesson.code}　›　章節題庫</div>
      <h2 class="catalog-title">${lesson.code}　${lesson.title}</h2>
      <p class="catalog-sub">依本課教材內容自編四選一練習；三種難度各 15 題，每題附詳解。</p>
      <div class="catalog-grid">
        ${levels.map(level => `
          <button class="catalog-card" data-english-lesson-bank="${level.key}">
            <span class="top"><span class="icon">${level.icon}</span><strong>${level.label}</strong><span class="catalog-badge reference">15 題</span></span>
            <span class="desc">${level.desc}</span>
          </button>`).join('')}
      </div>`;

    $('#backEnglishLessonBtn')?.addEventListener('click', () => showEnglish71Lesson(lessonKey));
    levels.forEach(level => {
      $("[data-english-lesson-bank=\"" + level.key + "\"]")?.addEventListener('click', event => {
        openEnglishLessonBank(lessonKey, level.key, event.currentTarget);
      });
    });
  }

  async function openEnglishLessonBank(lessonKey, difficultyKey, button) {
    const lesson = ENGLISH_7_1_LESSONS.find(item => item.key === lessonKey);
    const path = lesson?.banks?.[difficultyKey];
    if (!lesson || !path || !button) return;

    const oldHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span class="top"><span class="icon">⏳</span><strong>準備題目…</strong></span><span class="desc">正在載入題目與詳解</span>';

    try {
      const response = await fetch(path, { cache:'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const questions = Array.isArray(data.questions) ? data.questions : [];
      if (questions.length !== 15) throw new Error(`題數異常：${questions.length}/15`);
      if (typeof banks === 'undefined' || typeof window.startExam !== 'function') throw new Error('題庫引擎尚未就緒');

      const exam = data.exam || {};
      const key = exam.key || exam.difficulty || `${lessonKey}-${difficultyKey}`;

      banks[key] = questions;
      window.examContexts = window.examContexts || {};
      window.examContexts[key] = {
        ...exam,
        key,
        difficulty: key,
        examType: exam.examType || 'english-school-lesson-practice',
        preserveOptionOrder: exam.preserveOptionOrder === true,
        backLabel: `返回 ${lesson.code} 題庫`,
        onBack: () => showEnglishLessonBanks(lessonKey)
      };

      window.startExam(key);
    } catch (error) {
      console.error('[english-lesson-bank] load failed', error);
      alert(`題庫載入失敗：${error.message}`);
      button.disabled = false;
      button.innerHTML = oldHtml;
    }
  }

  function renderEnglishReferenceSection(section) {
    const page = section.page ? `<span class="english-reference-page">${section.page}</span>` : '';
    let body = '';

    if (section.type === 'groups') {
      body = (section.groups || []).map(group => `
        <div class="english-reference-group">
          <strong>${group.label || ''}</strong>
          <div class="english-reference-chips">
            ${(group.items || []).map(item => `<span class="english-reference-chip">${item}</span>`).join('')}
          </div>
        </div>`).join('');
    } else if (section.type === 'patterns') {
      body = (section.patterns || []).map(pattern => `
        <div class="english-reference-pattern">
          <strong>${pattern.label || ''}</strong>
          ${(pattern.examples || []).map(example => `<span class="english-reference-example">${example}</span>`).join('')}
        </div>`).join('');
    } else if (section.type === 'table') {
      body = `
        <div class="english-reference-table-wrap">
          <table class="english-reference-table">
            <thead><tr>${(section.columns || []).map(column => `<th>${column}</th>`).join('')}</tr></thead>
            <tbody>
              ${(section.rows || []).map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </div>
        ${(section.notes || []).map(note => `<div class="english-reference-note">${note}</div>`).join('')}`;
    } else {
      body = `<ul class="english-reference-list">${(section.items || []).map(item => `<li>${item}</li>`).join('')}</ul>`;
    }

    return `
      <section class="english-reference-section">
        <h3>${section.title || ''}${page}</h3>
        ${body}
      </section>`;
  }

  async function showEnglishLessonReference(lessonKey) {
    const lesson = ENGLISH_7_1_LESSONS.find(item => item.key === lessonKey);
    if (!lesson?.referencePath) return;

    setHeader(`${lesson.code}｜教材參考資料`, lesson.title);
    document.title = `${lesson.code} 教材參考資料｜英文第一冊`;
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backEnglishLessonBtn">← 返回 ${lesson.code}</button>
      <div class="catalog-path">英文　›　七年級上學期（一上）　›　第一冊　›　${lesson.code}　›　教材參考資料</div>
      <h2 class="catalog-title">${lesson.code}　${lesson.title}</h2>
      <p class="catalog-sub">教材參考資料載入中…</p>`;

    $('#backEnglishLessonBtn')?.addEventListener('click', () => showEnglish71Lesson(lessonKey));

    try {
      const response = await fetch(lesson.referencePath, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const contentEl = $('#catalogContent');
      if (!contentEl) return;

      contentEl.innerHTML = `
        <button class="catalog-back" id="backEnglishLessonBtn">← 返回 ${lesson.code}</button>
        <div class="catalog-path">英文　›　七年級上學期（一上）　›　第一冊　›　${lesson.code}　›　教材參考資料</div>
        <h2 class="catalog-title">${data.lessonCode || lesson.code}　${data.title || lesson.title}</h2>
        <p class="catalog-sub">${data.schoolYear || ''}${data.publisher ? '｜' + data.publisher + '版' : ''}${data.pageRange ? '｜' + data.pageRange : ''}</p>
        <section class="english-reference-section">
          <h3>本課學習重點</h3>
          <ul class="english-reference-list">${(data.learningGoals || []).map(item => `<li>${item}</li>`).join('')}</ul>
        </section>
        ${(data.sections || []).map(renderEnglishReferenceSection).join('')}
        ${data.sourceNote ? `<div class="english-reference-source">${data.sourceNote}</div>` : ''}`;

      $('#backEnglishLessonBtn')?.addEventListener('click', () => showEnglish71Lesson(lessonKey));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('[english-reference] load failed', error);
      $('#catalogContent').innerHTML = `
        <button class="catalog-back" id="backEnglishLessonBtn">← 返回 ${lesson.code}</button>
        <div class="catalog-path">英文　›　七年級上學期（一上）　›　第一冊　›　${lesson.code}　›　教材參考資料</div>
        <h2 class="catalog-title">教材參考資料載入失敗</h2>
        <p class="catalog-sub">請重新整理後再試一次。</p>`;
      $('#backEnglishLessonBtn')?.addEventListener('click', () => showEnglish71Lesson(lessonKey));
    }
  }

  function showEnglishGept() {
    setHeader('英文科｜全民英檢', 'GEPT 練習架構');
    document.title = '全民英檢 GEPT｜英文題庫';
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backEnglishSemestersBtn">← 返回英文</button>
      <div class="catalog-path">英文　›　全民英檢（GEPT）</div>
      <h2 class="catalog-title">全民英檢（GEPT）</h2>
      <p class="catalog-sub">先建立等級入口；後續再依實際教材與練習需求加入字彙、文法、閱讀與聽力題庫。</p>
      <div class="catalog-grid">
        <button class="catalog-card" disabled><span class="top"><strong>初級</strong><span class="catalog-badge soon">待建</span></span><span class="desc">基礎字彙、文法、閱讀與聽力。</span></button>
        <button class="catalog-card" disabled><span class="top"><strong>中級</strong><span class="catalog-badge soon">待建</span></span><span class="desc">中階字彙、文法、閱讀與聽力。</span></button>
        <button class="catalog-card" disabled><span class="top"><strong>中高級</strong><span class="catalog-badge soon">待建</span></span><span class="desc">進階字彙、文法、閱讀與聽力。</span></button>
      </div>`;
    $('#backEnglishSemestersBtn')?.addEventListener('click', showEnglishSemesters);
  }

  function showChineseSemesters() {
    setHeader('國文科', '選擇年級與學期');
    document.title = '國文科｜國中題庫';
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backSubjectsBtn">← 返回科目</button>
      <div class="catalog-path">國文</div>
      <h2 class="catalog-title">請選擇學期</h2>
      <p class="catalog-sub">七年級上學期第一冊已依實體課本目錄建立完整課次；其他學期後續加入。</p>
      <div class="catalog-grid">
        ${CHINESE_SEMESTERS.map(s => `
          <button class="catalog-card" data-chinese-semester="${s.key}">
            <span class="top"><strong>${s.title}</strong><span class="catalog-badge ${s.key === '7-1' ? 'reference' : ''}">${s.short}</span></span>
            <span class="desc">${s.key === '7-1' ? '第一冊：10 課、語文天地 2 單元、自學 3 篇' : '查看章節建置狀態'}</span>
          </button>`).join('')}
      </div>`;
    $('#backSubjectsBtn')?.addEventListener('click', showSubjects);
    CHINESE_SEMESTERS.forEach(s => $(`[data-chinese-semester="${s.key}"]`)?.addEventListener('click', () => showChineseSemester(s.key)));
  }

  function showChineseSemester(semesterKey) {
    const semester = CHINESE_SEMESTERS.find(s => s.key === semesterKey);
    if (!semester) return;
    if (semesterKey === '7-1') return showChinese71Lessons();
    setHeader(`國文科｜${semester.title}`, '章節建置中');
    document.title = `國文${semester.short}｜國中題庫`;
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backChineseSemestersBtn">← 返回學期</button>
      <div class="catalog-path">國文　›　${semester.title}（${semester.short}）</div>
      <h2 class="catalog-title">章節尚待建立</h2>
      <p class="catalog-sub">等實際課本／講義確認後，再依教材加入課次、題庫與知識基準。</p>`;
    $('#backChineseSemestersBtn')?.addEventListener('click', showChineseSemesters);
  }

  function chineseBadge(lesson) {
    if (lesson.bankMenuReady) return '<span class="catalog-badge reference">題庫架構已建</span>';
    if (lesson.referenceReady) return '<span class="catalog-badge reference">教材已收錄</span>';
    return '<span class="catalog-badge soon">目錄已確認</span>';
  }

  function showChinese71Lessons() {
    setHeader('國文科｜七年級上學期', '第一冊｜選擇課次');
    document.title = '國文第一冊｜七年級上學期';
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backChineseSemestersBtn">← 返回學期</button>
      <div class="catalog-path">國文　›　七年級上學期（一上）　›　第一冊</div>
      <h2 class="catalog-title">請選擇課次</h2>
      <p class="catalog-sub">依實體課本目錄建立：10 課、語文天地 2 單元、自學 3 篇。</p>
      <div class="catalog-grid">
        ${CHINESE_7_1_LESSONS.map(lesson => `
          <button class="catalog-card chapter-card" data-chinese-lesson="${lesson.key}">
            <span class="top"><strong>${lesson.code}　${lesson.title}</strong>${chineseBadge(lesson)}</span>
            <span class="desc">${lesson.author ? `${lesson.author}｜` : ''}p.${lesson.page}${lesson.detail ? `｜${lesson.detail}` : ''}</span>
            <span class="desc">${lesson.desc}</span>
          </button>`).join('')}
      </div>`;
    $('#backChineseSemestersBtn')?.addEventListener('click', showChineseSemesters);
    CHINESE_7_1_LESSONS.forEach(lesson => $(`[data-chinese-lesson="${lesson.key}"]`)?.addEventListener('click', () => showChinese71Lesson(lesson.key)));
  }

  function showChinese71Lesson(lessonKey) {
    const lesson = CHINESE_7_1_LESSONS.find(item => item.key === lessonKey);
    if (!lesson) return;
    if (lessonKey === 'chinese-7-1-lesson-01') return showChinese71Lesson01Banks();

    setHeader(`國文第一冊｜${lesson.code}`, lesson.title);
    document.title = `${lesson.code} ${lesson.title}｜國文第一冊`;
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backChinese71LessonsBtn">← 返回課次</button>
      <div class="catalog-path">國文　›　七年級上學期（一上）　›　第一冊　›　${lesson.code} ${lesson.title}</div>
      <h2 class="catalog-title">${lesson.code}　${lesson.title}</h2>
      <p class="catalog-sub">${lesson.author ? `作者：${lesson.author}｜` : ''}課本起始頁 p.${lesson.page}${lesson.detail ? `｜${lesson.detail}` : ''}</p>
      <div class="catalog-grid">
        <button class="catalog-card chapter-card" disabled>
          <span class="top"><strong>📚 教材參考資料</strong><span class="catalog-badge ${lesson.referenceReady ? 'reference' : 'soon'}">${lesson.referenceReady ? '已收錄' : '待建'}</span></span>
          <span class="desc">${lesson.referenceReady ? lesson.desc : '課本目錄位置已確認；教材內容後續依原始課本／講義建立。'}</span>
        </button>
        <button class="catalog-card chapter-card" disabled>
          <span class="top"><strong>📝 章節題庫</strong><span class="catalog-badge soon">待建</span></span>
          <span class="desc">教材內容確認後，再建立自編題與各校段考拆解題。</span>
        </button>
      </div>`;
    $('#backChinese71LessonsBtn')?.addEventListener('click', showChinese71Lessons);
  }

  function showChinese71Lesson01Banks() {
    setHeader('國文第一冊｜第一課', '夏夜｜選擇題庫');
    document.title = '第一課 夏夜｜國文第一冊';
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backChinese71LessonsBtn">← 返回課次</button>
      <div class="catalog-path">國文　›　七年級上學期（一上）　›　第一冊　›　第一課 夏夜</div>
      <h2 class="catalog-title">第一課　夏夜</h2>
      <p class="catalog-sub">自編題依難度建立；各校題庫保留真實段考來源與原始題型。</p>
      <div class="catalog-grid">
        <button class="catalog-card" disabled><span class="top"><span class="icon">🌱</span><strong>簡易</strong><span class="catalog-badge soon">待建</span></span><span class="desc">字音字形、基本課文內容、作者與基礎修辭。</span></button>
        <button class="catalog-card" disabled><span class="top"><span class="icon">🌿</span><strong>中等</strong><span class="catalog-badge soon">待建</span></span><span class="desc">文意理解、意象判讀、修辭與寫作手法整合。</span></button>
        <button class="catalog-card" disabled><span class="top"><span class="icon">🌳</span><strong>困難</strong><span class="catalog-badge soon">待建</span></span><span class="desc">跨文本、延伸閱讀、綜合應用與高層次判讀。</span></button>
        <button class="catalog-card" id="chineseLesson01SchoolBankBtn"><span class="top"><span class="icon">🏫</span><strong>各校題庫</strong><span class="catalog-badge school">${CHINESE_7_1_LESSON_01_SCHOOLS.length} 校已索引</span></span><span class="desc">由各校真實段考拆題；支援原始題型、閱讀題組、圖片與紙筆練習。</span></button>
      </div>`;
    $('#backChinese71LessonsBtn')?.addEventListener('click', showChinese71Lessons);
    $('#chineseLesson01SchoolBankBtn')?.addEventListener('click', showChinese71Lesson01SchoolBanks);
  }

  function showChinese71Lesson01SchoolBanks() {
    setHeader('第一課 夏夜｜各校題庫', '真實段考來源');
    document.title = '夏夜｜各校題庫';
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backChineseLesson01BanksBtn">← 返回題庫</button>
      <div class="catalog-path">國文　›　第一冊　›　第一課 夏夜　›　各校題庫</div>
      <h2 class="catalog-title">各校題庫</h2>
      <p class="catalog-sub">目前已確認 ${CHINESE_7_1_LESSON_01_SCHOOLS.length} 校來源；網站實際作答會由各校真題混合呈現。</p>
      <div class="catalog-grid">
        <button class="catalog-card chapter-card" disabled><span class="top"><strong>🔀 綜合練習</strong><span class="catalog-badge school">已收錄</span></span><span class="desc">混合各校屬於〈夏夜〉的真實考題；自動評量題與紙筆題分開統計。</span></button>
        ${CHINESE_7_1_LESSON_01_SCHOOLS.map(school => `<button class="catalog-card chapter-card" disabled><span class="top"><strong>🏫 ${school.name}</strong><span class="catalog-badge school">來源已索引</span></span><span class="desc">${school.exam}</span></button>`).join('')}
      </div>`;
    $('#backChineseLesson01BanksBtn')?.addEventListener('click', showChinese71Lesson01Banks);
  }

  function showScienceSemesters() {
    setHeader('自然科', '選擇年級與學期');
    document.title = '自然科｜國中題庫';
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backSubjectsBtn">← 返回科目</button>
      <div class="catalog-path">自然</div>
      <h2 class="catalog-title">請選擇學期</h2>
      <p class="catalog-sub">七年級上學期已依目前教材目錄建立完整單元架構。</p>
      <div class="catalog-grid">
        ${SCIENCE_SEMESTERS.map(s => `<button class="catalog-card" data-semester="${s.key}" ${s.enabled ? '' : 'disabled'}><span class="top"><strong>${s.title}</strong><span class="catalog-badge ${s.enabled ? '' : 'soon'}">${s.short}</span></span><span class="desc">${s.enabled ? '查看單元與小節' : '尚未建立題庫'}</span></button>`).join('')}
      </div>`;
    $('#backSubjectsBtn')?.addEventListener('click', showSubjects);
    $('[data-semester="7-1"]')?.addEventListener('click', showScience71Units);
  }

  function showScience71Units() {
    setHeader('自然科｜七年級上學期', '選擇單元');
    document.title = '自然一上｜國中題庫';
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backSemestersBtn">← 返回學期</button>
      <div class="catalog-path">自然　›　七年級上學期（一上）</div>
      <h2 class="catalog-title">請選擇單元</h2>
      <p class="catalog-sub">目前單元 1 的 1-1、1-2、1-3，以及單元 2 的 2-1、2-2、2-3、2-4 已有題庫入口；其餘小節先完成分類，題目後續加入。</p>
      <div class="catalog-grid">
        ${SCIENCE_7_1_UNITS.map(u => {
          const ready = u.sections.filter(s => s.enabled).length;
          return `<button class="catalog-card chapter-card" data-science-unit="${u.key}"><span class="top"><strong>${u.number}　${u.title}</strong><span class="catalog-badge ${ready ? '' : 'soon'}">${ready ? `${ready} 節可作答` : '架構已建'}</span></span><span class="desc">${u.sections.map(s => `${s.code} ${s.title}`).join('、')}</span></button>`;
        }).join('')}
      </div>`;
    $('#backSemestersBtn')?.addEventListener('click', showScienceSemesters);
    SCIENCE_7_1_UNITS.forEach(u => $(`[data-science-unit="${u.key}"]`)?.addEventListener('click', () => showScience71Unit(u.key)));
  }

  function showScience71Chapters() { showScience71Units(); }

  function showScience71Unit(unitKey) {
    const unit = SCIENCE_7_1_UNITS.find(u => u.key === unitKey);
    if (!unit) return;
    setHeader(`自然一上｜${unit.number}`, unit.title);
    document.title = `${unit.number} ${unit.title}｜自然一上`;
    $('#catalogContent').innerHTML = `
      <button class="catalog-back" id="backScienceUnitsBtn">← 返回單元</button>
      <div class="catalog-path">自然　›　七年級上學期（一上）　›　${unit.number} ${unit.title}</div>
      <h2 class="catalog-title">${unit.number}　${unit.title}</h2>
      <p class="catalog-sub">已建立教材小節分類；標示「題庫可用」者可以開始作答。</p>
      <div class="catalog-grid">
        ${unit.sections.map(s => `<button class="catalog-card chapter-card" data-science-section="${s.key}" ${s.enabled ? '' : 'disabled'}><span class="top"><strong>${s.code}　${s.title}</strong><span class="catalog-badge ${s.enabled ? '' : (s.type === 'literacy' ? 'core' : 'soon')}">${s.enabled ? '題庫可用' : (s.type === 'literacy' ? '核心素養｜待建' : (s.type === 'assessment' ? '學力測驗｜待匯入' : '建置中'))}</span></span><span class="desc">${s.enabled ? (s.desc || '進入題庫') : (s.desc || '章節位置已建立，題目後續補入。')}</span></button>`).join('')}
      </div>`;
    $('#backScienceUnitsBtn')?.addEventListener('click', showScience71Units);
    if (unitKey === 'unit-1') $('[data-science-section="science-method"]')?.addEventListener('click', enterScienceMethod);
  }

  function ensureChapterBackButton() {
    const startScreen = $('#startScreen');
    const panel = $('#startScreen .panel');
    if (!startScreen || !panel || $('#chapterBackBtn')) return;
    const row = document.createElement('div');
    row.className = 'chapter-back-row';
    row.innerHTML = '<button id="chapterBackBtn" class="secondary">← 返回單元 1</button>';
    panel.appendChild(row);
    $('#chapterBackBtn')?.addEventListener('click', () => showScience71Unit('unit-1'));
  }

  function enterScienceMethod() {
    $('#catalogShell')?.classList.add('hidden');
    $('#examScreen')?.classList.add('hidden');
    $('#startScreen')?.classList.remove('hidden');
    ensureChapterBackButton();
    const h1 = $('#startScreen header h1');
    const p = $('#startScreen header p');
    if (h1) h1.textContent = '1-2 科學方法模擬考';
    if (p) p.textContent = '自然七上｜單元 1 生命現象與科學探究｜1-2 科學方法';
    document.title = '1-2 科學方法模擬考｜自然七上單元1';
  }

  function init() {
    injectStyles();
    if (!makeShell()) return;
    ensureChapterBackButton();
    showSubjects();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();