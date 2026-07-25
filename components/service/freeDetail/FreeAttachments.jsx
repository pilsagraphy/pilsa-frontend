'use client';

import React from 'react';

function Divider() {
  return <div className="w-full h-px bg-[#DEDEDE]" />;
}

export default function FreeAttachments({ attachments = [] }) {
  if (!Array.isArray(attachments) || attachments.length === 0) return null;

  return (
    <section className="flex w-full flex-col gap-4 md:gap-[20px]">
      <Divider />

      <div className="flex flex-col gap-2 text-[15px] tracking-[-0.32px] md:flex-row md:items-start md:gap-6 md:text-[16px]">
        <span className="shrink-0 text-[#919191]">첨부파일</span>

        <div className="flex min-w-0 flex-col gap-2 md:gap-[8px]">
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
                className="flex items-center gap-1 break-all text-[#454545] hover:underline"
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
