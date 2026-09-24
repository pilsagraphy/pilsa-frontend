// 관리자 - 이 주의 문장 관리 API 처리
// ※ 사용자용 노출 조회는 apis/quote.js
import axiosInstance from '@/apis/axiosInstance';

// 1. 문장 목록 (GET /api/admin/quotes) [ADMIN]
//    응답: { quotes: [{ quoteId, content, startDate, endDate, writerId,
//           createdAt, updatedAt }] }

// 2. 문장 등록 (POST /api/admin/quotes) [ADMIN]
//    요청: { content, startDate, endDate }  // YYYY-MM-DD
//    응답: 201 { message, data: { quoteId } }

// 3. 문장 수정 (PUT /api/admin/quotes/{quoteId}) [ADMIN]
//    요청: { content, startDate, endDate }
//    응답: { message, data: null }

// 4. 문장 삭제 (PATCH /api/admin/quotes/{quoteId}/delete) [ADMIN]
//    응답: { message, data: null } — 소프트 삭제

export const getAdminQuotes = async () => {
  const response = await axiosInstance.get('/api/admin/quotes');
  return response.data?.quotes ?? [];
};

export const createQuote = async ({ content, startDate, endDate }) => {
  const response = await axiosInstance.post('/api/admin/quotes', { content, startDate, endDate });
  return response.data;
};

export const updateQuote = async (quoteId, { content, startDate, endDate }) => {
  const response = await axiosInstance.put(`/api/admin/quotes/${quoteId}`, {
    content,
    startDate,
    endDate,
  });
  return response.data;
};

// 소프트 삭제 — 목록에서 사라지고 노출 대상에서도 빠진다
export const deleteQuote = async (quoteId) => {
  const response = await axiosInstance.patch(`/api/admin/quotes/${quoteId}/delete`);
  return response.data;
};
