// 관리자 - 댓글 관리 API 처리
// ※ 블라인드/삭제/복원 조치는 apis/admin/reports.js 의 select-* 를 targetType='comment' 로 호출
import axiosInstance from '@/apis/axiosInstance';

// 1. 댓글 목록 - 전체 (GET /api/admin/comments) [ADMIN]
//    쿼리: page, size, boardId, keyword
//    응답: { totalPages, totalCount, comments: [{ commentId, postId, boardId,
//           boardName, authorName, authorLoginId, authorStudentNo,
//           content, created, state }] }
//    authorLoginId · authorStudentNo 는 조치 확인 모달의 '대상 회원' 표기에 쓴다
export const getAdminComments = async (params = {}) => {
  const response = await axiosInstance.get('/api/admin/comments', { params });
  return response.data;
};
