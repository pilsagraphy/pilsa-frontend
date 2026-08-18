// 모든 요청에 공통으로 들어가는 설정(Base URL, 타임아웃, 헤더)을 한곳에서 관리합니다.
import axios from 'axios';
import useAuthStore from '@/stores/useAuthStore';
import { PUBLIC_ROUTES } from '@/constants/routes';
import { refreshAccessToken } from '@/apis/auth';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  timeout: 5000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// [요청 인터셉터] 토큰이 있으면 자동으로 붙여줌
axiosInstance.interceptors.request.use((config) => {
  // 1. 토큰이 필요 없는 URL 패턴인지 확인
  // config.url이 PUBLIC_ROUTES 중 하나로 시작하는지 체크합니다.
  const isPublicRoute = PUBLIC_ROUTES.some((route) => config.url.startsWith(route));

  // 2. 로그인/회원가입 등 /api/auth로 시작하는 API도 예외 처리 (백엔드 설정과 동기화)
  const isAuthApi = config.url?.startsWith('/api/auth');
  // 공용 API이거나 인증 관련 API라면 토큰을 붙이지 않고 그대로 내보냄
  if (isPublicRoute || isAuthApi) {
    return config;
  }

  // 3. 그 외의 비공개(Private) 요청에만 토큰 부착
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// [응답 인터셉터] 토큰 만료 시 자동 재발급 로직
axiosInstance.interceptors.response.use(
  (response) => response, // 성공 시 그대로 반환
  async (error) => {
    const originalRequest = error.config;
    const response = error.response;

    if (!response) return Promise.reject(error);

    const { status, headers } = response;

    // 백엔드 설정: 401 에러 + X-Token-Expired 헤더가 '1'인 경우
    // _skipAuthRefresh: 로그아웃 직전 뒷정리(알림 기기 해제 등) 요청용 —
    if (
      status === 401 &&
      headers['x-token-expired'] === '1' &&
      !originalRequest._retry &&
      !originalRequest._skipAuthRefresh &&
      !originalRequest.url?.startsWith('/api/auth/token/access/refresh')
    ) {
      originalRequest._retry = true;

      try {
        // 1. 토큰 재발급 요청
        const data = await refreshAccessToken();
        const newAccessToken = data.accessToken;

        // 2. Zustand 스토어 업데이트
        useAuthStore.getState().setAccessToken(newAccessToken);

        // 3. 원래 실패했던 요청의 헤더를 새 토큰으로 교체 후 재시도
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // 재발급 실패 시 (리프레시 토큰도 만료된 경우) 로그아웃 처리
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
