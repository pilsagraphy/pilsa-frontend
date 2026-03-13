import React from 'react';
import { CircleAlert } from 'lucide-react';

export default function FreeWriteBox({
  label,
  children,
  heightClass = 'h-[52px]',
  showTooltip = false,
}) {
  return (
    <div className="flex flex-col gap-[12px] w-full">
      <div className="flex items-center gap-[4px] text-[16px] text-black tracking-[-0.32px]">
        <label className="leading-[1.6] whitespace-pre-wrap">{label}</label>

        {showTooltip && (
          /* 기존 <svg> 태그를 지우고 CircleAlert로 교체! */
          <CircleAlert className="w-[20px] h-[20px] text-[#919191]" strokeWidth={1.2} />
        )}
      </div>

      <div
        className={`flex items-center w-full ${heightClass} bg-white border border-[#b9b9b9] rounded-[4px] focus-within:border-black transition-colors relative`}
      >
        {children}
      </div>
    </div>
  );
}
