'use client';

import React from 'react';

function Divider({ dark = false }) {
  return <div className={['w-full h-px', dark ? 'bg-[#B9B9B9]' : 'bg-[#DEDEDE]'].join(' ')} />;
}

function VLine() {
  return <div className="w-px h-[16px] bg-[#DEDEDE]" aria-hidden="true" />;
}

function Chip() {
  return (
    <div className="bg-[#212121] h-[27px] rounded-[103px] px-[12px] flex items-center justify-center">
      <span className="text-white text-[12px] tracking-[-0.24px] leading-none">중요</span>
    </div>
  );
}

function formatKoreanDate(value) {
  if (!value) return '';
  if (typeof value === 'string' && value.includes('.')) return value;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}. ${mm}. ${dd}.`;
}

export default function NoticeInfo({ isImportant, title, date, author }) {
  const safeTitle = title ?? '';
  const safeAuthor = author ?? '';
  const safeDate = formatKoreanDate(date);

  return (
    <section className="w-full">
      <Divider dark />

      <div className="flex min-h-0 items-center py-3 md:h-[56px] md:py-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2 md:gap-[12px]">
          {Boolean(isImportant) && <Chip />}
          <h2 className="min-w-0 flex-1 text-[16px] leading-snug tracking-[-0.36px] text-[#212121] md:text-[18px] md:leading-none">
            {safeTitle}
          </h2>
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
