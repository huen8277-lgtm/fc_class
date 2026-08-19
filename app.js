(() => {
  'use strict';

  const el = (id) => document.getElementById(id);
  
const state = {
    sheets: {},
    sheetNames: [],
    activeSheet: '',
    mode: 'processed',
    rows: [],
    filteredRows: [],
    rawHeaders: [],
    displayHeaders: [],
    summary: null,
    selectedIndex: -1,
    selectedRow: null,
    sort: { index: -1, dir: 'desc', header: '오버롤' },
    fileName: '',
    activeRows2d: null,
    controls: { enhance: 1, adapt: 1, teamColor: 0 },
    detailTab: 'overview',
    reference: { pool: [], updatedAt: '', source: 'static' },
    classStats: {},
    playerNameMap: null,
    playerNameMapPromise: null,
    playerNameMapLoaded: false,
    processedCache: {},
  };

  function pickPlayersSheetName(sheetNames) {
    if (!Array.isArray(sheetNames) || !sheetNames.length) return '';
    const exact = sheetNames.find((n) => String(n).trim().toLowerCase() === 'players');
    if (exact) return exact;
    const contains = sheetNames.find((n) => String(n).toLowerCase().includes('players'));
    return contains || '';
  }

  const TRAIT_MAP = {
    0: '선호 포지션 고집',
    1: '장거리 스로잉',
    2: '강한 땅볼 프리킥(미사용)',
    3: '다이버',
    4: '유리몸',
    5: '강철몸',
    6: '주발 선호',
    7: '(AI) 슬라이딩 태클 선호',
    8: '예리한 침투(미사용)',
    9: '(AI)개인 플레이 선호',
    10: '리더쉽(미사용)',
    11: '트러블 메이커',
    12: '(AI)얼리 크로스 선호',
    13: '예리한 감아차기',
    14: '화려한 개인기',
    15: '(AI)긴 패스 선호',
    16: '(AI)중거리 슛 선호',
    17: '스피드 드리블러',
    18: '(AI)플레이 메이커',
    19: '(AI)GK 공격 가담',
    20: 'GK 날렵한 펀칭',
    21: 'GK 멀리 던지기',
    22: '강력한 헤딩',
    23: 'GK 일대일 선방',
    24: '초장거리 드로잉',
    25: '아웃사이드 슈팅',
    26: '인기인(미사용)',
    27: '따돌리기 패스',
    28: '세컨드 윈드',
    29: '아크로바틱 클리어',
    30: '정교한 발놀림(미사용)',
    31: '정교한 패스(미사용)',
    32: '정교한 개인기(미사용)',
    33: 'PK 멈칫 거리는 동작 선호(미사용)',
    34: 'PK 찍어차는 슛 선호(미사용)',
    35: 'BICYCLE_KICKS(미사용)',
    36: '다이빙 헤딩(미사용)',
    37: '드라이브 패스(미사용)',
    38: 'GK 플랫 킥(미사용)',
    39: '터줏대감(미사용)',
    40: '궁극의 프로(미사용)',
    41: '(AI) 찍어차는 슛 선호',
    42: '테크니컬 드리블러',
    43: '스위퍼 키퍼',
    44: '자리잡기 우선(미사용)',
    45: '코너킥의 달인(미사용)',
    46: '정교한 프리킥(미사용)',
    47: '타겟맨(미사용)',
    48: 'GK 소극적 크로스 수비',
    49: 'GK 적극적 크로스 수비',
    50: '아크로바틱 피니셔',
    51: '크로스 포쳐',
    52: '라인 브레이커',
    53: '와일드 태클러',
    54: '체이서',
    55: '2개의 심장',
    56: '파이터',
    57: 'GK 빠른 반응',
    59: '커맨더',
    60: 'GK 공중볼 장악',
    62: '블로커',
    63: '스피드스터',
    64: '타이탄',
    65: '트릭스터',
    66: '레이저 슈터',
    67: '프레데터',
    68: 'GK 데드아이',
  };

  const UNUSED_TRAIT_IDS = new Set([
    2, 8, 10, 19, 26,
    30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    44, 45, 46, 47
  ]);

  const TRAIT_WEIGHTS = {
    '라인 브레이커': 4,
    '체이서': 4,
    '프레데터': 4,
    '레이저 슈터': 4,
    '아크로바틱 피니셔': 3,
    '크로스 포쳐': 3,
    '스피드스터': 3,
    '테크니컬 드리블러': 3,
    '화려한 개인기': 2,
    '예리한 감아차기': 3,
    '(AI)얼리 크로스 선호': 2,
    '(AI)긴 패스 선호': 2,
    '(AI)중거리 슛 선호': 2,
    '(AI)플레이 메이커': 2,
    '따돌리기 패스': 1,
    '아웃사이드 슈팅': 2,
    '강력한 헤딩': 3,
    '세컨드 윈드': 2,
    '아크로바틱 클리어': 2,
    '블로커': 4,
    '타이탄': 4,
    '커맨더': 4,
    '와일드 태클러': 3,
    '파이터': 2,
    '2개의 심장': 2,
    'GK 날렵한 펀칭': 3,
    'GK 멀리 던지기': 3,
    'GK 일대일 선방': 4,
    'GK 소극적 크로스 수비': 2,
    'GK 적극적 크로스 수비': 2,
    'GK 빠른 반응': 4,
    'GK 공중볼 장악': 4,
    'GK 데드아이': 4,
    '스위퍼 키퍼': 3,
    '(AI)GK 공격 가담': 1,
    '트릭스터': 2,
  };

  const CLASS_GUIDE = [
    { title: '최상위 축', items: ['26TOTY', '26TOTY-N', '25TOTY', '25TOTY-N'] },
    { title: '최상위 확장', items: ['25TOTS', '24TOTS', '23TOTS', '22TOTS', '21TOTS', '20TOTS', '19TOTS', '26HEROES', '25HEROES', '24HEROES', '23HEROES', '22HEROES'] },
    { title: '프리미엄 시즌', items: ['ICON TM', 'ICON', 'NHD', 'TB', 'TT', 'GR', 'TC', 'CH', 'LE', 'WB', 'GRU', 'BLD', 'BDO', 'CU', 'MDL', 'EU24', 'LD', 'UT', 'JNM', 'DC'] },
    { title: '메타 핵심', items: ['LN', 'SPL', 'LOL', 'FA', 'CC', 'HG', 'RTN', 'BWC', 'MC', 'CAP', 'EBS', 'BTB'] },
    { title: '이벤트 / 테마', items: ['VTR', 'MOG', 'LH', 'OTW', 'COC', 'HOT', '24EP', 'FC', '23HW', 'WC22', 'UP', 'E21', 'NTG', '23NG', '22NG', '21NG', '20NG', '19NG', '25IM', 'SH', 'TK', 'PTG', 'KHD', 'WG', 'FAC', '25DP', 'WS', 'FSL', 'DCB'] },
    { title: 'TOTY / 한국 / PL', items: ['26TY', '25TY', '24TY', '23TY', '22TY', '21TY', '20TY', '19TY', 'K19', 'K18', '12KH', '26KL', '25KL', '24KL', '23KL', '22KL', '21KL', '20KL', 'K23', 'K22', 'K21', '25PL', '24PL', '23PL', '22PL', '21PL', '20'] },
    { title: '연도 시즌', items: ['20', '21', '22', '23', '24', '25'] }
  ];


  const ALL_CLASS_LIST = [
    '26TOTY', '26TOTY-N', '25TOTY', '25TOTY-N', '24TOTY', '24TOTY-N', '23TOTY', '23TOTY-N', '22TOTY', '22TOTY-N', '21TOTY', '21TOTY-N', '20TOTY', '20TOTY-N', '19TOTY', '19TOTY-N',
    '25TOTS', '24TOTS', '23TOTS', '22TOTS', '21TOTS', '20TOTS', '19TOTS',
    '26HEROES', '25HEROES', '24HEROES', '23HEROES', '22HEROES',
    'ICON TM', 'ICON', 'NHD', 'TB', 'TT', 'GR', 'TC',
    'CH', 'LE', 'NO.7', 'WB', 'GRU', 'BLD', 'BDO', 'CU', 'MDL', 'EU24', 'LD', 'UT', 'JNM', 'DC',
    'LN', 'SPL', 'LOL', 'FA', 'CC', 'HG', 'RTN', 'BWC', 'MC', 'CAP', 'EBS', 'BTB',
    'VTR', 'MOG', 'LH', 'OTW', 'COC', 'HOT', '24EP', 'FC', '23HW', 'WC22', 'UP', 'E21', 'NTG', '23NG', '22NG', '21NG', '20NG', '19NG',
    '25IM', 'SH', 'TK', 'PTG', 'KHD', 'WG', 'FAC', '25DP', 'WS', 'FSL', 'DCB',
    '26TY', '25TY', '24TY', '23TY', '22TY', '21TY', '20TY', '19TY',
    'K19', 'K18', '12KH', '26KL', '25KL', '24KL', '23KL', '22KL', '21KL', '20KL',
    'K23', 'K22', 'K21',
    '25KB', '24KB', '23KB', '22KB', '21KB', '20KB',
    '25PL', '24PL', '23PL', '22PL', '21PL',
    '20', '21', '22', '23', '24', '25',
  ];


  function getReferencePool() {
    const pool = Array.isArray(ALL_CLASS_LIST) && ALL_CLASS_LIST.length
      ? ALL_CLASS_LIST
      : (Array.isArray(state.reference?.pool) && state.reference.pool.length
        ? state.reference.pool
        : (Array.isArray(state.sheetNames) ? state.sheetNames : []));
    return pool.map((name) => ({ name, tier: classBaseScore(name) }));
  }

  async function refreshLiveReferencePack() {
    const btn = el('refreshRefsBtn');
    if (btn) btn.disabled = true;
    try {
      const detectedPool = Array.isArray(state.sheetNames) ? state.sheetNames.slice() : [];
      const fullPool = Array.isArray(ALL_CLASS_LIST) && ALL_CLASS_LIST.length
        ? ALL_CLASS_LIST.slice()
        : detectedPool.slice();

      state.reference = {
        pool: fullPool,
        detectedPool,
        updatedAt: new Date().toISOString(),
        source: 'uploaded-workbook',
      };
      renderLegend();
      const countNode = el('refCount');
      if (countNode) countNode.textContent = `${fullPool.length}개`;
      if (state.rows.length) applyMode();
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function loadPlayerNameMap() {
    if (state.playerNameMapPromise) return state.playerNameMapPromise;
    state.playerNameMapPromise = (async () => {
      try {
        if (typeof window !== 'undefined' && window.PLAYER_NAME_MAP && typeof window.PLAYER_NAME_MAP === 'object') {
          const inlineEntries = window.PLAYER_NAME_MAP.entries && typeof window.PLAYER_NAME_MAP.entries === 'object'
            ? window.PLAYER_NAME_MAP.entries
            : window.PLAYER_NAME_MAP;
          state.playerNameMap = inlineEntries;
          state.playerNameMapLoaded = true;
          return inlineEntries;
        }
        const res = await fetch('./player_name_map.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`player_name_map.json 로드 실패 (${res.status})`);
        const data = await res.json();
        const entries = data && typeof data === 'object' && data.entries && typeof data.entries === 'object'
          ? data.entries
          : (data && typeof data === 'object' ? data : {});
        state.playerNameMap = entries;
        state.playerNameMapLoaded = true;
        return entries;
      } catch (err) {
        console.warn('player_name_map.json 로드 실패', err);
        state.playerNameMap = {};
        state.playerNameMapLoaded = true;
        return state.playerNameMap;
      }
    })();
    return state.playerNameMapPromise;
  }

  const STAT_ORDER = [

    { label: '속력', src: '속력' },
    { label: '가속력', src: '가속력' },
    { label: '골 결정력', src: '골 결정력' },
    { label: '슛 파워', src: '슛 파워' },
    { label: '중거리 슛', src: '중거리 슛' },
    { label: '위치 선정', src: '위치 선정' },
    { label: '발리 슛', src: '발리슛' },
    { label: '페널티 킥', src: '페널티 킥' },
    { label: '짧은 패스', src: '짧은 패스' },
    { label: '시야', src: '시야' },
    { label: '크로스', src: '크로스' },
    { label: '긴 패스', src: '롱 패스' },
    { label: '프리킥', src: '프리킥 정확도' },
    { label: '커브', src: '커브' },
    { label: '드리블', src: '드리블' },
    { label: '볼 컨트롤', src: '볼 컨트롤' },
    { label: '민첩성', src: '민첩성' },
    { label: '밸런스', src: '밸런스' },
    { label: '반응 속도', src: '반응속도' },
    { label: '대인 수비', src: '대인 수비' },
    { label: '태클', src: '스탠딩 태클' },
    { label: '가로채기', src: '가로채기' },
    { label: '헤더', src: '헤더 정확도' },
    { label: '슬라이딩 태클', src: '슬라이딩 태클' },
    { label: '몸싸움', src: '몸싸움' },
    { label: '스태미너', src: '스태미너' },
    { label: '적극성', src: '적극성' },
    { label: '점프', src: '점프' },
    { label: '침착성', src: '침착성' },
    { label: 'GK 다이빙', src: 'GK 다이빙' },
    { label: 'GK 핸들링', src: 'GK 핸들링' },
    { label: 'GK 킥', src: 'GK 킥' },
    { label: 'GK 반응속도', src: 'GK 반응속도' },
    { label: 'GK 위치선정', src: 'GK 위치선정' },
  ];
  const STAT_MAP = Object.fromEntries(STAT_ORDER.map((s) => [s.label, s.src]));
  const ENHANCE_BONUS = { 1: 0, 2: 1, 3: 2, 4: 4, 5: 6, 6: 8, 7: 11, 8: 15, 9: 17, 10: 19, 11: 21, 12: 24, 13: 27 };

  const STAT_LABEL_SET = new Set(STAT_ORDER.map((s) => s.label));

  const BASE_HEADERS = [
    '이름', '성', '급여', '약발', '주발', '특성1', '특성2', '특성3', '오버롤',
    '가속력', '적극성', '민첩성', '밸런스', '볼 컨트롤', '침착성', '크로스', '커브', '드리블', '골 결정력',
    '프리킥 정확도', 'GK 다이빙', 'GK 핸들링', 'GK 킥', 'GK 위치선정', 'GK 반응속도', '헤더 정확도', '점프',
    '롱 패스', '중거리 슛', '대인 수비', '페널티 킥', '위치 선정', '포텐셜', '반응속도', '짧은 패스', '슛 파워',
    '슬라이딩 태클', '속력', '스태미너', '스탠딩 태클', '몸싸움', '가로채기', '시야', '발리슛', '포지션'
  ];

  const DISPLAY_HEADERS = [
    '포지션', '선수명', '급여', '주발', '약발', '특성', '오버롤',
    ...STAT_ORDER.map((s) => s.label), '평가'
  ];

  const SOURCE_COLS = (() => {
    const cols = ['U', 'V', 'T', 'CY', 'AK', 'DY', 'DZ', 'EA', 'BU'];
    cols.push(...rangeCols('AL', 'BT'));
    cols.push('AD');
    return cols;
  })();

  function rangeCols(start, end) {
    const s = colToIndex(start);
    const e = colToIndex(end);
    const out = [];
    for (let i = s; i <= e; i++) out.push(indexToCol(i));
    return out;
  }

  function colToIndex(col) {
    let n = 0;
    for (let i = 0; i < col.length; i++) n = n * 26 + (col.charCodeAt(i) - 64);
    return n - 1;
  }

  function indexToCol(index) {
    let n = index + 1;
    let out = '';
    while (n > 0) {
      const mod = (n - 1) % 26;
      out = String.fromCharCode(65 + mod) + out;
      n = Math.floor((n - mod) / 26);
    }
    return out;
  }

  function setText(id, text) {
    const node = el(id);
    if (node) node.textContent = text;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  function isNumeric(value) {
    return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(String(value).replace(/,/g, '')));
  }

  function toNumber(value) {
    if (!isNumeric(value)) return null;
    return Number(String(value).replace(/,/g, ''));
  }

  function toCsvCell(value) {
    const s = String(value ?? '').replace(/\r?\n/g, '\n');
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function normalFoot(v) {
    if (v === null || v === undefined || v === '') return '';
    if (String(v).trim() === '1') return '오른발';
    if (String(v).trim() === '2') return '왼발';
    return v;
  }

  const PLAYER_NAME_ALIAS = {
    'cristiano ronaldo': '크리스티아누 호날두',
    'lionel messi': '리오넬 메시',
    'neymar jr': '네이마르 주니오르',
    'kylian mbappe': '킬리안 음바페',
    'erling haaland': '엘링 홀란',
    'luis figo': '루이스 피구',
    'zinedine zidane': '지네딘 지단',
    'roberto carlos': '호베르투 카를루스',
    'ronaldinho': '호나우지뉴',
    'didier drogba': '디디에 드록바',
    'andres iniesta': '안드레스 이니에스타',
    'xavi': '사비',
    'thierry henry': '티에리 앙리',
    'ruud gullit': '뤼트 훌리트',
    'patrick vieira': '파트리크 비에이라',
    'paolo maldini': '파올로 말디니',
    'frank lampard': '프랭크 램파드',
    'steven gerrard': '스티븐 제라드',
    'wayne rooney': '웨인 루니',
    'gareth bale': '가레스 베일',
    'heung min son': '손흥민',
    'mohamed salah': '무함마드 살라',
    'kevin de bruyne': '케빈 더 브라위너',
    'jude bellingham': '주드 벨링엄',
    'vinicius junior': '비니시우스 주니오르',
    'karim benzema': '카림 벤제마',
    'robert lewandowski': '로베르트 레반도프스키',
    'luka modric': '루카 모드리치',
    'toni kroos': '토니 크로스',
    'sergio ramos': '세르히오 라모스',
    'virgil van dijk': '버질 반 다이크',
    'manuel neuer': '마누엘 노이어',
    'thomas muller': '토마스 뮐러',
    'jamal musiala': '자말 무시알라',
    'pedri': '페드리',
    'gavi': '가비',
    'bruno fernandes': '브루누 페르난드스',
    'bernardo silva': '베르나르두 실바',
    'phil foden': '필 포든',
    'trent alexander arnold': '트렌트 알렉산더-아널드',
    'giorgio chiellini': '지오르지오 키엘리니',
    'gianluigi buffon': '잔루이지 부폰',
    'petr cech': '페트르 체흐',
    'kaka': '카카',
    'ronaldo': '호나우두',
    'pele': '펠레',
    'maradona': '마라도나',
    'eusebio': '에우제비우',
    'garrincha': '가린샤',
    'van der sar': '판 데르 사르',
    'francesco totti': '프란체스코 토티',
    'alessandro del piero': '알레산드로 델 피에로',
    'filippo inzaghi': '필리포 인자기',
    'andriy shevchenko': '안드리 셰브첸코',
    'riyad mahrez': '리야드 마레즈',
    'nuno mendes': '누누 멘데스',
    'joshua kimmich': '요주아 키미히',
    'marcelo': '마르셀루',
    'cafu': '카푸',
    'roberto baggio': '로베르토 바조',
    'gheorghe hagi': '게오르게 하지',
    'paolo di canio': '파올로 디 카니오',
    'frank rijkaard': '프랑크 라이카르트',
    'marcel desailly': '마르셀 데사이',
    'jaap stam': '얍 스탐',
    'ronald koeman': '로날트 쿠만',
    'michael ballack': '미하엘 발락',
    'oliver kahn': '올리버 칸',
    'iker casillas': '이케르 카시야스',
    'gianluigi donnarumma': '잔루이지 돈나룸마',
    'davide de gea': '다비드 데 헤아',
    'casemiro': '카세미루',
    'fabinho': '파비뉴',
    'nabil fekir': '나빌 페키르',
    'antoine griezmann': '앙투안 그리즈만',
    'ousmane dembele': '우스만 뎀벨레',
    'kingsley coman': '킹슬리 코망',
    'sadio mane': '사디오 마네',
    'juninho': '주니뉴',
    'zico': '지코',
    'romario': '호마리우',
    'rivaldo': '히바우두',
    'dani alves': '다니 알베스',
    'carlos tevez': '카를로스 테베스',
    'diego forlan': '디에고 포를란',
    'fernando torres': '페르난도 토레스',
    'fernando hierro': '페르난도 이에로',
    'sergio busquets': '세르히오 부스케츠',
    'luis suarez': '루이스 수아레스',
    'edinson cavani': '에딘손 카바니',
    'angel di maria': '앙헬 디 마리아',
    'marco reus': '마르코 로이스',
    'matthias sammer': '마티아스 자머',
    'lothar matthaus': '로타어 마테우스',
    'hugo sanchez': '우고 산체스',
    'dennis bergkamp': '데니스 베르캄프',
    'ruud van nistelrooy': '뤼트 판 니스텔로이',
    'patrick kluivert': '파트릭 클라위버르트',
    'clarence seedorf': '클라렌스 세도르프',
    'arjen robben': '아르연 로번',
    'wesley sneijder': '웨슬리 스네이더',
    'rafael van der vaart': '라파엘 판 데르 파르트',
    'david beckham': '데이비드 베컴',
    'paul scholes': '폴 스콜스',
    'ian wright': '이언 라이트',
    'alan shearer': '앨런 시어러',
    'gary lineker': '게리 리네커',
    'john terry': '존 테리',
    'rio ferdinand': '리오 퍼디낸드',
    'nemanja vidic': '네마냐 비디치',
    'fernando redondo': '페르난도 레돈도',
    'claudio caniggia': '클라우디오 카니히아',
    'diego maradona': '디에고 마라도나',
    'roberto carlos': '호베르투 카를루스',
  };

  const PLAYER_NAME_ALIAS_EXTRA = {
    "harry kane": "해리 케인",
    "kane": "해리 케인",
    "son heung min": "손흥민",
    "son heung-min": "손흥민",
    "heung-min son": "손흥민",
    "son": "손흥민",
    "kylian mbappe": "킬리안 음바페",
    "mbappe": "킬리안 음바페",
    "erling haaland": "엘링 홀란",
    "haaland": "엘링 홀란",
    "rodri": "로드리",
    "declan rice": "데클란 라이스",
    "rice": "데클란 라이스",
    "phil foden": "필 포든",
    "foden": "필 포든",
    "bukayo saka": "부카요 사카",
    "saka": "부카요 사카",
    "martin odegaard": "마르틴 외데고르",
    "odegaard": "마르틴 외데고르",
    "vinicius junior": "비니시우스 주니오르",
    "vinicius jr": "비니시우스 주니오르",
    "vinicius": "비니시우스 주니오르",
    "jude bellingham": "주드 벨링엄",
    "bellingham": "주드 벨링엄",
    "mohamed salah": "무함마드 살라",
    "salah": "무함마드 살라",
    "kevin de bruyne": "케빈 더 브라위너",
    "de bruyne": "케빈 더 브라위너",
    "robert lewandowski": "로베르트 레반도프스키",
    "lewandowski": "로베르트 레반도프스키",
    "karim benzema": "카림 벤제마",
    "benzema": "카림 벤제마",
    "luka modric": "루카 모드리치",
    "modric": "루카 모드리치",
    "toni kroos": "토니 크로스",
    "kroos": "토니 크로스",
    "sergio ramos": "세르히오 라모스",
    "virgil van dijk": "버질 반 다이크",
    "van dijk": "버질 반 다이크",
    "alisson": "알리송",
    "thibaut courtois": "티보 쿠르투아",
    "courtois": "티보 쿠르투아",
    "ederson": "에데르송",
    "manuel neuer": "마누엘 노이어",
    "neuer": "마누엘 노이어",
    "gianluigi donnarumma": "잔루이지 돈나룸마",
    "donnarumma": "잔루이지 돈나룸마",
    "marc andre ter stegen": "마르크안드레 테어 슈테겐",
    "ter stegen": "마르크안드레 테어 슈테겐",
    "joshua kimmich": "요주아 키미히",
    "kimmich": "요주아 키미히",
    "thomas muller": "토마스 뮐러",
    "muller": "토마스 뮐러",
    "leon goretzka": "레온 고레츠카",
    "goretzka": "레온 고레츠카",
    "jamal musiala": "자말 무시알라",
    "musiala": "자말 무시알라",
    "florian wirtz": "플로리안 비르츠",
    "wirtz": "플로리안 비르츠",
    "pedri": "페드리",
    "gavi": "가비",
    "bruno fernandes": "브루누 페르난드스",
    "bernardo silva": "베르나르두 실바",
    "joao cancelo": "주앙 칸셀루",
    "rafael leao": "라파엘 레앙",
    "rafeal leao": "라파엘 레앙",
    "jamie vardy": "제이미 바디",
    "raheem sterling": "라힘 스털링",
    "jack grealish": "잭 그릴리시",
    "mason mount": "메이슨 마운트",
    "james maddison": "제임스 매디슨",
    "luis diaz": "루이스 디아스",
    "darwin nunez": "다르윈 누녜스",
    "alexander isak": "알렉산데르 이삭",
    "victor osimhen": "빅토르 오시멘",
    "nico williams": "니코 윌리엄스",
    "anthony gordon": "앤서니 고든",
    "cole palmer": "콜 파머",
    "morgan gibbs white": "모건 깁스화이트",
    "cristiano ronaldo": "크리스티아누 호날두",
    "ronaldo": "호나우두",
    "lionel messi": "리오넬 메시",
    "neymar jr": "네이마르 주니오르",
    "neymar": "네이마르 주니오르",
    "zinedine zidane": "지네딘 지단",
    "ronaldinho": "호나우지뉴",
    "didier drogba": "디디에 드록바",
    "andres iniesta": "안드레스 이니에스타",
    "xavi": "사비",
    "thierry henry": "티에리 앙리",
    "ruud gullit": "뤼트 훌리트",
    "patrick vieira": "파트리크 비에이라",
    "paolo maldini": "파올로 말디니",
    "frank lampard": "프랭크 램파드",
    "steven gerrard": "스티븐 제라드",
    "wayne rooney": "웨인 루니",
    "gareth bale": "가레스 베일",
    "luis figo": "루이스 피구",
    "roberto carlos": "호베르투 카를루스",
    "kaka": "카카",
    "pele": "펠레",
    "maradona": "마라도나",
    "eusebio": "에우제비우",
    "garrincha": "가린샤",
    "francesco totti": "프란체스코 토티",
    "alessandro del piero": "알레산드로 델 피에로",
    "filippo inzaghi": "필리포 인자기",
    "andriy shevchenko": "안드리 셰브첸코",
    "david beckham": "데이비드 베컴",
    "paul scholes": "폴 스콜스",
    "ryan giggs": "라이언 긱스",
    "john terry": "존 테리",
    "rio ferdinand": "리오 퍼디낸드",
    "nemanja vidic": "네마냐 비디치",
    "fabio cannavaro": "파비오 칸나바로",
    "frank rijkaard": "프랑크 라이카르트",
    "ronald koeman": "로날트 쿠만",
    "michael ballack": "미하엘 발락",
    "oliver kahn": "올리버 칸",
    "iker casillas": "이케르 카시야스",
    "gianluigi buffon": "잔루이지 부폰",
    "petr cech": "페트르 체흐",
    "ruud van nistelrooy": "뤼트 판 니스텔로이",
    "patrick kluivert": "파트릭 클라위버르트",
    "clarence seedorf": "클라렌스 세도르프",
    "arjen robben": "아르연 로번",
    "wesley sneijder": "웨슬리 스네이더",
    "rafael van der vaart": "라파엘 판 데르 파르트",
    "van der sar": "판 데르 사르",
    "dennis bergkamp": "데니스 베르캄프",
    "alan shearer": "앨런 시어러",
    "gary lineker": "게리 리네커",
    "ian wright": "이언 라이트",
    "paolo di canio": "파올로 디 카니오",
    "gheorghe hagi": "게오르게 하지",
    "juninho": "주니뉴",
    "zico": "지코",
    "romario": "호마리우",
    "rivaldo": "히바우두",
    "dani alves": "다니 알베스",
    "carlos tevez": "카를로스 테베스",
    "diego forlan": "디에고 포를란",
    "fernando torres": "페르난도 토레스",
    "fernando hierro": "페르난도 이에로",
    "sergio busquets": "세르히오 부스케츠",
    "luis suarez": "루이스 수아레스",
    "edinson cavani": "에딘손 카바니",
    "angel di maria": "앙헬 디 마리아",
    "marco reus": "마르코 로이스",
    "matthias sammer": "마티아스 자머",
    "lothar matthaus": "로타어 마테우스",
    "hugo sanchez": "우고 산체스",
    "cafu": "카푸",
    "marcelo": "마르셀루",
    "roberto baggio": "로베르토 바조",
    "jaap stam": "얍 스탐",
    "michael laudrup": "미하엘 라우드루프",
    "paulo futre": "파울루 푸트르",
    "bobby charlton": "보비 찰튼",
    "bobby moore": "보비 무어",
    "franz beckenbauer": "프란츠 베켄바워",
    "gerd muller": "게르트 뮐러",
    "marcus rashford": "마커스 래시퍼드",
    "rashford": "마커스 래시퍼드",
    "bruno guimaraes": "브루누 기마랑이스",
    "joao felix": "주앙 펠릭스",
    "nuno mendes": "누누 멘데스",
    "gabriel jesus": "가브리에우 제주스",
    "gabriel martinelli": "가브리에우 마르티넬리",
    "matheus cunha": "마테우스 쿠냐",
    "lucas paqueta": "루카스 파케타",
    "federico valverde": "페데리코 발베르데",
    "eduardo camavinga": "에두아르도 카마빙가",
    "aurélien tchouaméni": "오렐리앵 추아메니",
    "aurelien tchouameni": "오렐리앵 추아메니",
    "marco verratti": "마르코 베라티",
    "nicolo barella": "니콜로 바렐라",
    "nicolo fagioli": "니콜로 파졸리",
    "jorginho": "조르지뉴",
    "luka jovic": "루카 요비치",
    "piotr zielinski": "피오트르 지엘린스키",
    "sergej milinkovic savic": "세르게이 밀린코비치사비치",
    "milinkovic savic": "세르게이 밀린코비치사비치",
    "diogo jota": "디오구 조타",
    "rodrigo de paul": "로드리고 데 폴",
    "angelino": "안헬리뇨",
    "pedro porro": "페드로 포로",
    "gonzalo montiel": "곤살로 몬티엘",
    "emiliano martinez": "에밀리아노 마르티네스",
    "dibu martinez": "에밀리아노 마르티네스",
    "lautaro martinez": "라우타로 마르티네스",
    "julian alvarez": "훌리안 알바레스",
    "angel correa": "앙헬 코레아",
    "alexis mac allister": "알렉시스 맥앨리스터",
    "mac allister": "알렉시스 맥앨리스터",
    "lisandro martinez": "리산드로 마르티네스",
    "ronald araujo": "로날드 아라우호",
    "ferland mendy": "페를랑 멘디",
    "lucas hernandez": "루카스 에르난데스",
    "dayot upamecano": "다요 우파메카노",
    "josko gvardiol": "요슈코 그바르디올",
    "gvardiol": "요슈코 그바르디올",
    "reece james": "리스 제임스",
    "ben chilwell": "벤 칠웰",
    "trent alexander arnold": "트렌트 알렉산더 아널드",
    "david alaba": "다비드 알라바",
    "hiroki sakai": "사카이 히로키",
    "takefusa kubo": "쿠보 다케후사",
    "kaoru mitoma": "미토마 카오루",
    "keito nakanishi": "나카니시 케이토",
    "hidemasa morita": "모리타 히데마사",
    "takumi minamino": "미나미노 타쿠미",
    "yasuto wakizaka": "와키자카 야스토",
    "ko itakura": "이타쿠라 고",
    "kim min jae": "김민재",
    "lee kang in": "이강인",
    "heung min son": "손흥민",
    "paik seung ho": "백승호",
    "park ji sung": "박지성",
    "cho gue sung": "조규성",
    "lee jae sung": "이재성",
    "hwang hee chan": "황희찬",
    "hwang in beom": "황인범",
    "kim young gwon": "김영권",
    "cho hyun woo": "조현우",
    "song bum keun": "송범근",
    "kim seung gyu": "김승규",
    "lamine yamal": "라민 야말",
    "alex baena": "알렉스 바에나",
    "samuel omorodion": "사무엘 오모로디온",
    "mikel merino": "미켈 메리노",
    "martin zubimendi": "마르틴 수비멘디",
    "julián álvarez": "훌리안 알바레스",

    "mike maignan": "마이크 메냥",
    "maignan": "마이크 메냥",
    "achraf hakimi": "아슈라프 하키미",
    "hakimi": "아슈라프 하키미",
    "jules kounde": "쥘 쿤데",
    "kounde": "쥘 쿤데",
    "antonio rudiger": "안토니오 뤼디거",
    "rudiger": "안토니오 뤼디거",
    "ibrahima konate": "이브라히마 코나테",
    "konate": "이브라히마 코나테",
    "william saliba": "윌리엄 살리바",
    "saliba": "윌리엄 살리바",
    "edouard mendy": "에두아르 멘디",
    "mendy": "에두아르 멘디",
    "marquinhos": "마르키뉴스",
    "lucas vazquez": "루카스 바스케스",
    "dani carvajal": "다니 카르바할",
    "carvajal": "다니 카르바할",
    "pedro gonzalez": "페드리",
    "rodrigo": "로드리",
    "gabriel magalhaes": "가브리에우 마갈량이스",
    "gabriel paulista": "가브리에우 파울리스타",
    "diogo dalot": "디오구 달로트",
    "dalot": "디오구 달로트",
    "ilkay gundogan": "일카이 귄도안",
    "ilkay guendogan": "일카이 귄도안",
    "mario gotze": "마리오 괴체",
    "gotze": "마리오 괴체",
    "sadio mane": "사디오 마네",
    "mohamed kudus": "모하메드 쿠두스",
    "antoine griezmann": "앙투안 그리즈만",
    "ousmane dembele": "우스만 뎀벨레",
    "kingsley coman": "킹슬리 코망",
    "rayan cherki": "라얀 셰르키",
    "xavi simons": "사비 시몬스",
    "florian thauvin": "플로리앙 토뱅",
    "nicolas gonzalez": "니콜라스 곤살레스",
    "nico gonzalez": "니코 곤살레스",
    "matthijs de ligt": "마티아스 더 리흐트",
    "de ligt": "마티아스 더 리흐트",
    "frenkie de jong": "프렝키 더용",
    "de jong": "프렝키 더용",
    "pedro porro": "페드로 포로",
    "sergio canales": "세르히오 카날레스",
    "mikel oyarzabal": "미켈 오야르사발",
    "robin le normand": "로빈 르노르망",
    "rodrigo de paul": "로드리고 데 폴",
    "luka jovic": "루카 요비치",
};
  Object.assign(PLAYER_NAME_ALIAS, PLAYER_NAME_ALIAS_EXTRA);

  function lookupPlayerAlias(value) {
    const base = normalizeNameKey(value);
    if (!base) return '';
    const tryKeys = [base];
    const stripped = base
      .replace(/\b(jr|sr|ii|iii|iv|v)\b/g, ' ')
      .replace(/\b(the|of|de|del|da|di|van|von)\b/g, ' $1 ')
      .replace(/\s+/g, ' ')
      .trim();
    if (stripped && stripped !== base) tryKeys.push(stripped);
    const noStop = base.replace(/\b(jr|sr|ii|iii|iv|v)\b/g, ' ').replace(/\s+/g, ' ').trim();
    if (noStop && noStop !== base) tryKeys.push(noStop);
    for (const k of tryKeys) {
      if (PLAYER_NAME_ALIAS[k]) return PLAYER_NAME_ALIAS[k];
    }
    return '';
  }


  const HANGUL_INITIALS = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  const HANGUL_MEDIALS = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
  const HANGUL_FINALS = ['', 'ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

  const ROMAN_VOWELS = [
    ['yae', 'ㅒ'], ['yai', 'ㅒ'], ['yeo', 'ㅕ'], ['ye', 'ㅖ'], ['ya', 'ㅑ'], ['wae', 'ㅙ'], ['woe', 'ㅚ'], ['wai', 'ㅙ'],
    ['ae', 'ㅐ'], ['ai', 'ㅐ'], ['ay', 'ㅐ'], ['ey', 'ㅖ'], ['ei', 'ㅔ'], ['ea', 'ㅔ'], ['oa', 'ㅘ'], ['oo', 'ㅜ'],
    ['ou', 'ㅜ'], ['ow', 'ㅗ'], ['oi', 'ㅚ'], ['ui', 'ㅟ'], ['ue', 'ㅞ'], ['ua', 'ㅘ'],
    ['yo', 'ㅛ'], ['yu', 'ㅠ'], ['wa', 'ㅘ'], ['we', 'ㅞ'], ['wi', 'ㅟ'], ['ee', 'ㅣ'], ['ie', 'ㅣ'],
    ['a', 'ㅏ'], ['e', 'ㅔ'], ['i', 'ㅣ'], ['o', 'ㅗ'], ['u', 'ㅜ'], ['y', 'ㅣ'],
  ];

  const ROMAN_ONSET = {
    'sh': 'ㅅ', 'ch': 'ㅊ', 'th': 'ㅅ', 'ph': 'ㅍ', 'wh': 'ㅇ', 'qu': 'ㅋ', 'ng': 'ㅇ',
    'b': 'ㅂ', 'c': 'ㅋ', 'd': 'ㄷ', 'f': 'ㅍ', 'g': 'ㄱ', 'h': 'ㅎ', 'j': 'ㅈ', 'k': 'ㅋ',
    'l': 'ㄹ', 'm': 'ㅁ', 'n': 'ㄴ', 'p': 'ㅍ', 'r': 'ㄹ', 's': 'ㅅ', 't': 'ㅌ', 'v': 'ㅂ',
    'w': 'ㅇ', 'x': 'ㄱ', 'z': 'ㅈ'
  };

  const ROMAN_CODA = {
    'ng': 'ㅇ', 'sh': 'ㅅ', 'ch': 'ㅊ', 'th': 'ㅅ', 'ph': 'ㅂ', 'qu': 'ㄱ', 'ck': 'ㄱ',
    'b': 'ㅂ', 'c': 'ㄱ', 'd': 'ㄷ', 'f': 'ㅂ', 'g': 'ㄱ', 'h': 'ㅎ', 'j': 'ㅈ', 'k': 'ㄱ',
    'l': 'ㄹ', 'm': 'ㅁ', 'n': 'ㄴ', 'p': 'ㅂ', 'r': 'ㄹ', 's': 'ㅅ', 't': 'ㅅ', 'v': 'ㅂ',
    'x': 'ㄱ', 'z': 'ㅈ'
  };

  function composeHangul(initial, medial, final = '') {
    const i = HANGUL_INITIALS.indexOf(initial);
    const m = HANGUL_MEDIALS.indexOf(medial);
    const f = HANGUL_FINALS.indexOf(final);
    if (i < 0 || m < 0 || f < 0) return '';
    return String.fromCharCode(0xac00 + (i * 21 + m) * 28 + f);
  }

  function bestVowelMatch(s, idx) {
    for (const [roma, hangul] of ROMAN_VOWELS) {
      if (s.startsWith(roma, idx)) return { roma, hangul };
    }
    return null;
  }

  function mapOnsetCluster(cluster) {
    if (!cluster) return '';
    const lower = cluster.toLowerCase();
    if (ROMAN_ONSET[lower]) return ROMAN_ONSET[lower];
    return ROMAN_ONSET[lower.slice(-1)] || '';
  }

  function mapCodaCluster(cluster) {
    if (!cluster) return '';
    const lower = cluster.toLowerCase();
    if (ROMAN_CODA[lower]) return ROMAN_CODA[lower];
    if (lower.length >= 2 && ROMAN_CODA[lower.slice(-2)]) return ROMAN_CODA[lower.slice(-2)];
    return ROMAN_CODA[lower.slice(-1)] || '';
  }

  function transliterateEnglishToken(token) {
    let s = String(token || '').trim();
    if (!s) return '';
    s = s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    s = s.replace(/[^a-z\-]/g, '');
    if (!s) return '';

    const alias = PLAYER_NAME_ALIAS[s] || PLAYER_NAME_ALIAS_EXTRA[s];
    if (alias) return alias;

    const pieces = [];
    let i = 0;
    while (i < s.length) {
      if (s[i] === '-') { pieces.push('-'); i++; continue; }

      let onset = '';
      while (i < s.length && !bestVowelMatch(s, i) && s[i] !== '-') {
        onset += s[i];
        i++;
        if (onset.length > 2) break;
      }

      const vowelMatch = bestVowelMatch(s, i);
      if (!vowelMatch) {
        if (onset) {
          const onsetHangul = mapOnsetCluster(onset);
          if (onsetHangul) pieces.push(onsetHangul);
          else pieces.push(onset);
        }
        break;
      }
      i += vowelMatch.roma.length;

      let coda = '';
      let lookahead = i;
      while (lookahead < s.length && s[lookahead] !== '-' && !bestVowelMatch(s, lookahead)) {
        coda += s[lookahead];
        lookahead++;
        if (coda.length > 2) break;
      }
      let final = '';
      if (coda) {
        const consonantCount = coda.replace(/[^bcdfghjklmnpqrstvwxyz]/g, '').length;
        if (consonantCount >= 2 && lookahead < s.length && bestVowelMatch(s, lookahead)) {
          final = mapCodaCluster(coda.slice(0, -1));
          i = lookahead - 1;
        } else {
          final = mapCodaCluster(coda);
          i = lookahead;
        }
      }

      const onsetHangul = mapOnsetCluster(onset) || 'ㅇ';
      const syllable = composeHangul(onsetHangul, vowelMatch.hangul, final);
      if (syllable) {
        pieces.push(syllable);
      } else {
        pieces.push(onsetHangul + vowelMatch.hangul + final);
      }
    }

    let result = pieces.join('').replace(/-+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!result) return '';

    // Replace any leftover jamo with cleaner Hangul-ish output or the original token.
    if (/[ㄱ-ㅎ]/.test(result)) {
      result = result.replace(/ㄱ/g, 'ㄱ').replace(/ㄴ/g, 'ㄴ').replace(/ㄷ/g, 'ㄷ').replace(/ㄹ/g, 'ㄹ').replace(/ㅁ/g, 'ㅁ').replace(/ㅂ/g, 'ㅂ').replace(/ㅅ/g, 'ㅅ').replace(/ㅇ/g, 'ㅇ').replace(/ㅈ/g, 'ㅈ').replace(/ㅊ/g, 'ㅊ').replace(/ㅋ/g, 'ㅋ').replace(/ㅌ/g, 'ㅌ').replace(/ㅍ/g, 'ㅍ').replace(/ㅎ/g, 'ㅎ');
    }
    return result;
  }

  function transliteratePlayerName(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/[ㄱ-힣]/.test(raw)) return raw;

    const alias = lookupPlayerAlias(raw);
    if (alias) return alias;

    const normalized = raw
      .replace(/[\/|]+/g, ' ')
      .replace(/[_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!normalized) return '';

    const tokens = normalized.split(' ');
    const converted = tokens.map((token) => {
      if (!token) return '';
      if (/^[A-Za-z][A-Za-z.'-]*$/.test(token)) return transliterateEnglishToken(token);
      return token;
    }).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

    if (converted && converted !== raw) return converted;
    return lookupPlayerAlias(normalized) || raw;
  }


  function normalizeNameKey(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[’'`]/g, '')
      .replace(/[^a-z\s-]/g, ' ')
      .replace(/[-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function lookupOfficialPlayerName(value) {
    const map = state.playerNameMap && typeof state.playerNameMap === 'object' ? state.playerNameMap : {};
    const raw = String(value || '').trim();
    if (!raw) return '';
    const candidates = [raw, raw.replace(/[\/|]+/g, ' '), raw.replace(/[_.]+/g, ' '), raw.replace(/\s+/g, ' ').trim()];
    for (const candidate of candidates) {
      const key = normalizeNameKey(candidate);
      if (!key) continue;
      const hit = map[key] || map[key.replace(/\s+/g, '')];
      if (hit) return hit;
    }
    return '';
  }

  function fullPlayerName(row) {
    const first = String(row[0] ?? '').trim();
    const last = String(row[1] ?? '').trim();
    const joined = [first, last].filter(Boolean).join(' ').trim().replace(/[\/|]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!joined) return '-';
    if (/[ㄱ-힣]/.test(joined)) return joined;
    const candidates = [joined, first, last, `${first} ${last}`.trim()];
    for (const candidate of candidates) {
      const hit = lookupOfficialPlayerName(candidate);
      if (hit) return hit;
    }
    return joined;
  }

  function addPlus3(value) {

    if (!isNumeric(value)) return value;
    return Number(value) + 3;
  }

  function findHeaderIndex(headers, names) {
    const normalized = headers.map((h) => String(h ?? '').replace(/\s+/g, '').toLowerCase());
    for (const name of names) {
      const target = String(name).replace(/\s+/g, '').toLowerCase();
      const idx = normalized.findIndex((h) => h === target || h.includes(target) || target.includes(h));
      if (idx >= 0) return idx;
    }
    return -1;
  }

  function mapSourceRow(row) {
    return SOURCE_COLS.map((col) => row[colToIndex(col)] ?? '');
  }

  function parseTraitMask(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'bigint') return value;
    const raw = String(value).trim().replace(/,/g, '');
    if (!raw) return null;
    if (/^[+-]?\d+$/.test(raw)) {
      try { return BigInt(raw); } catch (_) { return null; }
    }
    const num = Number(raw);
    if (!Number.isFinite(num)) return null;
    try { return BigInt(Math.trunc(num)); } catch (_) { return null; }
  }

  function decodeTraitBucket(bitValue, startId, endId) {
    const mask = parseTraitMask(bitValue);
    const out = [];
    if (mask === null) return out;
    const maxBits = endId - startId + 1;
    for (let bit = 0; bit < maxBits; bit++) {
      const bitSet = ((mask >> BigInt(bit)) & 1n) === 1n;
      if (!bitSet) continue;
      const traitId = startId + bit;
      if (!(traitId in TRAIT_MAP)) continue;
      out.push({ id: traitId, name: TRAIT_MAP[traitId], source: startId === 50 ? 'trait3' : startId === 30 ? 'trait2' : 'trait1' });
    }
    return out;
  }

  function decodeTraits(row) {
    const t1 = decodeTraitBucket(row[5], 0, 29);
    const t2 = decodeTraitBucket(row[6], 30, 49);
    const t3 = decodeTraitBucket(row[7], 50, 69);

    const ordered = [...t3, ...t1, ...t2];
    const seen = new Set();
    const merged = [];
    for (const item of ordered) {
      if (seen.has(item.name)) continue;
      seen.add(item.name);
      merged.push({ ...item, bold: false, unused: UNUSED_TRAIT_IDS.has(item.id) });
    }
    return merged;
  }

  function renderTraitChips(traits) {
    if (!traits.length) return '<span class="chip">특성 정보 없음</span>';
    return `<div class="chips">${traits.map((t) => {
      const cls = ['chip'];
      if (t.unused) cls.push('unused');
      return `<span class="${cls.join(' ')}" title="trait_id ${t.id}">${escapeHtml(t.name)}</span>`;
    }).join('')}</div>`;
  }

  function roleByStats(values) {
    const n = (i) => toNumber(values[i]) ?? 0;
    const attack = avg([n(37), n(35), n(18), n(17), n(13), n(14), n(16), n(27), n(34), n(42)]);
    const defense = avg([n(36), n(39), n(40), n(41), n(29), n(20), n(21), n(22), n(23), n(24)]);
    const mid = avg([n(9), n(10), n(11), n(12), n(13), n(14), n(27), n(33), n(34), n(42)]);
    const gk = avg([n(20), n(21), n(22), n(23), n(24)]);
    const scores = { ATT: attack, DEF: defense, MID: mid, GK: gk };
    const role = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    return { role, scores };
  }

  function weightedTraitBonus(traits) {
    let total = 0;
    for (const t of traits) {
      if (t.unused) continue;
      total += TRAIT_WEIGHTS[t.name] ?? 0;
    }
    return total;
  }

  function buildImprovementNotes(ctx) {
    const { role, speed, skill, shooting, defense, passing, gk, weakFoot, traitBonus, salary } = ctx;
    const notes = [];
    const gap = (val, target, label, tip) => {
      if (val < target) notes.push(`${label} ${fmt(val, 1)} → 목표 ${target} (${fmt(target - val, 1)} 부족): ${tip}`);
    };

    if (role === 'ATT') {
      gap(speed, 90, '속도', '가속/스피드 계열 보완(강화·팀컬러) 시 침투·역습 체감이 확 좋아짐');
      gap(shooting, 90, '슈팅', '결정력·슛파워 보완 시 마무리 안정성이 올라감');
      gap(passing, 85, '연계 패스', '짧은 패스·시야 보완 시 전방 압박 상황 탈압박이 쉬워짐');
      if (weakFoot < 4) notes.push(`약발 ${weakFoot} → 4 이상 권장: 역발 마무리 상황에서 편차가 줄어듦`);
    } else if (role === 'MID') {
      gap(passing, 89, '패스', '롱패스·시야 보완 시 전개 속도와 정확도가 개선됨');
      gap(skill, 88, '볼 컨트롤', '드리블·컨트롤 보완 시 탈압박 안정성이 올라감');
      gap(defense, 84, '수비 기여', '가로채기·대인수비 보완 시 중원 밸런스가 강화됨');
      if (weakFoot < 4) notes.push(`약발 ${weakFoot} → 4 이상 권장: 중원 전개 시 패스 방향 제약이 줄어듦`);
    } else if (role === 'DEF') {
      gap(defense, 90, '수비', '대인수비·태클 보완 시 1대1 대응력이 올라감');
      gap(speed, 84, '스피드', '뒷공간 커버를 위해 속도 보완이 필요함');
      gap(passing, 82, '빌드업 패스', '롱패스 정확도 보완 시 후방 빌드업 기여가 올라감');
    } else {
      gap(gk, 90, 'GK 핵심 스탯', '반응속도·핸들링 보완 시 선방 안정성이 올라감');
    }

    if (salary > 22) notes.push(`급여 ${salary}로 부담이 큼: 스쿼드 급여 여유를 확보한 뒤 기용하는 편이 좋음`);
    if (traitBonus < 6) notes.push('메타 특성 비중이 낮음: 강화 단계를 올리기보다 특성 조합/트레이닝 자원 확보가 우선순위');
    if (!notes.length) notes.push('현재 지표만으로도 실사용 밸런스가 준수함: 강화 단계별 투자 효율만 검토하면 충분함');
    return notes;
  }

  function evaluateRow(row, traits) {
    const ovr = toNumber(row[8]) ?? 0;
    const salary = toNumber(row[2]) ?? 0;
    const weakFoot = toNumber(row[3]) ?? 0;
    const rolePack = roleByStats(row);
    const role = rolePack.role;
    const roleScore = rolePack.scores[role] ?? 0;
    const traitBonus = weightedTraitBonus(traits);

    const speed = avg([toNumber(row[37]) ?? 0, toNumber(row[9]) ?? 0, toNumber(row[33]) ?? 0, toNumber(row[10]) ?? 0]);
    const skill = avg([toNumber(row[13]) ?? 0, toNumber(row[14]) ?? 0, toNumber(row[15]) ?? 0, toNumber(row[16]) ?? 0, toNumber(row[17]) ?? 0, toNumber(row[35]) ?? 0]);
    const shooting = avg([toNumber(row[18]) ?? 0, toNumber(row[28]) ?? 0, toNumber(row[35]) ?? 0, toNumber(row[43]) ?? 0]);
    const defense = avg([toNumber(row[29]) ?? 0, toNumber(row[36]) ?? 0, toNumber(row[39]) ?? 0, toNumber(row[40]) ?? 0, toNumber(row[41]) ?? 0]);
    const passing = avg([toNumber(row[27]) ?? 0, toNumber(row[34]) ?? 0, toNumber(row[42]) ?? 0, toNumber(row[15]) ?? 0]);
    const gk = avg([toNumber(row[20]) ?? 0, toNumber(row[21]) ?? 0, toNumber(row[22]) ?? 0, toNumber(row[23]) ?? 0, toNumber(row[24]) ?? 0]);

    const salaryBonus = salary <= 15 ? 1.3 : salary <= 18 ? 0.8 : salary <= 22 ? 0.35 : -0.6;
    const weakFootAdj = role === 'ATT'
      ? (weakFoot - 3) * 1.8
      : role === 'MID'
        ? (weakFoot - 3) * 1.3
        : role === 'DEF'
          ? (weakFoot - 3) * 0.7
          : (weakFoot - 3) * 0.4;
    const calibration = role === 'ATT' ? -6.5 : role === 'MID' ? -5.5 : role === 'DEF' ? -5 : -4.5;
    const composite = (ovr * 0.58) + (roleScore * 0.18) + (speed * 0.07) + (skill * 0.06) + (shooting * 0.05) + (defense * 0.04) + (passing * 0.04) + (gk * 0.01) + (traitBonus * 0.36) + salaryBonus + weakFootAdj + calibration;
    const grade = gradeFromPercentile(classPercentile(composite));
    const compare = compareClasses(composite);

    const strengths = [];
    const weaknesses = [];

    if (role === 'ATT') {
      if (speed >= 90) strengths.push('속도/가속 체감이 좋다.');
      if (shooting >= 90) strengths.push('결정력과 슛 파워가 강하다.');
      if (weakFoot >= 4) strengths.push('약발 활용도가 좋아 마무리 변수가 적다.');
      if (weakFoot <= 2) weaknesses.push('약발 의존 상황에서 마무리 편차가 생길 수 있다.');
      if (traits.some((t) => ['라인 브레이커', '체이서', '프레데터', '스피드스터', '아크로바틱 피니셔', '크로스 포쳐'].includes(t.name))) strengths.push('메타 핵심 공격 특성이 잘 붙어 있다.');
      if (avg([toNumber(row[29]) ?? 0, toNumber(row[40]) ?? 0]) < 85) weaknesses.push('몸싸움/경합에서 밀릴 수 있다.');
      if (passing < 84) weaknesses.push('연계형 플레이는 다소 아쉬울 수 있다.');
    } else if (role === 'DEF') {
      if (defense >= 90) strengths.push('수비 지표가 매우 좋다.');
      if (traits.some((t) => ['블로커', '타이탄', '커맨더', '와일드 태클러', '강력한 헤딩', '아크로바틱 클리어'].includes(t.name))) strengths.push('수비 메타 특성이 강하다.');
      if (toNumber(row[40]) >= 88 || toNumber(row[29]) >= 88) strengths.push('피지컬 경합 대응이 좋다.');
      if (speed < 84) weaknesses.push('뒷공간 커버가 아쉬울 수 있다.');
      if (passing < 82) weaknesses.push('빌드업 연결은 제한적일 수 있다.');
    } else if (role === 'MID') {
      if (passing >= 89) strengths.push('전개와 짧은 패스가 강하다.');
      if (skill >= 88) strengths.push('볼 컨트롤과 체감이 좋다.');
      if (weakFoot >= 4) strengths.push('약발 활용이 좋아 중원 전개가 안정적이다.');
      if (weakFoot <= 2) weaknesses.push('약발 전환 시 패스/마무리 안정성이 떨어질 수 있다.');
      if (traits.some((t) => ['(AI)플레이 메이커', '(AI)긴 패스 선호', '따돌리기 패스', '테크니컬 드리블러'].includes(t.name))) strengths.push('중원 조율 특성이 좋다.');
      if (defense < 84 && shooting < 84) weaknesses.push('공수 특화가 약하면 범용성만 남을 수 있다.');
    } else {
      if (gk >= 90) strengths.push('골키퍼 핵심 스탯이 강하다.');
      if (weakFoot >= 4) strengths.push('약발 관여가 적은 포지션 특성상 안정성이 높다.');
      if (weakFoot <= 2) weaknesses.push('약발 영향은 낮지만 빌드업 연결에는 손해가 있을 수 있다.');
      if (traits.some((t) => ['GK 날렵한 펀칭', 'GK 멀리 던지기', 'GK 일대일 선방', 'GK 적극적 크로스 수비', 'GK 빠른 반응', 'GK 공중볼 장악', 'GK 데드아이', '스위퍼 키퍼'].includes(t.name))) strengths.push('GK 핵심 특성이 잘 붙어 있다.');
      if (gk < 84) weaknesses.push('실사용 GK로는 불안 요소가 있다.');
    }

    if (strengths.length === 0) strengths.push('핵심 지표가 무난해 범용성은 확보된다.');
    if (weaknesses.length === 0) weaknesses.push('치명적인 약점은 적다.');

    const market = marketText(grade, ovr, salary, traitBonus, role);
    const invest = investmentText(grade, ovr, salary, traitBonus);
    const useCase = useCaseText(role, grade, composite);
    const improvementNotes = buildImprovementNotes({ role, speed, skill, shooting, defense, passing, gk, weakFoot, traitBonus, salary });
    const body = [
      `[${roleLabel(role)} 기준 ${grade}]`,
      '',
      `약발 반영: ${weakFoot || '-'} / ${role === 'ATT' ? '공격 핵심' : role === 'MID' ? '중원 핵심' : role === 'DEF' ? '수비 보조' : 'GK 보조'}`,
      '',
      '장점',
      ...strengths.map((x) => `* ${x}`),
      '',
      '단점',
      ...weaknesses.map((x) => `* ${x}`),
      '',
      '비교',
      ...compare.map((x) => `* ${x}`),
      '',
      '실사용 개선 포인트',
      ...improvementNotes.map((x) => `* ${x}`),
      '',
      '추천 강화',
      `* ${recommendEnhance(grade, ovr)}` ,
      '',
      '급여 효율',
      `* ${salaryEfficiency(salary, grade)}` ,
      '',
      '시장성',
      `* ${market}` ,
      '',
      '투자 가치',
      `* ${invest}` ,
      '',
      '실사용 포지션',
      ...useCase.map((x) => `* ${x}`)
    ].join('\n');

    const tableLine1 = `${roleLabel(role)} · ${compactSentence(strengths[0] || weaknesses[0] || '범용성 확보', 18)} · ${compactSentence(market, 18)}`;
    const tableLine2 = `${compactSentence(compare[0] || '전체 클래스 풀 기준 비교', 26)} · ${compactSentence(invest, 18)}`;

    return {
      grade,
      role,
      roleLabel: roleLabel(role),
      composite,
      compare,
      strengths,
      weaknesses,
      improvementNotes,
      market,
      invest,
      useCase,
      body,
      summaryCore: tableLine1,
      tableText: tableLine2,
      scoreBands: {
        speed,
        skill,
        shooting,
        defense,
        passing,
        gk,
      }
    };
  }

  function roleLabel(role) {
    return {
      ATT: '공격형 포지션',
      MID: '미드필더형',
      DEF: '수비형',
      GK: '골키퍼형'
    }[role] || '범용형';
  }

  function gradeFromScore(score) {
    if (score >= 101) return 'S+';
    if (score >= 98) return 'S';
    if (score >= 95) return 'A+';
    if (score >= 92) return 'A';
    if (score >= 89) return 'B';
    return 'C';
  }

  function classBaseScore(name) {
    const n = String(name || '').trim().toUpperCase();
    const yr = (n.match(/^(\d{2})/) || [])[1] ? Number((n.match(/^(\d{2})/) || [])[1]) : null;
    if (n === '26TOTY') return 110;
    if (n === '26TOTY-N') return 108;
    if (n === '25TOTY') return 107;
    if (n === '25TOTY-N') return 105;
    if (n === '24TOTY') return 103;
    if (n === '24TOTY-N') return 101;
    if (n === '23TOTY') return 99;
    if (n === '23TOTY-N') return 97;
    if (n === '22TOTY') return 95;
    if (n === '22TOTY-N') return 93;
    if (n === '21TOTY') return 92;
    if (n === '21TOTY-N') return 90;
    if (n === '20TOTY') return 89;
    if (n === '20TOTY-N') return 87;
    if (n === '19TOTY') return 86;
    if (n === '19TOTY-N') return 84;
    if (n.includes('TOTY')) return 90 - (Number.isFinite(yr) ? Math.max(0, 26 - yr) : 0);

    if (n === '25TOTS') return 103;
    if (n === '24TOTS') return 101;
    if (n === '23TOTS') return 99;
    if (n === '22TOTS') return 97;
    if (n === '21TOTS') return 95;
    if (n === '20TOTS') return 93;
    if (n === '19TOTS') return 91;

    if (n === '26HEROES') return 101;
    if (n === '25HEROES') return 99;
    if (n === '24HEROES') return 97;
    if (n === '23HEROES') return 95;
    if (n === '22HEROES') return 93;

    if (n === 'ICON TM') return 103;
    if (n === 'ICON') return 100;
    if (n === 'NHD') return 84;
    if (n === 'TB') return 85;
    if (n === 'TT') return 86;
    if (n === 'GR') return 86;
    if (n === 'TC') return 85;

    if (['CH','LE','NO.7','WB','GRU','BLD','BDO','CU','MDL','EU24','LD','UT','JNM','DC'].includes(n)) return 94;
    if (['LN','SPL','LOL','FA','CC','HG','RTN','BWC','MC','CAP','EBS','BTB'].includes(n)) return 92;
    if (['VTR','MOG','LH','OTW','COC','HOT'].includes(n)) return 88;
    if (['24EP','FC','23HW','WC22','UP','E21','NTG','23NG','22NG','21NG','20NG','19NG'].includes(n)) return 87;
    if (['25IM','SH','TK','PTG','KHD','WG','FAC','25DP','WS','FSL','DCB'].includes(n)) return 88;
    if (['26TY','25TY','24TY','23TY','22TY','21TY','20TY','19TY'].includes(n)) return 90;
    if (['K19','K18','12KH','26KL','25KL','24KL','23KL','22KL','21KL','20KL','K23','K22','K21'].includes(n)) return 86;
    if (['25KB','24KB','23KB','22KB','21KB','20KB'].includes(n)) return 84;
    if (['25PL','24PL','23PL','22PL','21PL'].includes(n)) return 85;
    if (['20','21','22','23','24','25'].includes(n)) return 82;
    return 83;
  }

  function gradeFromPercentile(pct) {
    if (pct >= 0.985) return 'S+';
    if (pct >= 0.92) return 'S';
    if (pct >= 0.82) return 'A+';
    if (pct >= 0.68) return 'A';
    if (pct >= 0.48) return 'B';
    return 'C';
  }

  function gradeFromRelativePercentile(pct) {
    if (pct >= 0.995) return 'S+';
    if (pct >= 0.95) return 'S';
    if (pct >= 0.82) return 'A+';
    if (pct >= 0.60) return 'A';
    if (pct >= 0.35) return 'B';
    return 'C';
  }

  function classPercentile(score) {
    const pool = getReferencePool();
    if (!pool.length) return 0;
    const ranked = pool.filter((item) => score >= item.tier).length;
    return ranked / pool.length;
  }

  function compareClasses(score) {
    const pool = getReferencePool();
    const ranked = pool
      .map((item) => ({ ...item, delta: Math.abs(item.tier - score) }))
      .sort((a, b) => a.delta - b.delta || b.tier - a.tier)
      .slice(0, 4);
    const top = ranked[0]?.name || '전체 클래스';
    const second = ranked[1]?.name || top;
    const third = ranked[2]?.name || second;
    const pct = pool.length ? Math.max(0, Math.min(100, ((pool.findIndex((x) => x.name === top) + 1) / pool.length) * 100)) : 0;
    return [
      `전체 ${pool.length}개 클래스 풀 기준 ${top} 근접`,
      `${second} / ${third}와 직접 비교`,
      `체감 기준 상위 ${pct.toFixed(1)}% 수준`
    ];
  }

  function recommendEnhance(grade, ovr) {
    if (grade === 'S+' || ovr >= 98) return '11카 우선 검토';
    if (grade === 'S' || ovr >= 95) return '8카 우선 추천';
    if (grade === 'A+' || ovr >= 92) return '8카 가치 높음';
    if (grade === 'A') return '5~8카 범위 검토';
    return '저강화 가성비 검토';
  }

  function salaryEfficiency(salary, grade) {
    if (!salary) return '급여 정보 없음';
    if (salary <= 15 && (grade === 'S+' || grade === 'S' || grade === 'A+')) return '매우 우수';
    if (salary <= 18 && (grade === 'S+' || grade === 'S' || grade === 'A+')) return '우수';
    if (salary <= 20) return '보통';
    return '급여 부담 큼';
  }

  function marketText(grade, ovr, salary, traitBonus, role) {
    let tier = '보통';
    if (grade === 'S+' || (ovr >= 98 && traitBonus >= 10)) tier = '매우 강세';
    else if (grade === 'S' || ovr >= 95) tier = '강세';
    else if (grade === 'A+' || ovr >= 92) tier = '초반 강세';
    else if (salary <= 15 && traitBonus >= 6) tier = '가성비 수요';

    const roleTail = role === 'ATT'
      ? '공격 메타 특성상 출시 초반 가격 탄력이 크다.'
      : role === 'DEF'
        ? '수비형은 체감과 경합 검증 후 안정화된다.'
        : role === 'GK'
          ? 'GK는 체감 차이가 커서 상위 자원에 수요가 몰린다.'
          : '중원형은 범용 수요가 꾸준하다.';
    return `${tier} / ${roleTail}`;
  }

  function investmentText(grade, ovr, salary, traitBonus) {
    if (grade === 'S+' && ovr >= 98) return '상당히 높음. 초기 거래량 급증 가능성이 있다.';
    if (grade === 'S' && traitBonus >= 10) return '높음. 강특성 자원은 시장 프리미엄이 붙기 쉽다.';
    if (grade === 'A+' && salary <= 18) return '중상. 가성비 수요가 꾸준할 수 있다.';
    if (salary <= 15) return '중간. 급여 효율이 좋아 실사용 수요가 붙을 수 있다.';
    return '보통. 강점이 명확할 때만 투자 메리트가 있다.';
  }

  function useCaseText(role, grade, score) {
    if (role === 'ATT') {
      return [`ST : ${grade}`, `CF : ${gradeFromScore(score - 1.5)}`, `CAM : ${gradeFromScore(score - 3)}`];
    }
    if (role === 'DEF') {
      return [`CB : ${grade}`, `CDM : ${gradeFromScore(score - 2)}`, `FB : ${gradeFromScore(score - 4)}`];
    }
    if (role === 'MID') {
      return [`CM : ${grade}`, `CAM : ${gradeFromScore(score - 1.5)}`, `CDM : ${gradeFromScore(score - 2.5)}`];
    }
    return [`GK : ${grade}`, `빌드업 GK : ${gradeFromScore(score - 1)}`];
  }

  function compactSentence(text, maxLen = 16) {
    const clean = String(text || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (clean.length <= maxLen) return clean;
    return clean.slice(0, Math.max(0, maxLen - 1)).trimEnd() + '…';
  }

  function avg(nums) {
    const arr = nums.filter((n) => Number.isFinite(n));
    if (!arr.length) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  const GRADE_SORT = { 'S+': 600, 'S': 500, 'A+': 400, 'A': 300, 'B': 200, 'C': 100 };

  function abilityBand(value) {
    const n = toNumber(value);
    if (n === null) return '';
    if (n >= 170) return 'mint';
    if (n >= 160) return 'teal';
    if (n >= 150) return 'orange';
    if (n >= 140) return 'gold';
    if (n >= 130) return 'red';
    if (n >= 120) return 'magenta';
    if (n >= 110) return 'purple';
    if (n >= 100) return 'indigo';
    if (n >= 90) return 'blue';
    if (n >= 80) return 'sky';
    return 'gray';
  }

  function renderAbilityValue(value) {
    const n = toNumber(value);
    if (n === null) return escapeHtml(value ?? '');
    const band = abilityBand(n);
    return `<span class="ability ability-${band}">${escapeHtml(String(n))}</span>`;
  }

  function footBadgeHtml(value, kind) {
    const isStrong = kind === 'strong';
    const rawValue = String(value ?? '-');
    const label = isStrong ? `주발: ${rawValue}` : `약발: ${rawValue}`;
    const displayValue = isStrong ? '5' : rawValue;
    return `<span class=\"foot-badge ${kind}\" title=\"${escapeHtml(label)}\" aria-label=\"${escapeHtml(label)}\">
      <svg class=\"foot-icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\">
        <path d=\"M8 4.2c1.5 0 2.5 1.3 2.5 3s-1 3-2.5 3-2.5-1.3-2.5-3 1-3 2.5-3zm5.3.9c1.2 0 2 1 2 2.4s-.8 2.4-2 2.4-2-1-2-2.4.8-2.4 2-2.4zm2.4 4.3c1 0 1.7.8 1.7 1.9s-.7 1.9-1.7 1.9-1.7-.8-1.7-1.9.7-1.9 1.7-1.9zm-9.6 3.4c2.9 0 5.3 1.9 5.3 4.3 0 1.5-.7 2.7-2 3.6-.4.2-.8.4-1.4.4H7.2c-2.1 0-3.8-1.5-3.8-3.4 0-2 1.7-3.6 3.7-4.3z\" fill=\"currentColor\"/>
      </svg>
      <span class=\"num\">${escapeHtml(displayValue)}</span>
    </span>`;
  }



  function getSortWeight(header, cell, row, mode, colIndex) {
    const h = String(header || '').trim();
    if (!row) return { type: 'text', value: '' };
    const numHeaders = new Set(['급여', '오버롤', ...STAT_ORDER.map((s) => s.label)]);
    if (mode === 'processed') {
      if (h === '선수명') return { type: 'text', value: String(row.displayName || '').toLowerCase() };
      if (numHeaders.has(h)) return { type: 'num', value: toNumber(cell) ?? -Infinity };
      if (h === '주발') {
        const strong = String(cell ?? row.cleanRow?.[4] ?? '').trim();
        return { type: 'text', value: strong === '오른발' ? 'a오른발' : strong === '왼발' ? 'b왼발' : String(strong).toLowerCase() };
      }
      if (h === '약발') return { type: 'num', value: toNumber(cell) ?? -Infinity };
      if (h === '신규 특성' || h === '특성') return { type: 'text', value: String(row.traitText || '').toLowerCase() };
      if (h === '포지션') return { type: 'text', value: String(row.position || '').toLowerCase() };
      if (h === '평가') return { type: 'num', value: (GRADE_SORT[row.evaluation?.grade] ?? 0) * 1000 + (row.evaluation?.composite ?? 0) };
    } else {
      const raw = Array.isArray(row.rawRow) ? row.rawRow[colIndex] : '';
      if (h === '선수명') return { type: 'text', value: String(row.displayName || '').toLowerCase() };
      if (h === '급여' || h === '오버롤' || numHeaders.has(h)) return { type: 'num', value: toNumber(raw) ?? -Infinity };
      if (h === '주발') {
        const strong = String(row.cleanRow?.[4] ?? '').trim();
        return { type: 'text', value: strong === '오른발' ? 'a오른발' : strong === '왼발' ? 'b왼발' : String(strong).toLowerCase() };
      }
      if (h === '약발') return { type: 'num', value: toNumber(row.cleanRow?.[3]) ?? -Infinity };
    }
    const textValue = String((cell && typeof cell === 'object' ? (cell.text ?? cell.value ?? cell.title ?? '') : cell) ?? '').toLowerCase();
    const num = toNumber(cell && typeof cell === 'object' ? (cell.value ?? cell.text ?? '') : cell);
    if (Number.isFinite(num)) return { type: 'num', value: num };
    return { type: 'text', value: textValue };
  }

  function compareSortValues(a, b, dir = 'asc') {
    const mul = dir === 'desc' ? -1 : 1;
    if (a.type === 'num' && b.type === 'num') return (a.value - b.value) * mul;
    return String(a.value ?? '').localeCompare(String(b.value ?? ''), 'ko') * mul;
  }

  function sortRowsForTable(rows, headers, mode) {
    const sortHeader = String(state.sort?.header || headers[state.sort?.index] || '').trim();
    const idx = headers.findIndex((h) => String(h || '').trim() === sortHeader);
    if (idx < 0) return rows.slice();
    const dir = state.sort?.dir === 'desc' ? 'desc' : 'asc';
    return rows.slice().sort((ra, rb) => {
      const ca = mode === 'raw' ? ra.rawRow[idx] : ra.displayRow[idx];
      const cb = mode === 'raw' ? rb.rawRow[idx] : rb.displayRow[idx];
      const va = getSortWeight(headers[idx], ca, ra, mode, idx);
      const vb = getSortWeight(headers[idx], cb, rb, mode, idx);
      const cmp = compareSortValues(va, vb, dir);
      if (cmp !== 0) return cmp;
      const aName = String(ra.displayName || '').toLowerCase();
      const bName = String(rb.displayName || '').toLowerCase();
      return aName.localeCompare(bName, 'ko');
    });
  }

  function fmt(n, digits = 1) {
    if (n === null || n === undefined || Number.isNaN(n)) return '-';
    return Number(n).toFixed(digits);
  }


  function getUIControls() {
    return {
      enhance: Number(el('enhanceSelect')?.value || state.controls.enhance || 1),
      adapt: Number(el('adaptSelect')?.value || state.controls.adapt || 1),
      teamColor: Number(el('teamColorSelect')?.value || state.controls.teamColor || 0),
    };
  }

  function totalAbilityBonus(controls) {
    const c = controls || getUIControls();
    const enhance = ENHANCE_BONUS[Number(c.enhance) || 1] ?? 0;
    const adapt = Number(c.adapt) === 5 ? 4 : 0;
    const team = Number(c.teamColor) || 0;
    return enhance + adapt + team;
  }

  function rawSheetToRows(xmlDoc, sharedStrings) {
    const rows = [];
    const rowNodes = [...xmlDoc.getElementsByTagName('row')];
    let maxCol = 0;
    for (const rowNode of rowNodes) {
      const row = [];
      const cellNodes = [...rowNode.getElementsByTagName('c')];
      for (const cell of cellNodes) {
        const ref = cell.getAttribute('r') || '';
        const match = ref.match(/([A-Z]+)(\d+)/);
        const col = match ? colToIndex(match[1]) : row.length;
        const type = cell.getAttribute('t') || '';
        const v = cell.getElementsByTagName('v')[0];
        let value = '';
        if (type === 's') {
          const idx = Number(v?.textContent || 0);
          value = sharedStrings[idx] ?? '';
        } else if (type === 'inlineStr') {
          const isNode = cell.getElementsByTagName('is')[0];
          value = isNode ? isNode.textContent || '' : '';
        } else if (type === 'b') {
          value = (v?.textContent || '') === '1' ? 'TRUE' : 'FALSE';
        } else {
          value = v ? v.textContent || '' : '';
        }
        row[col] = value;
        if (col + 1 > maxCol) maxCol = col + 1;
      }
      for (let i = 0; i < maxCol; i++) {
        if (row[i] === undefined) row[i] = '';
      }
      rows.push(row);
    }
    return rows;
  }

  function xmlText(xml) {
    return new XMLSerializer().serializeToString(xml);
  }

  async function parseXml(text) {
    return new DOMParser().parseFromString(text, 'application/xml');
  }

  async function readZip(arrayBuffer) {
    const u8 = new Uint8Array(arrayBuffer);
    const dv = new DataView(arrayBuffer);
    const len = u8.length;
    const u16 = (off) => dv.getUint16(off, true);
    const u32 = (off) => dv.getUint32(off, true);
    const utf8 = (bytes) => new TextDecoder('utf-8').decode(bytes);

    let eocd = -1;
    for (let i = len - 22; i >= Math.max(0, len - 65557); i--) {
      if (u32(i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('ZIP end record not found');

    const total = u16(eocd + 10);
    const cdOffset = u32(eocd + 16);
    const cdSize = u32(eocd + 12);
    const files = {};
    let pos = cdOffset;

    async function inflateRaw(bytes) {
      if (typeof DecompressionStream !== 'undefined') {
        for (const fmt of ['deflate-raw', 'deflate']) {
          try {
            const ds = new DecompressionStream(fmt);
            const stream = new Blob([bytes]).stream().pipeThrough(ds);
            const ab = await new Response(stream).arrayBuffer();
            return new Uint8Array(ab);
          } catch (_) {
            // try next format
          }
        }
      }
      throw new Error('이 브라우저는 XLSX 압축 해제를 지원하지 않습니다. Chrome / Edge 최신 버전으로 열어주세요.');
    }

    for (let n = 0; n < total && pos < cdOffset + cdSize; n++) {
      if (u32(pos) !== 0x02014b50) throw new Error('Central directory entry not found');
      const method = u16(pos + 10);
      const compSize = u32(pos + 20);
      const nameLen = u16(pos + 28);
      const extraLen = u16(pos + 30);
      const commentLen = u16(pos + 32);
      const localOffset = u32(pos + 42);
      const name = utf8(u8.slice(pos + 46, pos + 46 + nameLen));

      if (u32(localOffset) !== 0x04034b50) throw new Error('Local file header not found');
      const lNameLen = u16(localOffset + 26);
      const lExtraLen = u16(localOffset + 28);
      const compStart = localOffset + 30 + lNameLen + lExtraLen;
      const compData = u8.slice(compStart, compStart + compSize);

      let out;
      if (method === 0) out = compData;
      else if (method === 8) out = await inflateRaw(compData);
      else throw new Error(`Unsupported compression method: ${method}`);
      files[name] = out;
      pos += 46 + nameLen + extraLen + commentLen;
    }
    return files;
  }

  function buildSheetSummary(rows) {
    if (!rows.length) return null;
    const grades = { 'S+': 0, 'S': 0, 'A+': 0, 'A': 0, 'B': 0, 'C': 0 };
    const roleCounts = { ATT: 0, MID: 0, DEF: 0, GK: 0 };
    const traitCounts = new Map();
    const ovrVals = [];
    const card8Vals = [];
    const card11Vals = [];
    const traitCoverage = [];
    let scoreSum = 0;
    let totalTrait = 0;

    rows.forEach((r) => {
      grades[r.evaluation.grade] += 1;
      roleCounts[r.evaluation.role] += 1;
      const ovr = toNumber(r.cleanRow[8]);
      const c8 = toNumber(r.card8);
      const c11 = toNumber(r.card11);
      if (ovr !== null) ovrVals.push(ovr);
      if (c8 !== null) card8Vals.push(c8);
      if (c11 !== null) card11Vals.push(c11);
      scoreSum += r.evaluation.composite;
      totalTrait += r.traits.length;
      if (r.traits.length) traitCoverage.push(1);
      r.traits.forEach((t) => {
        traitCounts.set(t.name, (traitCounts.get(t.name) || 0) + 1);
      });
    });

    const topTraits = [...traitCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const avgScore = scoreSum / rows.length;
    const avgOvr = avg(ovrVals);
    const avg8 = avg(card8Vals);
    const avg11 = avg(card11Vals);
    const decodeRate = rows.length ? (traitCoverage.length / rows.length) * 100 : 0;
    const sPlusRate = rows.length ? (grades['S+'] / rows.length) * 100 : 0;

    const dominantRole = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0][0];
    const metaText = dominantRole === 'ATT'
      ? '침투형/득점형 메타 비중이 높아 26TOTY 계열과 직접 비교가 잘 된다.'
      : dominantRole === 'DEF'
        ? '수비형 메타 비중이 높아 25TOTS, 24TOTS, DC 계열과 비교가 잘 된다.'
        : dominantRole === 'GK'
          ? 'GK 변별력이 큰 분포라 26TOTY급 상위 자원 수요가 몰릴 가능성이 있다.'
          : '중원형 비중이 높아 LN, BWC, BTB, EBS 계열과의 체감 비교가 핵심이다.';

    const marketText = avgScore >= 95
      ? '시장 영향도 매우 높음 · 26TOTY 상단권과 같은 급의 수요 가능'
      : avgScore >= 92
        ? '시장 영향도 높음 · 25TOTY / 25TOTS 교차 수요 가능'
        : avgScore >= 88
          ? '시장 영향도 보통 이상 · DC / LN / BWC와 직접 경쟁'
          : '시장 영향도 제한적 · 가성비/특화 포지션 중심';

    const investText = sPlusRate >= 40
      ? '투자 가치 높음 · 초반 고강 수요 기대'
      : sPlusRate >= 20
        ? '투자 가치 중상 · 강화 효율 확인 후 접근'
        : '투자 가치는 선별적 · 포지션 특화 기준';

    const community = avgScore >= 95
      ? '출시 초반 높은 가격 형성 및 높은 관심 예상'
      : avgScore >= 90
        ? '초기 기대감은 크지만 가격 안정화 가능성도 존재'
        : '가성비/특화 포지션 중심의 실사용 평가가 우세';

    const pool = getReferencePool().slice().sort((a, b) => b.tier - a.tier || a.name.localeCompare(b.name));
    const poolCount = pool.length;
    const topClass = pool[0]?.name || '26TOTY';
    const altCompare = `전체 ${poolCount}개 클래스 기준 ${topClass}부터 일괄 비교`;

    return {
      avgScore,
      avgOvr,
      avg8,
      avg11,
      decodeRate,
      sPlusRate,
      topTraits,
      grades,
      roleCounts,
      dominantRole,
      metaText,
      marketText,
      investText,
      community,
      altCompare,
      totalTrait,
      rows: rows.length,
    };
  }

  function renderSummary(summary) {
    const box = el('summaryStats');
    if (!box) return;
    if (!summary) {
      box.innerHTML = `
        <div class="stat"><div class="k">처리 행 수</div><div class="v">0</div><div class="s">업로드 대기 중</div></div>
        <div class="stat"><div class="k">평균 OVR</div><div class="v">-</div><div class="s">+3 보정 후 기준</div></div>
        <div class="stat"><div class="k">특성 해독률</div><div class="v">-</div><div class="s">Trait 1~3 반영</div></div>
        <div class="stat"><div class="k">S 이상 비율</div><div class="v">-</div><div class="s">메타 평가 기준</div></div>
      `;
      return;
    }

    const gradeRate = summary.sPlusRate.toFixed(1) + '%';
    box.innerHTML = `
      <div class="stat"><div class="k">처리 행 수</div><div class="v">${summary.rows}</div><div class="s">가공 가능한 선수 데이터</div></div>
      <div class="stat"><div class="k">평균 OVR</div><div class="v">${fmt(summary.avgOvr, 1)}</div><div class="s">+3 보정 반영</div></div>
      <div class="stat"><div class="k">평균 8 / 11카</div><div class="v">${fmt(summary.avg8, 1)} / ${fmt(summary.avg11, 1)}</div><div class="s">강화 가치 기준</div></div>
      <div class="stat"><div class="k">S 이상 비율</div><div class="v">${gradeRate}</div><div class="s">메타 등급 비중</div></div>
    `;
  }


  function renderLegend() {
    const count = el('refCount');
    const pool = getReferencePool();
    if (count) count.textContent = `${pool.length}개`;
    const box = el('legend');
    const summaryNode = el('refSummary');
    if (!box) return;

    const active = state.activeSheet || '';
    const ordered = pool
      .map((item) => ({
        name: item.name,
        tier: item.tier,
        count: Math.max(0, (Array.isArray(state.sheets[item.name]) ? state.sheets[item.name].length : 0) - 1),
      }))
      .sort((a, b) => {
        if (a.name === active && b.name !== active) return -1;
        if (b.name === active && a.name !== active) return 1;
        return (b.tier - a.tier) || a.name.localeCompare(b.name, 'ko');
      });

    const present = ordered.filter((item) => item.count > 0).length;
    if (summaryNode) {
      summaryNode.textContent = `전체 클래스 ${ordered.length}개를 비교 기준으로 사용 · 업로드 포함 ${present}개 / 미포함 ${Math.max(0, ordered.length - present)}개`;
    }

    if (!ordered.length) {
      box.innerHTML = '<span class="chip">비교 대상 클래스 없음</span>';
      return;
    }

    box.innerHTML = ordered.map((item) => {
      const isActive = item.name === active;
      const title = `${item.name} · ${item.count}명${item.count === 0 ? ' · 시트 없음' : ''}`;
      return `<button type="button" class="chip class-chip${isActive ? ' active' : ''}${item.count === 0 ? ' missing' : ''}" data-sheet="${escapeHtml(item.name)}" title="${escapeHtml(title)}">${escapeHtml(item.name)} <span class="chip-count">${item.count}</span></button>`;
    }).join('');

    box.querySelectorAll('button[data-sheet]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sheetName = btn.getAttribute('data-sheet');
        if (sheetName) showSheet(sheetName);
      });
    });
  }

  function renderTable(headers, rows, mode) {

    const wrap = el('tableWrap');
    if (!rows.length) {
      wrap.innerHTML = '<div class="empty">표시할 데이터가 없습니다.</div>';
      return;
    }

    const q = (el('search').value || '').trim().toLowerCase();
    let filtered = rows;
    if (q) filtered = rows.filter((r) => r.searchBlob.includes(q));
    const slice = sortRowsForTable(filtered, headers, mode);
    const selectedRow = state.selectedRow && slice.includes(state.selectedRow)
      ? state.selectedRow
      : slice[0] || null;

    let html = '<table><colgroup><col><col><col><col><col></colgroup><thead><tr>';
    headers.forEach((h, idx) => {
      const active = String(state.sort?.header || '') === String(h || '');
      const arrow = active ? (state.sort.dir === 'desc' ? ' ▼' : ' ▲') : '';
      const thClass = 'sortable';
      html += `<th class="${thClass}" data-sort-index="${idx}" role="button" tabindex="0">${escapeHtml(h)}<span class="sort-arrow">${arrow}</span></th>`;
    });
    html += '</tr></thead><tbody>';

    slice.forEach((row, idx) => {
      const isSelected = selectedRow === row;
      html += `<tr data-index="${idx}" class="${isSelected ? 'selected' : ''}">`;
      const arr = mode === 'raw' ? row.rawRow : row.displayRow;
      arr.forEach((cell, cIdx) => {
        const tdClass = '';
        html += `<td${tdClass}>${renderCell(cell, headers[cIdx], mode)}</td>`;
      });
      html += '</tr>';
    });

    html += '</tbody></table>';
    wrap.innerHTML = html;

    [...wrap.querySelectorAll('tbody tr')].forEach((tr) => {
      tr.addEventListener('click', () => {
        const sel = window.getSelection ? window.getSelection() : null;
        if (sel && sel.toString().length > 0) return;
        const idx = Number(tr.getAttribute('data-index'));
        const row = slice[idx];
        if (!row) return;
        state.selectedRow = row;
        state.selectedIndex = rows.indexOf(row);
        renderDetail(row);
        renderTable(headers, rows, mode);
      });
    });

    [...wrap.querySelectorAll('thead th.sortable')].forEach((th) => {
      const idx = Number(th.getAttribute('data-sort-index'));
      const header = headers[idx];
      const activate = () => {
        if (String(state.sort.header || '') === String(header || '')) {
          state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
        } else {
          state.sort.index = idx;
          state.sort.header = header;
          state.sort.dir = 'desc';
        }
        renderTable(headers, rows, mode);
      };
      th.addEventListener('click', activate);
      th.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
      });
    });

    if (!state.selectedRow && slice.length) state.selectedRow = slice[0];
    el('rowPill').textContent = `${filtered.length} rows`;
  }

  function renderCell(cell, header, mode) {
    if (cell && typeof cell === 'object') {
      if (cell.type === 'html') return cell.html;

      if (cell.type === 'eval') return `<div class="cell-pre one-line" title="${escapeHtml(cell.title || cell.text)}">${escapeHtml(cell.text)}</div>`;
      if (cell.type === 'grade') return `<span class="grade ${escapeHtml(cell.value.replace('+', 'plus'))}" title="${escapeHtml(cell.title || cell.text || cell.value)}">${escapeHtml(cell.value)}</span>`;
      if (cell.type === 'badge') return `<span class="chip">${escapeHtml(cell.text)}</span>`;
      const txt = cell.text ?? cell.value ?? '';
      if (mode === 'processed' && STAT_LABEL_SET.has(String(header || '').trim())) return renderAbilityValue(txt);
      return escapeHtml(txt);
    }
    if (mode === 'processed' && STAT_LABEL_SET.has(String(header || '').trim())) return renderAbilityValue(cell ?? '');
    if (String(header||'').trim()==='포지션') {
      const p=String(cell??'').toUpperCase();
      const att=['ST','CF','LF','RF','LW','RW'];
      const mid=['CAM','CM','CDM','LM','RM','LAM','RAM'];
      const def=['LB','RB','LWB','RWB','CB','SW'];
      let color='#795548';
      if(att.includes(p)) color='#F44336';
      else if(mid.includes(p)) color='#4CAF50';
      else if(def.includes(p)) color='#2196F3';
      return `<span style="color:${color};font-weight:800">${escapeHtml(p)}</span>`;
    }
    return escapeHtml(cell ?? '');
  }

  

  
function renderDetail(row) {
    if (!row) return;
    const box = el('detailBox');
    if (!box) return;

    const grade = String(row.evaluation?.grade || 'C');
    const gradeClass = grade.replace('+', 'plus');
    const position = String(row.position || '-');
    const playerName = String(row.displayName || row.cleanRow?.[0] || '-');
    const ovr = toNumber(row.adjustedRow?.[8] ?? row.cleanRow?.[8]);
    const weakFoot = normalFoot(row.cleanRow?.[3] ?? '-');
    const strongFoot = normalFoot(row.cleanRow?.[4] ?? '-');
    const traitAll = (row.traits || []);
    const traitAllHtml = traitAll.length
      ? traitAll.map((t) => `<span class="chip${t.source === 'trait3' ? ' bold' : ''}${t.name.includes('(미사용)') ? ' unused' : ''}" title="trait_id ${t.id}">${escapeHtml(t.name)}</span>`).join('')
      : '<span class="chip">특성 정보 없음</span>';

    const topEvalLines = [row.evaluation?.summaryCore, row.evaluation?.market, row.evaluation?.invest].filter(Boolean);
    const scoreBands = row.evaluation?.scoreBands || {};
    const bandCards = [
      ['속도', scoreBands.speed],
      ['체감', scoreBands.skill],
      ['슈팅', scoreBands.shooting],
      ['패스', scoreBands.passing],
      ['수비', scoreBands.defense],
      ['GK', scoreBands.gk],
    ];

    const abilityItems = STAT_ORDER.map((s) => {
      const value = row.adjustedRow?.[BASE_HEADERS.indexOf(s.src)] ?? '';
      return `
        <div class="ability-row">
          <div class="ability-label">${escapeHtml(s.label)}</div>
          <div class="ability-value">${renderAbilityValue(value)}</div>
        </div>`;
    });
    const half = Math.ceil(abilityItems.length / 2);
    const abilityGrid = [abilityItems.slice(0, half).join(''), abilityItems.slice(half).join('')].map((chunk) => `<div class="ability-column">${chunk}</div>`).join('');

    const compareHtml = Array.isArray(row.evaluation?.compare) && row.evaluation.compare.length
      ? row.evaluation.compare.map((x) => `<span class="detail-tag">${escapeHtml(x)}</span>`).join('')
      : '<span class="detail-tag">비교 정보 없음</span>';

    const strengthsList = row.evaluation?.strengths || [];
    const weaknessesList = row.evaluation?.weaknesses || [];
    const improvementNotes = row.evaluation?.improvementNotes || [];

    const positionSummary = `
      <div class="detail-section">
        <h3>포지션 요약</h3>
        <div class="detail-note-grid">
          ${bandCards.map(([k, v]) => `<div class="detail-note-card"><div class="k">${escapeHtml(k)}</div><div class="v">${fmt(v ?? 0, 1)}</div></div>`).join('')}
        </div>
        <div class="detail-tag-row" style="margin-top:10px;">${compareHtml}</div>
      </div>`;

    const strengthWeaknessSection = `
      <div class="detail-section">
        <h3>장점 / 단점 상세</h3>
        <div class="detail-note-card" style="background:rgba(127,226,173,.06);">
          <div class="k">장점</div>
          <ul class="detail-bullets">${strengthsList.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
        </div>
        <div class="detail-note-card" style="margin-top:8px;background:rgba(255,143,143,.06);">
          <div class="k">단점</div>
          <ul class="detail-bullets">${weaknessesList.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
        </div>
      </div>`;

    const improvementSection = `
      <div class="detail-section">
        <h3>실사용 개선 포인트</h3>
        <ul class="detail-bullets">${improvementNotes.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
      </div>`;

    box.innerHTML = `
      <div class="detail-shell">
        <div class="detail-top">
          <div class="detail-title-wrap">
            <div class="detail-kicker">선수 정보</div>
            <div class="detail-name-row">
              <div class="detail-name">${escapeHtml(playerName)}</div>
              <div class="detail-head-badges">
                <span class="pill accent">${escapeHtml(position)}</span>
                <span class="pill good detail-ovr-badge">OVR ${ovr !== null ? escapeHtml(String(ovr)) : '-'}</span>
                <span class="pill warn">${escapeHtml(String((row.traits || []).length))} traits</span>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-mini-grid">
          <div class="detail-mini"><div class="k">주발</div><div class="v">${escapeHtml(strongFoot)}</div></div>
          <div class="detail-mini"><div class="k">약발</div><div class="v number">${escapeHtml(String(weakFoot))}</div></div>
          <div class="detail-mini"><div class="k">급여</div><div class="v number">${escapeHtml(String(row.adjustedRow?.[2] ?? row.cleanRow?.[2] ?? '-'))}</div></div>
        </div>

        <div class="detail-eval-card" style="width:100%;">
          <div class="detail-eval-head">
            <span class="grade ${gradeClass}">${escapeHtml(grade)}</span>
            <span class="detail-eval-title">평가 요약</span>
          </div>
          <div class="detail-eval">
            <div class="detail-eval-text">${topEvalLines.length ? topEvalLines.map((line) => `<div>${escapeHtml(line)}</div>`).join('') : '<div>평가 대기</div>'}</div>
          </div>
        </div>

        <div class="detail-panel">
          <div class="detail-section">
            <h3>능력치</h3>
            <div class="detail-ability-grid">${abilityGrid}</div>
          </div>

          <div class="detail-section">
            <h3>특성</h3>
            <div class="detail-chip-grid">${traitAllHtml}</div>
          </div>

          ${positionSummary}
          ${improvementSection}
          ${strengthWeaknessSection}
        </div>
      </div>
    `;

    el('detailPill').textContent = row.evaluation?.roleLabel || '대기';
  }

  function renderSummaryTab() {

    const wrap = el('tableWrap');
    const summary = state.summary;
    if (!summary) {
      wrap.innerHTML = '<div class="empty">요약이 없습니다.</div>';
      return;
    }
    const stars = (value) => '★★★★★☆☆☆☆☆'.slice(5 - Math.round(value), 10 - Math.round(value));
    wrap.innerHTML = `
      <div style="padding:16px;display:grid;gap:14px;min-width:0;">
        <div class="card" style="box-shadow:none;">
          <div class="head" style="padding:12px 14px;">
            <h2>클래스 총평</h2>
            <span class="pill accent">전체 클래스 기준</span>
          </div>
          <div class="body" style="display:grid;gap:8px;">
            <div class="summary-note">${escapeHtml(summary.metaText)}</div>
            <div class="summary-note">${escapeHtml(summary.marketText)}</div>
            <div class="summary-note">${escapeHtml(summary.investText)}</div>
            <div class="summary-note">커뮤니티 반응: ${escapeHtml(summary.community)}</div>
            <div class="summary-note">비교 기준: ${escapeHtml(summary.altCompare)}</div>
          </div>
        </div>
        <div class="stat-grid" style="grid-template-columns:repeat(4,minmax(0,1fr));">
          <div class="stat"><div class="k">메타 적합도</div><div class="v">${summary.avgScore >= 95 ? '★★★★★' : summary.avgScore >= 92 ? '★★★★☆' : summary.avgScore >= 88 ? '★★★☆☆' : '★★☆☆☆'}</div><div class="s">${escapeHtml(summary.metaText)}</div></div>
          <div class="stat"><div class="k">시장 영향도</div><div class="v">${summary.avgScore >= 95 ? '★★★★★' : summary.avgScore >= 92 ? '★★★★☆' : summary.avgScore >= 88 ? '★★★☆☆' : '★★☆☆☆'}</div><div class="s">${escapeHtml(summary.marketText)}</div></div>
          <div class="stat"><div class="k">투자 가치</div><div class="v">${summary.sPlusRate >= 40 ? '★★★★★' : summary.sPlusRate >= 20 ? '★★★★☆' : '★★★☆☆'}</div><div class="s">${escapeHtml(summary.investText)}</div></div>
          <div class="stat"><div class="k">클래스 반응</div><div class="v">${summary.avgScore >= 95 ? '강세' : summary.avgScore >= 90 ? '혼조' : '보수적'}</div><div class="s">${escapeHtml(summary.community)}</div></div>
        </div>
        <div class="card" style="box-shadow:none;">
          <div class="head"><h2>상위 특성</h2><span class="pill accent">${summary.totalTrait} traits</span></div>
          <div class="body">
            <div class="legend-chips">${summary.topTraits.length ? summary.topTraits.map(([name, count]) => `<span class="chip bold">${escapeHtml(name)} · ${count}</span>`).join('') : '<span class="chip">없음</span>'}</div>
          </div>
        </div>
        <div class="card" style="box-shadow:none;">
          <div class="head"><h2>등급 분포</h2><span class="pill">S+ ${fmt(summary.sPlusRate,1)}%</span></div>
          <div class="body" style="display:grid;gap:8px;">
            ${Object.entries(summary.grades).map(([k, v]) => {
              const pct = summary.rows ? (v / summary.rows) * 100 : 0;
              return `<div>
                <div style="display:flex;justify-content:space-between;gap:10px;font-size:12px;margin-bottom:6px;"><strong>${k}</strong><span>${v} (${pct.toFixed(1)}%)</span></div>
                <div class="progress"><div style="width:${pct}%;"></div></div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function applyMode() {
    el('modePill').textContent = state.mode === 'processed' ? '가공 결과 보기' : state.mode === 'raw' ? '원본 매핑 보기' : '클래스 총평';
    if (el('tabProcessed')) el('tabProcessed').classList.toggle('active', state.mode === 'processed');
    if (el('tabRaw')) el('tabRaw').classList.toggle('active', state.mode === 'raw');
    if (el('tabSummary')) el('tabSummary').classList.toggle('active', state.mode === 'summary');
    if (state.mode === 'processed') {
      renderTable(state.displayHeaders, state.filteredRows, 'processed');
    } else if (state.mode === 'raw') {
      renderTable(state.rawHeaders, state.filteredRows, 'raw');
    } else {
      renderSummaryTab();
    }
  }

  function downloadCsv() {
    const rows = state.mode === 'raw' ? state.filteredRows.map((r) => r.rawRow) : state.filteredRows.map((r) => r.csvRow);
    const headers = state.mode === 'raw' ? state.rawHeaders : state.displayHeaders;
    const csv = '\ufeff' + [headers, ...rows].map((row) => row.map((cell) => toCsvCell(cell)).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.fileName ? state.fileName.replace(/\.[^.]+$/, '') : 'class_daejang'}_${state.mode}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function refreshFiltered() {
    const query = (el('search').value || '').trim().toLowerCase();
    let rows = state.rows.slice();
    if (query) rows = rows.filter((r) => r.searchBlob.includes(query));
    state.filteredRows = rows;
    if (state.mode === 'summary') {
      applyMode();
    } else if (state.mode === 'raw') {
      renderTable(state.rawHeaders, state.filteredRows, 'raw');
    } else {
      renderTable(state.displayHeaders, state.filteredRows, 'processed');
    }
    const fallback = state.filteredRows[0] || null;
    if (!state.selectedRow || !state.filteredRows.includes(state.selectedRow)) {
      state.selectedRow = fallback;
      state.selectedIndex = fallback ? state.filteredRows.indexOf(fallback) : -1;
      if (fallback) renderDetail(fallback);
    }
  }

  function setMode(mode) {
    state.mode = mode;
    el('tabProcessed').classList.toggle('active', mode === 'processed');
    el('tabRaw').classList.toggle('active', mode === 'raw');
    el('tabSummary').classList.toggle('active', mode === 'summary');
    applyMode();
  }

  function processRows(rows2d, controls = getUIControls()) {
    if (!rows2d || !rows2d.length) throw new Error('시트를 읽지 못했습니다.');
    const rawHeaders = BASE_HEADERS.slice();
    const displayHeaders = DISPLAY_HEADERS.slice();
    const out = [];
    const traitCounter = new Map();
    const gradeCounter = { 'S+': 0, 'S': 0, 'A+': 0, 'A': 0, 'B': 0, 'C': 0 };
    let sumOvr = 0;
    let countOvr = 0;
    const totalBonus = totalAbilityBonus(controls);

    for (let r = 1; r < rows2d.length; r++) {
      const rawRow = rows2d[r] || [];
      const mapped = mapSourceRow(rawRow);
      const cleanRow = mapped.slice();
      cleanRow[4] = normalFoot(cleanRow[4]);
      for (let i = 8; i < cleanRow.length; i++) {
        cleanRow[i] = addPlus3(cleanRow[i]);
      }

      const adjustedRow = cleanRow.slice();
      for (let i = 8; i < adjustedRow.length; i++) {
        if (isNumeric(adjustedRow[i])) adjustedRow[i] = Number(adjustedRow[i]) + totalBonus;
      }

      const traits = decodeTraits(cleanRow);
      const trait3Traits = traits.filter((t) => t.source === 'trait3');
      const traitHtml = renderTraitChips(trait3Traits);
      const traitText = traits.length ? traits.map((t) => t.name).join(' / ') : '-';
      const trait3Text = trait3Traits.length ? trait3Traits.map((t) => t.name).join(' / ') : (traits[0]?.name || '-');
      const position = String(adjustedRow[adjustedRow.length - 1] ?? '').trim();
      const ovr = toNumber(adjustedRow[8]);
      const evaluation = evaluateRow(adjustedRow, traits);
      const playerName = fullPlayerName(adjustedRow);

      gradeCounter[evaluation.grade] = (gradeCounter[evaluation.grade] || 0) + 1;
      if (ovr !== null) {
        sumOvr += ovr;
        countOvr += 1;
      }

      traits.forEach((t) => {
        traitCounter.set(t.name, (traitCounter.get(t.name) || 0) + 1);
      });

      const statValues = Object.fromEntries(STAT_ORDER.map((s) => [s.label, adjustedRow[BASE_HEADERS.indexOf(s.src)] ?? '']));
      const displayRow = [
        position,
        playerName,
        adjustedRow[2],
        normalFoot(adjustedRow[4]),
        adjustedRow[3],
        { type: 'html', html: `<div class="trait-inline">${traitHtml}</div>` },
        adjustedRow[8],
        ...STAT_ORDER.map((s) => statValues[s.label]),
        { type: 'grade', value: evaluation.grade, title: evaluation.body, text: evaluation.summaryCore }
      ];

      const csvRow = [
        position, playerName, adjustedRow[2], normalFoot(adjustedRow[4]), adjustedRow[3], trait3Text,
        ...STAT_ORDER.map((s) => statValues[s.label]),
        evaluation.body
      ];

      const searchBlob = [
        playerName,
        adjustedRow.join(' '),
        position,
        traitText,
        normalFoot(adjustedRow[4]),
        String(adjustedRow[3] ?? ''),
        evaluation.body,
        evaluation.grade,
        evaluation.roleLabel,
        evaluation.compare.join(' '),
      ].join(' ').toLowerCase();

      out.push({
        rawRow: mapped,
        cleanRow,
        adjustedRow,
        displayRow,
        csvRow,
        traits,
        traitText,
        trait3Text,
        traitHtml,
        position,
        evaluation,
        displayName: playerName,
        searchBlob,
      });
    }

    if (out.length) {
      const ranked = out.slice().sort((a, b) => b.evaluation.composite - a.evaluation.composite);
      const denom = Math.max(1, ranked.length - 1);
      ranked.forEach((row, idx) => {
        const pct = 1 - (idx / denom);
        const grade = gradeFromRelativePercentile(pct);
        row.evaluation.grade = grade;
        row.evaluation.body = row.evaluation.body.replace(/^\[[^\]]+\]/, `[${row.evaluation.roleLabel} 기준 ${grade}]`);
        row.evaluation.summary = `${grade} · ${row.evaluation.summaryCore}`;
        row.displayRow[row.displayRow.length - 1] = { type: 'grade', value: row.evaluation.grade, title: row.evaluation.body, text: row.evaluation.summaryCore };
        row.csvRow[row.csvRow.length - 1] = row.evaluation.body;
      });
    }

    const summary = buildSheetSummary(out);
    const topTraits = [...traitCounter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    summary.topTraits = topTraits;
    summary.avgOvr = countOvr ? sumOvr / countOvr : 0;
    summary.avg8 = countOvr ? (sumOvr / countOvr) + 15 : 0;
    summary.avg11 = countOvr ? (sumOvr / countOvr) + 21 : 0;
    summary.rows = out.length;
    summary.gradeCounts = gradeCounter;

    return { rawHeaders, displayHeaders, rows: out, summary };
  }


  function showSheet(sheetName) {
    state.activeSheet = sheetName;
    const rows2d = state.sheets[sheetName];
    state.activeRows2d = rows2d;
    if (!rows2d || rows2d.length < 2) throw new Error('시트 데이터가 충분하지 않습니다.');

    const cacheKey = `${sheetName}|${state.controls.enhance}|${state.controls.adapt}|${state.controls.teamColor}`;
    const cached = state.processedCache[cacheKey];
    const processed = cached || processRows(rows2d, state.controls);
    state.processedCache[cacheKey] = processed;

    state.rawHeaders = processed.rawHeaders;
    state.displayHeaders = processed.displayHeaders;
    state.rows = processed.rows;
    const ovrHeaderIndex = processed.displayHeaders.indexOf('오버롤');
    if (ovrHeaderIndex >= 0) {
      state.sort = { index: ovrHeaderIndex, dir: 'desc', header: '오버롤' };
    }
    state.summary = processed.summary;
    state.selectedIndex = processed.rows.length ? 0 : -1;
    state.selectedRow = processed.rows.length ? processed.rows[0] : null;
    state.filteredRows = processed.rows;

    setText('sheetTitle', sheetName);
    setText('sheetStat', `${rows2d.length - 1}행 / ${processed.rawHeaders.length}열`);
    setText('loadedPill', '파일 로드됨');
    el('loadedPill').style.display = 'inline-flex';
    setText('avgPill', `OVR ${fmt(state.summary.avgOvr, 1)}`);
    setText('detailPill', `${sheetName} · ${Math.max(0, (rows2d.length || 0) - 1)}명`);
    renderLegend();
    renderSummary(state.summary);
    renderDetail(state.filteredRows[0]);
    applyMode();
    setText('status', '완료');
  }

  async function handleFile(file) {
    if (!file) return;
    state.fileName = file.name;
    setText('fileName', file.name);
    setText('status', '읽는 중...');
    el('enginePill').textContent = '엑셀 파서 가동 중';
    el('tableWrap').innerHTML = '<div class="empty">파일을 처리하는 중입니다...</div>';
    state.processedCache = {};
    try {
      await loadPlayerNameMap();
      const ab = await file.arrayBuffer();
      const zip = await readZip(ab);
      const workbookXml = await parseXml(new TextDecoder('utf-8').decode(zip['xl/workbook.xml']));
      const relsXml = await parseXml(new TextDecoder('utf-8').decode(zip['xl/_rels/workbook.xml.rels']));
      const sharedStrings = zip['xl/sharedStrings.xml']
        ? [...(await parseXml(new TextDecoder('utf-8').decode(zip['xl/sharedStrings.xml']))).getElementsByTagName('si')].map((si) => si.textContent || '')
        : [];

      const relMap = {};
      [...relsXml.getElementsByTagName('Relationship')].forEach((r) => {
        relMap[r.getAttribute('Id')] = r.getAttribute('Target');
      });

      const sheetNodes = [...workbookXml.getElementsByTagName('sheet')];
      const sheets = {};
      const classStats = {};
      for (const s of sheetNodes) {
        const name = s.getAttribute('name') || 'Sheet';
        const rid = s.getAttribute('r:id') || s.getAttribute('id');
        const target = relMap[rid];
        if (!target) continue;
        const path = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`;
        if (!zip[path]) continue;
        try {
          const xml = await parseXml(new TextDecoder('utf-8').decode(zip[path]));
          const rows2d = rawSheetToRows(xml, sharedStrings);
          const maxCols = rows2d.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0);
          const nonEmptyRows = rows2d.reduce((acc, row, idx) => {
            if (idx === 0 || !Array.isArray(row)) return acc;
            return acc + (row.some((cell) => String(cell ?? '').trim() !== '') ? 1 : 0);
          }, 0);
          const looksLikeData = rows2d.length >= 2 && maxCols >= 40 && nonEmptyRows > 0;
          if (!looksLikeData) continue;
          sheets[name] = rows2d;
          classStats[name] = { players: Math.max(0, rows2d.length - 1), cols: maxCols };
        } catch (sheetErr) {
          console.warn(`시트 처리 실패: ${name}`, sheetErr);
        }
      }

      const sheetNames = Object.keys(sheets);
      if (!sheetNames.length) throw new Error('데이터 시트를 찾지 못했습니다.');

      state.sheets = sheets;
      state.sheetNames = sheetNames;
      state.classStats = classStats;
      state.reference.pool = sheetNames.slice();
      state.reference.detectedPool = sheetNames.slice();
      renderLegend();

      const preferred = state.activeSheet && sheetNames.includes(state.activeSheet)
        ? state.activeSheet
        : sheetNames[0];
      showSheet(preferred);
      setText('status', '완료');
      el('enginePill').textContent = '오프라인 HTML / 공식 선수명';
      el('enginePill').className = 'pill accent';
    } catch (err) {
      console.error(err);
      setText('status', `실패: ${err?.message || '알 수 없는 오류'}`);
      el('tableWrap').innerHTML = `<div class="empty">엑셀 처리를 실패했습니다.<br>${escapeHtml(err?.message || '알 수 없는 오류')}</div>`;
      el('enginePill').textContent = '오류';
      el('enginePill').className = 'pill';
    }
  }

  function renderSheetSwitcher() {
    renderLegend();
  }

  function initLegend() {
    renderLegend();
  }

  function initEvents() {
    const fileInput = el('file');
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
      e.target.value = '';
      await handleFile(file);
    });

    el('search').addEventListener('input', () => refreshFiltered());
    el('downloadBtn').addEventListener('click', () => downloadCsv());
    const refreshBtn = el('refreshRefsBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', async () => { await refreshLiveReferencePack(); });
    ['enhanceSelect', 'adaptSelect', 'teamColorSelect'].forEach((id) => {
      const node = el(id);
      if (!node) return;
      node.addEventListener('change', () => {
        state.controls = getUIControls();
        if (state.activeSheet) showSheet(state.activeSheet);
      });
    });

    el('tabProcessed').addEventListener('click', () => setMode('processed'));
    el('tabRaw').addEventListener('click', () => setMode('raw'));
    el('tabSummary').addEventListener('click', () => setMode('summary'));
  }

  function boot() {
    initLegend();
    initEvents();
    setText('status', '대기 중');
    setText('sheetTitle', '-');
    setText('sheetStat', '-');
    setText('rowPill', '0 rows');
    setText('avgPill', 'OVR -');
    state.reference.pool = [];
    state.reference.detectedPool = [];
    state.controls = getUIControls();
    loadPlayerNameMap();
    const e = el('enhanceSelect'); if (e) e.value = '1';
    const a = el('adaptSelect'); if (a) a.value = '1';
    const t = el('teamColorSelect'); if (t) t.value = '0';
    state.controls = getUIControls();
    renderLegend();
  }

  boot();
})();
