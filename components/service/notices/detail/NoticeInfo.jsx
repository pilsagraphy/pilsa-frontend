'use client';

import React from 'react';

function Divider() {
  return <div className="w-full h-px bg-[#DEDEDE]" />;
}

function Chip() {
  return (
    <div className="bg-[#212121] h-[27px] rounded-[103px] px-[12px] flex items-center justify-center">
      <span className="text-white text-[12px] tracking-[-0.24px]">중요</span>
    </div>
  );
}

export default function NoticeInfo({ notice }) {
  if (!notice) return null;

  const { isImportant, title, date, author } = notice;

  return (
    <section className="flex flex-col gap-[20px] w-full">
      <Divider />

      <div className="flex items-center gap-[12px]">
        {isImportant ? <Chip /> : null}
        <h2 className="text-[18px] tracking-[-0.36px] text-[#212121]">{title}</h2>
      </div>

      <Divider />

      <div className="flex items-center justify-between w-full text-[14px] tracking-[-0.28px] text-[#919191]">
        <div className="flex items-center gap-[24px]">
          <span>등록일</span>
          <span className="text-[#454545]">{date}</span>
        </div>

        <div className="flex items-center gap-[24px]">
          <span>작성자</span>
          <span className="text-[#454545]">{author}</span>
        </div>
      </div>

      <Divider />
    </section>
  );
}
