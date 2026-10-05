'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

import { openLightbox } from '@/stores/useLightboxStore';

// 꾹 누르기(폰): 이 시간 넘게 누르고 있으면 설명을 띄운다. usePressDrag(300ms)보다 조금 길게 둬서 '탭해서 크게 보기'와 갈린다
const LONG_PRESS_MS = 400;
const MOVE_SLOP_PX = 8; // 이보다 움직이면 스크롤로 본다 (usePressDrag 와 같은 기준)

// gallery / index: 크게 보기에서 앞뒤 사진으로 넘길 수 있게 전체 목록과 이 사진의 자리
const GalleryTile = ({ photo, activeSrc = null, onActivate, gallery = [], index = 0 }) => {
  // 마우스가 있는 기기(웹)인지 여부. SSR/초기값은 데스크톱으로 가정.
  const [canHover, setCanHover] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setCanHover(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // 꾹 누르기 타이머. { x, y, timer } — 기다리는 중이면 값이 있다
  const pressRef = useRef(null);
  // 꾹 눌러 설명을 띄웠으면 뒤따라오는 click 은 크게 보기로 이어지지 않게 막는다
  const longPressedRef = useRef(false);

  const clearPress = () => {
    if (pressRef.current?.timer) clearTimeout(pressRef.current.timer);
    pressRef.current = null;
  };
  useEffect(() => clearPress, []);

  if (!photo) return null;

  const hasCaption = Boolean(photo.title || photo.hashtags?.length);

  // 활성 타일은 부모(Gallery)가 activeSrc 하나로 관리한다 →
  // 새 이미지를 꾹 누르면 이전에 켜둔 캡션은 자동으로 풀리고 이 타일만 켜진다.
  const isActive = activeSrc === photo.imageSrc;

  const handlePointerDown = (event) => {
    // 마우스는 호버로 이미 보인다. 손가락·펜만 꾹 누르기 대상
    if (!hasCaption || event.pointerType === 'mouse' || event.isPrimary === false) return;
    longPressedRef.current = false;
    const timer = setTimeout(() => {
      pressRef.current = null;
      longPressedRef.current = true;
      onActivate?.(photo.imageSrc);
      navigator.vibrate?.(10);
    }, LONG_PRESS_MS);
    pressRef.current = { x: event.clientX, y: event.clientY, timer };
  };

  const handlePointerMove = (event) => {
    const start = pressRef.current;
    if (!start) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > MOVE_SLOP_PX) clearPress();
  };

  // 탭 = 크게 보기 (폰·PC 모두, PM 2026-09-21). 꾹 누르기 = 설명 띄우기 (테스터 요청, 2026-10-05).
  // 크게 보기로 넘어갈 때 타일 캡션은 접는다 — 예전엔 탭이 캡션도 켜서, 크게 보기를 닫고 나온 뒤에야 캡션이
  // 불쑥 보이는 버그가 있었다 ("축소할 때만 설명이 나온다").
  const handleClick = () => {
    clearPress();
    if (longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }
    if (isActive) {
      // 띄워 둔 설명은 한 번 더 누르면 닫힌다
      onActivate?.(null);
      return;
    }
    onActivate?.(null);
    const list = gallery.length ? gallery : [photo];
    openLightbox(
      list.map((item) => ({
        src: item.imageSrc,
        alt: item.title || '활동 사진',
        caption: item.title || '',
        hashtags: item.hashtags ?? [],
      })),
      gallery.length ? index : 0
    );
  };

  return (
    <div
      className="group relative size-full cursor-zoom-in select-none overflow-hidden rounded-[4px] bg-[#D9D9D9] [-webkit-touch-callout:none]"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={clearPress}
      onPointerCancel={clearPress} // 스크롤이 시작되면 브라우저가 이걸 보낸다
      onPointerLeave={clearPress}
      onContextMenu={(event) => event.preventDefault()} // 꾹 누를 때 안드로이드 크롬의 '이미지 저장' 메뉴 차단
    >
      <Image
        src={photo.imageSrc}
        alt={photo.title || '활동 사진'}
        fill
        className="object-cover"
        style={{ objectPosition: photo.objectPosition || 'center' }}
        sizes="(max-width: 768px) 33vw, 20vw"
      />
      {hasCaption && (
        // pointer-events-none: 꾹 누르는 도중 캡션이 떠도 포인터 대상이 타일에서 바뀌지 않게.
        // isActive 가 어느 기기에서든 우선 — 안드로이드 '데스크톱 모드'처럼 hover 판정이 어긋나도 꾹 누르기가 통한다
        <div
          className={`pointer-events-none absolute inset-0 flex flex-col justify-between px-[14px] py-[10px] md:px-[29px] md:py-[24px] bg-black/50 transition-opacity duration-300 ${
            isActive ? 'opacity-100' : canHover ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
          }`}
        >
          {photo.title && (
            <p className="font-['Pretendard:SemiBold',sans-serif] text-[12px] md:text-[16px] text-white leading-[1.5] tracking-[-0.32px] not-italic">
              {photo.title}
            </p>
          )}
          {photo.hashtags?.length > 0 && (
            <p className="font-['Pretendard:Regular',sans-serif] text-[10px] md:text-[12px] text-white leading-[1.5] tracking-[-0.24px] not-italic">
              {photo.hashtags.join(' ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default GalleryTile;
