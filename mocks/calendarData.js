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
      category: SCHEDULE_CATEGORIES.GENERAL,
      startDate: '2026-10-05',
      endDate: '2026-10-07',
      content: OT_CONTENT,
    },
    // 2일 일정
    {
      scheduleId: 2,
      title: '가을 MT',
      category: SCHEDULE_CATEGORIES.REGULAR_MEETING,
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
