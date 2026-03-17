// 명예의 전당 관련 API 처리
import api from '@/apis/axiosInstance';

// 명예의 전당 조회 (GET /api/public/honor)
export const getHonorList = async () => {
    const response = await api.get('/api/public/honor/'); 
    return response.data; 
};