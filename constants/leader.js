export const DUMMY_LEADER = [
  {
    order: '초대 회장',
    name: '박건희',
    period: '(2021~2022)',
    imageSrc: '/images/leader/leader_1.png',
  },
  {
    order: '2대 회장',
    name: '김선하',
    period: '(2023~2023)',
    imageSrc: '/images/leader/leader_2.jpeg',
  },
  {
    order: '3대 회장',
    name: '박경빈',
    period: '(2024~2024)',
    imageSrc: '/images/leader/leader_3.jpeg',
  },
  {
    order: '4대 회장',
    name: '가성연',
    period: '(2025~2025)',
    imageSrc: '/images/leader/leader_4.jpeg',
  },
  {
    order: '5대 회장',
    name: '최재연',
    period: '(2026~현재)',
    imageSrc: '/images/leader/leader_5.png',
    // 재임 중 임원진 — 학기별. 조직도(constants/organization.js)와 같은 모양이고, 명단은 그 파일의 이력에서 (PM, 2026-09-21).
    // 카드의 '임원진 보기' 버튼을 누르면 팝업으로 보여 준다
    officers: [
      {
        term: '2026-1학기',
        chairman: {
          title: '회장단',
          leader: '최재연',
          // 직책이 있는 사람은 { name, role } 로 (PM: 최성현 부회장 · 안예지 총무, 2026-09-21)
          members: [
            { name: '최성현', role: '부회장' },
            { name: '안예지', role: '총무' },
          ],
        },
        teams: [
          { title: '제작스터디', leader: '박수민', members: ['최예윤', '유해담'] },
          { title: '정기모임', leader: '한서은', members: ['김서현', '김수현', '최서진', '하종연'] },
          { title: '큐레이션팀', leader: '김서진', members: [] },
        ],
        advisors: ['가성연', '정도이', '김예령'],
      },
      {
        term: '2026-2학기',
        chairman: {
          title: '회장단',
          leader: '최재연',
          // 직책이 있는 사람은 { name, role } 로 (PM: 최성현 부회장 · 안예지 총무, 2026-09-21)
          members: [
            { name: '최성현', role: '부회장' },
            { name: '안예지', role: '총무' },
          ],
        },
        teams: [
          { title: '제작스터디', leader: '박수민', members: ['김아란', '남가현', '박시현', '유해담', '최보은', '최예윤'] },
          { title: '정기모임', leader: '한서은', members: ['김서현', '김성은', '김수현', '이민승', '최서진', '홍준화'] },
          { title: '큐레이션팀', leader: '김서진', members: ['정현준', '하민재'] },
        ],
        advisors: [],
      },
    ],
  },
];
