'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FreeWriteForm from '@/components/service/freeWrite/FreeWriteForm';
import { useFreeWriteStore } from '@/stores/useFreeWriteStore';
import { getFreePostDetail, getFreeCategories, updateFreePost } from '@/apis/free';
import { getErrorMessage } from '@/apis/auth';

export default function FreeEdit({ postId }) {
  const router = useRouter();

  const { title, categoryId, content, isAnonymous, setForm, resetForm } = useFreeWriteStore();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchEditData = async () => {
      try {
        setLoading(true);

        const [detailData, categoryData] = await Promise.all([
          getFreePostDetail(postId),
          getFreeCategories(),
        ]);

        if (!isMounted) return;

        const categories = Array.isArray(categoryData) ? categoryData : [];

        const matchedCategory = categories.find(
          (category) => category.name === detailData?.categoryName
        );

        setForm({
          title: detailData?.title ?? '',
          content: detailData?.content ?? '',
          categoryId: matchedCategory?.categoryId ? String(matchedCategory.categoryId) : '',
          isAnonymous: Boolean(detailData?.isAnonymous),
          files: [],
        });
      } catch (error) {
        if (!isMounted) return;
        alert(getErrorMessage(error, '게시글 정보를 불러오지 못했습니다.'));
        router.push('/students/free');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (postId) {
      fetchEditData();
    }

    return () => {
      isMounted = false;
    };
  }, [postId, router, setForm]);

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

      await updateFreePost(postId, {
        title: title.trim(),
        content: content.trim(),
        categoryId: Number(categoryId),
        isAnonymous,
      });

      alert('수정이 완료되었습니다.');
      resetForm();
      router.push(`/students/free/${postId}`);
    } catch (error) {
      alert(getErrorMessage(error, '게시글 수정에 실패했습니다.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('수정을 취소하시겠습니까?')) {
      resetForm();
      router.back();
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-[#919191]">불러오는 중입니다.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[20px] max-w-[1000px] mx-auto p-8">
      <div className="flex flex-col gap-[36px] w-full">
        <h1 className="text-[24px] font-bold text-black tracking-[-0.48px] leading-[1.5]">
          자유게시판 글 수정
        </h1>

        <FreeWriteForm />
      </div>

      <div className="flex flex-col gap-[12px] w-full mt-4">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center w-full h-[52px] bg-[#212121] text-[16px] text-white tracking-[-0.32px] rounded-[4px] hover:bg-black transition-colors cursor-pointer disabled:opacity-60"
        >
          {submitting ? '수정 중...' : '수정 완료'}
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
