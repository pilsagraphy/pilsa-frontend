'use client';

import React, { useEffect, useState } from 'react';
import FreeWriteBox from './FreeWriteBox';
import { useFreeWriteStore } from '@/stores/useFreeWriteStore';
import { ChevronDown } from 'lucide-react';
import { getFreeCategories } from '@/apis/free';

export default function FreeWriteForm() {
  const {
    title,
    categoryId,
    content,
    isAnonymous,
    setTitle,
    setFiles,
    setCategoryId,
    setContent,
    setIsAnonymous,
  } = useFreeWriteStore();

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const data = await getFreeCategories();
        if (!isMounted) return;
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!isMounted) return;
        setCategories([]);
        console.error('자유게시판 카테고리 조회 실패', error);
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-[12px] w-full">
      <FreeWriteBox label="제목">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요."
          required
          className="w-full h-full px-[16px] bg-transparent text-[16px] tracking-[-0.32px] outline-none"
        />
      </FreeWriteBox>

      <div className="flex flex-col md:flex-row gap-[12px] w-full">
        <FreeWriteBox label="첨부파일" showTooltip={true}>
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="w-full h-full px-[16px] pt-[12px] bg-transparent text-[16px] tracking-[-0.32px] outline-none cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-[4px] file:border-0 file:text-sm file:bg-gray-100 file:text-[#212121] hover:file:bg-gray-200"
          />
        </FreeWriteBox>

        <FreeWriteBox label="카테고리">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full h-full px-[16px] bg-transparent text-[16px] text-[#212121] tracking-[-0.32px] outline-none appearance-none cursor-pointer relative z-10"
            required
          >
            <option value="" disabled>
              게시글 카테고리를 선택하세요
            </option>

            {categories.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.name}
              </option>
            ))}
          </select>

          <ChevronDown
            className="absolute right-[16px] pointer-events-none"
            size={15}
            strokeWidth={2}
            color="#212121"
          />
        </FreeWriteBox>
      </div>

      <FreeWriteBox label="내용" heightClass="h-[615px]">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요."
          required
          className="w-full h-full p-[16px] bg-transparent text-[16px] tracking-[-0.32px] outline-none resize-none"
        />
      </FreeWriteBox>

      <div className="flex items-center pt-[8px] pb-[4px]">
        <label className="flex items-center gap-[8px] cursor-pointer">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-[16px] h-[16px] cursor-pointer accent-[#212121]"
          />
          <span className="text-[14px] text-[#212121] tracking-[-0.28px]">익명으로 게시</span>
        </label>
      </div>
    </div>
  );
}
