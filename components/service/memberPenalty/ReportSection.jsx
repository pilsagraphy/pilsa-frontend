'use client';
import React, { useMemo } from 'react';
import ReportRow, { REPORT_GRID } from './ReportRow';

const HEADERS = ['번호', '작성 위치', '처리 사유', '원문 링크', '상태', '처리일'];

// ReportRow 들을 합쳐 하나의 신고 목록 섹션을 만든다.
// title: '신고 게시글' | '신고 댓글'
export default function ReportSection({ title, reports = [], isLoading = false, error = null }) {
  // 처리일 오름차순(오래된→최신)으로 번호 부여 — 뒤로 갈수록 큰 번호.
  // 아직 처리되지 않은 건은 처리일이 없어 끼워 넣을 자리가 없으니 맨 뒤로 모은다.
  // 표시용 문자열(date)이 아니라 원본 ISO 값(resolvedAt)으로 비교한다.
  const ordered = useMemo(
    () =>
      [...reports]
        .sort((a, b) => {
          if (!a.resolvedAt) return b.resolvedAt ? 1 : 0;
          if (!b.resolvedAt) return -1;
          return a.resolvedAt < b.resolvedAt ? -1 : a.resolvedAt > b.resolvedAt ? 1 : 0;
        })
        .map((report, index) => ({ ...report, number: index + 1 })),
    [reports],
  );

  return (
    <div className="w-full font-['Pretendard',sans-serif]">
      <p className="mb-[10px] text-[16px] tracking-[-0.32px] text-black">{title}</p>

      {/* 맨 위 헤더 행 (회색 글씨) */}
      {/* 머리글은 6열 그리드일 때만 뜻이 있다 — 폰에서는 카드가 이름표를 직접 달고 있다 */}
      <div
        className={`${REPORT_GRID} hidden h-[46px] pr-[10px] text-[14px] tracking-[-0.28px] text-[#919191] md:grid`}
      >
        {HEADERS.map((header) => (
          <div key={header} className="text-center">
            {header}
          </div>
        ))}
      </div>

      {/* 헤더와 목록 사이 연한 회색 가로선 */}
      <div className="border-b border-[#919191]" />

      {/* 스크롤 범위: row 1~5 (46px * 5). 6개 이상이면 세로 스크롤 (화살표 없이) */}
      <div className="mp-scroll-y max-h-[280px] min-h-[92px] overflow-x-hidden overflow-y-auto [scrollbar-gutter:stable] md:h-[230px] md:max-h-none">
        {isLoading ? (
          // 1) 로딩 중
          <div className="flex h-full items-center justify-center text-[14px] tracking-[-0.28px] text-[#919191]">
            불러오는 중…
          </div>
        ) : error ? (
          // 2) 에러 (스토어가 넣어준 한국어 문장)
          <div className="flex h-full items-center justify-center text-[14px] tracking-[-0.28px] text-[#ae0000]">
            {error}
          </div>
        ) : ordered.length === 0 ? (
          // 3) 데이터 없음
          <div className="flex h-full items-center justify-center text-[14px] tracking-[-0.28px] text-[#919191]">
            내역이 없습니다.
          </div>
        ) : (
          // 4) 데이터 있음
          ordered.map((report) => (
            <ReportRow key={report.reportId} report={report} number={report.number} />
          ))
        )}
      </div>
    </div>
  );
}
