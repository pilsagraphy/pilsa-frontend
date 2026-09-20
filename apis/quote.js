// 이 주의 문장 관련 API 처리 (메인페이지)
// ※ 관리자용 문장 등록·수정·삭제는 apis/admin/quotes.js
import axiosInstance from '@/apis/axiosInstance';

// 1. 이 주의 문장 (GET /api/quotes/current) [PUBLIC]
//    응답: { content }
//    노출기간(startDate~endDate) 내 문장 중 랜덤 1건. 비로그인 열람 가능
//    오늘을 포함하는 문장이 없으면 404 — 문장이 없는 것이지 오류가 아니므로 호출부는 null 로 받는다
export const getCurrentQuote = async () => {
  try {
    const response = await axiosInstance.get('/api/quotes/current');
    return response.data?.content ?? null;
  } catch {
    return null;
  }
};
