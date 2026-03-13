'use client';

import React from 'react';

export default function NoticeHead() {
  return (
    <div className="w-full flex justify-between">
      <h1 className="mt-[36px] text-[24px] font-semibold tracking-[-0.48px] text-[#212121]">
        공지사항
      </h1>

      <button
        type="button"
        className="
          self-start
          translate-y-[60px]
          h-[52px]
          w-[135px]
          bg-[#212121]
          text-white
          rounded-[4px]
        "
        onClick={() => console.log('목록 클릭')}
      >
        목록
      </button>
    </div>
  );
}
