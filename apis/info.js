// 정보게시판 관련 API 처리
import authApi from '@/apis/authApi';

// 1. 정보게시판 상단 5개 조회 (GET /api/stu/info/top5)
export const getTop5InfoPosts = async () => {
  const response = await authApi.get('/api/stu/info/top5');
  return response.data;
};

// 2. 정보게시판 전체 목록 조회
// GET /api/stu/info/posts?page=1&size=10&keyword=...&sort=created&categoryId=...
export const getInfoPostList = async ({
  page = 1,
  size = 10,
  keyword = '',
  sort = 'created',
  categoryId,
} = {}) => {
  const params = { page, size, sort };

  if (keyword?.trim()) {
    params.keyword = keyword.trim();
  }

  if (categoryId) {
    params.categoryId = categoryId;
  }

  const response = await authApi.get('/api/stu/info/posts', { params });
  return response.data;
};

// 3. 정보게시판 단일글 조회
// GET /api/stu/info/posts/{postId}
export const getInfoPostDetail = async (postId, sort = 'created') => {
  const response = await authApi.get(`/api/stu/info/posts/${postId}`, {
    params: { sort },
  });
  return response.data;
};

// 4. 정보게시판 좋아요
// PATCH /api/stu/boards/info/posts/{postId}/like
export const toggleInfoPostLike = async (postId) => {
  const response = await authApi.patch(
    `/api/stu/boards/info/posts/${postId}/like`
  );
  return response.data;
};

// 5. 정보게시판 카테고리 조회
// GET /api/stu/info/categories
export const getInfoCategories = async () => {
  const response = await authApi.get('/api/stu/info/categories');
  return response.data;
};