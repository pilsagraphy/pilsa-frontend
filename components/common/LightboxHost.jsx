'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import useLightboxStore from '@/stores/useLightboxStore';

// openLightbox 가 띄우는 '크게 보기' 창. 레이아웃에 한 번만 둔다.
// 검은 배경 위에 사진 한 장을 화면에 맞춰 보여 주고, 여러 장이면 화살표·스와이프·방향키로 넘긴다.
// 바깥(검은 곳)을 누르거나 ESC 로 닫는다.
// 설명(caption)·태그가 딸린 사진은 아래에 설명 띠를 그린다 — 띠를 누르면 접고, 다시 누르면 편다.
export default function LightboxHost() {
  const lightbox = useLightboxStore((s) => s.lightbox);
  const setIndex = useLightboxStore((s) => s.setIndex);
  const close = useLightboxStore((s) => s.close);

  const touchStartRef = useRef(null);
  const count = lightbox?.images.length ?? 0;
  const index = lightbox?.index ?? 0;
  const current = lightbox?.images[index];

  // 설명 띠는 열 때·사진을 넘길 때마다 다시 펼친다 (접어 둔 상태가 다음 사진까지 따라가지 않게)
  const [showCaption, setShowCaption] = useState(true);
  useEffect(() => {
    setShowCaption(true);
  }, [lightbox, index]);

  // 사진 확대(핀치·두 번 탭). 페이지 확대를 막은 뒤로(layout viewport maximumScale 1, 방명록 모달 때문) 브라우저 핀치가
  // 먹지 않아 크게 보기에서 사진을 키울 방법이 없었다 (테스터 제보 10/11 "활동사진 누르고 확대가 안돼요").
  // 그래서 여기서 직접 키운다 — 1~4배, 키운 상태에선 한 손가락으로 옮기고 넘기기(스와이프)는 쉰다. 사진을 넘기면 원래 크기로
  const [zoom, setZoom] = useState({ scale: 1, x: 0, y: 0 });
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const gestureRef = useRef(null); // { kind: 'pinch', dist, scale, x, y, mx, my } | { kind: 'pan', sx, sy, x, y }
  const lastTapRef = useRef(0);
  useEffect(() => {
    setZoom({ scale: 1, x: 0, y: 0 });
  }, [lightbox, index]);

  // 폰의 뒤로가기 = 크게 보기 닫기. 설치형 앱에는 다른 뒤로가기 수단이 없어, 사진을 띄운 채 뒤로가기를 누르면
  // 사진은 그대로고 뒤 화면만 넘어갔다 (테스터 제보, 10/10). 열 때 같은 주소로 표시용 엔트리(pilsaLightbox)를 쌓고
  // popstate 로 그것만 소비한다. X·바깥 탭으로 닫으면 엔트리를 back() 으로 치운다 (이동이 없어 안전).
  const closedByPopRef = useRef(false);
  const isOpenRef = useRef(false);
  isOpenRef.current = Boolean(lightbox);
  useEffect(() => {
    const onPop = () => {
      if (!isOpenRef.current) return;
      closedByPopRef.current = true;
      close();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [close]);
  useEffect(() => {
    if (!lightbox) return undefined;
    closedByPopRef.current = false;
    if (!window.history.state?.pilsaLightbox) {
      window.history.pushState({ ...window.history.state, pilsaLightbox: true }, '', window.location.href);
    }
    return () => {
      if (closedByPopRef.current) return;
      if (window.history.state?.pilsaLightbox) window.history.back();
    };
    // 열림/닫힘에만 반응한다 — 사진을 넘길 때(index 변경)는 엔트리를 다시 쌓지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(lightbox)]);

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

  const hasCaption = Boolean(current.caption || current.hashtags?.length);

  const MAX_SCALE = 4;
  const touchDist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

  const onTouchStart = (event) => {
    const z = zoomRef.current;
    // 두 손가락 = 핀치 확대. 넘기기가 아니다
    if (event.touches.length > 1) {
      touchStartRef.current = null;
      const [a, b] = event.touches;
      gestureRef.current = {
        kind: 'pinch',
        dist: touchDist(a, b) || 1,
        scale: z.scale,
        x: z.x,
        y: z.y,
        mx: (a.clientX + b.clientX) / 2,
        my: (a.clientY + b.clientY) / 2,
      };
      return;
    }
    const t = event.touches[0];
    // 키운 상태에서 한 손가락 = 사진 옮기기
    if (z.scale > 1) {
      touchStartRef.current = null;
      gestureRef.current = { kind: 'pan', sx: t.clientX, sy: t.clientY, x: z.x, y: z.y };
      return;
    }
    gestureRef.current = null;
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchMove = (event) => {
    const g = gestureRef.current;
    if (!g) return;
    if (g.kind === 'pinch' && event.touches.length > 1) {
      const [a, b] = event.touches;
      const scale = Math.min(MAX_SCALE, Math.max(1, (g.scale * touchDist(a, b)) / g.dist));
      const mx = (a.clientX + b.clientX) / 2;
      const my = (a.clientY + b.clientY) / 2;
      // 두 손가락 가운데를 따라 옮긴다
      setZoom(scale === 1 ? { scale: 1, x: 0, y: 0 } : { scale, x: g.x + (mx - g.mx), y: g.y + (my - g.my) });
    } else if (g.kind === 'pan' && event.touches.length === 1) {
      const t = event.touches[0];
      setZoom((z) => ({ ...z, x: g.x + (t.clientX - g.sx), y: g.y + (t.clientY - g.sy) }));
    }
  };
  const onTouchEnd = (event) => {
    // 핀치 중 한 손가락만 떼면 남은 손가락으로 이어서 옮긴다
    if (event.touches.length === 1 && zoomRef.current.scale > 1) {
      const t = event.touches[0];
      const z = zoomRef.current;
      gestureRef.current = { kind: 'pan', sx: t.clientX, sy: t.clientY, x: z.x, y: z.y };
      return;
    }
    if (event.touches.length === 0) gestureRef.current = null;
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || count < 2 || zoomRef.current.scale > 1) return;
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
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      // 핀치·옮기기를 직접 처리하므로 브라우저 제스처(확대·당겨서 새로고침)는 끈다
      style={{ touchAction: 'none' }}
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
          {/* 장수 표시. 설명 띠가 있으면 그 위로 올린다 (같은 자리라 겹친다) */}
          <span
            className={`absolute left-1/2 z-20 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-[13px] text-white ${
              hasCaption && showCaption ? 'bottom-[96px]' : 'bottom-4'
            }`}
          >
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
        onClick={(event) => {
          event.stopPropagation();
          // 두 번 탭 = 2배로 키우기 / 원래대로 (PC 는 더블클릭)
          const now = Date.now();
          if (now - lastTapRef.current < 300) {
            lastTapRef.current = 0;
            setZoom((z) => (z.scale > 1 ? { scale: 1, x: 0, y: 0 } : { scale: 2, x: 0, y: 0 }));
          } else {
            lastTapRef.current = now;
          }
        }}
        className="max-h-[calc(100dvh-32px)] max-w-[calc(100vw-32px)] select-none object-contain"
        style={{
          transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
          // 손가락을 따라갈 땐 바로, 두 번 탭으로 바뀔 땐 부드럽게
          transition: gestureRef.current ? 'none' : 'transform 0.2s ease-out',
        }}
        draggable={false}
      />

      {/* 설명 띠 — 누르면 접힌다(사진을 가린다고 느낄 때). 접힌 상태에서도 같은 자리를 누르면 다시 펴진다 */}
      {hasCaption && (
        <div
          className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1 bg-gradient-to-t from-black/80 to-transparent px-4 pt-10 text-center transition-opacity duration-200"
          style={{
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
            opacity: showCaption ? 1 : 0,
          }}
          onClick={(event) => {
            event.stopPropagation(); // 설명을 눌렀다고 창이 닫히면 안 된다
            setShowCaption((v) => !v);
          }}
        >
          {current.caption && (
            <p className="text-[14px] font-semibold leading-[1.5] tracking-[-0.28px] text-white [word-break:keep-all] md:text-[16px]">
              {current.caption}
            </p>
          )}
          {current.hashtags?.length > 0 && (
            <p className="text-[11px] leading-[1.5] tracking-[-0.22px] text-white/80 md:text-[13px]">
              {current.hashtags.join(' ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
