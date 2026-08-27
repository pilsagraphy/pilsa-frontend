// 관리자 - 제재 회원 관리 API 처리
// ※ 정지/영구차단 부과는 apis/admin/users.js (회원목록 화면)
import axiosInstance from '@/apis/axiosInstance';

// 1. 제재 회원 목록 (GET /api/admin/sanctions/users) [ADMIN]
//    응답: [{ userId, loginId, name, email, banStatus, bannedUntil,
//           banStartedAt, tag }]
//    tag: permanent | temporary | caution
export const getSanctionedUsers = async () => {
  const response = await axiosInstance.get('/api/admin/sanctions/users');
  return response.data;
};

// 2. 제재 회원 상세 (GET /api/admin/sanctions/users/{userId}) [ADMIN]
//    응답: { tag, banStatus, bannedUntil, banStartedAt,
//           cautionRemainder, warningCount, reportDeletedCount }
//    cautionRemainder = 유효 주의 합계 % 10 (경고까지 남은 진행도)
//    warningCount 분모는 3 — 경고는 3단계(1주/1달/영구)다. 시안의 N/5 는 오표기
export const getSanctionedUserDetail = async (userId) => {
  const response = await axiosInstance.get(`/api/admin/sanctions/users/${userId}`);
  return response.data;
};

// 3. 회원별 신고된 게시글 내역 (GET /api/admin/sanctions/users/{userId}/reports/posts) [ADMIN]
//    응답: [{ reportId, postId, boardId, boardName, title, preview, state,
//           reasonId, reasonLabel, detail, status, activeFlag, createdAt, resolvedAt }]
//    state 는 대상 게시글의 현재 표시 상태 (normal/blind/deleted)
export const getSanctionedUserReportedPosts = async (userId) => {
  const response = await axiosInstance.get(
    `/api/admin/sanctions/users/${userId}/reports/posts`,
  );
  return response.data;
};

// 4. 회원별 신고된 댓글 내역 (GET /api/admin/sanctions/users/{userId}/reports/comments) [ADMIN]
//    응답: [{ reportId, commentId, postId, boardId, boardName, postTitle, preview,
//           state, reasonId, reasonLabel, detail, status, activeFlag,
//           createdAt, resolvedAt }]
//    댓글은 제목이 없고 이동 경로가 소속 게시글이라 3번과 응답 형태가 다르다
export const getSanctionedUserReportedComments = async (userId) => {
  const response = await axiosInstance.get(
    `/api/admin/sanctions/users/${userId}/reports/comments`,
  );
  return response.data;
};

// 5. 제재 수동 해제 (POST /api/admin/sanctions/users/{userId}/lift) [ADMIN]
//    응답: { message }
//    정지만 푼다 — 경고(warning_log)는 시효 365일 동안 유효하게 남는다
//    실패: 404 없는 회원 / 409 이미 해제된 회원
//    ※ 3기 진행 예정 — 백엔드 대기(연동 불가), 화면 연결 전 PM 확인 필요
