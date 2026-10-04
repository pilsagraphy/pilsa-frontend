'use client';
import React from 'react';
import ReportRow, { REPORT_GRID } from './ReportRow';

const HEADERS = ['번호', '진행순번', '작성 위치', '내역', '링크', '상태', '날짜', '시간'];

// 글/댓글 묶음(ReportRow)들을 합쳐 하나의 신고·조치 로그 섹션을 만든다.
// title: '신고·처리 게시글' | '신고·처리 댓글'. groups 는 PenaltyDashboardSection 이 번호까지 매겨 준다.
export default function ReportSection({ title, groups = [], isLoading = false, error = null }) {
  return (
    <div className="w-full font-['Pretendard',sans-serif]">
      <p className="mb-[10px] text-[16px] tracking-[-0.32px] text-black">{title}</p>

      {/* 맨 위 헤더 행 (회색 글씨) */}
      {/* 머리글은 8열 그리드일 때만 뜻이 있다 — 폰에서는 카드가 이름표를 직접 달고 있다 */}
      <div
        className={`${REPORT_GRID} hidden h-[46px] items-center text-[13px] tracking-[-0.26px] text-[#919191] md:grid`}
      >
        {HEADERS.map((header) => (
          <div key={header} className="text-center">
            {header}
          </div>
        ))}
      </div>

      {/* 헤더와 목록 사이 연한 회색 가로선 */}
      <div className="border-b border-[#919191]" />

      {/* 묶음이 여러 줄이라 높이를 고정하지 않고, 길어지면 세로 스크롤 */}
      <div className="mp-scroll-y max-h-[320px] min-h-[92px] overflow-x-hidden overflow-y-auto [scrollbar-gutter:stable]">
        {isLoading ? (
          // 1) 로딩 중
          <div className="flex h-[92px] items-center justify-center text-[14px] tracking-[-0.28px] text-[#919191]">
            불러오는 중…
          </div>
        ) : error ? (
          // 2) 에러 (스토어가 넣어준 한국어 문장)
          <div className="flex h-[92px] items-center justify-center text-[14px] tracking-[-0.28px] text-[#ae0000]">
            {error}
          </div>
        ) : groups.length === 0 ? (
          // 3) 데이터 없음
          <div className="flex h-[92px] items-center justify-center text-[14px] tracking-[-0.28px] text-[#919191]">
            내역이 없습니다.
          </div>
        ) : (
          // 4) 데이터 있음
          groups.map((group) => <ReportRow key={group.key} group={group} number={group.number} />)
        )}
      </div>
    </div>
  );
}
