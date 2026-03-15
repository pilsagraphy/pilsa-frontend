'use client';

import React from 'react';

function Divider({ dark = false }) {
  return <div className={['w-full h-px', dark ? 'bg-[#919191]' : 'bg-[#DEDEDE]'].join(' ')} />;
}

function VLine() {
  return (
    <div className="flex h-[21px] items-center justify-center w-0">
      <div className="rotate-90">
        <div className="h-px w-[21px] bg-[#B9B9B9]" />
      </div>
    </div>
  );
}

function CategoryChip({ name }) {
  return (
    <div className="bg-[#212121] h-[27px] rounded-[103px] px-[12px] flex items-center justify-center shrink-0">
      <span className="text-white text-[12px] tracking-[-0.24px] leading-[1.4]">{name}</span>
    </div>
  );
}

export default function BoardInfo({ categoryName, title, date, author, attachments = [] }) {
  return (
    <section className="w-full flex flex-col gap-[20px]">
      <Divider dark />

      {/* 카테고리 + 제목 */}
      <div className="flex items-center gap-[12px]">
        {categoryName && <CategoryChip name={categoryName} />}
        <h2 className="text-[18px] tracking-[-0.36px] text-[#212121] leading-[1.6]">{title}</h2>
      </div>

      <Divider />

      {/* 등록일 / 작성자 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[24px]">
          <span className="text-[#919191] text-[14px] tracking-[-0.28px]">등록일</span>
          <VLine />
          <span className="text-[#454545] text-[16px] tracking-[-0.32px]">{date}</span>
        </div>
        <div className="flex items-end gap-[24px]">
          <span className="text-[#919191] text-[14px] tracking-[-0.28px]">작성자</span>
          <VLine />
          <span className="text-[#454545] text-[14px] tracking-[-0.28px]">{author}</span>
        </div>
      </div>

      <Divider />

      {/* 첨부파일 */}
      {attachments.length > 0 && (
        <>
          <div className="flex items-center gap-[24px]">
            <span className="text-[#919191] text-[14px] tracking-[-0.28px] shrink-0">첨부파일</span>
            <VLine />
            <div className="flex flex-col gap-[4px]">
              {attachments.map((file) => (
                <a
                  key={file.attachmentId ?? file.fileUrl}
                  href={file.fileUrl ?? '#'}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#454545] text-[16px] tracking-[-0.32px] hover:underline"
                >
                  {file.originName ?? '첨부파일'}
                </a>
              ))}
            </div>
          </div>
          <Divider />
        </>
      )}
    </section>
  );
}
