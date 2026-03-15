'use client';

import React from 'react';

export default function FreeContent({ content = '' }) {
  if (!content) return null;

  return (
    <section className="w-full">
      <p className="text-[16px] leading-[1.6] tracking-[-0.32px] text-[#212121] whitespace-pre-line">
        {content}
      </p>
    </section>
  );
}
