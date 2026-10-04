'use client';
import React, { useState } from 'react';
import Link from 'next/link';

// 헤더 행과 데이터 행이 동일한 열 정렬을 쓰도록 공유하는 그리드 템플릿.
// [번호][진행순번][작성 위치][내역][링크][상태][날짜][시간] — 내역 칸만 남는 폭을 다 가져간다 (PM 열 구성, 2026-09-27).
export const REPORT_GRID =
  'grid grid-cols-[36px_52px_84px_minmax(0,1fr)_64px_60px_64px_44px] items-start gap-x-[6px] pr-[14px]';

// 기타 사유의 상세는 이 글자 수까지만 보이고, 넘치면 '더 보기'로 편다
const DETAIL_PREVIEW = 40;

// 내역 한 줄: { label, value, detail? } → "라벨 : 값 (상세)"
function EventLine({ line }) {
  const [open, setOpen] = useState(false);
  const detail = line.detail ?? '';
  const long = detail.length > DETAIL_PREVIEW || detail.includes('\n');
  const shown = open || !long ? detail : `${detail.replace(/\s+/g, ' ').slice(0, DETAIL_PREVIEW)}…`;

  return (
    <div className="text-[#454545] [word-break:keep-all]">
      <span className="text-[#919191]">{line.label} : </span>
      <span className="text-[#212121]">{line.value}</span>
      {detail && (
        <span className="whitespace-pre-wrap break-words text-[12px] leading-[1.6] text-[#757575]">
          {' '}
          ({shown})
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

const linkClass = 'underline decoration-solid underline-offset-2 hover:text-[#212121]';

// 신고·조치 로그 한 묶음 = 글/댓글 하나. 번호는 묶음 단위, 그 안의 사건은 진행순번 1, 2 … 로 나눈다 (PM 요청).
// 묶음 머리 행에 작성 위치 · 제목 · 링크(원문 / 신고 관리) · 현재 상태를 두고, 아래에 사건을 시간순으로 늘어놓는다.
// 복원·삭제 같은 조치는 여기서 하지 않는다 — 신고 관리로 건너가서 한다 (PM, 2026-09-27).
export default function ReportRow({ group, number }) {
  // 새 탭(target=_blank)이 아니라 같은 탭에서 앱 내 이동 — 앱(TWA)에서는 새 탭이 앱을 다시 켜는 것처럼 보였고,
  // 전체 새로고침이라 로딩 화면 없이 흰 화면이 스쳤다
  const links = (
    <>
      {group.link ? (
        <Link href={group.link} title={group.targetTitle} aria-label={group.linkLabel} className={linkClass}>
          원문
        </Link>
      ) : (
        <span className="text-[#919191]">-</span>
      )}
      <Link href={group.reportsLink} className={linkClass}>
        신고 관리
      </Link>
    </>
  );

  return (
    <>
      {/* 폰: 카드 한 장. 8열을 그대로 욱여넣으면 글자가 한 자씩 끊긴다 */}
      <div className="flex flex-col gap-[6px] border-b border-[#dedede] px-[6px] py-[10px] font-['Pretendard',sans-serif] text-[13px] tracking-[-0.26px] text-[#454545] md:hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate font-medium text-[#212121]" title={group.targetTitle}>
            {number}. {group.board}
            {group.targetTitle ? ` · ${group.targetTitle}` : ''}
          </span>
          <span className="flex shrink-0 items-center gap-[10px] pr-[6px]">
            <span className="text-[#919191]">{group.stateLabel}</span>
            {links}
          </span>
        </div>
        <ol className="flex flex-col gap-[6px]">
          {group.events.map((event) => (
            <li key={event.key} className="flex gap-[6px]">
              <span className="shrink-0 text-[#919191]">{event.sub}.</span>
              <div className="flex min-w-0 flex-1 flex-col gap-[1px]">
                {event.lines.map((line) => (
                  <EventLine key={line.label} line={line} />
                ))}
                <span className="text-[12px] text-[#919191]">
                  {event.status} · {event.date} {event.time}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* 태블릿 이상: 8열 그리드. 머리 행 + 사건 행. 내역이 여러 줄이라 높이를 고정하지 않는다 */}
      <div className="hidden border-b border-[#dedede] py-[6px] font-['Pretendard',sans-serif] text-[13px] tracking-[-0.26px] text-[#454545] md:block">
        <div className={`${REPORT_GRID} min-h-[28px] items-center`}>
          <div className="text-center font-medium text-[#212121]">{number}</div>
          <div />
          <div className="truncate text-center" title={group.board}>
            {group.board}
          </div>
          <div className="min-w-0 truncate pr-[4px] text-left text-[#212121]" title={group.targetTitle}>
            {group.targetTitle ?? ''}
          </div>
          <div className="flex flex-col items-center gap-[2px] text-center">{links}</div>
          <div className="text-center">{group.stateLabel}</div>
          <div />
          <div />
        </div>
        {group.events.map((event) => (
          <div key={event.key} className={`${REPORT_GRID} py-[3px]`}>
            <div />
            <div className="text-center text-[#919191]">{event.sub}</div>
            <div />
            <div className="flex min-w-0 flex-col gap-[1px] pr-[4px] text-left">
              {event.lines.map((line) => (
                <EventLine key={line.label} line={line} />
              ))}
            </div>
            <div />
            <div className="text-center text-[#919191]">{event.status}</div>
            <div className="text-center text-[#919191]">{event.date}</div>
            <div className="text-center text-[#919191]">{event.time}</div>
          </div>
        ))}
      </div>
    </>
  );
}
