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
