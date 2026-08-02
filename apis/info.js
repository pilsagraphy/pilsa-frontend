// 정보게시판 관련 API 처리
import axiosInstance from '@/apis/axiosInstance';

// 1. 정보게시판 상단 5개 조회 (GET /api/stu/info/top5)
export const getTop5InfoPosts = async () => {
  const response = await axiosInstance.get('/api/stu/info/top5');
  return response.data;
};

// 2. 정보게시판 카테고리 조회 (GET /api/stu/info/categories)
export const getInfoCategories = async () => {
  const response = await axiosInstance.get('/api/stu/info/categories');
  return response.data;
};

// 3. 정보게시판 전체 목록 조회 (GET /api/stu/info/posts?page=1&size=10&categoryId=...&keyword=...&sort=created,liked)
export const getInfoPostList = async ({
  page = 1,
  size = 10,
  keyword = '',
  sort = 'created',
  categoryId,
} = {}) => {
  const params = {
    page,
    size,
    sort,
  };

  if (keyword?.trim()) {
    params.keyword = keyword.trim();
  }

  if (
    categoryId !== undefined &&
    categoryId !== null &&
    categoryId !== '' &&
    categoryId !== 'all'
  ) {
    params.categoryId = Number(categoryId);
  }

  const response = await axiosInstance.get('/api/stu/info/posts', { params });
  return response.data;
};

// 4. 정보게시판 단일글 조회 (GET /api/stu/info/posts/{postId})
export const getInfoPostDetail = async (postId, sort = 'created') => {
  const response = await axiosInstance.get(`/api/stu/info/posts/${postId}`, {
    params: { sort },
  });
  return response.data;
};

// 5. 정보게시판 좋아요 처리 (PATCH /api/stu/info/posts/{postId}/like)
export const toggleInfoPostLike = async (postId) => {
  const response = await axiosInstance.patch(`/api/stu/info/posts/${postId}/like`);
  return response.data;
};

// 6. 정보게시판 글 쓰기 (POST /api/stu/info/posts)
export const createInfoPost = async ({ title, content, categoryId, files = [] }) => {
  const formData = new FormData();

  formData.append('title', title ?? '');
  formData.append('content', content ?? '');

  if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
    formData.append('categoryId', String(categoryId));
  }

  if (Array.isArray(files)) {
    files.forEach((file) => {
      if (file) formData.append('files', file);
    });
  }

  const response = await axiosInstance.post('/api/stu/info/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// 7. 정보게시판 글 수정 (PUT /api/stu/info/posts/{postId})
export const updateInfoPost = async (postId, { title, content, categoryId }) => {
  const payload = {};

  if (title !== undefined) payload.title = title;
  if (content !== undefined) payload.content = content;
  if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
    payload.categoryId = Number(categoryId);
  }

  const response = await axiosInstance.put(`/api/stu/info/posts/${postId}`, payload);
  return response.data;
};

// 8. 정보게시판 글 삭제 (DELETE /api/stu/info/posts/{postId})
export const deleteInfoPost = async (postId) => {
  const response = await axiosInstance.delete(`/api/stu/info/posts/${postId}`);
  return response.data;
};

// 9. 정보게시판 댓글 등록 (POST /api/stu/info/posts/{postId}/comments)
export const createInfoComment = async (postId, { content, isPrivate = false }) => {
  const response = await axiosInstance.post(`/api/stu/info/posts/${postId}/comments`, {
    content,
    isPrivate: Boolean(isPrivate),
  });
  return response.data;
};

// 10. 정보게시판 댓글 수정 (PUT /api/stu/info/posts/{postId}/comments/{commentId})
export const updateInfoComment = async (postId, commentId, { content, isPrivate = false }) => {
  const response = await axiosInstance.put(`/api/stu/info/posts/${postId}/comments/${commentId}`, {
    content,
    isPrivate: Boolean(isPrivate),
  });
  return response.data;
};

// 11. 정보게시판 댓글 삭제 (DELETE /api/stu/info/posts/{postId}/comments/{commentId})
export const deleteInfoComment = async (postId, commentId) => {
  const response = await axiosInstance.delete(
    `/api/stu/info/posts/${postId}/comments/${commentId}`
  );
  return response.data;
};
