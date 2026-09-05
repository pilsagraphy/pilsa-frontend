'use client';

import React, { useRef } from 'react';
import { Heading, Bold, Italic, FileText } from 'lucide-react';

import { applyInlineMarkdown } from '@/lib/markdown';

const iconClass = 'text-[#b9b9b9] transition-colors hover:text-[#212121]';

// 본문 편집 툴바.
// 제목·굵게·기울임은 아래 '내용'의 마크다운 본문에 서식을 넣고,
// 문서 아이콘은 첨부파일(첨부 목록에 노출되는 파일)을 고른다.
export default function BoardWriteToolbar({
  contentRef,
  value,
  onChange,
  files = [],
  onFilesChange,
  allowAttachment = false,
}) {
  const fileInputRef = useRef(null);

  const applyFormat = (type) => {
    const textarea = contentRef?.current;
    const base = value ?? '';
    // 미리보기 탭이면 textarea 가 없다 → 글 끝에 붙인다
    const start = textarea ? textarea.selectionStart : base.length;
    const end = textarea ? textarea.selectionEnd : base.length;

    const next = applyInlineMarkdown(base, start, end, type);
    onChange(next.text);

    // 서식을 넣은 자리로 커서를 돌려놔야 이어서 타이핑할 수 있다
    requestAnimationFrame(() => {
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(next.selectionStart, next.selectionEnd);
    });
  };

  const handlePickFiles = (e) => {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length > 0) onFilesChange([...(files ?? []), ...picked]);
    // 같은 파일을 다시 골라도 change 가 나도록 비운다
    e.target.value = '';
  };

  return (
    <div className="flex h-full w-full items-center justify-center gap-[34px] px-[16px]">
      <button type="button" onClick={() => applyFormat('heading')} aria-label="제목" title="제목">
        <Heading size={24} strokeWidth={2} className={iconClass} />
      </button>

      <button type="button" onClick={() => applyFormat('bold')} aria-label="굵게" title="굵게">
        <Bold size={24} strokeWidth={2} className={iconClass} />
      </button>

      <button type="button" onClick={() => applyFormat('italic')} aria-label="기울임" title="기울임">
        <Italic size={24} strokeWidth={2} className={iconClass} />
      </button>

      {allowAttachment && (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="첨부파일"
            title="첨부파일"
          >
            <FileText size={24} strokeWidth={2} className={iconClass} />
          </button>

          <input ref={fileInputRef} type="file" multiple hidden onChange={handlePickFiles} />
        </>
      )}
    </div>
  );
}
