'use client';
import React from 'react';
import { Check } from 'lucide-react';

// 헤더 행과 데이터 행이 동일한 열 정렬을 쓰도록 공유하는 그리드 템플릿.
// 체크박스만 고정폭, 나머지 7개 열은 남는 너비를 균등 분배해 왼쪽으로 몰리지 않게 한다.
// [체크박스][번호][작성 위치][처리 사유][원문 링크][상태][처리일]
export const REPORT_GRID = 'grid grid-cols-[40px_repeat(6,minmax(0,1fr))] items-center';

// 신고 목록용 체크박스
// - 활성(블라인드): 클릭 가능, 클릭 시 "흰 배경 속 검은 체크"(테두리 유지) 표시
// - 비활성(영구삭제): 회색이며 클릭 불가
export function ReportCheckbox({ checked = false, disabled = false, onChange }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange?.(!checked);
      }}
      className={`grid size-[18px] place-content-center rounded-[4px] border ${
        disabled ? 'cursor-not-allowed border-[#dedede] bg-[#dedede]' : 'border-[#919191] bg-white'
      }`}
    >
      {checked && !disabled ? (
        <Check size={10} strokeWidth={1.5} className="text-[#212121]" />
      ) : null}
    </button>
  );
}

// 신고 내역 개별 행
export default function ReportRow({ report, number, checked = false, onCheckedChange }) {
  // 상태가 '영구삭제'면 체크박스 비활성(회색), '블라인드'면 체크 가능
  const canCheck = report.status !== '영구삭제';

  return (
    <div
      className={`${REPORT_GRID} h-[46px] border-b border-[#dedede] font-['Pretendard',sans-serif] text-[14px] tracking-[-0.28px] text-[#454545]`}
    >
      <div className="flex justify-center">
        <ReportCheckbox checked={checked} disabled={!canCheck} onChange={onCheckedChange} />
      </div>
      <div className="text-center">{number}</div>
      <div className="text-center">{report.board}</div>
      <div className="text-center">{report.reason}</div>
      <div className="text-center">
        <a
          href={report.link}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-solid underline-offset-2"
          onClick={(e) => e.stopPropagation()}
        >
          Link
        </a>
      </div>
      <div className="text-center">{report.status}</div>
      <div className="text-center">{report.date}</div>
    </div>
  );
}
