import { toast as sonner } from 'sonner';

// 사이트 공용 토스트 — sonner 를 감싸 **길이에 따라 머무는 시간**을 정한다 (PM, 2026-09-24).
//
//  - 짧은 안내("저장했습니다")는 1초면 읽는다. 오래 남으면 화면을 가린다.
//  - 긴 문장(구글 연동 안내, "잠시 후 다시 시도해주세요" 류)이나 설명(description)이 붙은 것은 3초.
//  - 호출부가 duration 을 직접 주면 그 값을 쓴다. 어느 쪽이든 손가락으로 쓸어 바로 치울 수 있다(ClientToaster).
//
// 사용법은 sonner 와 같다: import { toast } from '@/lib/toast'; toast.success('…'); toast.error('…', { description })
const SHORT_MS = 1000;
const LONG_MS = 3000;
const LONG_THRESHOLD = 24; // 글자 수 — 한 줄에 다 들어오는 정도까지는 '짧다'

const durationFor = (message, options) => {
  if (options?.duration != null) return options.duration;
  const text = typeof message === 'string' ? message : '';
  const long = text.length > LONG_THRESHOLD || Boolean(options?.description);
  return long ? LONG_MS : SHORT_MS;
};

const withDuration =
  (fn) =>
  (message, options = {}) =>
    fn(message, { ...options, duration: durationFor(message, options) });

export const toast = Object.assign(withDuration(sonner), {
  success: withDuration(sonner.success),
  error: withDuration(sonner.error),
  info: withDuration(sonner.info),
  warning: withDuration(sonner.warning),
  message: withDuration(sonner.message),
  // 아래는 그대로 — loading/promise 는 끝날 때까지 떠 있어야 하고, dismiss/custom 은 시간과 무관하다
  loading: sonner.loading,
  promise: sonner.promise,
  custom: sonner.custom,
  dismiss: sonner.dismiss,
});

export default toast;
