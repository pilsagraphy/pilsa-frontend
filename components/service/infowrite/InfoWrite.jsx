'use client';
import React from 'react';
import { useEffect } from 'react';
import InfoWriteForm from './InfoWriteForm';
import { useInfoWriteStore } from '@/stores/useInfoWriteStore';
import { useRouter } from 'next/navigation';

export default function InfoWrite() {
  const { title, file, isImportant, content, resetForm } = useInfoWriteStore();
  const router = useRouter();

  // 페이지에 들어오자마자 스토어 초기화
  useEffect(() => {
    resetForm();
  }, [resetForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('isImportant', isImportant === 'important');
    if (file) formData.append('file', file);

    try {
      await axios.post('/api/admin/stu/info', formData);
      alert('작성이 완료되었습니다!');
      resetForm();
      router.push('/info');
    } catch (error) {
      console.error('발송 실패:', error);
    }
  };

  const handleCancel = () => {
    if (window.confirm('작성을 취소하시겠습니까? 작성 중인 내용은 저장되지 않습니다.')) {
      resetForm();
      router.back(); // 취소 시 이전 페이지(목록)로 돌아가기
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[20px] max-w-[1000px] mx-auto p-8">
      <div className="flex flex-col gap-[36px] w-full">
        <h1 className="text-[24px] font-bold text-black tracking-[-0.48px] leading-[1.5]">
          정보게시판 글쓰기
        </h1>

        <InfoWriteForm />
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
