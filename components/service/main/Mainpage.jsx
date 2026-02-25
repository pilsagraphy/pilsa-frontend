'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import lottie from 'lottie-web';

export default function Page() {
  const router = useRouter();
  const containerRef = useRef(null);
  const animRef = useRef(null);
  const timeoutRef = useRef(null);

  const [isAccelerating, setIsAccelerating] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    animRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/lottie/clock_hands.json',
    });

    animRef.current.setSpeed(1);

    // ✅ 전체 보이게 (contain)
    animRef.current.addEventListener('DOMLoaded', () => {
      const svg = containerRef.current?.querySelector('svg');
      if (svg) {
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.display = 'block';
      }
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      animRef.current?.destroy();
      animRef.current = null;
    };
  }, []);

  const triggerFlash = () => {
    setFlashOn(true);
    requestAnimationFrame(() => setFlashOn(false));
  };

  const handleClick = () => {
    if (isAccelerating) return;
    setIsAccelerating(true);

    // ✅ 여기서 바로 쿠키 찍기 (세션 쿠키)
    document.cookie = 'pilsa_gate_passed=1; path=/';
    // document.cookie = 'pilsa_gate_passed=; path=/; max-age=0' 하면 쿠키 지워짐

    // ✅ 즉시 10배
    animRef.current?.setSpeed(10);

    triggerFlash();

    // ✅ 1초 후 /intro 이동
    timeoutRef.current = setTimeout(() => {
      router.push('/about/intro');
    }, 1000);
  };

  return (
    <main
      onClick={handleClick}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'grid',
        placeItems: 'center',
        cursor: isAccelerating ? 'default' : 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      <img
        src="/overlay/floating.svg"
        alt=""
        className="floatY"
        style={{
          position: 'absolute',
          left: '51%',
          top: '38%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          width: '650px',
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
        }}
      />
    </main>
  );
}
