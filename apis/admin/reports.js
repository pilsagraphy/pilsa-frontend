// 관리자 - 신고 관리 API 처리
// ※ 아래 3·4·5번(select-*)은 신고관리 / 게시글관리 / 댓글관리 화면이 공유한다
//    단건 조치용 API 는 없다 — targetIds 에 1건만 담아 호출한다
import axiosInstance from '@/apis/axiosInstance';

// ─────────────────────────── 신고 목록 ───────────────────────────

// 1. 신고된 게시글 목록 (GET /api/admin/reports/posts) [ADMIN]
//    쿼리: page, size, state, boardId, sort, keyword
//    응답: { totalPages, totalCount, items: [{ targetType, targetId, postId,
//           preview, boardId, boardName, authorName, reasonLabel,
//           firstReportedAt, reportCount, state }] }
//    대상 단위 그룹핑 — 동일 대상 중복 신고는 reportCount 로 합산된다

// 2. 신고된 댓글 목록 (GET /api/admin/reports/comments) [ADMIN]
//    쿼리: page, size, state, boardId, sort, keyword
//    응답: 1번과 동일한 형태 (targetType='comment', targetId=commentId)
//    postId 는 원문 게시글로 이동하기 위한 값

// ─────────────────────────── 일괄 조치 (부분 성공) ───────────────────────────
// 공통 응답: { successCount, failCount, failures: [{ id, message }] }
// 항목마다 독립 트랜잭션 — 일부가 실패해도 나머지는 처리된다
// 요청에 중복 id 가 있으면 한 번만 처리된다

// 3. 선택 블라인드 (PATCH /api/admin/reports/select-blind) [ADMIN]
//    요청: { targetType: 'post'|'comment', targetIds: [], reasonId, detail }
//    가리기만 하고 벌점은 부과하지 않는다. 최종 판단 전 임시 조치라 신고는 pending 으로 남는다

// 4. 선택 삭제 (PATCH /api/admin/reports/select-delete) [ADMIN]
//    요청: { targetType, targetIds: [], reasonId, detail }
//    소프트 삭제 + 작성자 주의 +2 + 경고/정지 에스컬레이션
//    대상별 pending 신고를 resolved 로 일괄 종료한다 (중복 신고 이중 벌점 차단)
//    reasonId 를 안 보내면 대표(최신) 신고 사유를 쓰므로 신고 없는 글도 이 API 로 삭제 가능

// 5. 선택 복원 (PATCH /api/admin/reports/select-restore) [ADMIN]
//    요청: { targetType, targetIds: [] } — 복원은 사유를 받지 않는다
//    모든 조치의 되돌리기(삭제된 대상도 되살림) + 부과된 주의 포인트 회수
//    대상별 pending 신고는 rejected 로 종료된다
