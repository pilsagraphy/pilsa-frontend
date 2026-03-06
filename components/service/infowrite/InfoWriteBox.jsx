'use client';
import React from 'react';
import { useInfoWriteStore } from '@/stores/infowrite.store';

export default function InfoWriteBox() {
  const { title, setTitle, category, setCategory, content, setContent, setFile } =
    useInfoWriteStore();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex gap-[12px] flex-col w-full">
      {/* 1. 제목 영역 */}
      <div className="flex gap-[12px] flex-col w-full">
        <label
          htmlFor="title"
          className="text-[16px] text-black tracking-[-0.32px] leading-[1.6] w-full cursor-pointer"
        >
          제목
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요."
          className="px-[16px] text-[16px] text-black placeholder:text-[#9e9e9e] w-full h-[52px] bg-white border border-[#b9b9b9] rounded-[4px] outline-none focus:border-[#212121] transition-colors"
        />
      </div>

      {/* 2 & 3. 첨부파일 & 카테고리 묶음 */}
      <div className="flex gap-[12px] items-start w-full">
        {/* 첨부파일 (수정된 부분) */}
        <div className="flex gap-[12px] items-start flex-col flex-1 w-full">
          <label
            htmlFor="file-upload"
            className="text-[16px] text-black tracking-[-0.32px] leading-[1.6] w-full cursor-pointer"
          >
            첨부파일
          </label>
          <input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            // flex 속성 제거 및 py(상하 패딩) 값 조절로 수직 중앙 정렬
            className="px-[16px] py-[11px] text-[16px] text-[#9e9e9e] file:text-[14px] file:font-semibold file:text-black hover:file:text-black w-full h-[52px] bg-white border border-[#b9b9b9] rounded-[4px] file:mr-[16px] file:px-[12px] file:py-[4px] file:rounded-[4px] file:border-0 file:bg-[#f0f0f0] hover:file:bg-[#e0e0e0] cursor-pointer outline-none transition-colors"
          />
        </div>

        {/* 카테고리 */}
        <div className="flex gap-[12px] items-start flex-col flex-1 w-full">
          <label
            htmlFor="category"
            className="text-[16px] text-black tracking-[-0.32px] leading-[1.6] w-full cursor-pointer"
          >
            카테고리
          </label>
          <div className="relative w-full h-[52px]">
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="pl-[16px] pr-[40px] text-[16px] text-black tracking-[-0.32px] w-full h-full bg-white border border-[#b9b9b9] rounded-[4px] appearance-none outline-none focus:border-[#212121] cursor-pointer transition-colors"
            >
              <option value="" disabled className="text-[#9e9e9e]">
                게시글 카테고리를 선택하세요.
              </option>
              <option value="notice">공지사항</option>
              <option value="free">자유게시판</option>
              <option value="qna">질문/답변</option>
            </select>

            <svg
              viewBox="0 0 15 8"
              fill="none"
              className="absolute right-[16px] top-1/2 -translate-y-1/2 w-[15px] h-[8px] pointer-events-none"
            >
              <path
                d="M14.5 0.5L7.5 7.5L0.5 0.5"
                stroke="#212121"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 4. 내용 영역 */}
      <div className="flex gap-[10px] items-start flex-col w-full">
        <label
          htmlFor="content"
          className="text-[16px] text-black tracking-[-0.32px] leading-[1.6] w-full cursor-pointer"
        >
          내용
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요."
          className="p-[16px] text-[16px] text-black tracking-[-0.32px] placeholder:text-[#9e9e9e] w-full h-[615px] bg-white border border-[#b9b9b9] rounded-[4px] resize-none outline-none focus:border-[#212121] transition-colors"
        />
      </div>
    </div>
  );
}
