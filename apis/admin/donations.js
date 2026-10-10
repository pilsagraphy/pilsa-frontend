// 관리자 - 운영 관리 > 명예의 전당 관리 API (PM 2026-10-11). 공개 조회는 apis/donation.js
import axiosInstance from '@/apis/axiosInstance';

// 행: { donationId, userId, userName, userLoginId, displayName, amount, affiliation, major, message, donatedAt, isAnonymous, photoUrl }
export const getAdminDonations = async () => (await axiosInstance.get('/api/admin/donations')).data;
export const createDonation = async (body) => (await axiosInstance.post('/api/admin/donations', body)).data;
export const updateDonation = async (donationId, body) =>
  (await axiosInstance.put(`/api/admin/donations/${encodeURIComponent(donationId)}`, body)).data;
export const deleteDonation = async (donationId) =>
  (await axiosInstance.delete(`/api/admin/donations/${encodeURIComponent(donationId)}`)).data;
export const uploadDonationPhoto = async (donationId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post(`/api/admin/donations/${encodeURIComponent(donationId)}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 2 * 60 * 1000,
  });
  return response.data;
};
