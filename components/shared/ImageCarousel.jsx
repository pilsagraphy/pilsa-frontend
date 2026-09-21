'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { openLightbox } from '@/stores/useLightboxStore';

// 이미지 여러 장을 한 장씩 옆으로 넘겨 보는 띠. 한 장이면 그냥 한 장.
// 아래로 죽 나열하면 사진이 많을 때 스크롤이 길어진다 (PM, 2026-09-21). 누르면 크게 보기(라이트박스).
//
// images: [{ src, alt }]. 스크롤 스냅으로 손가락·트랙패드로 넘기고, PC 는 양옆 화살표.
export default function ImageCarousel({ images = [], className = '' }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const count = images.length;

  // 스크롤 위치로 현재 장을 계산한다 (점 표시·화살표용)
  useEffect(() => {
    const el = trackRef.current;
    if (!el || count < 2) return undefined;
    const onScroll = () => setIndex(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [count]);

  if (!count) return null;

  const scrollTo = (next) => {
    const el = trackRef.current;
    if (!el) return;
    const target = (next + count) % count;
    el.scrollTo({ left: target * el.clientWidth, behavior: 'smooth' });
  };

  const navButtonClass =
    'absolute top-1/2 z-10 hidden size-[36px] -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#212121] shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition hover:bg-white md:flex';

  return (
    <div className={`relative w-full ${className}`}>
      <div
        ref={trackRef}
        className="flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, i) => (
          <button
            key={`${image.src}-${i}`}
            type="button"
            onClick={() => openLightbox(images, i)}
            aria-label={`${image.alt || '이미지'} 크게 보기`}
            className="flex w-full shrink-0 snap-center items-center justify-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt ?? ''}
              loading={i === 0 ? 'eager' : 'lazy'}
              className="max-h-[420px] w-auto max-w-full cursor-zoom-in rounded-[6px] border border-[#EDEDED] object-contain"
            />
          </button>
        ))}
      </div>

      {count > 1 && (
        <>
          <button type="button" aria-label="이전 사진" onClick={() => scrollTo(index - 1)} className={`${navButtonClass} left-2`}>
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <button type="button" aria-label="다음 사진" onClick={() => scrollTo(index + 1)} className={`${navButtonClass} right-2`}>
            <ChevronRight size={20} strokeWidth={2} />
          </button>
          <div className="mt-2 flex justify-center gap-[6px]" aria-hidden>
            {images.map((_, i) => (
              <span
                key={i}
                className={`size-[6px] rounded-full transition-colors ${i === index ? 'bg-[#212121]' : 'bg-[#DEDEDE]'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
