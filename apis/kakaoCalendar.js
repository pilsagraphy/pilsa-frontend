// 카카오 톡캘린더 자동 등록 (2026-10-12) — 구글처럼 등록·수정·삭제가 그대로 반영된다.
// 동의 뒤 백엔드 콜백이 returnTo(기본 /mypage) 로 `?kcalendar=linked|failed|cancelled` 를 붙여 돌려보낸다.
import axiosInstance from '@/apis/axiosInstance';

// { linked, kakaoName, lastSyncedAt, failedCount, configured }
export const getKakaoCalendarStatus = async () => {
  const response = await axiosInstance.get('/api/user/mypage/calendar/kakao');
  return response.data;
};

export const getKakaoCalendarLinkUrl = async (returnTo) => {
  const response = await axiosInstance.get('/api/user/mypage/calendar/kakao/authorize', {
    params: returnTo ? { returnTo } : undefined,
  });
  return response.data?.authorizeUrl;
};

// removeEvents=true 면 넣어 둔 일정도 톡캘린더에서 지운다. 응답 { message, removedEvents }
export const unlinkKakaoCalendar = async (removeEvents = false) => {
  const response = await axiosInstance.delete('/api/user/mypage/calendar/kakao', { params: { removeEvents } });
  return response.data;
};
