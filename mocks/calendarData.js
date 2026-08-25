// mocks/calendarData.js
import { SCHEDULE_CATEGORIES } from '@/constants/calendar';

// 디자인 시안과 같은 조합으로 둔다. (여러 날 일정 2개 + 하루 일정 1개)
// 달력에서 여러 날 일정은 이어진 막대로, 하루 일정은 동그라미로 그려진다.
// 세 일정 모두 같은 달에 있어야 한 화면에서 세 모양을 다 확인할 수 있다.

// 일정 상세의 '세부 내용'은 여러 줄 문자열로 온다.
// '-'로 시작하면 목록, 앞의 공백 2칸마다 한 단계 들여쓴다. (ScheduleDetailContent 참고)
const OT_CONTENT = [
  '- 일시: 10월 5일(월) ~ 10월 7일(수)',
  '- 장소: 학생회관 3층 세미나실',
  '- 일자별 진행',
  '  - 1일차: 동아리 소개 / 조 편성',
  '  - 2일차: 촬영 기초 강의',
  '  - 3일차: 조별 과제 발표',
  '- 준비물: 개인 카메라 (없으면 대여 신청)',
].join('\n');

const MT_CONTENT = [
  '- 일시: 10월 20일(화) ~ 10월 21일(수)',
  '- 장소: ○○ 펜션',
  '- 집합 시간 및 장소: 10월 20일 오전 9시 / 학교 정문 앞',
  '- 준비물',
  '  - 개인 세면도구',
  '  - 편한 옷 + 여벌 옷',
  '  - 개인 상비약',
  '  - 텀블러 (있으면 좋음)',
  '- 회비: 5만원 (10월 16일까지 입금)',
  '  - 입금 계좌: ○○은행 000-0000-0000 (홍길동)',
].join('\n');

const MEETING_CONTENT = [
  '- 안건: 하반기 활동 결산 / 겨울 프로젝트 팀 편성',
  '- 장소: 학생회관 3층 세미나실',
  '- 참석 대상: 정회원 전원',
].join('\n');

export const calendarMockResponse = {
  message: '일정 조회 성공',
  data: [
    // 3일 일정
    {
      scheduleId: 1,
      title: '신입 OT',
      category: SCHEDULE_CATEGORIES.ETC,
      startDate: '2026-10-05',
      endDate: '2026-10-07',
      content: OT_CONTENT,
    },
    // 2일 일정
    {
      scheduleId: 2,
      title: '가을 MT',
      category: SCHEDULE_CATEGORIES.MT,
      startDate: '2026-10-20',
      endDate: '2026-10-21',
      content: MT_CONTENT,
    },
    // 1일 일정
    {
      scheduleId: 3,
      title: '정기 회의',
      category: SCHEDULE_CATEGORIES.REGULAR_MEETING,
      startDate: '2026-10-25',
      endDate: '2026-10-25',
      startTime: '19:00',
      endTime: '21:00',
      content: MEETING_CONTENT,
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// 리뷰 반영분 확인용 데이터. /calendar/mock 에서만 쓰인다. (개발 환경 전용 페이지)
// 실제 화면은 GET /api/event 를 조회하고 실패해도 목 데이터로 메꾸지 않으므로(CalendarSection)
// 이 파일의 값은 화면에 영향을 주지 않는다. 위 calendarMockResponse 는 현재 쓰이는 곳이 없다.
// 2026년 8월 기준 — 8/1(토), 8/2(일), 8/9(일), 8/16(일), 8/23(일), 8/30(일)
// ─────────────────────────────────────────────────────────────
export const calendarTestMockResponse = {
  message: '일정 조회 성공',
  data: [
    {
      scheduleId: 101,
      title: '① 지난 달부터 이어짐',
      category: SCHEDULE_CATEGORIES.ETC,
      startDate: '2026-07-30',
      endDate: '2026-08-03',
      // 확인: 8/1 칸 왼쪽이 둥글게 끝나야 한다. (7월 칸은 점으로만 표시되므로)
      content:
        '- 8월 1일 칸의 왼쪽 끝이 둥근지 확인\n- 8/1(토)에서 한 번 끊기고 8/2(일)부터 다시 이어짐',
    },
    {
      scheduleId: 102,
      title: '② 주 경계 넘김',
      category: SCHEDULE_CATEGORIES.REGULAR_MEETING,
      startDate: '2026-08-07',
      endDate: '2026-08-10',
      // 확인: 8/8(토)에서 끝이 둥글고, 다음 줄 8/9(일)에서 다시 둥글게 시작
      content: '- 8/7~8/8 한 줄, 8/9~8/10 다음 줄\n- 줄이 바뀌는 지점 양쪽이 모두 둥근지 확인',
    },
    {
      scheduleId: 103,
      title: '③ 겹침 A',
      category: SCHEDULE_CATEGORIES.ETC,
      startDate: '2026-08-12',
      endDate: '2026-08-15',
      // 확인: ④와 8/14~15가 겹친다. 고른 쪽이 진한 막대로 이기고,
      //      겹치는 날 때문에 막대 중간에 둥근 노치가 생기지 않아야 한다.
      content:
        '- ④ 겹침 B와 8/14~8/15가 겹침\n- 목록에서 A와 B를 번갈아 눌러 진한 막대가 서로 바뀌는지 확인\n- 진한 막대 중간에 둥근 홈이 파이지 않는지 확인',
    },
    {
      scheduleId: 104,
      title: '④ 겹침 B',
      category: SCHEDULE_CATEGORIES.ETC,
      startDate: '2026-08-14',
      endDate: '2026-08-17',
      content: '- ③ 겹침 A와 8/14~8/15가 겹침\n- 8/15(토)에서 끊기고 8/16(일)부터 다시 이어짐',
    },
    {
      scheduleId: 105,
      title: '⑤ 하루 일정 (시간 있음)',
      category: SCHEDULE_CATEGORIES.REGULAR_MEETING,
      startDate: '2026-08-20',
      endDate: '2026-08-20',
      startTime: '19:00',
      endTime: '21:00',
      // 확인: 동그라미 한 개 + 상세 날짜가 '8월 20일 (목) 19:00 ~ 21:00'
      content:
        '- 달력에 동그라미 하나로만 표시되는지 확인\n- 날짜 / 시간이 날짜 한 번 + 시간 범위로 표기되는지 확인',
    },
    {
      scheduleId: 106,
      title: '⑥ 다음 달로 이어짐',
      category: SCHEDULE_CATEGORIES.ETC,
      startDate: '2026-08-28',
      endDate: '2026-09-02',
      // 확인: 8/31 칸 오른쪽이 둥글게 끝나야 한다.
      content:
        '- 8월 31일 칸의 오른쪽 끝이 둥근지 확인\n- 9월로 넘기면 9/1~9/2가 이어져 보이는지 확인',
    },
  ],
};
