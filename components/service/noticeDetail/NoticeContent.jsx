'use client';

import React from 'react';

export default function NoticeContent({ content = '' }) {
  if (!content) return null;

  return (
    <section className="w-full">
      <p className="break-words text-[15px] leading-[1.65] tracking-[-0.32px] text-[#212121] whitespace-pre-line md:text-[16px] md:leading-[1.6]">
        {content}
      </p>
    </section>
  );
}
