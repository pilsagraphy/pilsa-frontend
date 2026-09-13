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
  // iPadOS 는 UA 가 Mac 으로 나온다 — 터치 포인트로 한 번 더 거른다 (lib/platform.js isIOS 와 같은 규칙)
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return navigator.userAgentData?.mobile ?? (/Android|iPhone|iPad/i.test(navigator.userAgent) || iPadOS);
};

// 브라우저가 웹 푸시를 지원하는가
export const isPushSupported = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// "이 기기에서 알림 받기" 토글 노출 조건 (PC 웹 = 알림함만, 토글은 모바일 전용)
export const canShowPushToggle = () => isMobileDevice() && isPushSupported();

// 설치형 안드로이드 앱(Play 스토어 TWA)에서 실행 중인가 — 이 폰의 알림 정본 채널
export const isInstalledAndroidApp = () =>
  isStandalone() && typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

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

// 기기 등록 요청 본문. 설치형 안드로이드 앱이면 replaceOthers 를 실어 같은 폰의 브라우저 구독을 서버가 함께 정리하게 한다
// (apis/notification.js 2번 — 앱이 Chrome 으로 고정되기 전 삼성 인터넷으로 열린 앱이 남긴 구독이 있으면 알림이 두 번 온다)
function registerPayload(subscription) {
  return {
    enabled: true,
    ...(isInstalledAndroidApp() ? { replaceOthers: true } : {}),
    ...subscription.toJSON(),
  };
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

  setPushOptOut(false); // 다시 켰으니 자동 복구 대상으로 되돌린다
  return setNotificationDevice(registerPayload(subscription));
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
  setPushOptOut(true); // 직접 끈 기기 — 로그인할 때 자동으로 되살리지 않는다
  return result;
}

// "이 기기에서는 알림을 받지 않겠다"고 직접 끈 기록.
// 끄면 구독까지 해제하므로, 그 뒤 상태는 "권한은 granted 인데 구독은 없음" 이 되어
// 아직 한 번도 켜 본 적 없는 기기와 구별되지 않는다. 그 둘을 가르는 것이 이 플래그다.
const OPT_OUT_KEY = 'pilsa:pushOptOut';

function isPushOptedOut() {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === '1';
  } catch {
    return false; // 저장소를 못 쓰면 옵트아웃이 없는 것으로 본다
  }
}

function setPushOptOut(value) {
  try {
    if (value) localStorage.setItem(OPT_OUT_KEY, '1');
    else localStorage.removeItem(OPT_OUT_KEY);
  } catch {
    // 저장 실패는 무시 — 최악의 경우 자동 복구가 한 번 더 도는 정도다
  }
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

/**
 * 로그인 직후 — 알림 설정 자동 복구.
 *
 * 권한이 이미 granted 라면 사용자는 "알림을 허용해 뒀다"고 여긴다. 그런데 알림은 계정에 귀속되므로
 * 서버에 기기가 등록돼야 실제로 배달된다. 설치형 앱(TWA)은 앱의 알림 권한이 곧 사이트 권한이라
 * (크롬이 앱을 열 때 앱 권한 상태를 사이트 권한으로 복사한다) 앱 설정에서 알림을 켜고 돌아오면 granted 인데
 * 구독은 없는 상태가 된다 — 그대로 두면 "허용했는데 안 오는" 상태다.
 * 그래서 권한이 granted 면 구독이 없을 때 여기서 만들어 등록까지 끝낸다 —
 * granted 상태의 subscribe() 는 추가로 묻지 않으므로 사용자에게 창이 더 뜨지 않는다.
 *
 * 직접 끈 기기(OPT_OUT)는 건드리지 않는다. 끌 때 구독까지 해제하기 때문에 "권한 granted + 구독 없음"이
 * 되어 한 번도 켜지 않은 기기와 같아 보이는데, 그대로 두면 로그인할 때마다 꺼 둔 알림이 되살아난다.
 */
export function restorePushAfterLogin() {
  restoreAfterLoginPromise = (async () => {
    try {
      if (!isPushSupported()) return;
      if (Notification.permission !== 'granted') return; // 권한이 없으면 유도 바텀시트가 물어본다
      if (isPushOptedOut()) return;

      const registration = await ensureRegistration();
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const { publicKey } = await getVapidPublicKey();
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const { devices } = await getNotificationDevices();
      const registered = (devices ?? []).some((d) => d.endpoint === subscription.endpoint);
      if (!registered) {
        await setNotificationDevice(registerPayload(subscription));
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
  let on = (devices ?? []).some((d) => d.endpoint === subscription.endpoint);

  // 브라우저 구독은 살아 있고 권한도 granted 인데 서버에 그 endpoint 가 없다 =
  // 크롬이 구독을 갱신했거나(endpoint 회전 → 옛 행은 발송 410 으로 서버가 정리) 다른 기기에서 로그아웃한 것.
  // 사용자가 직접 끈 경우에는 unsubscribe() 까지 하므로 구독 자체가 없어 여기 오지 않는다 → 조용히 다시 등록한다.
  // 이게 없으면 구독이 갱신될 때마다 "이 기기에서 알림 받기"가 저절로 꺼진 것처럼 보인다.
  if (!on && Notification.permission === 'granted') {
    try {
      await setNotificationDevice(registerPayload(subscription));
      on = true;
    } catch {
      // 실패하면 꺼진 상태로 보여 준다 — 사용자가 직접 다시 켤 수 있다
    }
  }

  return { on, hasSubscription: true };
}

// ─────────────────────────── 앱 복귀 복구 ───────────────────────────

// 앱으로 돌아왔을 때 알림 권한이 살아났으면 등록까지 끝낸다.
// 설치형 앱(TWA)에서 OS 알림 프롬프트를 한 번 거부하면 Notification.permission 이 'denied' 로 고정되고 웹에서는 다시 물을 수 없다.
// 사용자가 앱 정보 → 알림 에서 직접 켜고 돌아오는 것이 유일한 복구 경로인데, 그때 아무도 구독을 만들지 않으면
// "설정에서 켰는데도 안 온다" 가 된다. 권한이 granted 인데 이 기기 구독이 없을 때만 동작한다(매번 서버를 부르지 않는다).
// 로그인 상태에서만 부를 것 — 서버 등록에 인증이 필요하다.
export async function recoverPushIfNewlyGranted() {
  try {
    if (!isPushSupported()) return;
    if (Notification.permission !== 'granted') return;
    if (isPushOptedOut()) return;
    const registration = await navigator.serviceWorker.getRegistration(SW_PATH);
    const subscription = registration ? await registration.pushManager.getSubscription() : null;
    if (subscription) return; // 구독이 있으면 서버 등록은 로그인 시 restorePushAfterLogin 이 이미 맞췄다
    await restorePushAfterLogin();
  } catch {
    // 조용히 실패
  }
}

// 앱 복귀(visibilitychange)와 권한 변경(permissions.onchange)을 지켜본다. 해제 함수를 돌려준다.
// 크롬 TWA 는 앱 권한 상태를 앱을 다시 켤 때 사이트 권한으로 옮기므로, 설정에서 켜고 바로 돌아온 경우는
// 다음 실행 때 잡힌다 — 그때는 AuthBootstrap 의 restorePushAfterLogin 이 맡는다.
export function watchPushPermissionRecovery() {
  if (typeof document === 'undefined' || !isPushSupported()) return () => {};

  const onVisible = () => {
    if (document.visibilityState === 'visible') recoverPushIfNewlyGranted();
  };
  document.addEventListener('visibilitychange', onVisible);

  let status = null;
  navigator.permissions
    ?.query({ name: 'notifications' })
    .then((result) => {
      status = result;
      result.onchange = () => recoverPushIfNewlyGranted();
    })
    .catch(() => {
      // permissions API 미지원 — visibilitychange 만으로 간다
    });

  return () => {
    document.removeEventListener('visibilitychange', onVisible);
    if (status) status.onchange = null;
  };
}
