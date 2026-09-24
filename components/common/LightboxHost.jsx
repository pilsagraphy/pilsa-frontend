'use client';

import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import useLightboxStore from '@/stores/useLightboxStore';

// openLightbox 가 띄우는 '크게 보기' 창. 레이아웃에 한 번만 둔다.
// 검은 배경 위에 사진 한 장을 화면에 맞춰 보여 주고, 여러 장이면 화살표·스와이프·방향키로 넘긴다.
// 바깥(검은 곳)을 누르거나 ESC 로 닫는다.
export default function LightboxHost() {
  const lightbox = useLightboxStore((s) => s.lightbox);
  const setIndex = useLightboxStore((s) => s.setIndex);
  const close = useLightboxStore((s) => s.close);

  const touchStartRef = useRef(null);
  const count = lightbox?.images.length ?? 0;
  const index = lightbox?.index ?? 0;
  const current = lightbox?.images[index];

  // 키보드: ESC 닫기, ←/→ 넘기기. 떠 있는 동안 뒤 페이지 스크롤은 잠근다
  useEffect(() => {
    if (!lightbox) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') close();
      else if (event.key === 'ArrowLeft' && count > 1) setIndex(index - 1);
      else if (event.key === 'ArrowRight' && count > 1) setIndex(index + 1);
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightbox, count, index, close, setIndex]);

  if (!lightbox || !current) return null;

  const onTouchStart = (event) => {
    const t = event.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (event) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || count < 2) return;
    const t = event.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy) * 1.5) return;
    setIndex(dx < 0 ? index + 1 : index - 1);
  };

  const navButtonClass =
    'absolute top-1/2 z-10 flex size-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="이미지 크게 보기"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90"
      onClick={close}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        type="button"
        onClick={close}
        aria-label="닫기"
        className="absolute right-3 top-3 z-10 flex size-[44px] items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30"
        style={{ top: 'calc(12px + env(safe-area-inset-top, 0px))' }}
      >
        <X size={22} strokeWidth={2} />
      </button>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="이전 사진"
            className={`${navButtonClass} left-3`}
            onClick={(event) => {
              event.stopPropagation();
              setIndex(index - 1);
            }}
          >
            <ChevronLeft size={26} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="다음 사진"
            className={`${navButtonClass} right-3`}
            onClick={(event) => {
              event.stopPropagation();
              setIndex(index + 1);
            }}
          >
            <ChevronRight size={26} strokeWidth={2} />
          </button>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-[13px] text-white">
            {index + 1} / {count}
          </span>
        </>
      )}

      {/* 사진 자체를 눌러도 닫히지 않게 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={current.src}
        src={current.src}
        alt={current.alt ?? ''}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[calc(100dvh-32px)] max-w-[calc(100vw-32px)] select-none object-contain"
        draggable={false}
      />
    </div>
  );
}
