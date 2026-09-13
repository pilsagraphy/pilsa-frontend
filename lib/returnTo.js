// 로그인 뒤 돌아갈 경로 (returnTo).
//
// 알림을 눌러 게시글 딥링크로 들어왔는데 세션이 없으면(리프레시 쿠키 만료 등) AuthGuard 가 /login 으로 보낸다.
// 이때 원래 경로를 잃으면 로그인 뒤 /students 에 떨어져 "알림을 눌렀는데 첫 화면" 이 된다.
// 경로는 쿼리(?returnTo=)와 sessionStorage 양쪽에 둔다 — 구글 로그인은 서버·구글을 거쳐 /login?login=google 로
// 돌아오므로 쿼리가 유실되고 sessionStorage 만 살아남는다.
import { ROUTES } from '@/constants/routes';

export const RETURN_TO_PARAM = 'returnTo';
const STORAGE_KEY = 'pilsa:returnTo';

// 같은 사이트 안의 경로만 허용한다(열린 리다이렉트 방지). 게이트·로그인으로 되돌아가는 값은 의미가 없어 버린다
export function sanitizeReturnTo(value) {
  if (typeof value !== 'string') return null;
  // '//host' 는 프로토콜 상대 URL, '/\' 는 브라우저가 '//' 로 정규화한다 — 둘 다 외부로 나갈 수 있어 막는다
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null;
  if (value === ROUTES.GATE || value.startsWith(ROUTES.LOGIN)) return null;
  return value;
}

// 지금 보고 있는 경로 — 쿼리까지 (?toastId= 가 살아 있어야 로그인 뒤 알림 읽음 처리까지 이어진다)
export function currentPathForReturn() {
  if (typeof window === 'undefined') return null;
  return window.location.pathname + window.location.search;
}

export function stashReturnTo(path) {
  const safe = sanitizeReturnTo(path);
  try {
    if (safe) sessionStorage.setItem(STORAGE_KEY, safe);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장소를 못 쓰면 쿼리만으로 간다
  }
}

// 로그인 URL 만 만든다 (저장소는 건드리지 않는다) — <Link href> 처럼 렌더 중에 계산되는 곳에서 쓴다.
// 클릭 시점에 stashReturnTo 를 따로 불러 주면 구글 로그인처럼 쿼리가 사라지는 경로도 복구된다
export function loginHref(path) {
  const safe = sanitizeReturnTo(path);
  if (!safe) return ROUTES.LOGIN;
  return `${ROUTES.LOGIN}?${RETURN_TO_PARAM}=${encodeURIComponent(safe)}`;
}

// 비로그인 상태로 밀려날 때 쓰는 로그인 URL. 원래 경로를 쿼리와 sessionStorage 에 함께 남긴다
export function loginUrlWithReturnTo(path) {
  const safe = sanitizeReturnTo(path);
  stashReturnTo(safe);
  return loginHref(safe);
}

// 로그인 성공 직후 — 돌아갈 경로를 꺼낸다(1회용). 없으면 null
export function takeReturnTo(searchParams) {
  const fromQuery = sanitizeReturnTo(searchParams?.get?.(RETURN_TO_PARAM));
  let fromStorage = null;
  try {
    fromStorage = sanitizeReturnTo(sessionStorage.getItem(STORAGE_KEY));
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return fromQuery ?? fromStorage;
}
