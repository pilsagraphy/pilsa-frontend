// 연혁. 항목은 문자열이거나 { text, video?, link?, images? } (ActivityItem 참고).
// 영상이 있는 항목은 그 해의 맨 마지막에 둔다 — 글 목록 아래에 영상이 오는 편이 보기 좋다 (PM, 2026-09-24)
export const DUMMY_HISTORY = [
  {
    year: "2021",
    activities: ["필사그래피 창립", "학생회관 614호 동아리방 수령"],
  },
  {
    year: "2022",
    activities: [
      "특별지원금 대상 선정",
      // 평화의 전당 그림 — 정사각형 원본을 16:9 로 자르되 아래쪽을 살리고(위쪽 하늘을 버림) 밝기를 올렸다. 서버 public/history
      {
        text: "삼성 갤럭시 캠퍼스 큐레이터 공모전 당선 (상금 500만원)",
        images: [{ src: "/history/peace-hall.jpg", alt: "삼성 갤럭시 캠퍼스 큐레이터 공모전 — 평화의 전당", wide: true }],
      },
    ],
  },
  {
    year: "2023",
    activities: [
      "캘리그라피 전문 강사 초청",
      "행정 개편 및 연간 운영 지침 · 인수인계 체계 확립",
      "2학기 우수동아리 선정",
    ],
  },
  {
    year: "2024",
    activities: [
      "회칙 전면 개편",
      // 글 자체가 인스타그램 게시물 바로가기 (PM, 2026-09-24). 공유 토큰(stkn) 은 뺀 정식 주소. 2023 이 아니라 2024 활동
      {
        text: "동아연필 뉴엔 M-10 시리즈 신제품 서포터즈 활동",
        href: "https://www.instagram.com/p/C40NPEIPUha/",
      },
      // 전시 포스터 두 장 — 서버 public/history 에 있다 (PDF 인쇄본을 JPG 로 변환, 레포에는 넣지 않는다)
      {
        text: "정기모임 아스키아트 작품 중앙도서관 전시",
        images: [
          // 흰 바탕에 여백이 많아 옆 포스터보다 작아 보인다 — 살짝 키워 시각적 크기를 맞춘다
          { src: "/history/ascii-art-ink.jpg", alt: "아스키아트 전시 포스터 — 잉크", zoom: 1.3 },
          { src: "/history/ascii-art-year-end.jpg", alt: "아스키아트 전시 포스터 — 2024 필사그래피 연말정산" },
        ],
      },
    ],
  },
  {
    year: "2025",
    activities: [
      "필사그래피 동문회 발족",
      "1학기 우수동아리 선정",
      // 영상 원본은 서버 public/videos 에 있다 — 유튜브 임베드는 로딩이 느려 서버에서 직접 튼다. 아래에 유튜브 바로가기만 남긴다
      {
        // 첫 줄에 사업명을 되풀이하지 않는다 — 둘째 줄 영상 제목에 이미 '동아리야, 멘토링하자!' 가 있다 (PM)
        text: '대학생 멘토링 동아리 지원 사업 선정\n[2025 동아리야, 멘토링하자!] 느루담, 우리의 이야기',
        video: "/videos/neurudam-mentoring.mp4",
        // 영상 한 편이 아니라 필사그래피 유튜브 채널로 보낸다 (PM, 2026-09-24)
        link: { href: "https://www.youtube.com/@pilsagraphy", label: "필사그래피 유튜브에서 보기" },
      },
    ],
  },
  {
    year: "2026",
    activities: [
      "필사그래피 웹사이트 개설",
      "캘리그라피 전문 강사 초청",
      // 영상은 서버 public/videos 에 있다 (77MB 엔딩 크레딧 클립 — 레포에는 넣지 않는다)
      {
        text: "26.08.31. EBS 다큐프라임 '당신의 글씨는 안녕한가요?'",
        video: "/videos/ebs-ending-credit.mp4",
      },
    ],
  },
];
