'use client';
import React, { useMemo, useState } from 'react';
import ReportRow, { REPORT_GRID, ReportCheckbox } from './ReportRow';

const HEADERS = ['번호', '작성 위치', '처리 사유', '원문 링크', '상태', '처리일'];

// ReportRow 들을 합쳐 하나의 신고 목록 섹션을 만든다.
// title: '신고 게시글' | '신고 댓글'
export default function ReportSection({ title, reports = [] }) {
  // 처리일 최신순으로 번호 부여 (오래된→최신 오름차순 정렬, 뒤로 갈수록 큰 번호)
  const ordered = useMemo(
    () =>
      [...reports]
        .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
        .map((report, index) => ({ ...report, number: index + 1 })),
    [reports],
  );

  // 체크 가능한(블라인드) 행만 대상으로 선택 상태 관리
  const selectableIds = useMemo(
    () => ordered.filter((r) => r.status !== '영구삭제').map((r) => r.reportId),
    [ordered],
  );

  const [checkedIds, setCheckedIds] = useState(() => new Set());

  const allChecked =
    selectableIds.length > 0 && selectableIds.every((id) => checkedIds.has(id));

  const toggleAll = (next) => {
    setCheckedIds(next ? new Set(selectableIds) : new Set());
  };

  const toggleOne = (id, next) => {
    setCheckedIds((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  };

  return (
    <div className="w-full font-['Pretendard',sans-serif]">
      <p className="mb-[10px] text-[16px] tracking-[-0.32px] text-black">{title}</p>

      {/* 맨 위 헤더 행 (회색 글씨) */}
      <div className={`${REPORT_GRID} h-[46px] text-[14px] tracking-[-0.28px] text-[#919191]`}>
        <div className="flex justify-center">
          <ReportCheckbox checked={allChecked} onChange={toggleAll} />
        </div>
        {HEADERS.map((header) => (
          <div key={header} className="text-center">
            {header}
          </div>
        ))}
      </div>

      {/* 헤더와 목록 사이 연한 회색 가로선 */}
      <div className="border-b border-[#919191]" />

      {/* 스크롤 범위: row 1~5 (46px * 5). 6개 이상이면 세로 스크롤 (화살표 없이) */}
      <div className="mp-scroll-y h-[230px] overflow-x-hidden overflow-y-auto">
        {ordered.map((report) => (
          <ReportRow
            key={report.reportId}
            report={report}
            number={report.number}
            checked={checkedIds.has(report.reportId)}
            onCheckedChange={(next) => toggleOne(report.reportId, next)}
          />
        ))}
      </div>

      {/* 우측 하단 버튼: 상태 복원 / 영구 삭제 */}
      <div className="mt-[12px] flex justify-end gap-[14px]">
        <button
          type="button"
          className="h-[42px] w-[126px] rounded-[4px] border border-[#919191] bg-white text-[16px] tracking-[-0.32px] text-[#212121]"
        >
          상태 복원
        </button>
        <button
          type="button"
          className="h-[42px] w-[126px] rounded-[4px] bg-[#212121] text-[16px] tracking-[-0.32px] text-white"
        >
          영구 삭제
        </button>
      </div>
    </div>
  );
}
