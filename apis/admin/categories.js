// 관리자 - 게시판별 카테고리(태그) 관리 API
// ※ 회원 화면용 카테고리 목록은 apis/board.js 의 게시판 조회 쪽에 있다.
import axiosInstance from '@/apis/axiosInstance';

// 1. 카테고리 목록 (GET /api/admin/boards/{boardId}/categories) [ADMIN]
//    응답: [{ categoryId, name, code, displayOrder, postCount, isPinned }]
//    postCount 가 0 이 아니면 삭제할 수 없다(서버가 409). isPinned 인 '중요'는 이름 수정·삭제가 막혀 있다.
export const getBoardCategories = async (boardId) => {
  const response = await axiosInstance.get(`/api/admin/boards/${boardId}/categories`);
  return response.data ?? [];
};

// 2. 카테고리 등록 (POST /api/admin/boards/{boardId}/categories) [ADMIN]
//    요청: { name, displayOrder? }
//    예전에 지운 이름을 다시 넣으면 그 카테고리가 되살아난다(옛 글의 배지도 함께 돌아온다).
export const createBoardCategory = async (boardId, { name, displayOrder } = {}) => {
  const response = await axiosInstance.post(`/api/admin/boards/${boardId}/categories`, {
    name,
    displayOrder,
  });
  return response.data;
};

// 3. 카테고리 수정 (PATCH /api/admin/boards/{boardId}/categories/{categoryId}) [ADMIN]
//    요청: { name?, displayOrder? } — 보낸 값만 바뀐다. displayOrder 는 '몇 번째 자리'다.
export const updateBoardCategory = async (boardId, categoryId, payload) => {
  const response = await axiosInstance.patch(
    `/api/admin/boards/${boardId}/categories/${categoryId}`,
    payload
  );
  return response.data;
};

// 4. 카테고리 삭제 (PATCH /api/admin/boards/{boardId}/categories/{categoryId}/delete) [ADMIN]
//    소프트 삭제. 쓰고 있는 글이 있으면 409 로 막힌다.
export const deleteBoardCategory = async (boardId, categoryId) => {
  const response = await axiosInstance.patch(
    `/api/admin/boards/${boardId}/categories/${categoryId}/delete`
  );
  return response.data;
};
