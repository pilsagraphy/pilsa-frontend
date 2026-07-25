'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import InfoWriteForm from './InfoWriteForm';
import { useInfoWriteStore } from '@/stores/useInfoWriteStore';
import { createInfoPost } from '@/apis/info';
import { getErrorMessage } from '@/apis/auth';

export default function InfoWrite() {
  const router = useRouter();
  const { title, categoryId, content, files, resetForm } = useInfoWriteStore();

  const [submitting, setSubmitting] = useState(false);

  // 페이지에 들어오자마자 스토어 초기화
  useEffect(() => {
    resetForm();
  }, [resetForm]);

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

      await createInfoPost({
        title: title.trim(),
        content: content.trim(),
        categoryId: Number(categoryId),
        files,
      });

      alert('작성이 완료되었습니다.');
      resetForm();
      router.push('/students/info');
    } catch (error) {
      alert(getErrorMessage(error, '게시글 작성에 실패했습니다.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('작성을 취소하시겠습니까? 작성 중인 내용은 저장되지 않습니다.')) {
      resetForm();
      router.back(); // 취소 시 이전 페이지(목록)로 돌아가기
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-[1000px] flex-col gap-[20px] p-8">
      <div className="flex w-full flex-col gap-[36px]">
        <h1 className="text-[24px] leading-[1.5] tracking-[-0.48px] font-bold text-black">
          정보게시판 글쓰기
        </h1>

        <InfoWriteForm />
      </div>

      <div className="mt-4 flex w-full flex-col gap-[12px]">
        <button
          type="submit"
          disabled={submitting}
          className="flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[4px] bg-[#212121] text-[16px] tracking-[-0.32px] text-white transition-colors hover:bg-black disabled:opacity-60"
        >
          {submitting ? '작성 중...' : '글 작성하기'}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          className="flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[4px] border border-[#b9b9b9] bg-white text-[16px] tracking-[-0.32px] text-[#212121] transition-colors hover:bg-gray-50"
        >
          취소
        </button>
      </div>
    </form>
  );
}
