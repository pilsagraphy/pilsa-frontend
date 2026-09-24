'use client';

import BoardMarkdown from '@/components/shared/board/BoardMarkdown';

// 일정 상세 - 세부 내용. 관리자 일정 폼이 게시글과 같은 편집기(툴바)로 마크다운을 저장하므로 같은 렌더러로 그린다 (2026-09-21).
// 예전 평문 세부 사항('-' 목록, 줄바꿈)도 마크다운 규칙 안이라 그대로 보인다.
export default function ScheduleDetailContent({ content = '' }) {
  if (!content || !String(content).trim()) return null;
  return (
    <div className="text-[14px] md:text-[16px]">
      <BoardMarkdown content={String(content)} />
    </div>
  );
}
