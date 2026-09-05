// 관리자 - 게시판 관리 API 처리
import axiosInstance from '@/apis/axiosInstance';

// 함수 이름에 Admin 을 붙인다. 사용자용 게시판 목록(apis/board.js)과 호출부에서 헷갈리지 않게 하기 위함이다.

// 1. 게시판 목록 (GET /api/admin/boards) [ADMIN]
//    응답: [{ boardId, boardName, postCount, readScope, writeLevel, displayOrder }]
// readScope: MEMBER(재학생+졸업생) | STUDENT(재학생) | ALUMNI(졸업생)
// writeLevel: 0~3 (0 은 일반회원을 의미)
// displayOrder 가 게시판 표시 순서다. 정렬 여부는 화면에서 판단한다
export const getAdminBoards = async () => {
  const response = await axiosInstance.get('/api/admin/boards');
  return response.data;
};

// 2. 게시판 생성 (POST /api/admin/boards) [ADMIN]
//    요청: { name, readScope, writeLevel }
//    응답: 201 { boardId, boardName, postCount, readScope, writeLevel, displayOrder }
// 생성 즉시 /api/boards/{id}/** 가 동작한다 (코드 수정 불필요)
// 실패: 409 { message: '이미 존재하는 게시판 이름입니다.' }
export const createAdminBoard = async (payload) => {
  const response = await axiosInstance.post('/api/admin/boards', payload);
  return response.data;
};

// 3. 게시판 수정 (PATCH /api/admin/boards/{boardId}) [ADMIN]
//    요청: 전달한 필드만 수정 — name, readScope, writeLevel, displayOrder,
//          allowComment, allowAttachment, categoryMode, defaultCategoryId,
//          allowAnonymous, allowPrivateComment
//    응답: { boardId, boardName, postCount, readScope, writeLevel, displayOrder,
//            allowComment, allowAttachment, categoryMode, defaultCategoryId,
//            allowAnonymous, allowPrivateComment }
// 수정 후 게시판 정보 전체를 돌려주므로 목록을 재조회하지 않고 응답을 그대로 쓴다
// 실패: 404 { message: '존재하지 않는 게시판입니다.' }
//      409 { message: '이미 존재하는 게시판 이름입니다.' }
//      400 { message: '열람 권한 값이 올바르지 않습니다. (MEMBER=재학+졸업 / STUDENT=재학 / ALUMNI=졸업)' }
export const updateAdminBoard = async (boardId, payload) => {
  const response = await axiosInstance.patch(`/api/admin/boards/${boardId}`, payload);
  return response.data;
};

// 4. 게시판 삭제 (PATCH /api/admin/boards/{boardId}/delete) [ADMIN]
//    요청: 없음
//    응답: { message: '게시판이 삭제되었습니다.' } — 소프트 삭제
// 실패: 409 { message: '게시글이 3건 남아 있어 삭제할 수 없습니다.' } (건수는 실제 값이 들어온다)
export const deleteAdminBoard = async (boardId) => {
  const response = await axiosInstance.patch(`/api/admin/boards/${boardId}/delete`);
  return response.data;
};
