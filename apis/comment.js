// 공통게시판 댓글/대댓글 관련 API 처리
// ※ 게시글 상세(board.js)에서 댓글이 분리되어 별도 조회한다
import axiosInstance from '@/apis/axiosInstance';

// 1. 댓글/대댓글 목록 (GET /api/user/boards/{boardId}/posts/{postId}/comments) [MEMBER]
//    응답: [{ commentId, parentCommentId, content, authorName, userId,
//           isAnonymous, isPrivate, created, updated }]
//    대댓글은 parentCommentId 로 표현 (무제한 깊이) — FE 가 트리로 조립
//    익명댓글: authorName='익명', userId=null / 비밀댓글: content='비밀댓글입니다.'
//    마스킹은 전부 서버 책임. state=normal 댓글만 내려온다 (블라인드·삭제 제외)
export const getComments = async (boardId, postId) => {
  const response = await axiosInstance.get(
    `/api/user/boards/${boardId}/posts/${postId}/comments`
  );
  return response.data;
};

// 2. 댓글/대댓글 등록 (POST /api/user/boards/{boardId}/posts/{postId}/comments) [MEMBER]
//    요청: { content, parentCommentId, isAnonymous, isPrivate }
//    응답: { message }
//    parentCommentId 가 있으면 대댓글. 원글/부모 작성자에게 알림이 발행된다
//    실패: 400 부모 댓글 없음 / 403 이 게시판은 댓글을 사용하지 않음
export const createComment = async (boardId, postId, body) => {
  const response = await axiosInstance.post(
    `/api/user/boards/${boardId}/posts/${postId}/comments`,
    body
  );
  return response.data;
};

// 3. 댓글/대댓글 수정 (PUT /api/user/boards/{boardId}/posts/{postId}/comments/{commentId}) [MEMBER]
//    요청: { content, isAnonymous, isPrivate }
//    응답: { message }
export const updateComment = async (boardId, postId, commentId, body) => {
  const response = await axiosInstance.put(
    `/api/user/boards/${boardId}/posts/${postId}/comments/${commentId}`,
    body
  );
  return response.data;
};

// 4. 댓글/대댓글 삭제 (PATCH /api/user/boards/{boardId}/posts/{postId}/comments/{commentId}/delete) [MEMBER · 본인만]
//    응답: { message } — 소프트 삭제
export const deleteComment = async (boardId, postId, commentId) => {
  const response = await axiosInstance.patch(
    `/api/user/boards/${boardId}/posts/${postId}/comments/${commentId}/delete`
  );
  return response.data;
};
