// 알림(toast) 관련 API 처리
import axiosInstance from '@/apis/axiosInstance';

// ─────────────────────────── 알림 수신 기기 (절대 수정 금지) ───────────────────────────

// 1. 알림 수신 동의 상태 조회 (GET /api/user/mypage/toast/devices)
export const getNotificationDevices = async () => {
  const response = await axiosInstance.get('/api/user/mypage/toast/devices');
  return response.data;
};

// 2. 알림 수신 동의/거부 통합 토글 (PUT /api/user/mypage/toast/devices)
export const setNotificationDevice = async (payload, config = {}) => {
  const response = await axiosInstance.put('/api/user/mypage/toast/devices', payload, config);
  return response.data;
};

// 3. 알림 발송 서버 공개키 (GET /api/user/mypage/toast/vapid-key)
export const getVapidPublicKey = async () => {
  const response = await axiosInstance.get('/api/user/mypage/toast/vapid-key');
  return response.data;
};

// ─────────────────────────── 알림함 ───────────────────────────

// 4. 알림 목록 조회 (GET /api/user/mypage/toast)
export const getToastList = async () => {
  const response = await axiosInstance.get('/api/user/mypage/toast');
  return response.data;
};

// 5. 미읽음 개수 (GET /api/user/mypage/toast/unread-count)
export const getUnreadCount = async () => {
  const response = await axiosInstance.get('/api/user/mypage/toast/unread-count');
  return response.data;
};

// 6. 단건 읽음 (PATCH /api/user/mypage/toast/{toastId}/read)
export const readToast = async (toastId) => {
  const response = await axiosInstance.patch(
    `/api/user/mypage/toast/${encodeURIComponent(toastId)}/read`
  );
  return response.data;
};

// 7. 전체 읽음 (PATCH /api/user/mypage/toast/read-all)
export const readAllToasts = async () => {
  const response = await axiosInstance.patch('/api/user/mypage/toast/read-all');
  return response.data;
};

// 8. 단건 삭제 (PATCH /api/user/mypage/toast/{toastId}/delete)
export const deleteToast = async (toastId) => {
  const response = await axiosInstance.patch(
    `/api/user/mypage/toast/${encodeURIComponent(toastId)}/delete`
  );
  return response.data;
};
