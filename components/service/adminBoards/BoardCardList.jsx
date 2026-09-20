'use client';

import { GripVertical } from 'lucide-react';

import usePressDrag from '@/hooks/usePressDrag';
import { getReadScopeLabel, getWriteLevelLabel } from '@/constants/adminBoards';

// 좁은 화면의 게시판 목록.
//
// 표를 가로로 미는 대신 게시판 하나를 카드 하나로 세운다.
// 순서 바꾸기는 표(마우스 끌기)와 같은 손맛으로 — 손잡이를 꾹 누르면 카드가 들리고,
// 위아래로 끌어 놓으면 그 자리로 간다. 서버에는 '몇 번째 자리'만 보낸다 (표와 같다).
export default function BoardCardList({
  boards,
  onEdit,
  onManageCategories,
  onMove,
  disabled = false,
  emptyMessage = '',
}) {
  const drag = usePressDrag({
    disabled,
    // 페이지가 나뉘어 있어도 카드 index 차이는 그대로 순번 차이다
    onMove: (from, to) => onMove?.(boards[from].boardId, to - from),
  });

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
    <div ref={drag.listRef} className="flex flex-col">
      {boards.map((board, index) => {
        const lifted = drag.liftedIndex === index;
        const from = drag.liftedIndex ?? -1;
        // 들린 카드가 놓일 자리를 선으로 보여 준다
        const lineAbove = drag.dropIndex === index && index < from;
        const lineBelow = drag.dropIndex === index && index > from;

        return (
          <div
            key={board.boardId}
            data-drag-item
            className={`relative border-b border-[#B9B9B9] px-1 py-[14px] transition-opacity ${
              lifted ? 'opacity-40' : ''
            } ${lineAbove ? 'border-t-2 border-t-[#212121]' : ''} ${
              lineBelow ? '!border-b-2 !border-b-[#212121]' : ''
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
                {...drag.handleProps(index)}
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
