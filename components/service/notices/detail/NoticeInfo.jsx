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

export default function NoticeInfo({ isImportant, title, date, author }) {
  return (
    <section className="w-full">
      <Divider dark />

      <div className="h-[56px] flex items-center">
        <div className="flex items-center gap-[12px]">
          {isImportant && <Chip />}
          <h2 className="text-[18px] tracking-[-0.36px] text-[#212121] leading-none">{title}</h2>
        </div>
      </div>

      <Divider />

      <div className="h-[56px] flex items-center justify-between text-[14px] tracking-[-0.28px]">
        <div className="flex items-center gap-[12px]">
          <span className="text-[#919191] leading-none">등록일</span>
          <VLine />
          <span className="text-[#454545] leading-none">{date}</span>
        </div>

        <div className="flex items-center gap-[12px]">
          <span className="text-[#919191] leading-none">작성자</span>
          <VLine />
          <span className="text-[#454545] leading-none">{author}</span>
        </div>
      </div>
    </section>
  );
}
