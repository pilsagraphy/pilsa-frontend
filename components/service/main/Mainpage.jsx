'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClockScene from './ClockScene';

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

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = () => {
    if (isAccelerating) return;
    setIsAccelerating(true);

    // 게이트 통과 표시. 세션 쿠키였을 때는 설치형 앱(TWA)을 콜드 스타트할 때마다 쿠키가 사라져
    // 매번 게이트가 다시 떴다 — 1년짜리로 둔다. 지울 때는 max-age=0
    document.cookie = 'pilsa_gate_passed=1; path=/; max-age=31536000';

    // middleware 가 게이트로 돌려보내며 붙인 원래 목적지(?from=/students/...). 알림을 눌러 들어온
    // 사람이 게시글 대신 소개 페이지로 떨어지지 않게 그쪽으로 보낸다. 같은 사이트 안 경로만 허용한다.
    const from = new URLSearchParams(window.location.search).get('from');
    const next = from && from.startsWith('/') && !from.startsWith('//') ? from : '/about/intro';

    // 바늘을 10배로 돌리고 화면을 한 번 번쩍인 뒤 넘어간다
    setFlashOn(true);
    requestAnimationFrame(() => setFlashOn(false));

    timeoutRef.current = setTimeout(() => {
      router.push(next);
    }, 1000);
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
