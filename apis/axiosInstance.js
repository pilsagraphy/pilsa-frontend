// 모든 요청에 공통으로 들어가는 설정(Base URL, 타임아웃, 헤더)을 한곳에서 관리합니다.

import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080' || 'https://localhost:3000',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;

// 토큰(JWT) - 여기서 인터셉터로 처리할 예정
