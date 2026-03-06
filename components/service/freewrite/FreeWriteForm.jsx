'use client';
import React from 'react';
import FreeWriteBox from './FreeWriteBox';
import { useFreeWriteStore } from '@/stores/freewrite.store';

export default function FreeWriteForm() {
  const isAnonymous = useFreeWriteStore((state) => state.isAnonymous);
  const setField = useFreeWriteStore((state) => state.setField);
  const resetForm = useFreeWriteStore((state) => state.resetForm);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submit Data:', useFreeWriteStore.getState());
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col">
      {/* 입력 영역 */}
      <div className="flex w-full mb-[36px] gap-[12px] flex-col items-start">
        <FreeWriteBox label="제목" placeholder="제목을 입력하세요." type="text" field="title" />

        <div className="flex w-full gap-[12px] items-start">
          <FreeWriteBox
            label="첨부파일"
            placeholder="첨부파일을 선택해주세요."
            type="file"
            field="file"
            isHalf
          />
          <FreeWriteBox
            label="카테고리"
            placeholder="게시글 카테고리를 선택하세요."
            type="select"
            field="category"
            hasIcon
            isHalf
          />
        </div>

        <FreeWriteBox
          label="내용"
          placeholder="내용을 입력하세요."
          type="textarea"
          field="content"
        />
      </div>

      {/* 익명 체크박스 영역 (SVG 원본 디테일 복구) */}
      <div className="flex mb-[20px] gap-[8px] items-center">
        <label className="flex gap-[8px] cursor-pointer items-center">
          <div
            className={`flex w-[24px] h-[24px] border border-solid rounded-[2px] transition-colors relative justify-center items-center ${isAnonymous ? 'bg-[#212121] border-[#212121]' : 'bg-white border-[#b9b9b9]'}`}
          >
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setField('isAnonymous', e.target.checked)}
              className="sr-only"
            />
            {isAnonymous && (
              <svg
                className="w-[14px] h-[10px]"
                viewBox="0 0 15 10"
                fill="none"
                stroke="#FAFAFA"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* 알려주신 원본 Path 적용 완료! */}
                <path d="M1.00002 4.60002L4.77421 9.00002L14 1.00002" />
              </svg>
            )}
          </div>
          <span className="text-[14px] text-black font-['Pretendard:Regular',sans-serif] leading-[1.6] tracking-[-0.28px]">
            익명으로 게시
          </span>
        </label>
      </div>

      {/* 버튼 영역 */}
      <div className="flex w-full gap-[20px] flex-col items-end">
        <button
          type="submit"
          className="flex w-full h-[52px] bg-[#212121] rounded-[4px] transition-colors outline-none cursor-pointer hover:bg-black justify-center items-center"
        >
          <span className="text-[16px] text-white text-center font-['Pretendard:Regular',sans-serif] leading-[1.6] tracking-[-0.32px]">
            글 작성하기
          </span>
        </button>
        <button
          type="button"
          onClick={resetForm}
          className="flex w-full h-[52px] bg-white border border-[#b9b9b9] border-solid rounded-[4px] transition-colors outline-none cursor-pointer hover:bg-gray-50 justify-center items-center"
        >
          <span className="text-[16px] text-[#212121] text-center font-['Pretendard:Regular',sans-serif] leading-[1.6] tracking-[-0.32px]">
            취소
          </span>
        </button>
      </div>
    </form>
  );
}
