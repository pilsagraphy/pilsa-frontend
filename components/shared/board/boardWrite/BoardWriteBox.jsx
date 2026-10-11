import React from 'react';

// 글쓰기 폼의 라벨 + 입력 박스 한 칸
export default function BoardWriteBox({ label, children, heightClass = 'h-[52px]' }) {
  return (
    <div className="flex flex-col gap-[12px] w-full">
      <div className="flex items-center gap-[4px] text-[16px] text-ink tracking-[-0.32px]">
        <label className="leading-[1.6] whitespace-pre-wrap">{label}</label>
      </div>

      <div
        className={`flex items-center w-full ${heightClass} bg-surface border border-line-strong rounded-[4px] focus-within:border-ink transition-colors relative`}
      >
        {children}
      </div>
    </div>
  );
}
