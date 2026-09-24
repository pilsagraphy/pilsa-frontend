'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { checkboxClass } from './CommunityListStyles';

/**
 * 관리자 목록 표의 행 선택 체크박스
 * 헤더(SelectAllCheckbox)와 가로 · 세로 위치를 맞추려고 같은 구조로 감싼다.
 * 자세한 이유는 SelectAllCheckbox 주석 참고.
 */
export default function RowCheckbox({ checked, onCheckedChange, label }) {
  return (
    <span className="relative inline-flex align-middle">
      <Checkbox
        checked={checked}
        onCheckedChange={(next) => onCheckedChange?.(next === true)}
        aria-label={label}
        className={checkboxClass}
      />
    </span>
  );
}
