'use client';
import React, { useState } from 'react';
import Link from 'next/link';

// 헤더 행과 데이터 행이 동일한 열 정렬을 쓰도록 공유하는 그리드 템플릿.
// [번호][작성 위치][내역][원문][상태][일시] — 내역 칸만 남는 폭을 다 가져간다.
// 여섯 칸을 똑같이 나누면 내역이 한 자씩 세로로 끊기고 나머지 칸은 비어 있었다.
export const REPORT_GRID =
  'grid grid-cols-[36px_84px_minmax(0,1fr)_64px_52px_64px] items-start gap-x-[6px] pr-[14px]';

// 상세 사유는 이 글자 수까지만 보이고, 넘치면 '더 보기'로 편다
const DETAIL_PREVIEW = 40;

// 사건 한 줄: { label, value, detail? } — 라벨(무슨 일)은 회색, 값(누가 · 사유)은 본색, 상세는 작은 글씨로 접힌다
function EventLine({ event }) {
  const [open, setOpen] = useState(false);
  const detail = event.detail ?? '';
  const long = detail.length > DETAIL_PREVIEW || detail.includes('\n');
  const shown = open || !long ? detail : `${detail.replace(/\s+/g, ' ').slice(0, DETAIL_PREVIEW)}…`;

  return (
    <div className="flex flex-col text-[#454545]">
      <span className="[word-break:keep-all]">
        {event.label && <span className="text-[#919191]">{event.label} </span>}
        {event.value}
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

// 복원 버튼 — 지금 블라인드·삭제 상태인 대상에만 붙는다. 이미 처리가 끝난 삭제도 되돌릴 수 있어야 한다
// (관리자 실수·이의 제기, PM 2026-09-27). 서버의 select-restore 가 삭제도 되살리고 주의 점수도 회수한다.
function RestoreButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[4px] border border-[#212121] px-[6px] text-[12px] leading-[20px] text-[#212121] hover:bg-[#f6f6f6]"
    >
      복원
    </button>
  );
}

// 신고·조치 로그 한 묶음 = 글/댓글 하나. 번호는 묶음 단위, 그 안의 사건은 1-1, 1-2 … 로 나눈다 (PM 요청).
// 묶음 머리 행에 작성 위치 · 원문 링크 · 현재 상태 · 복원 버튼을 두고, 아래에 사건을 시간순으로 늘어놓는다.
export default function ReportRow({ group, number, onRestore }) {
  // 새 탭(target=_blank)이 아니라 같은 탭에서 앱 내 이동 — 앱(TWA)에서는 새 탭이 앱을 다시 켜는 것처럼 보였고,
  // 전체 새로고침이라 로딩 화면 없이 흰 화면이 스쳤다
  const link = group.link ? (
    <Link
      href={group.link}
      title={group.targetTitle}
      aria-label={group.linkLabel}
      className="underline decoration-solid underline-offset-2"
      onClick={(e) => e.stopPropagation()}
    >
      원문
    </Link>
  ) : (
    <span className="text-[#919191]">-</span>
  );

  const restore = group.canRestore && onRestore ? <RestoreButton onClick={() => onRestore(group)} /> : null;

  return (
    <>
      {/* 폰: 카드 한 장. 6열을 그대로 욱여넣으면 글자가 한 자씩 끊긴다 */}
      <div className="flex flex-col gap-[6px] border-b border-[#dedede] px-[6px] py-[10px] font-['Pretendard',sans-serif] text-[13px] tracking-[-0.26px] text-[#454545] md:hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate font-medium text-[#212121]" title={group.targetTitle}>
            {number}. {group.board}
            {group.targetTitle ? ` · ${group.targetTitle}` : ''}
          </span>
          <span className="flex shrink-0 items-center gap-[10px] pr-[6px]">
            <span className="text-[#919191]">{group.stateLabel}</span>
            {restore}
            {link}
          </span>
        </div>
        <ol className="flex flex-col gap-[4px]">
          {group.events.map((event) => (
            <li key={event.key} className="flex gap-[6px]">
              <span className="shrink-0 text-[#919191]">{number}-{event.sub}</span>
              <div className="flex min-w-0 flex-1 flex-col">
                <EventLine event={event} />
                <span className="text-[12px] text-[#919191]">
                  {event.status}
                  {event.date ? ` · ${event.date}` : ''}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* 태블릿 이상: 6열 그리드. 머리 행 + 사건 행. 사유가 여러 줄이라 높이를 고정하지 않는다 */}
      <div className="hidden border-b border-[#dedede] py-[6px] font-['Pretendard',sans-serif] text-[13px] tracking-[-0.26px] text-[#454545] md:block">
        <div className={`${REPORT_GRID} min-h-[28px] items-center`}>
          <div className="text-center font-medium text-[#212121]">{number}</div>
          <div className="truncate text-center" title={group.board}>
            {group.board}
          </div>
          <div className="min-w-0 truncate pr-[4px] text-left text-[#212121]" title={group.targetTitle}>
            {group.targetTitle ?? ''}
          </div>
          <div className="text-center">{link}</div>
          <div className="flex flex-col items-center gap-[2px] text-center">
            <span>{group.stateLabel}</span>
            {restore}
          </div>
          <div />
        </div>
        {group.events.map((event) => (
          <div key={event.key} className={`${REPORT_GRID} min-h-[24px] py-[2px]`}>
            <div className="text-center text-[#919191]">
              {number}-{event.sub}
            </div>
            <div />
            <div className="min-w-0 pr-[4px] text-left">
              <EventLine event={event} />
            </div>
            <div />
            <div className="text-center text-[#919191]">{event.status}</div>
            <div className="text-center text-[#919191]">{event.date}</div>
          </div>
        ))}
      </div>
    </>
  );
}
