// 동아리 소개 · 연혁 — 공개 조회 (PM 2026-10-11, 예전 constants/intro.js · history.js 대체). 편집은 apis/admin/about.js
import axiosInstance from '@/apis/axiosInstance';
import { apiUrl } from '@/lib/apiBase';

// 1. 소개 문단 (GET /api/intro) [PUBLIC] — [{ sectionId, title, content, sortOrder }]
export const getIntro = async () => {
  const response = await axiosInstance.get('/api/intro');
  return response.data;
};

// 2. 연혁 (GET /api/history) [PUBLIC] — [{ year, activities: [{ itemId, text, href, video, linkHref, linkLabel, images: [{ src, alt, wide, zoom }] }] }]
//    연도 오름차순. images[].src 가 /api/.. 면 서버 사진(apiUrl 로 감싼다), /history/.. 면 프론트 정적 파일
export const getHistory = async () => {
  const response = await axiosInstance.get('/api/history');
  return response.data;
};

export const historyImageSrc = (src) => (src?.startsWith('/api/') ? apiUrl(src) : src);
