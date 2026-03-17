'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getErrorMessage } from '@/apis/auth';

import FreeWriteForm from '@/components/service/freeWrite/FreeWriteForm';
import InfoWriteForm from '@/components/service/infowrite/InfoWriteForm';

import { useFreeWriteStore } from '@/stores/useFreeWriteStore';
import { useInfoWriteStore } from '@/stores/useInfoWriteStore';

import { getFreePostDetail, getFreeCategories, updateFreePost } from '@/apis/free';
import { getInfoPostDetail, getInfoCategories, updateInfoPost } from '@/apis/info';

export default function Edit({ postId, boardType, titleText }) {
  const router = useRouter();

  const config = useMemo(() => {
    if (boardType === 'free') {
      return {
        FormComponent: FreeWriteForm,
        useWriteStore: useFreeWriteStore,
        getPostDetail: getFreePostDetail,
        getCategories: getFreeCategories,
        updatePost: updateFreePost,
        listPath: '/students/free',
        detailPathBuilder: (id) => `/students/free/${id}`,
        includeAnonymous: true,
      };
    }

    if (boardType === 'info') {
      return {
        FormComponent: InfoWriteForm,
        useWriteStore: useInfoWriteStore,
        getPostDetail: getInfoPostDetail,
        getCategories: getInfoCategories,
        updatePost: updateInfoPost,
        listPath: '/students/info',
        detailPathBuilder: (id) => `/students/info/${id}`,
        includeAnonymous: false,
      };
    }

    throw new Error(`지원하지 않는 boardType입니다: ${boardType}`);
  }, [boardType]);

  const {
    FormComponent,
    useWriteStore,
    getPostDetail,
    getCategories,
    updatePost,
    listPath,
    detailPathBuilder,
    includeAnonymous,
  } = config;

  const store = useWriteStore();
  const { title, categoryId, content, setForm, resetForm } = store;
  const isAnonymous = includeAnonymous ? Boolean(store.isAnonymous) : false;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchEditData = async () => {
      try {
        setLoading(true);

        const [detailData, categoryData] = await Promise.all([
          getPostDetail(postId),
          getCategories(),
        ]);

        if (!isMounted) return;

        const categories = Array.isArray(categoryData) ? categoryData : [];
        const matchedCategory = categories.find(
          (category) => category.name === detailData?.categoryName
        );

        const nextForm = {
          title: detailData?.title ?? '',
          content: detailData?.content ?? '',
          categoryId: matchedCategory?.categoryId ? String(matchedCategory.categoryId) : '',
          files: [],
        };

        if (includeAnonymous) {
          nextForm.isAnonymous = Boolean(detailData?.isAnonymous);
        }

        setForm(nextForm);
      } catch (error) {
        if (!isMounted) return;
        alert(getErrorMessage(error, '게시글 정보를 불러오지 못했습니다.'));
        router.push(listPath);
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
  }, [postId, router, setForm, getPostDetail, getCategories, includeAnonymous, listPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title?.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!content?.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    if (!categoryId) {
      alert('카테고리를 선택해주세요.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title: title.trim(),
        content: content.trim(),
        categoryId: Number(categoryId),
      };

      if (includeAnonymous) {
        payload.isAnonymous = isAnonymous;
      }

      await updatePost(postId, payload);

      alert('수정이 완료되었습니다.');
      resetForm();
      router.push(detailPathBuilder(postId));
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
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-[1000px] flex-col gap-[20px] p-8">
      <div className="flex w-full flex-col gap-[36px]">
        <h1 className="text-[24px] leading-[1.5] tracking-[-0.48px] font-bold text-black">
          {titleText}
        </h1>

        <FormComponent />
      </div>

      <div className="mt-4 flex w-full flex-col gap-[12px]">
        <button
          type="submit"
          disabled={submitting}
          className="flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[4px] bg-[#212121] text-[16px] tracking-[-0.32px] text-white transition-colors hover:bg-black disabled:opacity-60"
        >
          {submitting ? '수정 중...' : '수정 완료'}
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
