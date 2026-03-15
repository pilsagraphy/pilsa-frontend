'use client';

import React from 'react';

function Divider() {
  return <div className="w-full h-px bg-[#DEDEDE]" />;
}

export default function FreeAttachments({ attachments = [] }) {
  if (!Array.isArray(attachments) || attachments.length === 0) return null;

  return (
    <section className="flex flex-col gap-[20px] w-full">
      <Divider />

      <div className="flex items-start gap-[24px] text-[16px] tracking-[-0.32px]">
        <span className="text-[#919191] shrink-0">첨부파일</span>

        <div className="flex flex-col gap-[8px]">
          {attachments.map((file) => {
            const fileName = file?.originName ?? file?.name ?? '첨부파일';
            const fileUrl = file?.fileUrl ?? file?.url ?? '#';
            const key = file?.attachmentId ?? fileUrl ?? fileName;

            return (
              <a
                key={key}
                href={fileUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#454545] hover:underline flex items-center gap-1"
              >
                {fileName}
              </a>
            );
          })}
        </div>
      </div>

      <Divider />
    </section>
  );
}
