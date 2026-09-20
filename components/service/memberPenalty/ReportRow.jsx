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
      {/* 원문 링크. 열이 좁아 글자는 'Link' 하나뿐이라 어느 글인지 구분되지 않는다.
          제목은 마우스오버(title)와 보조기기(aria-label)로만 알린다.
          (텍스트가 있으면 title 은 접근성 이름이 되지 않아 aria-label 이 따로 필요하다)
          경로를 모르는 게시판이면 link 가 없다 → 누를 수 없는 'Link' 대신 '-' 로 둔다.
          (관리자 댓글 관리의 CommentRow 가 '바로가기' 열을 같게 처리한다) */}
      <div className="text-center">
        {report.link ? (
          <a
            href={report.link}
            target="_blank"
            rel="noreferrer"
            title={report.targetTitle}
            aria-label={report.linkLabel}
            className="underline decoration-solid underline-offset-2"
            onClick={(e) => e.stopPropagation()}
          >
            Link
          </a>
        ) : (
          <span className="text-[#919191]">-</span>
        )}
      </div>
      <div className="text-center">{report.status}</div>
      <div className="text-center">{report.date}</div>
    </div>
  );
}
