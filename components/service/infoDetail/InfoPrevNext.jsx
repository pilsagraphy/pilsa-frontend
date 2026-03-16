'use client';

import React from 'react';

export default function InfoPrevNext({ links }) {
  if (!links) return null;

  const { hasPrev, hasNext, prevPostApi, nextPostApi } = links;

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
            console.log('이전 클릭:', prevPostApi);
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
            console.log('다음 클릭:', nextPostApi);
          }}
        >
          다음 ▶
        </button>
      </div>
    </div>
  );
}
