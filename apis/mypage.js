// 마이페이지 관련 API 처리
// ※ 알림함·알림 수신 기기는 apis/notification.js
import axiosInstance from '@/apis/axiosInstance';

// 목록 쿼리 파라미터 조립 — 빈 값은 빼고, keyword 는 앞뒤 공백 제거, boardId 는 숫자로.
// (size 는 서버가 최대 100 으로 보정한다)
function buildListParams({ page = 1, size = 10, sort, boardId, keyword }) {
  const params = { page, size };
  if (sort) params.sort = sort;
  if (boardId !== undefined && boardId !== null && boardId !== '') {
    params.boardId = Number(boardId);
  }
  if (keyword && keyword.trim()) {
    params.keyword = keyword.trim();
  }
  return params;
}

// 1. 프로필/활동 요약 (GET /api/user/mypage) [MEMBER]
//    응답: { loginId, name, joinedAt, postCount, commentCount, likedCount,
//           semester: { posts, comments, receivedLikes } }
//    postCount/commentCount/likedCount 는 전체 기간, state='normal' 만 집계
//    이번 학기 경계는 policy_settings (기본 3월/9월 시작)
export const getMyPage = async () => {
  const response = await axiosInstance.get('/api/user/mypage');
  return response.data;
};

// 2. 비밀번호 변경 (PATCH /api/user/mypage/password/reset) [MEMBER]
//    요청: { currentPassword, newPassword }
//    새 비밀번호 재입력(확인)은 프론트 검증 — API 로는 보내지 않는다
//    규칙: 문자·숫자·특수문자 포함 8~20자 (회원가입과 동일)
//    ★성공 시 기존 토큰이 전부 무효화된다(본인 세션 포함)
//      → 저장한 토큰을 버리고 로그인 화면으로 보내야 한다. 그대로 두면 다음 요청에서 401
//    실패 400: 현재 비밀번호 불일치 / 규칙 위반 / 새 비밀번호가 현재와 동일
//    ※ 비로그인 초기화(PUT /api/auth/password/reset, auth.js)와 별개 API
export const changePassword = async ({ currentPassword, newPassword }) => {
  const response = await axiosInstance.patch('/api/user/mypage/password/reset', {
    currentPassword,
    newPassword,
  });
  return response.data;
};

// 3. 모든 기기에서 로그아웃 (PATCH /api/user/mypage/logout-all) [MEMBER]
//    응답: { message }
//    비밀번호 재입력을 받지 않는다. 호출한 기기도 함께 로그아웃된다
//    다른 기기는 다음 요청에서 401 + X-Token-Expired:1 을 받는다
//    ※ 2번(비밀번호 변경)은 이 처리를 자동 수행하므로 따로 부를 필요 없다
export const logoutAllDevices = async () => {
  const response = await axiosInstance.patch('/api/user/mypage/logout-all');
  return response.data;
};

// 4. 회원 탈퇴 (PATCH /api/user/mypage/withdraw) - 응답: { message }
// 본인 확인용 비밀번호 재입력을 받는다 (토큰 탈취만으로 탈퇴 불가)
// 제재 여부와 무관하게 항상 허용된다. 이름·이메일·아이디·전화·비밀번호는 즉시 파기되고
// 학번은 복원 불가 해시로 남는다. 글·댓글은 유지되며 작성자명이 '탈퇴한 회원'으로 바뀐다
// 재가입은 30일 쿨다운. 알림 기기 삭제·알림함 정리·세션 종료가 함께 처리된다
// 실패: 400 비밀번호 불일치 / 404 탈퇴 처리할 수 없는 계정
export const withdrawAccount = async (password) => {
  const response = await axiosInstance.patch('/api/user/mypage/withdraw', { password });
  return response.data;
};

// ───────────── 활동 목록 (명세서 2026-08-26 기준 구현 완료 — 이전 문서엔 '백엔드 대기'였음) ─────────────
// 공통 쿼리: page, size, boardId(원글 이동/필터), keyword. 응답에 totalPages/totalCount 포함.

// 5. 내가 쓴 글 (GET /api/user/mypage/posts) [MEMBER]
//    쿼리: page, size, sort(created|viewCount), boardId, keyword
//    응답: { totalPages, totalCount, posts: [{ postId, boardId, boardName,
//           title, likeCount, viewCount, created }] }
//    삭제된 게시판(state='deleted')의 글은 제외된다
export const getMyPosts = async ({ page = 1, size = 10, sort = 'created', boardId, keyword } = {}) => {
  const params = buildListParams({ page, size, sort, boardId, keyword });
  const response = await axiosInstance.get('/api/user/mypage/posts', { params });
  return response.data;
};

// 6. 내가 쓴 댓글 - 대댓글 포함 (GET /api/user/mypage/comments) [MEMBER]
//    쿼리: page, size, boardId, keyword  (★정렬은 최신순 고정 — sort 파라미터 없음)
//    응답: { totalPages, totalCount, comments: [{ commentId, postId, boardId,
//           postTitle, content, created }] }
//    원글이 블라인드/삭제거나 소속 게시판이 삭제되면 댓글도 제외된다
export const getMyComments = async ({ page = 1, size = 10, boardId, keyword } = {}) => {
  const params = buildListParams({ page, size, boardId, keyword });
  const response = await axiosInstance.get('/api/user/mypage/comments', { params });
  return response.data;
};

// 7. 좋아요 누른 글 (GET /api/user/mypage/likes) [MEMBER]
//    쿼리: page, size, sort(created|viewCount), boardId, keyword
//    sort=created 는 '좋아요 누른 순'(응답 created 는 글 작성일)
//    응답: { totalPages, totalCount, posts: [{ postId, boardId, boardName,
//           title, likeCount, viewCount, created }] }
export const getMyLikes = async ({ page = 1, size = 10, sort = 'created', boardId, keyword } = {}) => {
  const params = buildListParams({ page, size, sort, boardId, keyword });
  const response = await axiosInstance.get('/api/user/mypage/likes', { params });
  return response.data;
};
