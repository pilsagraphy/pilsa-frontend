// 마이페이지 관련 API 처리
import axiosInstance from '@/apis/axiosInstance';

// 회원 탈퇴 (PATCH /api/user/mypage/withdraw)
export const withdrawAccount = async (password) => {
  const response = await axiosInstance.patch('/api/user/mypage/withdraw', { password });
  return response.data;
};
