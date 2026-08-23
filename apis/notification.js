// 알림(toast) 관련 API 처리
import axiosInstance from '@/apis/axiosInstance';

// ─────────────────────────── 알림 수신 기기 (절대 수정 금지) ───────────────────────────

// 1. 알림 수신 동의 상태 조회 (GET /api/user/mypage/toast/devices)
//    응답: { deviceCount, devices: [{ endpoint, registeredAt }] }
// 토글 초기값 판정: const on = !!sub && devices.some((d) => d.endpoint === sub.endpoint)
// 서버는 GET 만으로 '지금 이 기기'를 특정할 수 없어(endpoint 를 쿼리에 실으면 액세스 로그에 남는다)
// 목록을 주고 프론트가 대조한다. 브라우저 구독만 믿으면 '토글 켜짐인데 알림 안 옴'이 생긴다
// 암호화 키(p256dh/auth)는 발송 전용이라 내려오지 않는다. deviceCount=0 이면 어디서도 안 받는 상태
export const getNotificationDevices = async () => {
  const response = await axiosInstance.get('/api/user/mypage/toast/devices');
  return response.data;
};

// 2. 알림 수신 동의/거부 통합 토글 (PUT /api/user/mypage/toast/devices)
//    요청 [동의] { enabled: true, endpoint, keys: { p256dh, auth } }  ← subscribe().toJSON() + enabled
//    요청 [거부] { enabled: false, endpoint }                        ← keys 불필요
//    응답: { enabled, deviceCount, message } — 처리 후 상태를 주므로 목록 재조회 불필요
// 등록·해제가 PUT 하나로 통합돼 있다. 원하는 상태만 보내면 되고 두 번 보내도 결과가 같다
// ★토글 OFF 와 로그아웃은 브라우저 처리가 다르다: 둘 다 enabled=false 로 호출하되
//   unsubscribe() 는 토글 OFF 에서만 한다. 로그아웃에서 구독까지 해제하면
//   재로그인 시 복구 근거가 없어 로그인마다 알림이 꺼진다
// 실패: 400 enabled 누락 / 400 endpoint 누락 / 400 enabled=true 인데 keys 누락
export const setNotificationDevice = async (payload, config = {}) => {
  const response = await axiosInstance.put('/api/user/mypage/toast/devices', payload, config);
  return response.data;
};

// 3. 알림 발송 서버 공개키 (GET /api/user/mypage/toast/vapid-key) - 응답: { publicKey }
// pushManager.subscribe 의 applicationServerKey 로 쓴다. 값이 불변이라 상수 보관 가능
export const getVapidPublicKey = async () => {
  const response = await axiosInstance.get('/api/user/mypage/toast/vapid-key');
  return response.data;
};

// ─────────────────────────── 알림함 ───────────────────────────

// 4. 알림 목록 조회 (GET /api/user/mypage/toast)
//    응답: { totalCount, unreadCount, toasts: [{ toastId, type, title, message,
//           targetType, targetId, boardId, isRead, createdAt }] }
// 페이징 없음 — 최근 2개월치 전체가 내려온다. 쿼리 ?unreadOnly=true 로 미읽음만 받을 수도 있다
// type: COMMENT | REPLY | REPORT_RESOLVED | SANCTION | NOTICE
//   (현재 실제 발행되는 건 COMMENT · REPLY 둘뿐 — 나머지는 정의만 있다)
// ★linkUrl 이 없다. 이동 경로는 targetType/targetId/boardId 로 프론트가 조립한다
export const getToastList = async () => {
  const response = await axiosInstance.get('/api/user/mypage/toast');
  return response.data;
};

// 5. 미읽음 개수 (GET /api/user/mypage/toast/unread-count) - 응답: { unreadCount }
// 종 아이콘 뱃지 전용. 집계 범위는 목록·전체읽음과 동일한 최근 2개월
export const getUnreadCount = async () => {
  const response = await axiosInstance.get('/api/user/mypage/toast/unread-count');
  return response.data;
};

// 6. 단건 읽음 (PATCH /api/user/mypage/toast/{toastId}/read)
//    응답: { message, toastId, type, targetType, targetId, boardId, unreadCount }
// 읽음 처리와 이동 정보를 함께 주므로 목록을 다시 부르지 않아도 된다
// 멱등 — 이미 읽은 알림을 다시 호출해도 200 + 동일 응답 (재클릭 시에도 이동해야 한다)
// 실패: 404 없거나 본인 알림이 아님
export const readToast = async (toastId) => {
  const response = await axiosInstance.patch(
    `/api/user/mypage/toast/${encodeURIComponent(toastId)}/read`
  );
  return response.data;
};

// 7. 전체 읽음 (PATCH /api/user/mypage/toast/read-all)
//    응답: { message, updatedCount, unreadCount }
// updatedCount 는 이번 호출로 실제 바뀐 행 수 (이미 다 읽었어도 200, 0)
// ★unreadCount 는 처리 후 실측값이다 — 뱃지에 이 값을 그대로 세팅하고 0 으로 추측하지 않는다
//   (처리 직후 새 알림이 들어오면 0 이 아닐 수 있다)
export const readAllToasts = async () => {
  const response = await axiosInstance.patch('/api/user/mypage/toast/read-all');
  return response.data;
};

// 8. 단건 삭제 (PATCH /api/user/mypage/toast/{toastId}/delete)
//    응답: { message, toastId, unreadCount } — 소프트 삭제
// 지운 알림으로 이동할 일은 없으므로 이동 정보(targetType 등)는 실리지 않는다
// 실패: 404 없거나 본인 알림이 아님
export const deleteToast = async (toastId) => {
  const response = await axiosInstance.patch(
    `/api/user/mypage/toast/${encodeURIComponent(toastId)}/delete`
  );
  return response.data;
};
