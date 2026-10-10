// 관리자 - 운영 관리 > 동아리 소개 관리 · 연혁 관리 API (PM 2026-10-11)
import axiosInstance from '@/apis/axiosInstance';

// 소개 문단: 목록 / 추가 / 수정 / 삭제 (소프트)
export const getAdminIntro = async () => (await axiosInstance.get('/api/admin/about/intro')).data;
export const createIntroSection = async (body) => (await axiosInstance.post('/api/admin/about/intro', body)).data;
export const updateIntroSection = async (sectionId, body) =>
  (await axiosInstance.put(`/api/admin/about/intro/${encodeURIComponent(sectionId)}`, body)).data;
export const deleteIntroSection = async (sectionId) =>
  (await axiosInstance.delete(`/api/admin/about/intro/${encodeURIComponent(sectionId)}`)).data;

// 연혁 항목: 평평한 목록 / 추가 / 수정 / 삭제 (소프트) / 사진 올리기({ src })
//   항목: { itemId, year, sortOrder, text, href, video, linkHref, linkLabel, images: [{ src, alt, wide, zoom }] }
export const getAdminHistory = async () => (await axiosInstance.get('/api/admin/about/history')).data;
export const createHistoryItem = async (body) => (await axiosInstance.post('/api/admin/about/history', body)).data;
export const updateHistoryItem = async (itemId, body) =>
  (await axiosInstance.put(`/api/admin/about/history/${encodeURIComponent(itemId)}`, body)).data;
export const deleteHistoryItem = async (itemId) =>
  (await axiosInstance.delete(`/api/admin/about/history/${encodeURIComponent(itemId)}`)).data;
export const uploadHistoryImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post('/api/admin/about/history/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 2 * 60 * 1000,
  });
  return response.data;
};
