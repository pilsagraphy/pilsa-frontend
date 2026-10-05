'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zen_Dots } from 'next/font/google';
import ClockScene from './ClockScene';
import useAuthStore, { AUTO_LOGIN_KEY } from '@/stores/useAuthStore';
import { ROUTES } from '@/constants/routes';
import { sanitizeReturnTo } from '@/lib/returnTo';

// 헤더 로고와 같은 서체 — 안내 문구가 로고의 일부처럼 보이게
const zenDots = Zen_Dots({ weight: '400', subsets: ['latin'] });

/**
 * 게이트 화면. 클릭하면 통과 쿠키를 심고 소개 페이지로 넘어간다
 * (middleware 가 pilsa_gate_passed 쿠키를 보고 다른 경로를 열어 준다).
 *
 * 배경 시계는 Lottie 였다가 ClockScene(SVG+CSS)으로 바꿨다 — 고정 캔버스를 contain 으로
 * 맞추느라 화면비가 다르면 사방에 흰 여백이 생겼고, 무료 플랜 워터마크도 함께 실렸다.
 */
export default function Page() {
  const router = useRouter();
  const timeoutRef = useRef(null);

  const [isAccelerating, setIsAccelerating] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  // middleware 가 게이트로 돌려보내며 붙인 원래 목적지(?from=/students/...). 알림을 눌러 들어온
  // 사람이 게시글 대신 소개 페이지로 떨어지지 않게 그쪽으로 보낸다. 같은 사이트 안 경로만 허용한다.
  const fromPathRef = useRef(null);

  useEffect(() => {
    // ?launch=app / ?from= 은 "이번 한 번 시계를 보여라" 는 1회용 신호다. 주소에 그대로 두면 이 히스토리 엔트리가
    // 영구히 게이트가 돼(middleware 는 launch 가 붙은 / 를 쿠키와 상관없이 게이트로 둔다) 뒤로가기로 돌아올 때마다
    // 시계가 다시 나오고, 옛 from 으로 엉뚱한 화면에 떨어졌다 (테스터 제보, 2026-10-04). 읽은 뒤 주소에서 지운다.
    const url = new URL(window.location.href);
    fromPathRef.current = sanitizeReturnTo(url.searchParams.get('from'));
    if (url.searchParams.has('launch') || url.searchParams.has('from')) {
      url.searchParams.delete('launch');
      url.searchParams.delete('from');
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = () => {
    if (isAccelerating) return;
    setIsAccelerating(true);

    // 게이트 통과 표시(세션 쿠키). 앱 안에서 / 로 다시 오면 middleware 가 이 쿠키를 보고 소개 페이지로 넘긴다.
    // "앱을 켤 때마다 시계 한 번"은 쿠키 수명이 아니라 앱의 시작 URL(/?launch=app)로 구분한다 — 크롬은 앱을
    // 껐다 켜도 세션 쿠키를 복원하기 때문(middleware.js 참고). 지울 때는 max-age=0
    document.cookie = 'pilsa_gate_passed=1; path=/';

    const fromPath = fromPathRef.current;

    // 바늘을 10배로 돌리고 화면을 한 번 번쩍인 뒤 넘어간다
    setFlashOn(true);
    requestAnimationFrame(() => setFlashOn(false));

    // 자동 로그인으로 들어온 회원은 소개 페이지가 아니라 메인(회원 대시보드)으로 (PM, 2026-09-21).
    // 세션 복원(AuthBootstrap)은 게이트에서 비동기로 도는 중일 수 있어, 넘어가는 순간의 상태를 보고
    // 자동 로그인 표시는 있는데 아직 복원이 안 끝났으면 잠깐(최대 2초) 기다린다
    const wantsAutoLogin = (() => {
      try {
        return localStorage.getItem(AUTO_LOGIN_KEY) === '1';
      } catch {
        return false;
      }
    })();
    const destination = () =>
      fromPath ?? (useAuthStore.getState().isLoggedIn ? ROUTES.STUDENTS_DASHBOARD : ROUTES.ABOUT_INTRO);

    const go = (waitedMs) => {
      if (!fromPath && wantsAutoLogin && !useAuthStore.getState().isLoggedIn && waitedMs < 2000) {
        timeoutRef.current = setTimeout(() => go(waitedMs + 100), 100);
        return;
      }
      // 게이트는 지나가는 화면이다 — push 로 쌓으면 뒤로가기가 시계로 돌아오고, 시계가 다시 push 해서
      // 영원히 못 빠져나왔다(테스터 제보 "시계가 계속 반복", 2026-10-04). 엔트리를 바꿔치기해서 뒤로가기가 시계를 건너뛰게 한다.
      router.replace(destination());
    };

    timeoutRef.current = setTimeout(() => go(0), 1000);
  };

  return (
    <main
      onClick={handleClick}
      style={{
        width: '100vw',
        height: '100dvh',
        display: 'grid',
        placeItems: 'center',
        cursor: isAccelerating ? 'default' : 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <ClockScene speed={isAccelerating ? 10 : 1} />

      <img
        src="/overlay/floating.svg"
        alt="PILSAGRAPHY"
        className="floatY"
        style={{
          position: 'absolute',
          left: '50%',
          top: '47%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          // 다이얼과 같은 vmin 기준이라 화면비가 바뀌어도 항상 원 안에 들어온다
          // (다이얼 지름이 88vmin 이므로 그 70% 남짓)
          width: 'min(64vmin, 660px)',
          height: 'auto',
          zIndex: 5,
        }}
      />

      {/* 안내 문구 — 시계만 돌고 있으면 "무한 로딩" 으로 오해한다는 피드백. 탭하면 넘어간다는 걸 알려 준다.
          누르는 순간 사라지고(가속 시작), 클릭은 main 이 받으므로 pointer-events 를 끊는다 */}
      <div
        aria-hidden
        className={`${zenDots.className} gateHint${isAccelerating ? ' gateHint--hidden' : ''}`}
      >
        <span className="gateHint__ring" />
        TAP TO START
      </div>

      {/* Flash overlay */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: '#fff',
          opacity: flashOn ? 0.85 : 0,
          transition: 'opacity 420ms ease-out',
          zIndex: 10,
        }}
      />
    </main>
  );
}
