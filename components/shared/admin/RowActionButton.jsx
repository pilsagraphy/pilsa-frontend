'use client';

import { cn } from '@/lib/utils';

/**
 * 관리자 목록의 '관리' 열에 들어가는 작은 버튼
 * (디자인: 높이 26px, 라운드 3px, 14px / 예: 블라인드 · 삭제 · 신고 관리로 이동)
 *
 * 크기가 작아 ui/button의 기본 높이·패딩과 맞지 않으므로 button을 직접 쓴다.
 * 너비는 디자인 값을 className의 min-w로만 주고(글자가 넘치면 늘어나도록) 줄바꿈은 막는다.
 */
export default function RowActionButton({
  filled = false,
  // 지금 취할 수 없는 조치는 숨기지 않고 회색으로 눌리지 않게만 한다.
  // 버튼이 사라지면 행마다 관리 열 너비가 달라져 표가 흔들린다.
  disabled = false,
  className,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-[26px] shrink-0 items-center justify-center whitespace-nowrap rounded-[3px] px-[8px] text-[14px] leading-[1.6] tracking-[-0.28px] transition-colors',
        disabled
          ? 'cursor-not-allowed border border-[#dedede] bg-transparent text-[#b9b9b9]'
          : filled
            ? 'bg-[#212121] text-white hover:bg-[#424242]'
            : 'border border-[#212121] text-[#212121] hover:bg-[#f5f5f5]',
        className
      )}
    >
      {children}
    </button>
  );
}
