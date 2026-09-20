// 활동 사진 갤러리 — 배열 순서 = 화면 순서.
// 순서를 바꾸려면 이 배열에서 해당 줄(블록)을 위/아래로 옮기면 된다.
// 사진마다 제목·해시태그를 적어두면 갤러리에서 호버(모바일은 탭) 시 노출된다.
// shape 는 사진의 방향(wide·landscape·portrait·square)으로, 격자에서 몇 칸을 차지할지 정한다.
// 사진을 바꾸면 이 값도 맞춘다 (가로가 세로의 1.6배 넘으면 wide, 1.1배 넘으면 landscape, 0.9배 아래면 portrait).
// (제목/태그는 초안이니 자유롭게 수정하세요.)
export const GALLERY_PHOTOS = [
  // ── 동아리 박람회 ──
  {
    imageSrc: '/images/gallery/gallery_1.webp',
    shape: 'square',
    title: '필사그래피 동아리 박람회',
    hashtags: ['#새학기', '#새내기_환영', '#2026'],
  },

  // ── 필사인의 밤 (첫줄 2·3번째 이미지 자리 바꿈 / 해시태그 #함께한_밤으로 통일) ──
  {
    imageSrc: '/images/gallery/KakaoTalk_20260908_171009496_22.webp',
    shape: 'wide',
    title: '필사인의 밤',
    hashtags: ['#함께한_밤'],
  },
  {
    imageSrc: '/images/gallery/KakaoTalk_20260908_171009496_00.webp',
    shape: 'wide',
    title: '필사인의 밤',
    hashtags: ['#함께한_밤'],
  },
  {
    imageSrc: '/images/gallery/KakaoTalk_20260908_171009496_23.webp',
    shape: 'wide',
    title: '필사인의 밤',
    hashtags: ['#함께한_밤'],
  },
  {
    imageSrc: '/images/gallery/KakaoTalk_20260908_171009496_24.webp',
    shape: 'wide',
    title: '필사인의 밤',
    hashtags: ['#함께한_밤'],
  },

  // ── 사막 ──
  {
    imageSrc: '/images/gallery/gallery_2.webp',
    shape: 'landscape',
    title: '필사그래피 사막',
    hashtags: ['#사색의광장', '#막걸리', '#2026'],
    // 세로 크롭 위치 (인물 얼굴이 잘리지 않도록 아래쪽 위주)
    objectPosition: 'center 60%',
  },
  {
    imageSrc: '/images/gallery/KakaoTalk_20260908_171009496_04.webp',
    shape: 'landscape',
    title: '필사그래피 사막',
    hashtags: ['#사색의광장', '#힐링'],
  },
  {
    imageSrc: '/images/gallery/KakaoTalk_20260908_171009496_05.webp',
    shape: 'landscape',
    title: '필사그래피 사막',
    hashtags: ['#막걸리', '#낭만'],
  },

  // ── 제작 스터디 ──
  {
    imageSrc: '/images/gallery/gallery_3.webp',
    shape: 'landscape',
    title: '필사그래피 활동',
    hashtags: ['#제작스터디', '#나만의_작품'],
  },

  // ── 정기모임 · 강사님 초청 (제목 → 필사그래피 활동, #정기모임 추가) ──
  {
    imageSrc: '/images/gallery/KakaoTalk_20260908_171009496_19.webp',
    shape: 'wide',
    title: '필사그래피 활동',
    hashtags: ['#정기모임', '#특별_강연', '#배움'],
  },

  // ── 필사필연 ──
  {
    imageSrc: '/images/gallery/KakaoTalk_20260908_171009496_01.webp',
    shape: 'portrait',
    title: '필사필연',
    hashtags: ['#운명적_만남'],
  },
  {
    imageSrc: '/images/gallery/KakaoTalk_20260908_171009496_06.webp',
    shape: 'landscape',
    title: '필사필연',
    hashtags: ['#필사로_잇다'],
  },
  {
    imageSrc: '/images/gallery/KakaoTalk_20260908_171009496_07.webp',
    shape: 'landscape',
    title: '필사필연',
    hashtags: ['#특별한_인연'],
  },

  // ── 축제 ──
  {
    imageSrc: '/images/gallery/gallery_4.webp',
    shape: 'portrait',
    title: '필사그래피 축제',
    hashtags: ['#수공예', '#뜨개인형'],
  },
  {
    imageSrc: '/images/gallery/gallery_5.webp',
    shape: 'portrait',
    title: '필사그래피 축제',
    hashtags: ['#수공예', '#책갈피'],
  },
  {
    imageSrc: '/images/gallery/gallery_6.webp',
    shape: 'landscape',
    title: '필사그래피 축제',
    hashtags: ['#부스_운영', '#즐거운_교류'],
  },

  // ── MT ──
  {
    imageSrc: '/images/gallery/gallery_7.webp',
    shape: 'landscape',
    title: '필사그래피 MT',
    hashtags: ['#팀_레크레이션'],
  },
  {
    imageSrc: '/images/gallery/gallery_8.webp',
    shape: 'landscape',
    title: '필사그래피 MT',
    hashtags: ['#즐거운_추억'],
  },
  {
    imageSrc: '/images/gallery/gallery_9.webp',
    shape: 'portrait',
    title: '필사그래피 MT',
    hashtags: ['#빛나는_추억'],
  },
  {
    imageSrc: '/images/gallery/gallery_10.webp',
    shape: 'portrait',
    title: '필사그래피 MT',
    hashtags: ['#달콤한_추억'],
  },
  {
    imageSrc: '/images/gallery/gallery_11.webp',
    shape: 'landscape',
    title: '필사그래피 MT',
    hashtags: ['#함께한_추억'],
  },
  {
    imageSrc: '/images/gallery/KakaoTalk_20260908_171009496_08.webp',
    shape: 'portrait',
    title: '필사그래피 MT',
    hashtags: ['#밤샘_수다'],
  },
  {
    imageSrc: '/images/gallery/KakaoTalk_20260908_171009496_09.webp',
    shape: 'landscape',
    title: '필사그래피 MT',
    hashtags: ['#추억_한스푼'],
  },
  {
    imageSrc: '/images/gallery/KakaoTalk_20260908_171009496_10.webp',
    shape: 'landscape',
    title: '필사그래피 MT',
    hashtags: ['#단합'],
  },
  {
    imageSrc: '/images/gallery/KakaoTalk_20260908_171009496_13.webp',
    shape: 'portrait',
    title: '필사그래피 MT',
    hashtags: ['#웃음_가득'],
  },
  {
    imageSrc: '/images/gallery/KakaoTalk_20260908_171009496_14.webp',
    shape: 'portrait',
    title: '필사그래피 MT',
    hashtags: ['#소중한_시간'],
  },
  {
    imageSrc: '/images/gallery/KakaoTalk_20260908_171009496_27.webp',
    shape: 'portrait',
    title: '필사그래피 MT',
    hashtags: ['#다음에_또'],
  },

  // ── 기타 (맨 마지막) ──
  {
    imageSrc: '/images/gallery/KakaoTalk_20260908_171009496_18.webp',
    shape: 'portrait',
    title: '필사그래피 일상',
    hashtags: ['#동아리방'],
  },
  {
    imageSrc: '/images/gallery/KakaoTalk_20260908_171009496_25.webp',
    shape: 'landscape',
    title: '필사그래피 일상',
    hashtags: ['#함께라서'],
  },
  {
    imageSrc: '/images/gallery/KakaoTalk_20260908_171009496_26.webp',
    shape: 'portrait',
    title: '필사그래피 일상',
    hashtags: ['#순간_포착'],
    // 마지막 이미지 크롭 위치
    objectPosition: 'center 40%',
  },
];
