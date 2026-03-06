import React from 'react';
import NoticeWriteBox from './NoticeWriteBox';
import useNoticeStore from '@/stores/useNoticeStore';

export default function NoticeWriteForm() {
  const { title, isImportant, content, setTitle, setFile, setIsImportant, setContent } =
    useNoticeStore();

  return (
    <div className="flex flex-col gap-[12px] w-full">
      <NoticeWriteBox label="제목">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요."
          required
          className="w-full h-full px-[16px] bg-transparent text-[16px] tracking-[-0.32px] outline-none"
        />
      </NoticeWriteBox>

      <div className="flex flex-col md:flex-row gap-[12px] w-full">
        <NoticeWriteBox label="첨부파일" showTooltip={true}>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full h-full px-[16px] pt-[12px] bg-transparent text-[16px] tracking-[-0.32px] outline-none cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-[4px] file:border-0 file:text-sm file:bg-gray-100 file:text-[#212121] hover:file:bg-gray-200"
          />
        </NoticeWriteBox>

        <NoticeWriteBox label="‘중요’ 표시 여부">
          <select
            value={isImportant}
            onChange={(e) => setIsImportant(e.target.value)}
            className="w-full h-full px-[16px] bg-transparent text-[16px] text-[#212121] tracking-[-0.32px] outline-none appearance-none cursor-pointer relative z-10"
          >
            <option value="none">표시 안 함 / 표시 두 가지 드롭다운</option>
            <option value="important">표시</option>
          </select>

          <svg
            className="absolute right-[16px] pointer-events-none"
            width="15"
            height="8"
            viewBox="0 0 15 8"
            fill="none"
          >
            <path
              d="M14.5 0.5L7.5 7.5L0.5 0.5"
              stroke="#212121"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </NoticeWriteBox>
      </div>

      <NoticeWriteBox label="내용" heightClass="h-[615px]">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요."
          required
          className="w-full h-full p-[16px] bg-transparent text-[16px] tracking-[-0.32px] outline-none resize-none"
        />
      </NoticeWriteBox>
    </div>
  );
}
