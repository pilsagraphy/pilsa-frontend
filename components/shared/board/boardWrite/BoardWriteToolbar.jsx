'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  List,
  ListOrdered,
  Minus,
  Baseline,
  Highlighter,
  FileText,
} from 'lucide-react';
import { useEditorState } from '@tiptap/react';

const iconClass = (active) =>
  `transition-colors ${active ? 'text-[#212121]' : 'text-[#b9b9b9] hover:text-[#212121]'}`;

// 본문 편집 툴바.
// 제목(H1~H3)·굵게·기울임·목록·수평선·글자색·배경색은 아래 '내용' 편집기(BoardRichEditor)에 바로 적용된다 —
// 노션처럼 누른 서식이 그 자리에서 보이고, 켜져 있는 서식은 진하게 표시된다.
// 문서 아이콘은 첨부파일(첨부 목록에 노출되는 파일)을 고른다.
const FORMAT_BUTTONS = [
  { key: 'h1', label: '큰 제목', Icon: Heading1, run: (c) => c.toggleHeading({ level: 1 }) },
  { key: 'h2', label: '중간 제목', Icon: Heading2, run: (c) => c.toggleHeading({ level: 2 }) },
  { key: 'h3', label: '작은 제목', Icon: Heading3, run: (c) => c.toggleHeading({ level: 3 }) },
  { key: 'bold', label: '굵게', Icon: Bold, run: (c) => c.toggleBold() },
  { key: 'italic', label: '기울임', Icon: Italic, run: (c) => c.toggleItalic() },
  { key: 'ul', label: '목록', Icon: List, run: (c) => c.toggleBulletList() },
  { key: 'ol', label: '번호 목록', Icon: ListOrdered, run: (c) => c.toggleOrderedList() },
  { key: 'hr', label: '수평선', Icon: Minus, run: (c) => c.setHorizontalRule() },
];

// 색 팔레트 — 글자색은 본문 위에서 읽히는 진한 색, 배경색은 글자를 가리지 않는 연한 색
const TEXT_COLORS = [
  { label: '빨강', value: '#E53935' },
  { label: '주황', value: '#FB8C00' },
  { label: '노랑', value: '#F9A825' },
  { label: '초록', value: '#43A047' },
  { label: '파랑', value: '#1E88E5' },
  { label: '보라', value: '#8E24AA' },
  { label: '회색', value: '#757575' },
];
const BACKGROUND_COLORS = [
  { label: '노랑', value: '#FFF59D' },
  { label: '주황', value: '#FFCCBC' },
  { label: '초록', value: '#C8E6C9' },
  { label: '파랑', value: '#BBDEFB' },
  { label: '보라', value: '#E1BEE7' },
  { label: '회색', value: '#EEEEEE' },
];

const sameColor = (a, b) => Boolean(a && b) && String(a).toLowerCase() === String(b).toLowerCase();

// 색 고르기 풍선. 툴바 상자가 가로 스크롤(overflow)이라 그 안에 두면 잘리므로 body 에 붙인다(portal)
function ColorPopover({ anchorRef, colors, current, onPick, onClear, onClose }) {
  const [pos, setPos] = useState(null);

  useEffect(() => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 196;
    const left = Math.max(8, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 8));
    setPos({ left, top: rect.bottom + 6, width });
  }, [anchorRef]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (anchorRef.current?.contains(event.target)) return;
      if (event.target.closest?.('[data-color-popover]')) return;
      onClose();
    };
    const onKey = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [anchorRef, onClose]);

  if (!pos || typeof document === 'undefined') return null;

  return createPortal(
    <div
      data-color-popover
      role="listbox"
      style={{ position: 'fixed', left: pos.left, top: pos.top, width: pos.width }}
      className="z-[80] rounded-[6px] border border-[#DEDEDE] bg-white p-2 shadow-[0_6px_20px_rgba(0,0,0,0.12)]"
      // 편집기 선택 영역이 풀리지 않게 한다
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="flex flex-wrap gap-[6px]">
        {colors.map((color) => (
          <button
            key={color.value}
            type="button"
            role="option"
            title={color.label}
            aria-label={color.label}
            aria-selected={sameColor(current, color.value)}
            onClick={() => onPick(color.value)}
            style={{ backgroundColor: color.value }}
            className={`size-[24px] rounded-full border ${
              sameColor(current, color.value) ? 'border-[#212121] ring-2 ring-[#212121]/20' : 'border-[#DEDEDE]'
            }`}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 w-full rounded-[4px] border border-[#DEDEDE] py-1 text-[13px] text-[#454545] hover:bg-[#F5F5F5]"
      >
        기본색으로
      </button>
    </div>,
    document.body
  );
}

export default function BoardWriteToolbar({
  editor = null,
  files = [],
  onFilesChange,
  allowAttachment = false,
}) {
  const fileInputRef = useRef(null);
  const textColorRef = useRef(null);
  const bgColorRef = useRef(null);
  const [openPalette, setOpenPalette] = useState(null); // 'text' | 'background' | null

  // 커서가 놓인 곳의 서식 — 바뀔 때만 다시 그린다
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            h1: e.isActive('heading', { level: 1 }),
            h2: e.isActive('heading', { level: 2 }),
            h3: e.isActive('heading', { level: 3 }),
            bold: e.isActive('bold'),
            italic: e.isActive('italic'),
            ul: e.isActive('bulletList'),
            ol: e.isActive('orderedList'),
            hr: false,
            textColor: e.getAttributes('textStyle').color ?? null,
            backgroundColor: e.getAttributes('textStyle').backgroundColor ?? null,
          }
        : null,
  });

  const applyFormat = (run) => {
    if (!editor) return;
    run(editor.chain().focus()).run();
  };

  const handlePickFiles = (e) => {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length > 0) onFilesChange([...(files ?? []), ...picked]);
    // 같은 파일을 다시 골라도 change 가 나도록 비운다
    e.target.value = '';
  };

  const paletteButton = (key, ref, label, Icon, currentColor) => (
    <button
      ref={ref}
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => setOpenPalette((prev) => (prev === key ? null : key))}
      disabled={!editor}
      aria-label={label}
      aria-expanded={openPalette === key}
      title={label}
      className="relative shrink-0 disabled:opacity-40"
    >
      <Icon size={22} strokeWidth={2} className={iconClass(Boolean(currentColor))} />
      {/* 지금 걸린 색을 아이콘 아래 띠로 보여 준다 */}
      <span
        aria-hidden
        style={{ backgroundColor: currentColor ?? '#DEDEDE' }}
        className="absolute -bottom-[3px] left-1/2 h-[3px] w-[18px] -translate-x-1/2 rounded-full"
      />
    </button>
  );

  return (
    <div className="flex h-full w-full items-center justify-center gap-[12px] overflow-x-auto px-[10px] sm:gap-[18px] lg:gap-[24px] lg:px-[16px]">
      {FORMAT_BUTTONS.map(({ key, label, Icon, run }) => (
        <button
          key={key}
          type="button"
          // mousedown 을 막아 편집기 선택 영역이 풀리지 않게 한다 (풀리면 서식이 엉뚱한 곳에 걸린다)
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyFormat(run)}
          disabled={!editor}
          aria-label={label}
          aria-pressed={Boolean(active?.[key])}
          title={label}
          className="shrink-0 disabled:opacity-40"
        >
          <Icon size={22} strokeWidth={2} className={iconClass(active?.[key])} />
        </button>
      ))}

      {paletteButton('text', textColorRef, '글자색', Baseline, active?.textColor)}
      {paletteButton('background', bgColorRef, '배경색', Highlighter, active?.backgroundColor)}

      {openPalette === 'text' && (
        <ColorPopover
          anchorRef={textColorRef}
          colors={TEXT_COLORS}
          current={active?.textColor}
          onPick={(value) => {
            applyFormat((c) => c.setColor(value));
            setOpenPalette(null);
          }}
          onClear={() => {
            applyFormat((c) => c.unsetColor());
            setOpenPalette(null);
          }}
          onClose={() => setOpenPalette(null)}
        />
      )}
      {openPalette === 'background' && (
        <ColorPopover
          anchorRef={bgColorRef}
          colors={BACKGROUND_COLORS}
          current={active?.backgroundColor}
          onPick={(value) => {
            applyFormat((c) => c.setBackgroundColor(value));
            setOpenPalette(null);
          }}
          onClear={() => {
            applyFormat((c) => c.unsetBackgroundColor());
            setOpenPalette(null);
          }}
          onClose={() => setOpenPalette(null)}
        />
      )}

      {allowAttachment && (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="첨부파일"
            title="첨부파일"
            className="shrink-0"
          >
            <FileText size={22} strokeWidth={2} className={iconClass(false)} />
          </button>

          <input ref={fileInputRef} type="file" multiple hidden onChange={handlePickFiles} />
        </>
      )}
    </div>
  );
}
