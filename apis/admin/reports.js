// 관리자 - 신고 관리 API 처리
// ※ 아래 3·4·5번(select-*)은 신고관리 / 게시글관리 / 댓글관리 화면이 공유한다
//    단건 조치용 API 는 없다 — targetIds 에 1건만 담아 호출한다
import axiosInstance from '@/apis/axiosInstance';

// ─────────────────────────── 신고 목록 ───────────────────────────

// 1. 신고된 게시글 목록 (GET /api/admin/reports/posts) [ADMIN]
//    쿼리: page(1부터), size, state, boardId, sort, keyword
//    응답: { totalPages, totalCount, items: [{ targetType, targetId, postId,
//           preview, boardId, boardName, authorName, reasonLabel,
//           firstReportedAt, reportCount, reportStatus, state }] }
//    대상 단위 그룹핑 — 동일 대상 중복 신고는 reportCount 로 합산된다
//    state 는 blind · deleted 만 인식한다. 미지정 시 pending(미조치)·blind·deleted 를 모두 내려주고
//    복원(=반려)된 대상만 빠진다. 걸지 않을 필터는 undefined 로 두면 쿼리에서 제외된다
//    ★reportStatus(pending|resolved)는 명세 예시에 없지만 실제로 내려온다 — state 와 다른 값
export const getReportedPosts = async (params) => {
  const response = await axiosInstance.get('/api/admin/reports/posts', { params });
  return response.data;
};

// 2. 신고된 댓글 목록 (GET /api/admin/reports/comments) [ADMIN]
//    쿼리 · 응답 형태는 1번과 같다 (targetType='comment', targetId=commentId)
//    postId 는 원문 게시글로 이동하기 위한 값
export const getReportedComments = async (params) => {
  const response = await axiosInstance.get('/api/admin/reports/comments', { params });
  return response.data;
};

// ─────────────────────────── 일괄 조치 (부분 성공) ───────────────────────────
// 공통 요청: { targetType: 'post'|'comment', targetIds: [] } (+ 삭제·블라인드는 reasonId, detail)
// 공통 응답: { successCount, failCount, failures: [{ id, message }] }
// 항목마다 독립 트랜잭션 — 일부가 실패해도 나머지는 처리된다
// 요청에 중복 id 가 있으면 한 번만 처리된다
// detail 은 사유가 '기타'일 때만 보낸다

// 3. 선택 블라인드 (PATCH /api/admin/reports/select-blind) [ADMIN]
//    가리기만 하고 벌점은 부과하지 않는다. 최종 판단 전 임시 조치라 신고는 pending 으로 남는다
export const blindReportTargets = async (payload) => {
  const response = await axiosInstance.patch('/api/admin/reports/select-blind', payload);
  return response.data;
};

// 4. 선택 삭제 (PATCH /api/admin/reports/select-delete) [ADMIN]
//    소프트 삭제(state=deleted) + 작성자 주의 +2 + 경고/정지 에스컬레이션
//    대상별 pending 신고를 resolved 로 일괄 종료한다 (중복 신고 이중 벌점 차단)
//    reasonId 를 안 보내면 대표(최신) 신고 사유를 쓰므로 신고 없는 글도 이 API 로 삭제 가능
//    작성자가 먼저 지운 글도 삭제 조치로 인정해 벌점을 부과한다 —
//    관리자가 이미 삭제 조치한 대상만 no-op (벌점 중복 차단)
export const deleteReportTargets = async (payload) => {
  const response = await axiosInstance.patch('/api/admin/reports/select-delete', payload);
  return response.data;
};

// 5. 선택 복원 (PATCH /api/admin/reports/select-restore) [ADMIN]
//    요청: { targetType, targetIds } — 복원은 사유를 받지 않는다
//    모든 조치의 되돌리기(삭제된 대상도 되살림) + 부과된 주의 포인트 회수
//    대상별 pending 신고는 rejected 로 종료된다
//    이미 공개 상태이고 종료할 신고도 없으면 failures 에
//    '복원할 신고가 없습니다. 이미 공개 상태입니다.' 가 담긴다
export const restoreReportTargets = async (payload) => {
  const response = await axiosInstance.patch('/api/admin/reports/select-restore', payload);
  return response.data;
};

// ─────────────────────────── 백엔드 대기 ───────────────────────────
// 대상별 신고 내역 (조치 모달의 '신고자 목록' 표) — 명세에 없다.
// 목록 API 는 대표 사유와 reportCount 만 주므로 한 대상에 여러 사유의 신고가 섞여 있을 때
// 관리자가 판단할 근거가 없다. 요청해 둔 형태:
//   GET /api/admin/reports/{posts|comments}/{targetId} [ADMIN]
//   응답: [{ reportId, reasonLabel, detail, createdAt }] — createdAt 오름차순
// (apis/README.md 4번 표 · 6번 항목에 기록)
