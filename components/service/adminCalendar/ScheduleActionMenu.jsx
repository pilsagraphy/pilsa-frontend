'use client';

import * as React from 'react';
import { EllipsisVertical } from 'lucide-react';

const MENU_WIDTH = 120;
const MENU_GAP = 6;

// 월별 일정 카드 오른쪽의 ⋮ 버튼. 누르면 '일정 수정 · 일정 삭제'가 열린다.
//
// 목록(MonthlyScheduleList)이 overflow-y-auto라서 메뉴를 카드 안에 absolute로 두면 잘린다.
// 그래서 버튼 위치를 재서 fixed로 띄운다. (열려 있는 동안 스크롤 · 리사이즈되면 닫는다)
export default function ScheduleActionMenu({ isSelected = false, onEdit, onDelete }) {
  const [position, setPosition] = React.useState(null);
  const buttonRef = React.useRef(null);
  const menuRef = React.useRef(null);

  const isOpen = position !== null;

  const close = React.useCallback(() => setPosition(null), []);

  const toggle = () => {
    if (isOpen) {
      close();
      return;
    }

    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    setPosition({ top: rect.bottom + MENU_GAP, left: rect.right - MENU_WIDTH });
  };

  React.useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (buttonRef.current?.contains(event.target)) return;
      if (menuRef.current?.contains(event.target)) return;
      close();
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    // 스크롤하면 fixed 메뉴만 제자리에 남아 버튼과 어긋나므로 그냥 닫는다.
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [isOpen, close]);

  const runAction = (action) => {
    close();
    action?.();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="일정 관리 메뉴"
        className="flex size-6 items-center justify-center rounded-full transition hover:bg-black/5"
      >
        <EllipsisVertical
          aria-hidden="true"
          strokeWidth={1.4}
          className={['size-[18px]', isSelected ? 'text-white' : 'text-[#919191]'].join(' ')}
        />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
          className="fixed z-50 overflow-hidden rounded-[4px] border border-[#dedede] bg-white py-[4px] shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => runAction(onEdit)}
            className="block w-full px-[14px] py-[8px] text-left text-[14px] leading-[1.6] tracking-[-0.28px] text-[#212121] transition-colors hover:bg-[#f6f6f6]"
          >
            일정 수정
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => runAction(onDelete)}
            className="block w-full px-[14px] py-[8px] text-left text-[14px] leading-[1.6] tracking-[-0.28px] text-[#212121] transition-colors hover:bg-[#f6f6f6]"
          >
            일정 삭제
          </button>
        </div>
      )}
    </>
  );
}
