'use client';

import { useEffect, useRef, useState } from 'react';

// 손가락: 꾹 누른 뒤 끌기로 인정하는 시간. 스크롤하려고 손을 댄 것과 구분한다.
// 마우스: 기다릴 이유가 없다 — 누르는 즉시 든다 (표에서 끌던 손맛 그대로)
const HOLD_MS = 300;
// 기다리는 동안 이만큼 안에서 흔들리는 건 그냥 손떨림이다. 이보다 크게 움직이면 스크롤로 본다
const SLOP_PX = 8;

/**
 * 세로 목록에서 항목 하나를 '꾹 눌러 들고 끌어서' 옮기는 손맛.
 *
 * 게시판 관리 카드와 카테고리 모달이 같은 동작을 쓴다. 서버에는 옮긴 항목의 '몇 번째 자리'만 보내면 되므로
 * 여기서는 from → to index 만 알려 준다.
 *
 * 쓰는 쪽:
 *   const drag = usePressDrag({ disabled, onMove: (from, to) => ... });
 *   <div ref={drag.listRef}> {items.map((it, i) => <div data-drag-item ...> <button {...drag.handleProps(i)} /> ...)} </div>
 *   drag.liftedIndex / drag.dropIndex 로 들린 항목과 놓일 자리를 그린다.
 *
 * 손잡이 버튼에는 touch-none 을 줘야 한다 — 없으면 브라우저가 스크롤로 가져가 버린다.
 */
export default function usePressDrag({ disabled = false, onMove }) {
  const listRef = useRef(null);
  const holdTimerRef = useRef(null);
  const pendingRef = useRef(null); // 기다리는 동안의 시작 좌표
  const dragRef = useRef(null); // { fromIndex, pointerId }
  const [liftedIndex, setLiftedIndex] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);

  useEffect(() => () => clearTimeout(holdTimerRef.current), []);

  // 손가락 y 좌표로 '몇 번째 자리'인지 센다. 항목 가운데를 넘으면 그 다음 자리다
  const indexAtY = (y) => {
    const items = Array.from(listRef.current?.querySelectorAll('[data-drag-item]') ?? []);
    let index = 0;
    for (const item of items) {
      const rect = item.getBoundingClientRect();
      if (y > rect.top + rect.height / 2) index += 1;
    }
    return Math.min(index, Math.max(0, items.length - 1));
  };

  const reset = () => {
    clearTimeout(holdTimerRef.current);
    pendingRef.current = null;
    dragRef.current = null;
    setLiftedIndex(null);
    setDropIndex(null);
  };

  const lift = (target, index, pointerId) => {
    dragRef.current = { fromIndex: index, pointerId };
    target.setPointerCapture?.(pointerId);
    setLiftedIndex(index);
    setDropIndex(index);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
  };

  const handleProps = (index) => ({
    onPointerDown: (event) => {
      if (disabled || event.button !== 0) return;
      const { pointerId, clientX, clientY } = event;
      const target = event.currentTarget;

      if (event.pointerType === 'mouse') {
        lift(target, index, pointerId);
        return;
      }
      pendingRef.current = { x: clientX, y: clientY };
      holdTimerRef.current = setTimeout(() => {
        pendingRef.current = null;
        lift(target, index, pointerId);
      }, HOLD_MS);
    },
    onPointerMove: (event) => {
      if (!dragRef.current) {
        const start = pendingRef.current;
        if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > SLOP_PX) {
          clearTimeout(holdTimerRef.current);
          pendingRef.current = null;
        }
        return;
      }
      event.preventDefault();
      setDropIndex(indexAtY(event.clientY));
    },
    onPointerUp: () => {
      const drag = dragRef.current;
      const to = dropIndex;
      reset();
      if (!drag || to === null || to === drag.fromIndex) return;
      onMove?.(drag.fromIndex, to);
    },
    onPointerCancel: reset,
    onContextMenu: (event) => event.preventDefault(),
  });

  return { listRef, liftedIndex, dropIndex, handleProps };
}
