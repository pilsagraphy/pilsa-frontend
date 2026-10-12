'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

import { openLightbox } from '@/stores/useLightboxStore';

// 꾹 누르기(폰): 이 시간 넘게 누르고 있으면 크게 보기를 연다
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
  // 꾹 눌러 크게 보기를 열었으면 뒤따라오는 click 은 설명 토글로 이어지지 않게 막는다
  const longPressedRef = useRef(false);
  // 마지막으로 누른 게 손가락·펜인지 — 폰과 PC 의 동작이 다르다
  const touchRef = useRef(false);

  const clearPress = () => {
    if (pressRef.current?.timer) clearTimeout(pressRef.current.timer);
    pressRef.current = null;
  };
  useEffect(() => clearPress, []);

  if (!photo) return null;

  const hasCaption = Boolean(photo.title || photo.hashtags?.length);

  // 활성 타일은 부모(Gallery)가 activeSrc 하나로 관리한다 →
  // 다른 사진을 누르면 이전에 켜둔 설명은 자동으로 풀리고 이 타일만 켜진다.
  const isActive = activeSrc === photo.imageSrc;

  const openLarge = () => {
    // 크게 보기로 넘어갈 때 타일 설명은 접는다 — 닫고 나온 뒤 설명이 불쑥 남아 있지 않게
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

  // 폰(손가락·펜): 가볍게 탭 = 제목·설명 켜고 끄기, 꾹 누르기 = 크게 보기 (PM 2026-10-12 — 예전 10/05 와 반대로).
  // PC(마우스): 올리면 설명이 보이고, 클릭 = 크게 보기 (꾹 누르기가 어색한 기기라 그대로)
  const handlePointerDown = (event) => {
    touchRef.current = event.pointerType !== 'mouse';
    if (!touchRef.current || event.isPrimary === false) return;
    longPressedRef.current = false;
    const timer = setTimeout(() => {
      pressRef.current = null;
      longPressedRef.current = true;
      navigator.vibrate?.(10);
      openLarge();
    }, LONG_PRESS_MS);
    pressRef.current = { x: event.clientX, y: event.clientY, timer };
  };

  const handlePointerMove = (event) => {
    const start = pressRef.current;
    if (!start) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > MOVE_SLOP_PX) clearPress();
  };

  const handleClick = () => {
    clearPress();
    if (longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }
    if (!touchRef.current) {
      openLarge();
      return;
    }
    // 설명이 없는 사진은 탭으로 켤 게 없으니 바로 크게 보기
    if (!hasCaption) {
      openLarge();
      return;
    }
    onActivate?.(isActive ? null : photo.imageSrc);
  };

  return (
    <div
      className="group relative size-full cursor-zoom-in select-none overflow-hidden rounded-[4px] bg-line [-webkit-touch-callout:none]"
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
