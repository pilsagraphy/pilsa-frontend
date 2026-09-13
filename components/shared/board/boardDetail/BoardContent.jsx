'use client';

import React from 'react';
import BoardMarkdown from '@/components/shared/board/BoardMarkdown';

// 본문 (마크다운)
// 내용이 한두 줄뿐인 글도 있어서 최소 높이를 준다 — 없으면 제목 바로 아래에 구분선·버튼이 붙어 답답해 보인다(디자인 요구).
export default function BoardContent({ content = '' }) {
  // select-text: 모바일 전역 user-select:none(globals.css) 예외 — 본문은 복사할 수 있어야 한다
  return (
    <section className="min-h-[140px] w-full select-text pb-8 pt-2 md:min-h-[200px] md:pb-12 md:pt-3">
      {content ? <BoardMarkdown content={content} /> : null}
    </section>
  );
}
