// 파일 업로드 / 조회(다운로드) 관련 API 처리
// ※ 첨부 정적 서빙은 폐지되었다 — 모든 첨부 접근은 아래 인증형 API 가 유일한 경로
import axiosInstance from '@/apis/axiosInstance';

// 파일 전송은 공통 타임아웃(5초)으로는 부족하다 (업로드 한도가 30MB).
// axiosInstance 는 건드리지 않고 이 파일의 요청에만 넉넉한 값을 준다.
const FILE_TIMEOUT_MS = 60000;

// 1. 파일 업로드 (POST /api/user/boards/{boardId}/files) [MEMBER]
//    multipart/form-data: file(1개, 필수), usage(inline|attachment, 선택)
//      inline     = 본문 삽입 이미지 → 상세 첨부 목록에 노출되지 않음
//      attachment = 첨부 목록에 노출
//      생략 시 이미지는 inline, 그 외는 attachment
//    응답: { attachmentId, url, originName, fileSize, isImage, usageType, markdown }
//    파일을 고른 즉시 호출한다 (게시글 행이 아직 없는 상태에서 선업로드)
//    markdown 은 완성된 문자열 → 본문의 `![Uploading name…]()` 자리표시자를 이 값으로 교체
//    글 연결은 발행/수정/임시저장의 attachmentIds + 본문에 남은 /api/user/files/{id} 자동 스캔
//    미연결 파일은 24시간 후 새벽 배치가 물리 삭제한다
//    실패: 400 허용되지 않는 형식 / 400 inline 인데 비이미지 / 403 권한·업로드 미사용 / 413 30MB 초과
export const uploadFile = async (boardId, file, usage) => {
  const formData = new FormData();
  formData.append('file', file);
  if (usage) formData.append('usage', usage);

  const response = await axiosInstance.post(`/api/user/boards/${boardId}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: FILE_TIMEOUT_MS,
  });
  return response.data;
};

// 2. 파일 조회·다운로드 (GET /api/user/files/{fileId}) [MEMBER · Authorization 필수]
//    응답: 파일 스트림 (이미지=inline, 그 외=attachment; filename="원본명")
//    img 태그는 헤더를 못 붙인다 → 마크다운 렌더링 시 이미지 컴포넌트를 갈아끼워
//    fetch(+Authorization) → blob URL 로 표시한다 (responseType: 'blob')
//    권한 없음도 404 로 통일된다 (파일 존재 자체를 숨김)
export const getFile = async (fileId) => {
  const response = await axiosInstance.get(`/api/user/files/${fileId}`, {
    responseType: 'blob',
    timeout: FILE_TIMEOUT_MS,
  });
  return response.data; // Blob
};

// 3. (FE 유틸) blob URL 생성/해제 헬퍼
//    2번 응답을 URL.createObjectURL 로 감싸고, 언마운트 시 revokeObjectURL 로 회수한다
//    같은 fileId 를 여러 곳에서 쓰므로 캐시(Map)를 두는 편이 좋다
//    → 통신이 아니라 화면단 유틸이므로 이 파일에는 두지 않는다 (lib/ 또는 hooks/ 에서 처리)
