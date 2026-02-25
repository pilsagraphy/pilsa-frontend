'use client';

import React from 'react';

function Divider() {
  return <div className="w-full h-px bg-[#DEDEDE]" />;
}

export default function NoticeAttachments({ attachments = [] }) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <section className="flex flex-col gap-[20px] w-full">
      <Divider />

      <div className="flex items-start gap-[24px] text-[16px] tracking-[-0.32px]">
        <span className="text-[#919191] shrink-0">첨부파일</span>

        <div className="flex flex-col gap-[8px]">
          {attachments.map((file, index) => (
            <a key={index} href={file.url} download className="text-[#454545] hover:underline">
              {file.name}
            </a>
          ))}
        </div>
      </div>

      <Divider />
    </section>
  );
}
