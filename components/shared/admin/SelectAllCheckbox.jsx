'use client';

import { Check } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { checkboxClass } from './CommunityListStyles';

/**
 * 관리자 목록 표 헤더의 전체 선택 체크박스
 *
 * ui/checkbox는 grid(블록 레벨)라 셀의 text-center로는 가운데 정렬되지 않는다.
 * inline-flex span으로 감싸야 가운데로 오고, align-middle까지 줘야
 * 인라인 baseline 아래 여백만큼 행 높이가 늘어나지 않는다.
 * 또 table.jsx의 [&>[role=checkbox]]:translate-y-[2px]는 직계 자식에만 걸리므로
 * 헤더와 행이 같은 구조로 감싸져 있어야 세로 위치가 어긋나지 않는다. (RowCheckbox와 한 쌍)
 *
 * 디자인상 선택 전에도 연한 체크 표시가 보이므로,
 * 체크되지 않았을 때만 회색 체크 아이콘을 겹쳐 보여준다.
 */
export default function SelectAllCheckbox({ checked, disabled = false, onCheckedChange, label }) {
  return (
    <span className="relative inline-flex align-middle">
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(next) => onCheckedChange?.(next === true)}
        aria-label={label}
        className={checkboxClass}
      />
      {!checked && (
        <Check
          aria-hidden
          className="pointer-events-none absolute inset-0 m-auto size-4 text-[#dedede]"
        />
      )}
    </span>
  );
}
