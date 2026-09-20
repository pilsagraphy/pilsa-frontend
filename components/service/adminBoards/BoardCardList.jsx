'use client';

import { useEffect, useRef, useState } from 'react';
import { GripVertical } from 'lucide-react';

import { getReadScopeLabel, getWriteLevelLabel } from '@/constants/adminBoards';

// 손가락: 꾹 누른 뒤 끌기로 인정하는 시간. 스크롤하려고 손을 댄 것과 구분한다.
// 마우스: 기다릴 이유가 없다 — 누르는 즉시 든다 (표에서 끌던 손맛 그대로)
const HOLD_MS = 300;
// 기다리는 동안 이만큼 안에서 흔들리는 건 그냥 손떨림이다. 이보다 크게 움직이면 스크롤로 본다
const SLOP_PX = 8;

// 좁은 화면의 게시판 목록.
//
// 표를 가로로 미는 대신 게시판 하나를 카드 하나로 세운다.
// 순서 바꾸기는 표(마우스 끌기)와 같은 손맛으로 — 손잡이를 꾹 누르면 카드가 들리고,
// 위아래로 끌어 놓으면 그 자리로 간다. 서버에는 '몇 번째 자리'만 보낸다 (표와 같다).
//
// 왜 위·아래 버튼이 아니라 끌기인가: 버튼은 한 칸씩만 움직여 다섯 칸 옮기려면 다섯 번 눌러야 하고,
// 매번 서버 왕복이라 다섯 번 기다린다. 끌기는 한 번에 끝난다.
export default function BoardCardList({
  boards,
  onEdit,
  onManageCategories,
  onMove,
  disabled = false,
  emptyMessage = '',
}) {
  const listRef = useRef(null);
  const holdTimerRef = useRef(null);
  const dragRef = useRef(null); // { boardId, fromIndex, pointerId }
  const [dragging, setDragging] = useState(null); // { boardId, y }
  const [dropIndex, setDropIndex] = useState(null); // 놓으면 들어갈 자리(카드 index)

  useEffect(() => () => clearTimeout(holdTimerRef.current), []);

  // 손가락 y 좌표로 '몇 번째 카드 자리'인지 센다. 카드 가운데를 넘으면 그 다음 자리다
  const indexAtY = (y) => {
    const cards = Array.from(listRef.current?.querySelectorAll('[data-card]') ?? []);
    let index = 0;
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      if (y > rect.top + rect.height / 2) index += 1;
    }
    return Math.min(index, cards.length - 1);
  };

  const cancelDrag = () => {
    clearTimeout(holdTimerRef.current);
    pendingRef.current = null;
    dragRef.current = null;
    setDragging(null);
    setDropIndex(null);
  };

  const pendingRef = useRef(null); // 기다리는 동안의 시작 좌표

  const lift = (target, board, index, pointerId, y) => {
    dragRef.current = { boardId: board.boardId, fromIndex: index, pointerId };
    target.setPointerCapture?.(pointerId);
    setDragging({ boardId: board.boardId, y });
    setDropIndex(index);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handlePointerDown = (event, board, index) => {
    if (disabled || event.button !== 0) return;
    const { pointerId, clientX, clientY } = event;
    const target = event.currentTarget;

    if (event.pointerType === 'mouse') {
      lift(target, board, index, pointerId, clientY);
      return;
    }

    // 손가락은 바로 들지 않고 잠깐 기다린다 — 그냥 스크롤하려는 손과 가르기 위해
    pendingRef.current = { x: clientX, y: clientY };
    holdTimerRef.current = setTimeout(() => {
      pendingRef.current = null;
      lift(target, board, index, pointerId, clientY);
    }, HOLD_MS);
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current) {
      // 들리기 전: 손떨림 정도는 봐주고, 그 이상 움직이면 스크롤이라 끌기 대기를 접는다
      const start = pendingRef.current;
      if (
        start &&
        Math.hypot(event.clientX - start.x, event.clientY - start.y) > SLOP_PX
      ) {
        clearTimeout(holdTimerRef.current);
        pendingRef.current = null;
      }
      return;
    }
    event.preventDefault();
    setDragging((prev) => (prev ? { ...prev, y: event.clientY } : prev));
    setDropIndex(indexAtY(event.clientY));
  };

  const handlePointerUp = () => {
    const drag = dragRef.current;
    const to = dropIndex;
    cancelDrag();
    if (!drag || to === null || to === drag.fromIndex) return;

    // 페이지가 나뉘어 있어도 카드 index 차이는 그대로 순번 차이다
    onMove?.(drag.boardId, to - drag.fromIndex);
  };

  if (emptyMessage) {
    return (
      <p className="border-b border-[#B9B9B9] py-10 text-center text-[14px] text-[#919191]">
        {emptyMessage}
      </p>
    );
  }

  const buttonClass =
    'rounded-[4px] border border-[#b9b9b9] px-3 py-[5px] text-[13px] leading-[1.6] text-[#454545] disabled:border-[#E0E0E0] disabled:text-[#C4C4C4]';

  return (
    <div ref={listRef} className="flex flex-col">
      {boards.map((board, index) => {
        const lifted = dragging?.boardId === board.boardId;
        // 들린 카드가 놓일 자리를 선으로 보여 준다
        const fromIndex = dragRef.current?.fromIndex ?? -1;
        const showLineAbove = dragging && dropIndex === index && index < fromIndex;
        const showLineBelow = dragging && dropIndex === index && index > fromIndex;

        return (
          <div
            key={board.boardId}
            data-card
            className={`relative border-b border-[#B9B9B9] px-1 py-[14px] transition-opacity ${
              lifted ? 'opacity-40' : ''
            } ${showLineAbove ? 'border-t-2 border-t-[#212121]' : ''} ${
              showLineBelow ? '!border-b-2 !border-b-[#212121]' : ''
            }`}
          >
            <div className="flex items-start gap-[10px]">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-semibold leading-[1.5] tracking-[-0.02em] text-[#212121]">
                  {board.boardName}
                </p>
                <p className="mt-[4px] text-[13px] leading-[1.6] tracking-[-0.02em] text-[#757575]">
                  글 {board.postCount?.toLocaleString() ?? 0}개 · 열람{' '}
                  {getReadScopeLabel(board.readScope)} · 작성 {getWriteLevelLabel(board.writeLevel)}
                </p>
              </div>

              {/* 순서 손잡이: 꾹 누르면 들린다. touch-none 이 없으면 브라우저가 스크롤로 가져가 버린다 */}
              <button
                type="button"
                aria-label="꾹 눌러서 순서 바꾸기"
                title="꾹 눌러서 순서 바꾸기"
                disabled={disabled}
                onPointerDown={(event) => handlePointerDown(event, board, index)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={cancelDrag}
                onContextMenu={(event) => event.preventDefault()}
                className={`grid size-8 shrink-0 touch-none select-none place-items-center rounded-[4px] text-[#B9B9B9] ${
                  lifted ? 'bg-[#F0F0F0] text-[#212121]' : 'active:bg-[#F5F5F5]'
                }`}
              >
                <GripVertical size={18} />
              </button>
            </div>

            <div className="mt-[10px] flex gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onEdit?.(board)}
                className={buttonClass}
              >
                정보 수정
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onManageCategories?.(board)}
                className={buttonClass}
              >
                카테고리 수정
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
