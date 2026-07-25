// 일정 관련 API 처리
import axiosInstance from '@/apis/axiosInstance';

// 1. 일정 조회 (GET /api/public/schedules?from=YYYY-MM&to=YYYY-MM)
export const getScheduleList = async (from, to) => {
  const response = await axiosInstance.get('/api/public/schedules', {
    params: { from, to },
  });

  return response.data;
};
