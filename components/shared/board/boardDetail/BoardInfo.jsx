'use client';

import React from 'react';
import { formatKoreanDate } from '@/lib/boardDetail';

import StateChip from './StateChip';

function Divider({ dark = false }) {
  return <div className={['w-full h-px', dark ? 'bg-[#B9B9B9]' : 'bg-[#DEDEDE]'].join(' ')} />;
}

function VLine() {
  return <div className="w-px h-[16px] bg-[#DEDEDE]" aria-hidden="true" />;
}

// 카테고리명 또는 '중요' 같은 배지
function Badge({ label }) {
  return (
    <div className="bg-[#212121] h-[27px] rounded-[103px] px-[12px] flex items-center justify-center">
      <span className="text-white text-[12px] tracking-[-0.24px] leading-none">{label}</span>
    </div>
  );
}

// 제목 · 배지 · 등록일 · 작성자 영역
//
// stateLabel: 게시글 상태(공개 · 블라인드 · 삭제). 관리자 상세만 넘긴다.
//   넘기지 않으면 그리지 않으므로 사용자 상세의 모양은 그대로다.
//   게시판 이름 옆에 붙이면 '게시판이 공개'라는 뜻으로 읽히므로 제목 옆에 둔다.
export default function BoardInfo({ badgeLabel, title, date, author, stateLabel }) {
  const safeTitle = title ?? '';
  const safeAuthor = author ?? '';
  const safeDate = formatKoreanDate(date);

  return (
    <section className="w-full">
      <Divider dark />

      <div className="flex min-h-0 items-center py-3 md:h-[56px] md:py-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2 md:gap-[12px]">
          {badgeLabel && <Badge label={badgeLabel} />}
          {/* 상태를 붙일 때만 flex-1 을 뺀다. flex-1 이면 제목이 남은 폭을 다 차지해
              상태가 오른쪽 끝으로 밀려 '제목 옆'이 아니게 된다.
              상태가 없는 사용자 상세는 지금까지와 똑같이 flex-1 을 유지한다. */}
          <h2
            className={`min-w-0 text-[16px] leading-snug tracking-[-0.36px] text-[#212121] md:text-[18px] md:leading-none ${
              stateLabel ? '' : 'flex-1'
            }`}
          >
            {safeTitle}
          </h2>
          {stateLabel && <StateChip label={stateLabel} />}
        </div>
      </div>

      <Divider />

      <div className="flex flex-col gap-3 py-3 text-[13px] tracking-[-0.28px] md:h-[56px] md:flex-row md:items-center md:justify-between md:gap-0 md:py-0 md:text-[14px]">
        <div className="flex flex-wrap items-center gap-2 md:gap-[12px]">
          <span className="shrink-0 text-[#919191] leading-none">등록일</span>
          <VLine />
          <span className="break-all text-[#454545] leading-none">{safeDate}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-[12px]">
          <span className="shrink-0 text-[#919191] leading-none">작성자</span>
          <VLine />
          <span className="min-w-0 break-all text-[#454545] leading-none">{safeAuthor}</span>
        </div>
      </div>
    </section>
  );
}
