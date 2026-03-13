import React from 'react';
import FreeWriteBox from './FreeWriteBox';
import { useFreeWriteStore } from '@/stores/useFreeWriteStore';
import { ChevronDown } from 'lucide-react';

export default function FreeWriteForm() {
  const {
    title,
    category,
    content,
    isAnonymous,
    setTitle,
    setFile,
    setCategory,
    setContent,
    setIsAnonymous,
  } = useFreeWriteStore();

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
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full h-full px-[16px] pt-[12px] bg-transparent text-[16px] tracking-[-0.32px] outline-none cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-[4px] file:border-0 file:text-sm file:bg-gray-100 file:text-[#212121] hover:file:bg-gray-200"
          />
        </FreeWriteBox>

        <FreeWriteBox label="카테고리">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-full px-[16px] bg-transparent text-[16px] text-[#212121] tracking-[-0.32px] outline-none appearance-none cursor-pointer relative z-10"
            required
          >
            {/* 기본 선택 옵션 */}
            <option value="" disabled>
              게시글 카테고리를 선택하세요
            </option>
            {/* 임의의 카테고리 예시 */}
            <option value="general">일반</option>
            <option value="question">질문</option>
            <option value="info">정보</option>
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
