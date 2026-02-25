'use client';

import React from 'react';

export default function NoticeHead() {
  return (
    <div className="flex justify-between items-center w-full">
      <h1 className="text-[24px] font-semibold tracking-[-0.48px] text-black">공지사항</h1>

      <button type="button" className="h-[52px] w-[135px] bg-[#212121] text-white rounded-[4px]">
        목록
      </button>
    </div>
  );
}
