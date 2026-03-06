'use client';
import React from 'react';
import InfoWriteBox from './InfoWriteBox';
import { useInfoWriteStore } from '@/stores/infowrite.store';

export default function InfoWriteForm() {
  const { title, category, content, file, resetForm } = useInfoWriteStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    console.log({ title, category, content, file });
    alert('게시글이 작성되었습니다!');
    resetForm();
  };

  const handleCancel = () => {
    if (window.confirm('작성을 취소하시겠습니까?')) resetForm();
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-[20px] items-end flex-col w-full h-full">
      <div className="flex gap-[36px] items-start flex-col w-full">
        <div className="flex justify-center flex-col w-full">
          <h1 className="text-[24px] font-semibold text-black tracking-[-0.48px] leading-[1.5] m-0">
            정보게시판 글쓰기
          </h1>
        </div>

        <InfoWriteBox />
      </div>

      <button
        type="submit"
        className="flex justify-center items-center px-[16px] text-[16px] text-white tracking-[-0.32px] w-full h-[52px] bg-[#212121] rounded-[4px] border-none outline-none cursor-pointer hover:bg-black transition-colors"
      >
        글 작성하기
      </button>

      <button
        type="button"
        onClick={handleCancel}
        className="flex justify-center items-center px-[16px] text-[16px] text-[#212121] tracking-[-0.32px] w-full h-[52px] bg-white border border-[#b9b9b9] rounded-[4px] outline-none cursor-pointer hover:bg-gray-50 transition-colors"
      >
        취소
      </button>
    </form>
  );
}
