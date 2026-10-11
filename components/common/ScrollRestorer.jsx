'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// 뒤로가기(popstate)로 돌아온 화면의 스크롤 위치를 되살린다. 레이아웃에 한 번만 둔다.
// Next 도 되살리려 하지만, 내용을 받아 와서 그리는 화면(홈 달력·일정·목록)은 돌아온 순간 아직 짧아서
// 맨 위에 멈춘다 — "게시글 들어갔다가 뒤로가기 누르면 위로 올라가요" (테스터 제보 10/11, 홈 화면).
// 그래서 떠날 때 위치를 주소별로 적어 두고, 돌아오면 화면이 그 높이까지 자랄 때까지 잠깐(최대 2초) 다시 시도한다.
// 사용자가 그 사이 직접 스크롤·터치하면 바로 멈춘다. 게시판 목록(BoardSection)은 자체 복원이 있고 값이 같아 겹쳐도 무방하다.

const RETRY_MS = 2000;
const POP_WINDOW_MS = 1000; // popstate 직후 이 안에 주소가 바뀌면 '뒤로가기로 돌아온 것'으로 본다

const keyOf = () => window.location.pathname + window.location.search;

export default function ScrollRestorer() {
  const pathname = usePathname();
  const positionsRef = useRef(new Map()); // 주소 → 마지막 scrollY
  const currentKeyRef = useRef(null);
  const poppedAtRef = useRef(0);

  // 스크롤할 때마다 지금 주소의 위치를 적는다. 스크롤 이벤트는 다음 프레임에 오므로,
  // 새 화면으로 바뀌며 Next 가 맨 위로 올린 것은 이미 새 주소로 적혀 이전 주소의 값을 덮지 않는다
  useEffect(() => {
    const onScroll = () => {
      if (currentKeyRef.current) positionsRef.current.set(currentKeyRef.current, window.scrollY);
    };
    const onPop = () => {
      poppedAtRef.current = Date.now();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('popstate', onPop);
    };
  }, []);

  useLayoutEffect(() => {
    const key = keyOf();
    currentKeyRef.current = key;

    const popped = Date.now() - poppedAtRef.current < POP_WINDOW_MS;
    poppedAtRef.current = 0;
    const target = positionsRef.current.get(key) ?? 0;
    if (!popped || target <= 0) return undefined;

    let cancelled = false;
    let frame = 0;
    const startedAt = Date.now();
    const stop = () => {
      cancelled = true;
    };
    // 사용자가 손대면 그만둔다 — 내가 스크롤하는데 끌려가면 안 된다
    window.addEventListener('touchstart', stop, { passive: true, once: true });
    window.addEventListener('wheel', stop, { passive: true, once: true });
    window.addEventListener('keydown', stop, { once: true });

    // 맞춘 뒤에도 잠깐(HOLD_MS) 지켜본다 — 늦게 자리를 잡는 이미지나 라우터가 한 번 더 움직일 수 있다
    const HOLD_MS = 500;
    let reachedAt = 0;
    const tick = () => {
      if (cancelled) return;
      const now = Date.now();
      const maxY = document.documentElement.scrollHeight - window.innerHeight;
      if (maxY >= target - 1 && Math.abs(window.scrollY - target) > 1) window.scrollTo(0, target);
      if (Math.abs(window.scrollY - target) <= 1 && !reachedAt) reachedAt = now;
      if (reachedAt && now - reachedAt > HOLD_MS) return;
      if (now - startedAt < RETRY_MS) frame = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      stop();
      cancelAnimationFrame(frame);
      window.removeEventListener('touchstart', stop);
      window.removeEventListener('wheel', stop);
      window.removeEventListener('keydown', stop);
    };
  }, [pathname]);

  return null;
}
