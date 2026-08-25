// 관리자 - 일정(캘린더) 관리 API 처리
// ※ 조회(목록/ICS)는 apis/event.js — 관리자 화면도 목록은 그쪽을 재사용한다
import axiosInstance from '@/apis/axiosInstance';

// 화면 필드(scheduleId/content) → 서버 필드(description)로 되돌린다.
// 반대 방향(서버 → 화면)은 apis/event.js 의 toSchedule 이 맡는다.
//
// description 은 DB NOT NULL 이라 빈 문자열이라도 채워 보낸다.
// 시각(startTime/endTime)·종일 여부는 서버에 담을 곳이 없어 여기서 버린다 —
// startDate/endDate 를 YYYY-MM-DD 그대로 datetime 컬럼에 넣으므로 시각은 00:00:00 이 된다.
// (폼의 시/분 셀렉트와 종일 체크박스는 카테고리 API 와 함께 PM 확인 대기 중)
const toEventPayload = ({ title, category, content, startDate, endDate }) => ({
  title,
  category,
  description: content ?? '',
  startDate,
  endDate,
});

// 1. 일정 등록 (POST /api/admin/event) [ADMIN]
//    요청: { title, category, description, startDate, endDate }  // YYYY-MM-DD
//      description 은 DB NOT NULL — 빈 문자열이라도 채워 보낸다
//      category 는 varchar(50) 자유 입력 (선택지 목록 API 없음, NULL 허용)
//    응답: 201 { message, data: { eventId, title } }  ← 200 아님
//    실패: 400 시작일/종료일 필수 / 400 시작일 > 종료일 / 403 관리자 권한 필요
// 응답에 목록이 없으므로(신규 eventId·title 뿐) 호출한 화면이 목록을 다시 불러야 한다
export const createEvent = async (schedule) => {
  const response = await axiosInstance.post('/api/admin/event', toEventPayload(schedule));
  return response.data;
};

// 2. 일정 수정 (PUT /api/admin/event/{eventId}) [ADMIN]
//    요청: 전달한 필드만 반영 — title, category, description, startDate, endDate
//    응답: { message, data: { eventId, updatedAt } }
//    실패: 404 없거나 이미 삭제된 일정 / 403 관리자 권한 필요
// ★등록과 달리 서버에 시작일<=종료일 검증이 없다 — ScheduleForm 의 프론트 검증이
//   수정 경로의 유일한 방어선이므로 그 검증을 지우면 안 된다
export const updateEvent = async (eventId, schedule) => {
  const response = await axiosInstance.put(
    `/api/admin/event/${encodeURIComponent(eventId)}`,
    toEventPayload(schedule)
  );
  return response.data;
};

// 3. 일정 삭제 (DELETE /api/admin/event/{eventId}) [ADMIN]
//    응답: { message } — 메서드는 DELETE 지만 실제 동작은 소프트 삭제
//    실패: 404 이미 삭제된 일정 / 403 관리자 권한 필요
export const deleteEvent = async (eventId) => {
  const response = await axiosInstance.delete(`/api/admin/event/${encodeURIComponent(eventId)}`);
  return response.data;
};
