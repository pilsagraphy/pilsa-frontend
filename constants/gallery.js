// 활동 사진 갤러리 — 학기별 구역(GALLERY_SECTIONS) 으로 묶는다 (PM 2026-10-10 밤: 학기별로 보고 드롭다운으로 건너뛰기).
// 구역의 semester 가 그 사진들의 학기다. 화면은 학기 순(최근 먼저)으로 이어 붙이고, 구역 안 순서 = 배열 순서.
// 사진마다 제목·해시태그를 적어두면 호버(모바일은 꾹 누르기)와 크게 보기 화면 아래 띠에 노출된다.
// ratio 는 사진의 가로÷세로 — 한 줄에 몇 장을 넣을지, 줄 높이를 얼마로 할지 이 값으로 정한다.
// ※ 학기는 사진 묶음 공유일(2026-09-08)과 해시태그로 추정해 전부 2026-1학기로 두었다 — 틀린 구역은 semester 만 고치면 된다.
export const GALLERY_SECTIONS = [
  {
    semester: "2026-1학기",
    title: "동아리 박람회",
    photos: [
      {
        imageSrc: "/images/gallery/gallery_1.webp",
        ratio: 1.0,
        title: "필사그래피 동아리 박람회",
        hashtags: ["#새학기", "#새내기_환영", "#2026"],
      },
    ],
  },
  {
    semester: "2026-1학기",
    title: "필사인의 밤",
    photos: [
      {
        imageSrc: "/images/gallery/KakaoTalk_20260908_171009496_22.webp",
        ratio: 1.77,
        title: "필사인의 밤",
        hashtags: ["#함께한_밤"],
      },
      {
        imageSrc: "/images/gallery/KakaoTalk_20260908_171009496_00.webp",
        ratio: 1.77,
        title: "필사인의 밤",
        hashtags: ["#함께한_밤"],
      },
      {
        imageSrc: "/images/gallery/KakaoTalk_20260908_171009496_23.webp",
        ratio: 1.78,
        title: "필사인의 밤",
        hashtags: ["#함께한_밤"],
      },
      {
        imageSrc: "/images/gallery/KakaoTalk_20260908_171009496_24.webp",
        ratio: 1.77,
        title: "필사인의 밤",
        hashtags: ["#함께한_밤"],
      },
    ],
  },
  {
    semester: "2026-1학기",
    title: "사막",
    photos: [
      {
        imageSrc: "/images/gallery/gallery_2.webp",
        ratio: 1.33,
        title: "필사그래피 사막",
        hashtags: ["#사색의광장", "#막걸리", "#2026"],
        // 세로 크롭 위치 (인물 얼굴이 잘리지 않도록 아래쪽 위주)
        objectPosition: "center 60%",
      },
      {
        imageSrc: "/images/gallery/KakaoTalk_20260908_171009496_04.webp",
        ratio: 1.33,
        title: "필사그래피 사막",
        hashtags: ["#사색의광장", "#힐링"],
      },
      {
        imageSrc: "/images/gallery/KakaoTalk_20260908_171009496_05.webp",
        ratio: 1.33,
        title: "필사그래피 사막",
        hashtags: ["#막걸리", "#낭만"],
      },
    ],
  },
  {
    semester: "2026-1학기",
    title: "제작 스터디",
    photos: [
      {
        imageSrc: "/images/gallery/gallery_3.webp",
        ratio: 1.33,
        title: "필사그래피 활동",
        hashtags: ["#제작스터디", "#나만의_작품"],
      },
    ],
  },
  {
    semester: "2026-1학기",
    title: "정기모임 · 강사님 초청",
    photos: [
      {
        imageSrc: "/images/gallery/KakaoTalk_20260908_171009496_19.webp",
        ratio: 1.78,
        title: "필사그래피 활동",
        hashtags: ["#정기모임", "#특별_강연", "#배움"],
      },
    ],
  },
  {
    semester: "2026-1학기",
    title: "필사필연",
    photos: [
      {
        imageSrc: "/images/gallery/KakaoTalk_20260908_171009496_01.webp",
        ratio: 0.75,
        title: "필사필연",
        hashtags: ["#운명적_만남"],
      },
      {
        imageSrc: "/images/gallery/KakaoTalk_20260908_171009496_06.webp",
        ratio: 1.33,
        title: "필사필연",
        hashtags: ["#필사로_잇다"],
      },
      {
        imageSrc: "/images/gallery/KakaoTalk_20260908_171009496_07.webp",
        ratio: 1.33,
        title: "필사필연",
        hashtags: ["#특별한_인연"],
      },
    ],
  },
  {
    semester: "2026-1학기",
    title: "축제",
    photos: [
      {
        imageSrc: "/images/gallery/gallery_4.webp",
        ratio: 0.75,
        title: "필사그래피 축제",
        hashtags: ["#수공예", "#뜨개인형"],
      },
      {
        imageSrc: "/images/gallery/gallery_5.webp",
        ratio: 0.75,
        title: "필사그래피 축제",
        hashtags: ["#수공예", "#책갈피"],
      },
      {
        imageSrc: "/images/gallery/gallery_6.webp",
        ratio: 1.33,
        title: "필사그래피 축제",
        hashtags: ["#부스_운영", "#즐거운_교류"],
      },
    ],
  },
  {
    semester: "2026-1학기",
    title: "MT",
    photos: [
      {
        imageSrc: "/images/gallery/gallery_7.webp",
        ratio: 1.33,
        title: "필사그래피 MT",
        hashtags: ["#팀_레크레이션"],
      },
      {
        imageSrc: "/images/gallery/gallery_8.webp",
        ratio: 1.33,
        title: "필사그래피 MT",
        hashtags: ["#즐거운_추억"],
      },
      {
        imageSrc: "/images/gallery/gallery_9.webp",
        ratio: 0.75,
        title: "필사그래피 MT",
        hashtags: ["#빛나는_추억"],
      },
      {
        imageSrc: "/images/gallery/gallery_10.webp",
        ratio: 0.75,
        title: "필사그래피 MT",
        hashtags: ["#달콤한_추억"],
      },
      {
        imageSrc: "/images/gallery/gallery_11.webp",
        ratio: 1.33,
        title: "필사그래피 MT",
        hashtags: ["#함께한_추억"],
      },
      {
        imageSrc: "/images/gallery/KakaoTalk_20260908_171009496_08.webp",
        ratio: 0.75,
        title: "필사그래피 MT",
        hashtags: ["#밤샘_수다"],
      },
      {
        imageSrc: "/images/gallery/KakaoTalk_20260908_171009496_09.webp",
        ratio: 1.33,
        title: "필사그래피 MT",
        hashtags: ["#추억_한스푼"],
      },
      {
        imageSrc: "/images/gallery/KakaoTalk_20260908_171009496_10.webp",
        ratio: 1.33,
        title: "필사그래피 MT",
        hashtags: ["#단합"],
      },
      {
        imageSrc: "/images/gallery/KakaoTalk_20260908_171009496_13.webp",
        ratio: 0.75,
        title: "필사그래피 MT",
        hashtags: ["#웃음_가득"],
      },
      {
        imageSrc: "/images/gallery/KakaoTalk_20260908_171009496_14.webp",
        ratio: 0.75,
        title: "필사그래피 MT",
        hashtags: ["#소중한_시간"],
      },
      {
        imageSrc: "/images/gallery/KakaoTalk_20260908_171009496_27.webp",
        ratio: 0.75,
        title: "필사그래피 MT",
        hashtags: ["#다음에_또"],
      },
    ],
  },
  {
    semester: "2026-1학기",
    title: "기타",
    photos: [
      {
        imageSrc: "/images/gallery/KakaoTalk_20260908_171009496_18.webp",
        ratio: 0.75,
        title: "필사그래피 일상",
        hashtags: ["#동아리방"],
      },
      {
        imageSrc: "/images/gallery/KakaoTalk_20260908_171009496_25.webp",
        ratio: 1.33,
        title: "필사그래피 일상",
        hashtags: ["#함께라서"],
      },
      {
        imageSrc: "/images/gallery/KakaoTalk_20260908_171009496_26.webp",
        ratio: 0.75,
        title: "필사그래피 일상",
        hashtags: ["#순간_포착"],
        // 마지막 이미지 크롭 위치
        objectPosition: "center 40%",
      },
    ],
  },
];

// 학기(최근 먼저) → 구역 순으로 편 사진 목록. 크게 보기(라이트박스)의 앞·뒤 넘기기 순서가 이것이다
export const GALLERY_PHOTOS = GALLERY_SECTIONS.flatMap((section) =>
  section.photos.map((photo) => ({
    ...photo,
    semester: section.semester,
    sectionTitle: section.title,
  })),
);
