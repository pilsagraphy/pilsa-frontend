'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

function extractPostId(apiPath) {
  if (!apiPath) return null;
  const match = String(apiPath).match(/\/posts\/(\d+)/);
  return match?.[1] ?? null;
}

export default function InfoPrevNext({ links }) {
  const router = useRouter();

  if (!links) return null;

  const { hasPrev, hasNext, prevPostApi, nextPostApi } = links;

  const prevPostId = extractPostId(prevPostApi);
  const nextPostId = extractPostId(nextPostApi);

  const baseBtn = 'text-[14px] tracking-[-0.32px] transition-colors md:text-[16px]';
  const enabledBtn = 'text-[#919191] hover:text-[#212121]';
  const disabledBtn = 'text-[#DEDEDE] cursor-not-allowed';

  return (
    <div className="flex w-full justify-center px-2">
      <div className="flex gap-8 md:gap-10">
        <button
          type="button"
          className={`${baseBtn} ${hasPrev && prevPostId ? enabledBtn : disabledBtn}`}
          disabled={!hasPrev || !prevPostId}
          onClick={() => {
            if (!hasPrev || !prevPostId) return;
            router.push(`/students/info/${prevPostId}`);
          }}
        >
          ◀ 이전
        </button>
        <button
          type="button"
          className={`${baseBtn} ${hasNext && nextPostId ? enabledBtn : disabledBtn}`}
          disabled={!hasNext || !nextPostId}
          onClick={() => {
            if (!hasNext || !nextPostId) return;
            router.push(`/students/info/${nextPostId}`);
          }}
        >
          다음 ▶
        </button>
      </div>
    </div>
  );
}
