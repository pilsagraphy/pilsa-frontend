'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

function extractPostId(apiPath) {
  if (!apiPath) return null;
  const match = String(apiPath).match(/\/posts\/(\d+)/);
  return match ? match[1] : null;
}

export default function FreePrevNext({ prevPostApi, nextPostApi }) {
  const router = useRouter();

  const prevPostId = extractPostId(prevPostApi);
  const nextPostId = extractPostId(nextPostApi);

  const hasPrev = Boolean(prevPostId);
  const hasNext = Boolean(nextPostId);

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
            if (!hasPrev) return;
            router.push(`/students/free/${prevPostId}`);
          }}
        >
          ◀ 이전
        </button>
        <button
          type="button"
          className={`${baseBtn} ${hasNext ? enabledBtn : disabledBtn}`}
          disabled={!hasNext}
          onClick={() => {
            if (!hasNext) return;
            router.push(`/students/free/${nextPostId}`);
          }}
        >
          다음 ▶
        </button>
      </div>
    </div>
  );
}
