'use client';

import React from 'react';
import BoardMarkdown from '@/components/shared/board/BoardMarkdown';

// 본문 (마크다운)
export default function BoardContent({ content = '' }) {
  if (!content) return null;

  return (
    <section className="w-full">
      <BoardMarkdown content={content} />
    </section>
  );
}
