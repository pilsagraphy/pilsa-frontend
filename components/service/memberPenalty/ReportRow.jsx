'use client';
import React from 'react';

// 헤더 행과 데이터 행이 동일한 열 정렬을 쓰도록 공유하는 그리드 템플릿.
// 6개 열은 남는 너비를 균등 분배해 왼쪽으로 몰리지 않게 한다.
// [번호][작성 위치][처리 사유][원문 링크][상태][처리일]
export const REPORT_GRID = 'grid grid-cols-[repeat(6,minmax(0,1fr))] items-center';

// 신고 내역 개별 행
export default function ReportRow({ report, number }) {
  // 사유는 줄 여러 개다 (신고 사유 · 처리 사유). 문자열 하나로 와도 그린다
  const reasonLines = Array.isArray(report.reason) ? report.reason : [report.reason];
  const reasonBlock = (
    <span className="flex flex-col gap-[1px]">
      {reasonLines.map((line) => (
        <span key={line} className="[word-break:keep-all]">
          {line}
        </span>
      ))}
    </span>
  );

  // 원문 링크는 두 모양에서 같은 것을 쓴다
  const link = report.link ? (
    <a
      href={report.link}
      target="_blank"
      rel="noreferrer"
      title={report.targetTitle}
      aria-label={report.linkLabel}
      className="underline decoration-solid underline-offset-2"
      onClick={(e) => e.stopPropagation()}
    >
      원문 보기
    </a>
  ) : (
    <span className="text-[#919191]">-</span>
  );

  return (
    <>
      {/* 폰: 카드 한 장. 6열을 그대로 욱여넣으면 글자가 한 자씩 끊긴다 */}
      <div className="flex flex-col gap-[4px] border-b border-[#dedede] py-[10px] font-['Pretendard',sans-serif] text-[13px] tracking-[-0.26px] text-[#454545] md:hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate font-medium text-[#212121]">
            {number}. {report.board}
          </span>
          <span className="shrink-0 text-[#919191]">{report.status}</span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0">{reasonBlock}</span>
          <span className="shrink-0">{link}</span>
        </div>
        {report.date && <div className="text-[12px] text-[#919191]">{report.date}</div>}
      </div>

      {/* 태블릿 이상: 기존 6열 그리드 */}
      <div
      // 사유가 두 줄이라 높이를 고정하지 않는다 (최소 46px)
      className={`${REPORT_GRID} hidden min-h-[46px] border-b border-[#dedede] py-[6px] font-['Pretendard',sans-serif] text-[13px] tracking-[-0.26px] text-[#454545] md:grid`}
    >
      <div className="text-center">{number}</div>
      <div className="text-center">{report.board}</div>
      <div className="px-[4px] text-left">{reasonBlock}</div>
      {/* 원문 링크. 열이 좁아 글자는 'Link' 하나뿐이라 어느 글인지 구분되지 않는다.
          제목은 마우스오버(title)와 보조기기(aria-label)로만 알린다.
          (텍스트가 있으면 title 은 접근성 이름이 되지 않아 aria-label 이 따로 필요하다)
          경로를 모르는 게시판이면 link 가 없다 → 누를 수 없는 'Link' 대신 '-' 로 둔다.
          (관리자 댓글 관리의 CommentRow 가 '바로가기' 열을 같게 처리한다) */}
      <div className="text-center">{link}</div>
      <div className="text-center">{report.status}</div>
      <div className="text-center">{report.date}</div>
      </div>
    </>
  );
}
