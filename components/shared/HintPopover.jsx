'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

// 물음표(i) 를 눌렀을 때 뜨는 설명 풍선.
//
// 두 가지를 직접 처리한다. 그냥 absolute 로 붙이면 둘 다 깨졌다:
//  1) 화면 밖으로 나가는 것 — 버튼이 오른쪽 끝에 있으면 풍선이 창 밖으로 밀려 잘렸다.
//     그래서 버튼의 실제 좌표를 재서 창 안쪽(양옆 12px)으로 가두고, 아래쪽 자리가 모자라면 위로 띄운다.
//  2) 잘려 나가는 것 — 카드가 overflow-hidden 이거나 가로 스크롤 안에 있으면 풍선이 그 상자에 갇혔다.
//     그래서 body 에 붙여(portal) 어느 상자에도 속하지 않게 한다.
//
// PC 는 마우스를 올리면, 폰은 눌러서 띄운다. 스크롤하거나 창 크기가 바뀌면 닫는다 —
// 따라다니게 만들면 떠 있는 동안 계속 좌표를 다시 재야 해서 오히려 덜컥거린다.

// 마우스처럼 '올려 두기'가 되는 기기인가 (폰·태블릿은 아니다)
const canHover = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const WIDTH = 240; // 풍선 최대 너비
const MARGIN = 12; // 창 가장자리에서 띄울 거리
const GAP = 8; // 버튼과 풍선 사이

export default function HintPopover({ label = '설명', children, className = '' }) {
  const anchorRef = useRef(null);
  const [pos, setPos] = useState(null); // null 이면 닫힘

  const place = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // 창이 풍선보다 좁을 수도 있다 (작은 폰)
    const width = Math.min(WIDTH, vw - MARGIN * 2);

    // 버튼 가운데에 맞추되, 양쪽 끝을 넘지 않게 민다
    const centered = rect.left + rect.width / 2 - width / 2;
    const left = Math.max(MARGIN, Math.min(centered, vw - width - MARGIN));

    // 아래에 자리가 없으면 버튼 위로 올린다
    const below = vh - rect.bottom;
    const placeAbove = below < 120 && rect.top > below;

    setPos({
      left,
      width,
      top: placeAbove ? undefined : rect.bottom + GAP,
      bottom: placeAbove ? vh - rect.top + GAP : undefined,
      placeAbove,
      // 꼬리는 버튼 가운데를 가리킨다 (풍선이 밀려도 어긋나지 않게 풍선 기준으로 다시 계산)
      arrowLeft: Math.max(10, Math.min(rect.left + rect.width / 2 - left, width - 10)),
    });
  }, []);

  const open = () => place();
  const close = () => setPos(null);

  useEffect(() => {
    if (!pos) return undefined;

    // 스크롤·창 크기 변경이면 좌표가 이미 어긋났다 — 따라다니는 대신 닫는다
    const onLeave = () => setPos(null);
    window.addEventListener('scroll', onLeave, true);
    window.addEventListener('resize', onLeave);
    return () => {
      window.removeEventListener('scroll', onLeave, true);
      window.removeEventListener('resize', onLeave);
    };
  }, [pos]);

  useEffect(() => {
    if (!pos) return undefined;

    // 폰에서 눌러 띄운 풍선은 바깥을 한 번 누르면 닫힌다
    const onPointerDown = (event) => {
      if (!anchorRef.current?.contains(event.target)) setPos(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [pos]);

  const bubble =
    pos && typeof document !== 'undefined'
      ? createPortal(
          <span
            role="tooltip"
            style={{
              position: 'fixed',
              left: pos.left,
              top: pos.top,
              bottom: pos.bottom,
              width: pos.width,
            }}
            className="z-[80] rounded-[6px] bg-[#212121] px-3 py-2 text-[12px] font-normal leading-[1.6] tracking-[-0.02em] text-white shadow-[0_6px_20px_rgba(0,0,0,0.18)]"
          >
            <span
              aria-hidden
              style={{ left: pos.arrowLeft }}
              className={`absolute size-[8px] -translate-x-1/2 rotate-45 bg-[#212121] ${
                pos.placeAbove ? '-bottom-[4px]' : '-top-[4px]'
              }`}
            />
            {children}
          </span>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        aria-label={label}
        aria-expanded={Boolean(pos)}
        onClick={() => (pos ? close() : open())}
        // 마우스가 있는 기기에서만 올려서 연다. 폰은 첫 탭에 mouseenter 가 흉내로 먼저 와서 열렸다가
        // 곧이어 click 이 닫아 버려 두 번 눌러야 떴다 — 손가락에는 click 만 남긴다
        onMouseEnter={() => canHover() && open()}
        onMouseLeave={() => canHover() && close()}
        onFocus={() => canHover() && open()}
        onBlur={() => canHover() && close()}
        className={`grid size-5 place-items-center rounded-full text-[#B9B9B9] transition hover:bg-[#F5F5F5] hover:text-[#757575] ${className}`}
      >
        <Info size={16} strokeWidth={1.5} />
      </button>
      {bubble}
    </>
  );
}
