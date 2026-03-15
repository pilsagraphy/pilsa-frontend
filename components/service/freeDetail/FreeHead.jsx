'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function FreeHead({ categoryName = '자유게시판' }) {
  const router = useRouter();

  return (
    <div className="w-full flex justify-between">
      <h1 className="mt-[36px] text-[24px] font-semibold tracking-[-0.48px] text-[#212121]">
        {categoryName}
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
        onClick={() => router.push('/students/free')}
      >
        목록
      </button>
    </div>
  );
}
