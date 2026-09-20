'use client';
import React, { useState } from 'react';
import Link from 'next/link';

// 헤더 행과 데이터 행이 동일한 열 정렬을 쓰도록 공유하는 그리드 템플릿.
// [번호][작성 위치][사유][원문][상태][처리일] — 사유 칸만 남는 폭을 다 가져간다.
// 여섯 칸을 똑같이 나누면 사유가 한 자씩 세로로 끊기고 나머지 칸은 비어 있었다.
export const REPORT_GRID =
  'grid grid-cols-[36px_84px_minmax(0,1fr)_64px_52px_64px] items-start gap-x-[6px] pr-[14px]';

// 상세 사유는 이 글자 수까지만 보이고, 넘치면 '더 보기'로 편다
const DETAIL_PREVIEW = 40;

// 사유 한 줄: { label, value, detail?, muted? }
function ReasonLine({ line }) {
  const [open, setOpen] = useState(false);
  const detail = line.detail ?? '';
  const long = detail.length > DETAIL_PREVIEW || detail.includes('\n');
  const shown = open || !long ? detail : `${detail.replace(/\s+/g, ' ').slice(0, DETAIL_PREVIEW)}…`;

  return (
    <div className={`flex flex-col ${line.muted ? 'text-[#919191]' : 'text-[#454545]'}`}>
      <span className="[word-break:keep-all]">
        {line.label && <span className="text-[#919191]">{line.label} </span>}
        {line.value}
      </span>
      {detail && (
        <span className="whitespace-pre-wrap break-words text-[12px] leading-[1.6] text-[#757575] [word-break:keep-all]">
          {shown}
          {long && (
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="ml-[4px] underline underline-offset-2 hover:text-[#212121]"
            >
              {open ? '접기' : '더 보기'}
            </button>
          )}
        </span>
      )}
    </div>
  );
}

function ReasonBlock({ reason }) {
  // 옛 모양(문자열·문자열 배열)도 받아 준다
  const lines = Array.isArray(reason)
    ? reason.map((l) => (typeof l === 'string' ? { label: '', value: l } : l))
    : [{ label: '', value: String(reason ?? '') }];
  return (
    <div className="flex flex-col gap-[3px]">
      {lines.map((line, index) => (
        <ReasonLine key={`${line.label}-${index}`} line={line} />
      ))}
    </div>
  );
}

// 신고 내역 개별 행
export default function ReportRow({ report, number }) {
  // 원문 링크는 두 모양에서 같은 것을 쓴다
  // 새 탭(target=_blank)이 아니라 같은 탭에서 앱 내 이동 — 앱(TWA)에서는 새 탭이 앱을 다시 켜는 것처럼 보였고,
  // 전체 새로고침이라 로딩 화면 없이 흰 화면이 스쳤다
  const link = report.link ? (
    <Link
      href={report.link}
      title={report.targetTitle}
      aria-label={report.linkLabel}
      className="underline decoration-solid underline-offset-2"
      onClick={(e) => e.stopPropagation()}
    >
      원문
    </Link>
  ) : (
    <span className="text-[#919191]">-</span>
  );

  return (
    <>
      {/* 폰: 카드 한 장. 6열을 그대로 욱여넣으면 글자가 한 자씩 끊긴다 */}
      <div className="flex flex-col gap-[6px] border-b border-[#dedede] py-[10px] font-['Pretendard',sans-serif] text-[13px] tracking-[-0.26px] text-[#454545] md:hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate font-medium text-[#212121]">
            {number}. {report.board}
          </span>
          <span className="flex shrink-0 items-center gap-[8px]">
            <span className="text-[#919191]">{report.status}</span>
            {link}
          </span>
        </div>
        <ReasonBlock reason={report.reason} />
        {report.date && <div className="text-[12px] text-[#919191]">{report.date}</div>}
      </div>

      {/* 태블릿 이상: 6열 그리드. 사유가 여러 줄이라 높이를 고정하지 않는다 */}
      <div
        className={`${REPORT_GRID} hidden min-h-[46px] border-b border-[#dedede] py-[8px] font-['Pretendard',sans-serif] text-[13px] tracking-[-0.26px] text-[#454545] md:grid`}
      >
        <div className="pt-[2px] text-center">{number}</div>
        <div className="truncate pt-[2px] text-center" title={report.board}>
          {report.board}
        </div>
        <div className="min-w-0 pr-[4px] text-left">
          <ReasonBlock reason={report.reason} />
        </div>
        <div className="pt-[2px] text-center">{link}</div>
        <div className="pt-[2px] text-center">{report.status}</div>
        <div className="pt-[2px] text-center">{report.date}</div>
      </div>
    </>
  );
}
