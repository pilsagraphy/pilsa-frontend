// 자유게시판 관련 API 처리
import axiosInstance from '@/apis/axiosInstance';

// 1. 자유게시판 상단 5개 조회 (GET /api/stu/free/top5)
export const getTop5FreePosts = async () => {
  const response = await axiosInstance.get('/api/stu/free/top5');
  return response.data;
};

// 2. 자유게시판 카테고리 조회 (GET /api/stu/free/categories)
export const getFreeCategories = async () => {
  const response = await axiosInstance.get('/api/stu/free/categories');
  return response.data;
};

// 3. 자유게시판 전체 목록 조회 (GET /api/stu/free/posts?page=1&size=10&categoryId=...&keyword=...&sort=created,liked)
export const getFreePostList = async ({
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

  if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
    params.categoryId = Number(categoryId);
  }

  const response = await axiosInstance.get('/api/stu/free/posts', { params });
  return response.data;
};

// 4. 자유게시판 단일글 조회 (GET /api/stu/free/posts/{postId})
export const getFreePostDetail = async (postId, sort = 'created') => {
  const response = await axiosInstance.get(`/api/stu/free/posts/${postId}`, {
    params: { sort },
  });
  return response.data;
};

// 5. 자유게시판 좋아요 처리 (PATCH /api/stu/free/posts/{postId}/like)
export const toggleFreePostLike = async (postId) => {
  const response = await axiosInstance.patch(`/api/stu/free/posts/${postId}/like`);
  return response.data;
};

// 6. 자유게시판 글 쓰기 (POST /api/stu/free/posts)
export const createFreePost = async ({
  title,
  content,
  categoryId,
  isAnonymous = false,
  files = [],
}) => {
  const formData = new FormData();

  formData.append('title', title ?? '');
  formData.append('content', content ?? '');
  formData.append('isAnonymous', String(Boolean(isAnonymous)));

  if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
    formData.append('categoryId', String(categoryId));
  }

  if (Array.isArray(files)) {
    files.forEach((file) => {
      if (file) formData.append('files', file);
    });
  }

  const response = await axiosInstance.post('/api/stu/free/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// 7. 자유게시판 글 수정 (PUT /api/stu/free/posts/{postId})
export const updateFreePost = async (postId, { title, content, categoryId, isAnonymous }) => {
  const payload = {};

  if (title !== undefined) payload.title = title;
  if (content !== undefined) payload.content = content;
  if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
    payload.categoryId = Number(categoryId);
  }
  if (isAnonymous !== undefined) payload.isAnonymous = Boolean(isAnonymous);

  const response = await axiosInstance.put(`/api/stu/free/posts/${postId}`, payload);
  return response.data;
};

// 8. 자유게시판 글 삭제 (DELETE /api/stu/free/posts/{postId})
export const deleteFreePost = async (postId) => {
  const response = await axiosInstance.delete(`/api/stu/free/posts/${postId}`);
  return response.data;
};

// 9. 자유게시판 댓글 등록 (POST /api/stu/free/posts/{postId}/comments)
export const createFreeComment = async (postId, { content, isAnonymous = false }) => {
  const response = await axiosInstance.post(`/api/stu/free/posts/${postId}/comments`, {
    content,
    isAnonymous: Boolean(isAnonymous),
    anonymous: Boolean(isAnonymous),
  });
  return response.data;
};

// 10. 자유게시판 댓글 수정 (PUT /api/stu/free/posts/{postId}/comments/{commentId})
export const updateFreeComment = async (postId, commentId, { content, isAnonymous = false }) => {
  const response = await axiosInstance.put(`/api/stu/free/posts/${postId}/comments/${commentId}`, {
    content,
    isAnonymous: Boolean(isAnonymous),
    anonymous: Boolean(isAnonymous),
  });
  return response.data;
};

// 11. 자유게시판 댓글 삭제 (DELETE /api/stu/free/posts/{postId}/comments/{commentId})
export const deleteFreeComment = async (postId, commentId) => {
  const response = await axiosInstance.delete(
    `/api/stu/free/posts/${postId}/comments/${commentId}`
  );
  return response.data;
};
