'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';

import { getReadScopeLabel, getWriteLevelLabel } from '@/constants/adminBoards';

// 좁은 화면의 게시판 목록.
//
// 표를 가로로 미는 대신 게시판 하나를 카드 하나로 세운다.
// 순서 바꾸기도 여기서만 다르다 — 표는 마우스로 끌지만, 폰에는 끌 손잡이가 없어 위·아래 버튼을 준다.
// (같은 요청을 보낸다: '몇 번째 자리'를 서버에 알려 주면 나머지가 밀린다)
export default function BoardCardList({
  boards,
  onEdit,
  onManageCategories,
  onMove,
  disabled = false,
  // 목록이 페이지로 나뉘어 있어 카드의 index 로는 첫·끝을 알 수 없다 — 전체 순번(displayOrder)으로 본다
  totalCount = 0,
  emptyMessage = '',
}) {
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
    <div className="flex flex-col">
      {boards.map((board) => (
        <div key={board.boardId} className="border-b border-[#B9B9B9] px-1 py-[14px]">
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

            {/* 순서 */}
            <div className="flex shrink-0 flex-col">
              <button
                type="button"
                aria-label="위로"
                disabled={disabled || board.displayOrder <= 1}
                onClick={() => onMove?.(board.boardId, -1)}
                className="text-[#919191] disabled:text-[#E0E0E0]"
              >
                <ChevronUp size={16} />
              </button>
              <button
                type="button"
                aria-label="아래로"
                disabled={disabled || board.displayOrder >= totalCount}
                onClick={() => onMove?.(board.boardId, 1)}
                className="text-[#919191] disabled:text-[#E0E0E0]"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          <div className="mt-[10px] flex gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onEdit?.(board)}
              className={buttonClass}
            >
              수정
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onManageCategories?.(board)}
              className={buttonClass}
            >
              카테고리
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
