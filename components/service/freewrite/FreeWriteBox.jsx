'use client';
import React from 'react';
import { useFreeWriteStore } from '../../../stores/freewrite.store';

export default function FreeWriteBox({
  label,
  placeholder,
  type = 'text',
  field,
  hasIcon,
  isHalf,
}) {
  const value = useFreeWriteStore((state) => state[field]);
  const setField = useFreeWriteStore((state) => state.setField);

  const handleChange = (e) => setField(field, e.target.value);

  return (
    <div
      className={`flex ${isHalf ? 'flex-1' : 'w-full'} gap-[${type === 'textarea' ? '10' : '12'}px] flex-col`}
    >
      <label
        htmlFor={field}
        className="flex w-full text-[16px] text-black font-['Pretendard:Regular',sans-serif] leading-[1.6] tracking-[-0.32px] justify-center flex-col"
      >
        {label}
      </label>

      <div
        className={`flex w-full ${type === 'textarea' ? 'h-[615px]' : 'h-[52px]'} px-[16px] bg-white border border-[#b9b9b9] rounded-[4px] transition-colors overflow-hidden relative focus-within:border-[#212121]`}
      >
        {type === 'textarea' && (
          <textarea
            id={field}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            className="w-full h-full pt-[12px] text-[16px] text-black font-['Pretendard:Regular',sans-serif] tracking-[-0.32px] placeholder:text-[#9e9e9e] bg-transparent outline-none resize-none"
          />
        )}

        {(type === 'text' || type === 'file') && (
          <input
            id={field}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            className={`w-full h-full text-[16px] text-black font-['Pretendard:Regular',sans-serif] tracking-[-0.32px] placeholder:text-[#9e9e9e] bg-transparent outline-none ${type === 'file' ? 'pt-[12px] file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#f0f0f0] file:text-[#212121] cursor-pointer' : ''}`}
          />
        )}

        {type === 'select' && (
          <>
            <select
              id={field}
              value={value}
              onChange={handleChange}
              className="w-full h-full text-[16px] text-black font-['Pretendard:Regular',sans-serif] tracking-[-0.32px] bg-transparent outline-none appearance-none cursor-pointer z-10"
            >
              <option value="" disabled hidden>
                {placeholder}
              </option>
              <option value="general">일반</option>
              <option value="question">질문</option>
              <option value="info">정보</option>
            </select>

            {hasIcon && (
              <svg
                className="w-[15px] h-[8px] absolute right-[16px] top-1/2 -translate-y-1/2 pointer-events-none z-0"
                viewBox="0 0 15 8"
                fill="none"
                stroke="#212121"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 0.5L7.5 7.5L0.5 0.5" />
              </svg>
            )}
          </>
        )}
      </div>
    </div>
  );
}
