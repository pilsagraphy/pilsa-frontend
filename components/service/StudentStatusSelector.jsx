'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function StudentStatusSelector() {
  const [hoveredButton, setHoveredButton] = useState(null);

  const handleSelection = (type) => {
    console.log(`선택됨: ${type === 'student' ? '재학생' : '졸업생'}`);
  };

  return (
    <div className="flex size-full items-center justify-center py-20 font-['Pretendard',sans-serif]">
      <div className="flex w-[600px] flex-col gap-[33px]">
        <h1 className="w-full whitespace-pre-wrap text-[24px] font-semibold leading-[1.5] tracking-[-0.48px] text-black">
          현재 학교를 다니고 계신가요?
        </h1>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => handleSelection('student')}
            onMouseEnter={() => setHoveredButton('student')}
            onMouseLeave={() => setHoveredButton(null)}
            className={`h-[52px] w-full rounded text-[16px] font-normal leading-[1.6] tracking-[-0.32px] transition-colors ${
              hoveredButton === 'student'
                ? 'bg-[#212121] text-white hover:bg-[#212121]'
                : 'border border-[#b9b9b9] bg-white text-[#212121] hover:bg-white'
            }`}
          >
            재학생입니다
          </Button>

          <Button
            onClick={() => handleSelection('graduate')}
            onMouseEnter={() => setHoveredButton('graduate')}
            onMouseLeave={() => setHoveredButton(null)}
            className={`h-[52px] w-full rounded text-[16px] font-normal leading-[1.6] tracking-[-0.32px] transition-colors ${
              hoveredButton === 'graduate'
                ? 'bg-[#212121] text-white hover:bg-[#212121]'
                : 'border border-[#b9b9b9] bg-white text-[#212121] hover:bg-white'
            }`}
          >
            졸업생입니다
          </Button>
        </div>
      </div>
    </div>
  );
}
