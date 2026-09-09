'use client';

import React from 'react';
import BoardMarkdown from '@/components/shared/board/BoardMarkdown';

// 본문 (마크다운)
export default function BoardContent({ content = '' }) {
  if (!content) return null;

  // select-text: 모바일 전역 user-select:none(globals.css) 예외 — 본문은 복사할 수 있어야 한다
  return (
    <section className="w-full select-text">
      <BoardMarkdown content={content} />
    </section>
  );
}
