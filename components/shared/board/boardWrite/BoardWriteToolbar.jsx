'use client';

import React, { useRef } from 'react';
import { Heading1, Heading2, Heading3, Bold, Italic, List, ListOrdered, FileText } from 'lucide-react';

import { applyInlineMarkdown } from '@/lib/markdown';

const iconClass = 'text-[#b9b9b9] transition-colors hover:text-[#212121]';

// 본문 편집 툴바.
// 제목(H1~H3)·굵게·기울임·목록은 아래 '내용'의 마크다운 본문에 서식을 넣고,
// 문서 아이콘은 첨부파일(첨부 목록에 노출되는 파일)을 고른다.
const FORMAT_BUTTONS = [
  { type: 'h1', label: '큰 제목', Icon: Heading1 },
  { type: 'h2', label: '중간 제목', Icon: Heading2 },
  { type: 'h3', label: '작은 제목', Icon: Heading3 },
  { type: 'bold', label: '굵게', Icon: Bold },
  { type: 'italic', label: '기울임', Icon: Italic },
  { type: 'ul', label: '목록', Icon: List },
  { type: 'ol', label: '번호 목록', Icon: ListOrdered },
];

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
    // textarea 가 아직 없으면 글 끝에 붙인다
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
    <div className="flex h-full w-full items-center justify-center gap-[12px] overflow-x-auto px-[10px] sm:gap-[18px] lg:gap-[26px] lg:px-[16px]">
      {FORMAT_BUTTONS.map(({ type, label, Icon }) => (
        <button key={type} type="button" onClick={() => applyFormat(type)} aria-label={label} title={label} className="shrink-0">
          <Icon size={22} strokeWidth={2} className={iconClass} />
        </button>
      ))}

      {allowAttachment && (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="첨부파일"
            title="첨부파일"
            className="shrink-0"
          >
            <FileText size={22} strokeWidth={2} className={iconClass} />
          </button>

          <input ref={fileInputRef} type="file" multiple hidden onChange={handlePickFiles} />
        </>
      )}
    </div>
  );
}
