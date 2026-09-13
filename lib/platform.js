// 플랫폼 판별 — 기능 지원 여부가 OS 마다 갈리는 곳에서만 쓴다.
//
// 화면 폭으로 판단하지 않는다. PC 에서 창을 좁혀도 안드로이드가 되면 안 된다.
// (lib/push.js 에도 isMobileDevice/isStandalone 이 있다. 그쪽은 알림 전용 판별이라 그대로 둔다)

// iPadOS 는 UA 가 Mac 으로 나오므로 터치 포인트로 한 번 더 거른다
export const isIOS = () => {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

export const isAndroid = () =>
  typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent);

// 안드로이드에서 이 화면을 실제로 그리고 있는 브라우저.
// 설치형 앱(TWA)도 껍데기일 뿐 화면·알림은 브라우저가 맡는다. "○○에서 실행 중" 고지를 띄우는 것도 그쪽이라,
// 안내 문구에 쓸 이름과 설정 화면을 열 패키지명이 필요하다.
// 순서가 중요하다 — 삼성 인터넷·Edge·웨일 모두 UA 에 Chrome 을 함께 달고 있어 Chrome 을 마지막에 본다.
//
// runningNotice 는 그 브라우저가 띄우는 고지 알림의 **실제 문구**다. 확인한 것만 적는다 —
// 화면에 없는 문구를 따옴표로 인용하면 회원이 있지도 않은 항목을 찾게 된다.
// Chrome 것은 회원 제보로 실물을 봤고, 나머지는 아직 확인하지 못해 null 로 둔다(확인되면 채운다).
const ANDROID_BROWSERS = [
  {
    pattern: /SamsungBrowser\//,
    name: '삼성 인터넷',
    pkg: 'com.sec.android.app.sbrowser',
    runningNotice: null,
  },
  { pattern: /EdgA\//, name: 'Edge', pkg: 'com.microsoft.emmx', runningNotice: null },
  { pattern: /Whale\//, name: '웨일', pkg: 'com.naver.whale', runningNotice: null },
  {
    pattern: /Chrome\//,
    name: 'Chrome',
    pkg: 'com.android.chrome',
    runningNotice: 'Chrome에서 실행 중',
  },
];

// { name, pkg, runningNotice } 또는 모르는 브라우저·안드로이드가 아니면 null
export const getAndroidHostBrowser = () => {
  if (!isAndroid()) return null;
  const ua = navigator.userAgent;
  return ANDROID_BROWSERS.find(({ pattern }) => pattern.test(ua)) ?? null;
};
