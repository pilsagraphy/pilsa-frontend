// 게시글/댓글 신고 관련 API 처리 (사용자용)
import axiosInstance from '@/apis/axiosInstance';

// 1. 신고 사유 목록 - 셀렉트바 (GET /api/user/reports/reasons) [MEMBER]
//    응답: [{ reasonId, code, label, displayOrder }]
//    FE 하드코딩 제거용. code='ETC' 를 고른 경우에만 detail 입력을 받는다

// 2. 신고 접수 (POST /api/user/reports) [MEMBER]
//    요청: { targetType: 'post'|'comment', targetId, reasonId, detail }
//    응답: { message }
//    실패: 400 본인 글은 신고 불가 / 409 이미 신고함 / 409 이미 삭제된 대상

// 신고 접수. targetType 은 'post' | 'comment', reasonId 는 constants/report.js 의 getReasonId(code) 로 얻는다.
// 409 는 두 가지다 — 이미 신고했거나, 대상이 이미 삭제됐다. 호출부가 상태 코드로 안내를 가른다.
export const submitReport = async ({ targetType, targetId, reasonId, detail }) => {
  const response = await axiosInstance.post('/api/user/reports', {
    targetType,
    targetId,
    reasonId,
    detail: detail || null,
  });
  return response.data; // { message }
};
