// 공지사항 게시판 관련 API 처리
import authApi from '@/apis/authApi';

// 1. 공지사항 상단 5개 조회 (GET api/stu/notices/top5)
export const getTop5Notices = async () => {
  const response = await authApi.get('/api/stu/notices/top5');
  return response.data;
};

// 2. 공지사항 전체 목록 조회 (GET api/stu/notices?page=1&size=10&keyword=...&sort=created,liked)
export const getNoticeList = async ({
  page = 1,
  size = 10,
  keyword = '',
  sort = 'created',
} = {}) => {
  const params = { page, size, sort };

  if (keyword?.trim()) {
    params.keyword = keyword.trim();
  }

  const response = await authApi.get('/api/stu/notices', { params });
  return response.data;
};

// 3. 공지사항 단일글 조회 (GET api/stu/notices/{postId})
export const getNoticeDetail = async (postId, sort = 'created') => {
  const response = await authApi.get(`/api/stu/notices/${postId}`, {
    params: { sort },
  });
  return response.data;
};

// 4. 공지사항 좋아요 처리 (PATCH api/stu/notices/{postId}/like)
export const toggleNoticeLike = async (postId) => {
  const response = await authApi.patch(`/api/stu/notices/${postId}/like`);
  return response.data;
};
