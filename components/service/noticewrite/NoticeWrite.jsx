'use client';
import React from 'react';
import NoticeWriteForm from './NoticeWriteForm';
import useNoticeStore from '../../../stores/useNoticeStore';

export default function NoticeWrite() {
  const { title, file, isImportant, content, resetForm } = useNoticeStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { title, file, isImportant, content };
    console.log('🚀 Submit Data:', submitData);
    alert('작성이 완료되었습니다!');
    resetForm();
  };

  const handleCancel = () => {
    if (window.confirm('작성을 취소하시겠습니까?')) {
      resetForm();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[20px] max-w-[1000px] mx-auto p-8">
      <div className="flex flex-col gap-[36px] w-full">
        <h1 className="text-[24px] font-bold text-black tracking-[-0.48px] leading-[1.5]">
          공지사항 글쓰기
        </h1>

        <NoticeWriteForm />
      </div>

      <div className="flex flex-col gap-[12px] w-full mt-4">
        <button
          type="submit"
          className="flex items-center justify-center w-full h-[52px] bg-[#212121] text-[16px] text-white tracking-[-0.32px] rounded-[4px] hover:bg-black transition-colors cursor-pointer"
        >
          글 작성하기
        </button>

        <button
          type="button"
          onClick={handleCancel}
          className="flex items-center justify-center w-full h-[52px] bg-white border border-[#b9b9b9] text-[16px] text-[#212121] tracking-[-0.32px] rounded-[4px] hover:bg-gray-50 transition-colors cursor-pointer"
        >
          취소
        </button>
      </div>
    </form>
  );
}
