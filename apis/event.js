// 일정(캘린더) 관련 API 처리
// ※ schedule.js(/api/public/schedules) 를 대체한다
// ※ 관리자용 일정 등록·수정·삭제는 apis/admin/event.js
import axiosInstance from '@/apis/axiosInstance';

// ─────────────────────────── 응답 정규화 ───────────────────────────

// 서버 필드명을 화면 필드명으로 맞춘다. (eventId → scheduleId, description → content)
// 달력·목록·상세·관리자 폼이 모두 후자를 쓰고 목 데이터도 그 모양이라,
// 컴포넌트 10곳을 고치는 대신 여기서 한 번 바꿔 준다.
//
// startDate/endDate 는 QA 확인 결과 'yyyy-MM-dd' 로 내려온다(2026-08-25 기준).
// 다만 DB 는 datetime 컬럼이라 직렬화 설정이 바뀌면 '2026-03-01T00:00:00' 이 될 수 있고,
// 달력의 날짜 비교(CalendarSection)와 상세의 정규식(ScheduleDetailDateTime)이
// 'yyyy-MM-dd' 를 가정한다. 그때 조용히 깨지지 않게 10자리로 잘라 둔다.
const toDateOnly = (value) => (typeof value === 'string' ? value.slice(0, 10) : value);

// startTime/endTime 은 서버에 없는 필드다. 넣지 않고 두면 상세가 '시간 없는 일정'으로 그린다.
// category 는 NULL 이 올 수 있는데 기본값('기타')은 ScheduleDetailCategory 가 씌운다 —
// 여기서 미리 채우면 수정 폼이 저장하지도 않은 구분을 이미 고른 것처럼 보여준다.
const toSchedule = (event) => ({
  scheduleId: event.eventId,
  title: event.title,
  category: event.category,
  content: event.description,
  startDate: toDateOnly(event.startDate),
  endDate: toDateOnly(event.endDate),
});

// ─────────────────────────── 조회 ───────────────────────────

// 1. 기간별 일정 목록 (GET /api/event) [PUBLIC]
//    쿼리: from, to (둘 다 필수) — YYYY-MM / YYYY-MM-DD 모두 허용
//          7자리로 보내면 from=해당 월 1일, to=해당 월 말일로 서버가 변환한다
//    응답: { message, data: [{ eventId, title, category, description, startDate, endDate }] }
//    기간이 걸치기만 하면 포함(start<=to AND end>=from), startDate 오름차순
//    category 는 관리자 자유 입력 문자열이다 (선택지 목록 API 없음 — 아래 5번 참고)
export const getEventList = async (from, to) => {
  const response = await axiosInstance.get('/api/event', {
    params: { from, to },
  });

  return {
    ...response.data,
    data: (response.data?.data ?? []).map(toSchedule),
  };
};

// 2. 일정 1건 ICS - 내 캘린더에 담기 (GET /api/event/{eventId}.ics) [PUBLIC]
//    axios 로 호출하지 않는다 — location.href = `/api/event/${eventId}.ics`
//    Content-Disposition: attachment 라 브라우저가 받아 캘린더 앱으로 넘긴다
//    가져오기(import)라서 이후 일정 수정은 반영되지 않는다 (안드로이드 전용 경로)

// 3. 구글 캘린더 구독 피드 (GET /api/event/calendar.ics) [PUBLIC]
//    axios 로 호출하지 않는다 — [구독하기] 버튼에서 새 창을 띄운다
//    window.open('https://calendar.google.com/calendar/render?cid='
//      + encodeURIComponent(`${도메인}/api/event/calendar.ics`))
//    한 번 구독하면 이후 등록/수정/삭제가 자동 반영된다 (구글이 수 시간~하루 주기로 재조회)
//    iOS 는 webcal://, 데스크톱은 위 render?cid=, 안드로이드는 2번(일정별 담기)

// ─────────────────────────── 미구현 (백엔드 대기) ───────────────────────────

// 4. 일정 상세 (GET /api/event/{eventId}) [MEMBER] — planned
//    현재 코드에 매핑 없음. 목록(1번)이 description 까지 내려주므로 없이도 화면 구성 가능

// 5. 일정 카테고리 목록 - 셀렉트바 (GET /api/event/categories) [PUBLIC] — planned
//    응답 예상: [{ eventCategoryId, name }] (is_active=1, display_order 순)
//    도입되면 등록/수정의 category 가 자유 입력에서 이 목록의 값으로 제한된다
//    그때까지 카테고리 셀렉트바는 그릴 수 없다 (하드코딩 금지 — PM 확인 필요)
