'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import InfoWriteBox from './InfoWriteBox';
import { useInfoWriteStore } from '@/stores/useInfoWriteStore';
import { getInfoCategories } from '@/apis/info';

export default function InfoWriteForm() {
  const { title, categoryId, content, files, setTitle, setFiles, setCategoryId, setContent } =
    useInfoWriteStore();

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const data = await getInfoCategories();
        if (!isMounted) return;
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('정보게시판 카테고리 조회 실패', error);
        if (!isMounted) return;
        setCategories([]);
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileChange = (e) => {
    const nextFiles = Array.from(e.target.files ?? []);
    setFiles(nextFiles);
  };

  return (
    <div className="flex flex-col gap-[12px] w-full">
      <InfoWriteBox label="제목">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요."
          required
          className="w-full h-full px-[16px] bg-transparent text-[16px] tracking-[-0.32px] outline-none"
        />
      </InfoWriteBox>

      <div className="flex flex-col md:flex-row gap-[12px] w-full">
        <InfoWriteBox label="첨부파일" showTooltip={true}>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="w-full h-full px-[16px] pt-[12px] bg-transparent text-[16px] tracking-[-0.32px] outline-none cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-[4px] file:border-0 file:text-sm file:bg-gray-100 file:text-[#212121] hover:file:bg-gray-200"
          />
        </InfoWriteBox>

        <InfoWriteBox label="카테고리">
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
              <option key={category.categoryId} value={String(category.categoryId)}>
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
        </InfoWriteBox>
      </div>

      {Array.isArray(files) && files.length > 0 && (
        <div className="px-[4px] text-[14px] tracking-[-0.28px] text-[#666666]">
          {files
            .map((file) => file?.name)
            .filter(Boolean)
            .join(', ')}
        </div>
      )}

      <InfoWriteBox label="내용" heightClass="h-[615px]">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요."
          required
          className="w-full h-full p-[16px] bg-transparent text-[16px] tracking-[-0.32px] outline-none resize-none"
        />
      </InfoWriteBox>
    </div>
  );
}
