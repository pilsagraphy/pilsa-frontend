// 웹 푸시(OS 알림)를 켜고/끄는 클라이언트 로직 (push-sw.js 를 서비스 워커로 등록해서 사용)
//
// 핵심 규칙 요약
//  - 노출 판별은 "화면 폭"이 아니라 기기/환경으로 한다 (PC에서 창을 좁혀도 새면 안 됨)
//  - 토글 ON  : 서버 등록(PUT enabled:true) — 권한 요청은 반드시 클릭 핸들러 안에서
//  - 토글 OFF : 서버 먼저(PUT enabled:false) → 브라우저 unsubscribe() 나중
//  - 로그아웃 : 서버 행만 지우고 unsubscribe()는 하지 않는다 (재로그인 자동 복구의 유일한 근거)
//  - 로그인 직후: 구독이 살아있고 권한이 granted면 서버에 조용히 재등록 (사용자에게 묻지 않음)
import {
  getNotificationDevices,
  setNotificationDevice,
  getVapidPublicKey,
} from '@/apis/notification';

// 서비스 워커는 자기가 놓인 경로 아래만 제어하므로 반드시 public/ 루트에 둔다
const SW_PATH = '/push-sw.js';

// ─────────────────────────── 환경 판별 ───────────────────────────

// 설치된 앱 창(standalone)으로 실행 중인가 — 진입 경로와 무관
export const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true // 구형 iOS 사파리 보완
  );
};

// 모바일 기기인가 — UA 기반 (화면 폭으로 모바일 판단 금지)
export const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return navigator.userAgentData?.mobile ?? /Android|iPhone|iPad/i.test(navigator.userAgent);
};

// 브라우저가 웹 푸시를 지원하는가
export const isPushSupported = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// "이 기기에서 알림 받기" 토글 노출 조건 (PC 웹 = 알림함만, 토글은 모바일 전용)
export const canShowPushToggle = () => isMobileDevice() && isPushSupported();

// ─────────────────────────── 내부 유틸 ───────────────────────────

// VAPID 공개키(base64url) → applicationServerKey 바이트 배열
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function ensureRegistration() {
  // register는 멱등 — 이미 등록돼 있으면 기존 registration 반환
  return navigator.serviceWorker.register(SW_PATH);
}

async function getCurrentSubscription() {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

// ─────────────────────────── 토글 동작  ───────────────────────────

// 토글 ON (= 유도 바텀시트의 [알림 켜기]) — 반드시 클릭 핸들러 안에서 호출할 것
// 반환: { enabled, deviceCount, message } / 권한 거부 시 Error('PERMISSION_DENIED')
export async function enablePushOnThisDevice() {
  const registration = await ensureRegistration();

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    // 차단 처리는 이 한 줄이 전부 — 전용 화면을 만들지 않는다 (PM 확정)
    const error = new Error('PERMISSION_DENIED');
    error.code = 'PERMISSION_DENIED';
    throw error;
  }

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const { publicKey } = await getVapidPublicKey();
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  return setNotificationDevice({ enabled: true, ...subscription.toJSON() });
}

// 토글 OFF (사용자가 직접 끔) — 서버 먼저, 브라우저 나중.
// unsubscribe()를 먼저 하면 endpoint를 잃어 서버에 어느 기기를 끄라고 말할 수 없다.
export async function disablePushOnThisDevice() {
  const subscription = await getCurrentSubscription();
  if (!subscription) return null;

  const result = await setNotificationDevice({
    enabled: false,
    endpoint: subscription.endpoint,
  });
  await subscription.unsubscribe(); // 사용자가 끈 경우에만 구독까지 해제
  return result;
}

// 로그아웃 시 — 서버 행만 지운다 (로그아웃 중 알림이 배달되면 공용 기기에서 남의 알림이 뜨게 되므로).
// 재로그인 시 알림 자동 복구(restorePushAfterLogin)의 근거가 됨.
export async function disablePushForLogout() {
  try {
    const subscription = await getCurrentSubscription();
    if (!subscription) return;
    // _skipAuthRefresh: 토큰이 이미 만료된 상태라면 재발급 실패 → 강제 /login 리다이렉트로
    // 로그아웃 흐름(?logout=1)이 끊기므로, 이 요청만은 재발급을 시도하지 않고 조용히 실패시킨다
    await setNotificationDevice(
      { enabled: false, endpoint: subscription.endpoint },
      { _skipAuthRefresh: true }
    );
  } catch {
    // 실패해도 로그아웃 자체는 진행
  }
}

// 로그인 직후 복구 작업의 진행 상태
let restoreAfterLoginPromise = null;
export function getRestoreAfterLoginPromise() {
  return restoreAfterLoginPromise;
}

// 로그인 직후 — 알림 설정 자동 복구
export function restorePushAfterLogin() {
  restoreAfterLoginPromise = (async () => {
    try {
      if (!isPushSupported()) return;
      const subscription = await getCurrentSubscription();
      if (!subscription || Notification.permission !== 'granted') return;

      const { devices } = await getNotificationDevices();
      const registered = (devices ?? []).some((d) => d.endpoint === subscription.endpoint);
      if (!registered) {
        await setNotificationDevice({ enabled: true, ...subscription.toJSON() });
      }
    } catch {
      // 조용히 실패
    }
  })();
  return restoreAfterLoginPromise;
}

// 토글 초기 상태 조회 — 서버에 등록돼 있는지 여부와 현재 권한 상태를 함께 반환
export async function getPushToggleState() {
  const subscription = await getCurrentSubscription();
  if (!subscription) return { on: false, hasSubscription: false };

  const { devices } = await getNotificationDevices();
  const on = (devices ?? []).some((d) => d.endpoint === subscription.endpoint);
  return { on, hasSubscription: true };
}
