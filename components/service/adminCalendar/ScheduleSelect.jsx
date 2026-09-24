'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';

// 목록이 길어지면 오른쪽에 얇은 스크롤바가 생긴다. (시안의 3px 회색 막대)
const SCROLLBAR_CLASS = [
  '[&::-webkit-scrollbar]:w-[3px]',
  '[&::-webkit-scrollbar-track]:bg-transparent',
  '[&::-webkit-scrollbar-thumb]:rounded-[1.5px]',
  '[&::-webkit-scrollbar-thumb]:bg-[#d9d9d9]',
].join(' ');

// 시안이 두 가지다.
//  - field:   '일정 구분'용. 입력 칸과 같은 폭, 40px 줄, 줄마다 #dedede 테두리, 고른 줄은 #eee
//  - compact: 년 · 월 · 일 · 시 · 분용. #b9b9b9 테두리 한 겹, 36px 줄, 아래쪽만 구분선
const PANEL_STYLE = {
  field: {
    panel: 'rounded-[4px]',
    list: 'max-h-[240px]',
    option:
      'flex h-[40px] w-full items-center border border-[#dedede] px-[16px] text-left text-[16px] leading-[1.6] tracking-[-0.32px] text-[#454545] first:rounded-t-[4px] last:rounded-b-[4px] [&:not(:first-child)]:border-t-0',
    optionSelected: 'bg-[#eee]',
    optionIdle: 'bg-white hover:bg-[#f6f6f6]',
  },
  compact: {
    panel: 'rounded-[4px] border border-[#b9b9b9] p-[4px] ps-[7px]',
    list: 'max-h-[216px]',
    option:
      'flex h-[36px] w-full items-center border-b border-[#dedede] px-[10px] text-left text-[16px] leading-[1.6] tracking-[-0.32px] text-[#919191]',
    optionSelected: 'bg-[#eee]',
    optionIdle: 'hover:bg-[#f6f6f6]',
  },
};

/**
 * 일정 폼 전용 드롭다운.
 *
 * 네이티브 select로는 시안의 목록 모양(줄 높이 · 구분선 · 얇은 스크롤바)을 못 맞춰서 직접 그린다.
 * 목록은 트리거 바로 아래에 absolute로 붙는다. (폼이 overflow 안에 있지 않아 잘리지 않는다)
 */
export default function ScheduleSelect({
  value,
  onChange,
  options,
  ariaLabel,
  variant = 'compact',
  width,
  disabled = false,
  placeholder = '',
  className = '',
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const rootRef = React.useRef(null);
  const style = PANEL_STYLE[variant];

  React.useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const select = (option) => {
    onChange?.(option);
    setIsOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={`relative shrink-0 ${className}`}
      style={width ? { width } : undefined}
    >
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={[
          'flex h-[40px] w-full items-center justify-between rounded-[6px] border border-[#dedede] bg-white text-left text-[16px] leading-[1.6] tracking-[-0.32px] text-[#212121] transition-colors',
          variant === 'field' ? 'px-[16px]' : 'ps-[12px] pe-[8px]',
          disabled ? 'cursor-not-allowed bg-[#f6f6f6] text-[#b9b9b9]' : 'hover:border-[#919191]',
        ].join(' ')}
      >
        {/* 값이 없으면(선택지를 못 받아 잠긴 경우) 빈 회색 박스만 남으므로 이유를 적어 둔다. */}
        <span className={`truncate ${value ? '' : 'text-[#b9b9b9]'}`}>{value || placeholder}</span>
        <ChevronDown
          aria-hidden="true"
          strokeWidth={1.5}
          className={`ms-[4px] size-4 shrink-0 ${disabled ? 'text-[#b9b9b9]' : 'text-[#212121]'}`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute left-0 top-[44px] z-40 w-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${style.panel}`}
        >
          <div className={`overflow-y-auto ${style.list} ${SCROLLBAR_CLASS}`}>
            {options.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={option === value}
                onClick={() => select(option)}
                className={[
                  style.option,
                  option === value ? style.optionSelected : style.optionIdle,
                ].join(' ')}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
