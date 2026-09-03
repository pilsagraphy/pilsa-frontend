'use client';
import React from 'react';

// 헤더 행과 데이터 행이 동일한 열 정렬을 쓰도록 공유하는 그리드 템플릿.
// 6개 열은 남는 너비를 균등 분배해 왼쪽으로 몰리지 않게 한다.
// [번호][작성 위치][처리 사유][원문 링크][상태][처리일]
export const REPORT_GRID = 'grid grid-cols-[repeat(6,minmax(0,1fr))] items-center';

// 신고 내역 개별 행
export default function ReportRow({ report, number }) {
  return (
    <div
      className={`${REPORT_GRID} h-[46px] border-b border-[#dedede] font-['Pretendard',sans-serif] text-[14px] tracking-[-0.28px] text-[#454545]`}
    >
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
