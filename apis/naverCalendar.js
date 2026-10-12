// 네이버 캘린더 '새 일정 넣기' (2026-10-12). 네이버 API 는 일정 추가만 되므로 구글처럼 수정·삭제가 따라가지 않는다.
// 동의 뒤 백엔드 콜백이 returnTo(기본 /mypage) 로 `?ncalendar=linked|failed|cancelled` 를 붙여 돌려보낸다.
import axiosInstance from '@/apis/axiosInstance';

// { linked, naverEmail, lastSentAt, sentCount, configured }
export const getNaverCalendarStatus = async () => {
  const response = await axiosInstance.get('/api/user/mypage/calendar/naver');
  return response.data;
};

export const getNaverCalendarLinkUrl = async (returnTo) => {
  const response = await axiosInstance.get('/api/user/mypage/calendar/naver/authorize', {
    params: returnTo ? { returnTo } : undefined,
  });
  return response.data?.authorizeUrl;
};

export const unlinkNaverCalendar = async () => {
  const response = await axiosInstance.delete('/api/user/mypage/calendar/naver');
  return response.data;
};
