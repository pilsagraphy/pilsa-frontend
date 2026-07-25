'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function NoticeHead() {
  const router = useRouter();

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <h1 className="text-[20px] font-semibold tracking-[-0.48px] text-[#212121] md:mt-[36px] md:text-[24px]">
        공지사항
      </h1>

      <button
        type="button"
        className="hidden h-[52px] w-[135px] shrink-0 items-center justify-center rounded-[4px] bg-[#212121] text-white md:flex md:self-start md:translate-y-[60px]"
        onClick={() => router.push('/students/notices')}
      >
        목록
      </button>
    </div>
  );
}
