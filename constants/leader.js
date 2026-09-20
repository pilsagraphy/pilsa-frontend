// 역대 회장. officers 는 재임 중 임원진(학기별) — 카드의 '임원진 보기' 팝업에 쓴다.
//
// 학기 한 칸의 모양:
//   term    '2023-1학기'
//   roles   회장단 직책별 — [{ role: '회장', names: [...] }, { role: '부회장', names: [...] }, ...]
//   teams   팀별 — { title, leader?, members } (leader 가 있으면 '팀장 ○○○ / 팀원 …', 없으면 이름만)
//   advisors 자문
// 2026 명단은 조직도(constants/organization.js) 이력에서, 2021~2024 는 PM 이 기억으로 준 명단(2026-09-21)이라 빈 자리가 있다.
export const DUMMY_LEADER = [
  {
    order: '초대 회장',
    name: '박건희',
    period: '(2021~2022)',
    imageSrc: '/images/leader/leader_1.png',
    officers: [
      {
        term: '2021-1학기',
        roles: [
          { role: '회장', names: ['박건희'] },
          { role: '부회장', names: ['김선하'] },
        ],
        teams: [],
        advisors: [],
      },
      {
        term: '2022-1학기',
        roles: [
          { role: '회장', names: ['박건희'] },
          { role: '부회장', names: ['김선하'] },
          { role: '총무', names: ['송월심'] },
        ],
        teams: [{ title: '제작스터디', members: ['김효림'] }],
        advisors: [],
      },
      {
        term: '2022-2학기',
        roles: [
          { role: '회장', names: ['박건희'] },
          { role: '부회장', names: ['김선하'] },
          { role: '총무', names: ['송월심'] },
        ],
        teams: [{ title: '제작스터디', members: ['김효림', '김준희', '채수빈'] }],
        advisors: [],
      },
    ],
  },
  {
    order: '2대 회장',
    name: '김선하',
    period: '(2023~2023)',
    imageSrc: '/images/leader/leader_2.jpeg',
    officers: [
      {
        term: '2023-1학기',
        roles: [
          { role: '회장', names: ['김선하'] },
          { role: '부회장', names: ['양예령'] },
          { role: '총무', names: ['송월심'] },
        ],
        teams: [
          { title: '정기모임', members: ['박건희'] },
          { title: '제작스터디', members: ['김효림', '김준희'] },
        ],
        advisors: [],
      },
      {
        term: '2023-2학기',
        roles: [
          { role: '회장', names: ['김선하'] },
          { role: '부회장', names: ['조연택'] },
          { role: '총무', names: ['박경빈', '송월심'] },
          { role: '임원', names: ['구재환', '신채빈', '이동규', '이연우', '이우경', '채지원', '가성연'] },
        ],
        // 2023 년에는 제작스터디·정기모임처럼 '서기단'이 팀으로 있었다 — 팀장 최재연
        teams: [
          { title: '제작스터디', members: ['김예령', '김효림'] },
          { title: '정기모임', members: ['박건희', '이연우', '최재연'] },
          { title: '서기단', leader: '최재연', members: ['이지윤', '전민기'] },
        ],
        advisors: [],
      },
    ],
  },
  {
    order: '3대 회장',
    name: '박경빈',
    period: '(2024~2024)',
    imageSrc: '/images/leader/leader_3.jpeg',
    officers: [
      {
        term: '2024-1학기',
        roles: [
          { role: '회장', names: ['박경빈'] },
          { role: '부회장', names: ['이동규'] },
          { role: '총무', names: ['가성연'] },
        ],
        teams: [
          { title: '정기모임', members: ['최재연', '박건희', '박지환'] },
          // 제작스터디는 김예령 외 한 명이 더 있었는데 PM 이 기억을 못 함 — 확인되면 추가
          { title: '제작스터디', members: ['김예령'] },
        ],
        advisors: [],
      },
      {
        term: '2024-2학기',
        roles: [
          { role: '회장', names: ['박경빈'] },
          { role: '부회장', names: ['이동규'] },
          { role: '총무', names: ['가성연'] },
        ],
        teams: [
          { title: '정기모임', members: ['최재연', '박건희', '박지환', '정도이', '박수민', '안예지', '이우주'] },
          { title: '제작스터디', members: ['김예령'] },
        ],
        advisors: [],
      },
    ],
  },
  {
    order: '4대 회장',
    name: '가성연',
    period: '(2025~2025)',
    imageSrc: '/images/leader/leader_4.jpeg',
    officers: [
      {
        term: '2025-1학기',
        roles: [
          { role: '회장', names: ['가성연'] },
          { role: '부회장', names: ['정도이'] },
          { role: '총무', names: ['신승현'] },
        ],
        teams: [{ title: '정기모임', members: ['박지환', '안예지'] }],
        advisors: [],
      },
      {
        term: '2025-2학기',
        roles: [
          { role: '회장', names: ['가성연'] },
          { role: '부회장', names: ['정도이'] },
          { role: '총무', names: ['신승현'] },
        ],
        // 25-2 부터 안예지가 정기모임장
        teams: [{ title: '정기모임', leader: '안예지', members: [] }],
        advisors: [],
      },
    ],
  },
  {
    order: '5대 회장',
    name: '최재연',
    period: '(2026~현재)',
    imageSrc: '/images/leader/leader_5.png',
    officers: [
      {
        term: '2026-1학기',
        roles: [
          { role: '회장', names: ['최재연'] },
          { role: '부회장', names: ['최성현'] },
          { role: '총무', names: ['안예지'] },
        ],
        teams: [
          { title: '제작스터디', leader: '박수민', members: ['최예윤', '유해담'] },
          { title: '정기모임', leader: '한서은', members: ['김서현', '김수현', '최서진', '하종연'] },
          { title: '큐레이션팀', leader: '김서진', members: [] },
        ],
        advisors: ['가성연', '정도이', '김예령'],
      },
      {
        term: '2026-2학기',
        roles: [
          { role: '회장', names: ['최재연'] },
          { role: '부회장', names: ['최성현'] },
          { role: '총무', names: ['안예지'] },
        ],
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
