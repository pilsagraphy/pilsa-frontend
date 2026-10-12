'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// 뒤로가기·앞으로가기·새로고침으로 돌아온 화면의 스크롤 위치를 되살린다. 레이아웃에 한 번만 둔다 (PM 2026-10-12 "어떤 페이지든").
//
// 브라우저 기본 복원(scrollRestoration auto)에 맡기지 않는다 — 내용을 받아 와서 그리는 화면(홈·마이페이지)은 돌아온 순간 아직 짧아서
// 브라우저가 맨 위나 엉뚱한 곳에 멈추고, 우리 복원과 서로 당겼다 ("마이페이지 > 설정에서 뒤로가기 했는데 보던 위치가 아니야").
// 그래서 manual 로 두고 직접 한다:
//  - 저장: 화면이 바뀌기 직전(useLayoutEffect 정리 = 새 화면이 커밋되는 중, Next 가 맨 위로 올리기 전)에 떠나는 주소의 위치를 적는다.
//    스크롤 이벤트로 적으면 Next 가 새 화면을 맨 위로 올린 스크롤이 어느 주소 것인지 꼬였다. 새로고침 대비로 떠날 때(pagehide)도 적는다.
//  - 복원: popstate(뒤로·앞으로) 로 바뀐 주소이거나 새로고침으로 처음 뜬 경우, 화면이 그 높이까지 자랄 때까지 잠깐(최대 3초) 다시 시도한다.
//    사용자가 그 사이 직접 손대면 바로 멈춘다.
// 게시판 목록(BoardSection)은 자체 복원도 있다 — 같은 값이라 겹쳐도 무방하다.

const STORAGE_KEY = 'pilsaScrollPositions';
const MAX_ENTRIES = 50;
const RETRY_MS = 3000;
const HOLD_MS = 500; // 맞춘 뒤에도 잠깐 지켜본다 — 늦게 자리를 잡는 이미지나 라우터가 한 번 더 움직일 수 있다
const POP_WINDOW_MS = 3000; // popstate 뒤 이 안에 주소가 바뀌면 '뒤로가기로 돌아온 것' (로딩 화면을 거쳐도 넉넉하게)

// 주소별 칸. pathname 은 React(usePathname)가 준 값을 믿고, 쿼리는 주소창이 이미 그 경로일 때만 붙인다
// (주소창 갱신이 커밋보다 늦으면 떠나는 화면의 쿼리가 섞일 수 있다)
const keyOf = (pathname = window.location.pathname) =>
  pathname + (window.location.pathname === pathname ? window.location.search : '');

const readPositions = () => {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};
const savePosition = (key, y) => {
  try {
    const map = readPositions();
    delete map[key]; // 다시 넣어 '최근' 순서로
    map[key] = Math.max(0, Math.round(y));
    const keys = Object.keys(map);
    if (keys.length > MAX_ENTRIES) keys.slice(0, keys.length - MAX_ENTRIES).forEach((k) => delete map[k]);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // 저장소를 못 쓰는 환경 — 복원만 못 할 뿐 화면은 그대로
  }
};

// 첫 로드가 새로고침이나 뒤로·앞으로(다른 사이트에서 돌아옴)인가
const isRestoringLoad = () => {
  try {
    const type = performance.getEntriesByType('navigation')[0]?.type;
    return type === 'reload' || type === 'back_forward';
  } catch {
    return false;
  }
};

export default function ScrollRestorer() {
  const pathname = usePathname();
  const poppedRef = useRef(null); // { at, key } — popstate 시점과 그때 돌아간 주소
  const firstRef = useRef(true);

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    // 주소까지 적어 둔다 — 사진 크게 보기를 닫는 뒤로가기(같은 주소)는 그 주소에서만 의미가 있어, 곧이어 링크로 다른 화면에 가도
    // '뒤로가기로 돌아온 것'으로 착각하지 않는다
    const onPop = () => {
      poppedRef.current = { at: Date.now(), key: keyOf() };
    };
    const onPageHide = () => savePosition(keyOf(), window.scrollY);
    window.addEventListener('popstate', onPop);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.history.scrollRestoration = previous;
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);

  useLayoutEffect(() => {
    const key = keyOf(pathname);
    const first = firstRef.current;
    firstRef.current = false;

    const pop = poppedRef.current;
    const popped = Boolean(pop) && Date.now() - pop.at < POP_WINDOW_MS && pop.key === key;
    if (popped) poppedRef.current = null;
    const target = readPositions()[key] ?? 0;
    const shouldRestore = (popped || (first && isRestoringLoad())) && target > 0;

    let cancelled = false;
    let frame = 0;
    const stop = () => {
      cancelled = true;
    };

    if (shouldRestore) {
      // 사용자가 손대면 그만둔다 — 내가 스크롤하는데 끌려가면 안 된다
      window.addEventListener('touchstart', stop, { passive: true, once: true });
      window.addEventListener('wheel', stop, { passive: true, once: true });
      window.addEventListener('keydown', stop, { once: true });

      const startedAt = Date.now();
      let reachedAt = 0;
      const tick = () => {
        if (cancelled) return;
        const now = Date.now();
        const maxY = document.documentElement.scrollHeight - window.innerHeight;
        // 아직 그 높이가 안 되면 갈 수 있는 데까지라도 내려 둔다 (다 자라면 마저 내려간다)
        const y = Math.min(target, Math.max(0, maxY));
        if (Math.abs(window.scrollY - y) > 1) window.scrollTo(0, y);
        if (maxY >= target - 1 && Math.abs(window.scrollY - target) <= 1) {
          if (!reachedAt) reachedAt = now;
          if (now - reachedAt > HOLD_MS) return;
        } else {
          reachedAt = 0;
        }
        if (now - startedAt < RETRY_MS) frame = requestAnimationFrame(tick);
      };
      tick();
    }

    return () => {
      // 화면이 바뀌기 직전 — 아직 떠나는 화면의 위치다 (새 화면이 그려지며 맨 위로 가기 전)
      savePosition(key, window.scrollY);
      stop();
      cancelAnimationFrame(frame);
      window.removeEventListener('touchstart', stop);
      window.removeEventListener('wheel', stop);
      window.removeEventListener('keydown', stop);
    };
  }, [pathname]);

  return null;
}
