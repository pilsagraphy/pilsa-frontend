import React from 'react';
import FreeWriteForm from './FreeWriteForm';

export default function FreeWrite() {
  return (
    <section className="flex w-full max-w-[800px] mx-auto h-full p-[20px] gap-[36px] flex-col items-start">
      <h1 className="text-[24px] text-black font-['Pretendard:SemiBold',sans-serif] leading-[1.5] tracking-[-0.48px]">
        자유게시판 글쓰기
      </h1>
      <FreeWriteForm />
    </section>
  );
}
