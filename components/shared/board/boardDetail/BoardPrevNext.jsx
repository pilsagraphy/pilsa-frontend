'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

// 이전 글 / 다음 글 이동. 이동할 글이 없으면 비활성.
// prevHref/nextHref는 상위(BoardDetailView)에서 게시판별 경로로 만들어 넘긴다.
export default function BoardPrevNext({ prevHref, nextHref }) {
  const router = useRouter();

  const baseBtn = 'text-[14px] tracking-[-0.32px] transition-colors md:text-[16px]';
  const enabledBtn = 'text-[#919191] hover:text-[#212121]';
  const disabledBtn = 'text-[#DEDEDE] cursor-not-allowed';

  return (
    <div className="flex w-full justify-center px-2">
      <div className="flex gap-8 md:gap-10">
        <button
          type="button"
          className={`${baseBtn} ${prevHref ? enabledBtn : disabledBtn}`}
          disabled={!prevHref}
          onClick={() => prevHref && router.push(prevHref)}
        >
          ◀ 이전
        </button>

        <button
          type="button"
          className={`${baseBtn} ${nextHref ? enabledBtn : disabledBtn}`}
          disabled={!nextHref}
          onClick={() => nextHref && router.push(nextHref)}
        >
          다음 ▶
        </button>
      </div>
    </div>
  );
}
