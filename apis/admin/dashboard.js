// 관리자 대시보드 관련 API 처리
import axiosInstance from '@/apis/axiosInstance';

// 1. 통계 수치 (GET /api/admin/dashboard) [ADMIN]
//    응답: { newMembers, pendingReports, newPosts, totalMembers }
//    신규 집계 기간은 policy_settings (기본 1일 = 당일 00:00 부터)
//    newMembers/totalMembers 는 영구차단·탈퇴 회원 제외
//    pendingReports 는 대상 단위 집계 (신고관리 화면 숫자와 일치)

// 2. 최근 신고 목록 (GET /api/admin/dashboard/recent-reports) [ADMIN]
//    쿼리: size (선택, 기본 5, 1~100 보정)
//    응답: [{ targetType, targetId, postId, boardId, boardName, preview, createdAt }]
//    대상 단위로 묶인다 — 같은 글이 N번 신고돼도 1줄, createdAt 은 최근 신고 시각
//    postId 는 댓글 신고에서 원글로 이동하기 위한 값

// 3. 최근 가입 회원 목록 (GET /api/admin/dashboard/recent-members) [ADMIN]
//    쿼리: size (선택, 기본 5, 1~100 보정)
//    응답: [{ userId, memberType, loginId, name, joinedAt }]
//    영구차단·탈퇴 회원 제외. userId 는 회원 상세로 이동하기 위한 값

// 4. (연동 메모) 대시보드 일정 달력
//    별도 API 없음 — apis/event.js 의 기간별 일정 목록(GET /api/event)을 재사용한다
