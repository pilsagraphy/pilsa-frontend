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
