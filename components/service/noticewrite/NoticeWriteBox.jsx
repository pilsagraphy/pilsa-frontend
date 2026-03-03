import React from 'react';
import svgPaths from '../../../constants/NoticeWriteData';

export default function NoticeWriteBox({
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
          <svg className="w-[20px] h-[20px] text-[#919191]" fill="none" viewBox="0 0 18 18">
            <path
              d={svgPaths.p4276680}
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.2"
            />
          </svg>
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
