'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function NoticePrevNext({ links }) {
  const router = useRouter();

  if (!links) return null;

  const { prev, next, hasPrev, hasNext } = links;

  const baseBtn = 'text-[16px] tracking-[-0.32px] transition-colors';
  const enabledBtn = 'text-[#919191] hover:text-[#212121]';
  const disabledBtn = 'text-[#DEDEDE] cursor-not-allowed';

  return (
    <div className="w-full flex justify-center">
      <div className="flex gap-[40px]">
        <button
          type="button"
          className={`${baseBtn} ${hasPrev ? enabledBtn : disabledBtn}`}
          disabled={!hasPrev}
          onClick={() => {
            if (!hasPrev || !prev?.href) return;
            router.push(prev.href);
          }}
        >
          ◀ 이전
        </button>

        <button
          type="button"
          className={`${baseBtn} ${hasNext ? enabledBtn : disabledBtn}`}
          disabled={!hasNext}
          onClick={() => {
            if (!hasNext || !next?.href) return;
            router.push(next.href);
          }}
        >
          다음 ▶
        </button>
      </div>
    </div>
  );
}
