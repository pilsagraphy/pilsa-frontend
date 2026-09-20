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
    // 재임 중 임원진 — 학기별. 회장단(회장 제외)과 각 팀장. 명단은 조직도(constants/organization.js) 이력에서 (PM, 2026-09-21)
    officers: [
      {
        term: '2026-1학기',
        groups: [
          { label: '회장단', names: ['최성현', '안예지'] },
          { label: '제작스터디 팀장', names: ['박수민'] },
          { label: '정기모임 팀장', names: ['한서은'] },
          { label: '큐레이션팀 팀장', names: ['김서진'] },
          { label: '자문', names: ['가성연', '정도이', '김예령'] },
        ],
      },
      {
        term: '2026-2학기',
        groups: [
          { label: '회장단', names: ['최성현', '안예지'] },
          { label: '제작스터디 팀장', names: ['박수민'] },
          { label: '정기모임 팀장', names: ['한서은'] },
          { label: '큐레이션팀 팀장', names: ['김서진'] },
        ],
      },
    ],
  },
];
