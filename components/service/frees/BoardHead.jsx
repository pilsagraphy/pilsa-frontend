'use client';

import React from 'react';

export default function BoardHead({ categoryName = '자유게시판' }) {
  return (
    <div className="w-full flex justify-between items-start">
      <h1 className="text-[24px] font-semibold tracking-[-0.48px] text-black leading-[1.5]">
        {categoryName}
      </h1>
      <button
        type="button"
        className="h-[52px] w-[135px] bg-[#212121] text-white rounded-[4px] text-[16px] tracking-[-0.32px]"
        onClick={() => console.log('목록 클릭')}
      >
        목록
      </button>
    </div>
  );
}
