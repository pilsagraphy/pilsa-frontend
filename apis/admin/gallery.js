// 관리자 - 운영 관리 > 활동 사진 관리 API (PM 2026-10-10 밤)
import axiosInstance from '@/apis/axiosInstance';

// 1. 학기별 사진 전부 (GET /api/admin/gallery/photos?semester=) [ADMIN] — 숨긴 사진 포함 { semester, semesters[], photos[] }
export const getAdminGalleryPhotos = async (semester) => {
  const response = await axiosInstance.get('/api/admin/gallery/photos', { params: semester ? { semester } : {} });
  return response.data;
};

// 2. 숨기기 / 복원 (PATCH /api/admin/gallery/photos/{photoId}/hide|restore) [ADMIN]
export const hideGalleryPhoto = async (photoId) => {
  const response = await axiosInstance.patch(`/api/admin/gallery/photos/${encodeURIComponent(photoId)}/hide`);
  return response.data;
};
export const restoreGalleryPhoto = async (photoId) => {
  const response = await axiosInstance.patch(`/api/admin/gallery/photos/${encodeURIComponent(photoId)}/restore`);
  return response.data;
};
