'use client';

import React, { useEffect, useState } from 'react';
import FreeWriteForm from './FreeWriteForm';
import { useFreeWriteStore } from '@/stores/useFreeWriteStore';
import { useRouter } from 'next/navigation';
import { createFreePost } from '@/apis/free';
import { getErrorMessage } from '@/apis/auth';

export default function FreeWrite() {
  const { title, files, categoryId, content, isAnonymous, resetForm } = useFreeWriteStore();

  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    resetForm();
  }, [resetForm]); // 페이지에 들어오자마자 스토어 초기화

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    if (!categoryId) {
      alert('카테고리를 선택해주세요.');
      return;
    }

    try {
      setSubmitting(true);

      await createFreePost({
        title: title.trim(),
        content: content.trim(),
        categoryId: Number(categoryId),
        isAnonymous,
        files,
      });

      alert('작성이 완료되었습니다.');
      resetForm();
      router.push('/students/free');
    } catch (error) {
      alert(getErrorMessage(error, '글 작성에 실패했습니다.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('작성을 취소하시겠습니까? 작성 중인 내용은 저장되지 않습니다.')) {
      resetForm();
      router.back(); // 취소 시 이전 페이지로 돌아가기
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[20px] max-w-[1000px] mx-auto p-8">
      <div className="flex flex-col gap-[36px] w-full">
        <h1 className="text-[24px] font-bold text-black tracking-[-0.48px] leading-[1.5]">
          자유게시판 글쓰기
        </h1>

        <FreeWriteForm />
      </div>

      <div className="flex flex-col gap-[12px] w-full mt-4">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center w-full h-[52px] bg-[#212121] text-[16px] text-white tracking-[-0.32px] rounded-[4px] hover:bg-black transition-colors cursor-pointer disabled:opacity-60"
        >
          {submitting ? '작성 중...' : '글 작성하기'}
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
