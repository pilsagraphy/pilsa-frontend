// 자유게시판 관련 API 처리
import authApi from '@/apis/authApi';

// 1. 자유게시판 상단 5개 조회 (GET /api/stu/free/top5)
export const getTop5FreePosts = async () => {
  const response = await authApi.get('/api/stu/free/top5');
  return response.data;
};

// 2. 자유게시판 전체 목록 조회 (GET /api/stu/free/posts?page=1&size=10&keyword=...&sort=created,liked)
export const getFreePostList = async ({
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

  const response = await authApi.get('/api/stu/free/posts', { params });
  return response.data;
};

// 3. 자유게시판 단일글 조회 (GET /api/stu/free/posts/{postId})
export const getFreePostDetail = async (postId, sort = 'created') => {
  const response = await authApi.get(`/api/stu/free/posts/${postId}`, {
    params: { sort },
  });
  return response.data;
};

// 4. 자유게시판 좋아요 처리 (PATCH /api/stu/boards/free/posts/{postId}/like)
export const toggleFreePostLike = async (postId) => {
  const response = await authApi.patch(`/api/stu/boards/free/posts/${postId}/like`);
  return response.data;
};

// 5. 자유게시판 카테고리 조회 (GET /api/stu/free/categories)
export const getFreeCategories = async () => {
  const response = await authApi.get('/api/stu/free/categories');
  return response.data;
};