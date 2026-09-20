'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Heading,
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

// 켜진 서식은 진한 색 + 연한 배경, 꺼진 서식은 회색.
// hover 색은 마우스가 있는 기기에서만 — 폰은 한 번 누르면 hover 가 남아 꺼진 버튼도 진하게 보였다 (PM, 2026-09-21)
const buttonClass = (active) =>
  `shrink-0 rounded-[4px] p-[3px] transition-colors disabled:opacity-40 ${
    active ? 'bg-[#EDEDED] text-[#212121]' : 'text-[#b9b9b9] [@media(hover:hover)]:hover:text-[#212121]'
  }`;

// 본문 편집 툴바.
// 제목(H1~H6)·굵게·기울임·목록·수평선·글자색·배경색은 아래 '내용' 편집기(BoardRichEditor)에 바로 적용된다 —
// 노션처럼 누른 서식이 그 자리에서 보이고, 켜져 있는 서식은 진하게 표시된다.
// 문서 아이콘은 첨부파일(첨부 목록에 노출되는 파일)을 고른다.
const FORMAT_BUTTONS = [
  { key: 'bold', label: '굵게', Icon: Bold, run: (c) => c.toggleBold() },
  { key: 'italic', label: '기울임', Icon: Italic, run: (c) => c.toggleItalic() },
  { key: 'ul', label: '목록', Icon: List, run: (c) => c.toggleBulletList() },
  { key: 'ol', label: '번호 목록', Icon: ListOrdered, run: (c) => c.toggleOrderedList() },
  { key: 'hr', label: '수평선', Icon: Minus, run: (c) => c.setHorizontalRule() },
];

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6];
// 고르기 목록에서 각 단계가 실제 크기 차이로 보이게
const HEADING_PREVIEW_SIZE = { 1: 22, 2: 20, 3: 18, 4: 17, 5: 16, 6: 15 };

// 색 팔레트 — 글자색은 본문 위에서 읽히는 진한 색, 배경색은 글자를 가리지 않는 연한 색
// 무지개 순서(빨 → 주 → 노 → 연두 → 초 → 청록 → 파 → 남 → 보 → 분홍) 뒤에 무채색(갈색·회색) — 뒤섞이면 찾기 어렵다
const TEXT_COLORS = [
  { label: '빨강', value: '#E53935' },
  { label: '주황', value: '#FB8C00' },
  { label: '노랑', value: '#F9A825' },
  { label: '연두', value: '#7CB342' },
  { label: '초록', value: '#43A047' },
  { label: '청록', value: '#00897B' },
  { label: '파랑', value: '#1E88E5' },
  { label: '남색', value: '#3949AB' },
  { label: '보라', value: '#8E24AA' },
  { label: '분홍', value: '#EC407A' },
  { label: '갈색', value: '#6D4C41' },
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

// 툴바 버튼 아래에 뜨는 풍선. 툴바 상자가 가로 스크롤(overflow)이라 그 안에 두면 잘리므로 body 에 붙인다(portal)
function ToolbarPopover({ anchorRef, width = 196, onClose, children }) {
  const [pos, setPos] = useState(null);

  useEffect(() => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.max(8, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 8));
    setPos({ left, top: rect.bottom + 6 });
  }, [anchorRef, width]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (anchorRef.current?.contains(event.target)) return;
      if (event.target.closest?.('[data-toolbar-popover]')) return;
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
      data-toolbar-popover
      style={{ position: 'fixed', left: pos.left, top: pos.top, width }}
      className="z-[80] rounded-[6px] border border-[#DEDEDE] bg-white p-2 shadow-[0_6px_20px_rgba(0,0,0,0.12)]"
      // 편집기 선택 영역이 풀리지 않게 한다
      onMouseDown={(e) => e.preventDefault()}
    >
      {children}
    </div>,
    document.body
  );
}

function ColorPalette({ colors, current, onPick, onClear }) {
  return (
    <div role="listbox">
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
    </div>
  );
}

export default function BoardWriteToolbar({
  editor = null,
  files = [],
  onFilesChange,
  allowAttachment = false,
}) {
  const fileInputRef = useRef(null);
  const headingRef = useRef(null);
  const textColorRef = useRef(null);
  const bgColorRef = useRef(null);
  const [openPopover, setOpenPopover] = useState(null); // 'heading' | 'text' | 'background' | null
  const closePopover = () => setOpenPopover(null);

  // 커서가 놓인 곳의 서식 — 바뀔 때만 다시 그린다
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            headingLevel: HEADING_LEVELS.find((level) => e.isActive('heading', { level })) ?? null,
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

  const popoverButton = (key, ref, label, Icon, isActive, underlineColor) => (
    <button
      ref={ref}
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => setOpenPopover((prev) => (prev === key ? null : key))}
      disabled={!editor}
      aria-label={label}
      aria-expanded={openPopover === key}
      title={label}
      className={`relative ${buttonClass(isActive)}`}
    >
      <Icon size={22} strokeWidth={2} />
      {/* 색 버튼은 지금 걸린 색을 아이콘 아래 띠로 보여 준다 */}
      {underlineColor !== undefined && (
        <span
          aria-hidden
          style={{ backgroundColor: underlineColor ?? '#DEDEDE' }}
          className="absolute bottom-0 left-1/2 h-[3px] w-[18px] -translate-x-1/2 rounded-full"
        />
      )}
    </button>
  );

  return (
    <div className="flex h-full w-full items-center justify-center gap-[8px] overflow-x-auto px-[10px] sm:gap-[14px] lg:gap-[20px] lg:px-[16px]">
      {/* 제목: 누르면 H1~H6 중에 고른다. 켜져 있으면 단계가 아이콘 옆에 보인다 */}
      {/* flex 여야 다른 버튼과 세로 가운데가 맞는다 — inline span 이면 글자 기준선에 붙어 혼자 떠 보였다 */}
      <span className="relative flex shrink-0 items-center">
        {popoverButton('heading', headingRef, '제목', Heading, Boolean(active?.headingLevel))}
        {active?.headingLevel && (
          <span className="pointer-events-none absolute -right-[2px] -top-[2px] text-[10px] font-bold leading-none text-[#212121]">
            {active.headingLevel}
          </span>
        )}
      </span>

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
          className={buttonClass(active?.[key])}
        >
          <Icon size={22} strokeWidth={2} />
        </button>
      ))}

      {popoverButton('text', textColorRef, '글자색', Baseline, Boolean(active?.textColor), active?.textColor ?? null)}
      {popoverButton(
        'background',
        bgColorRef,
        '배경색',
        Highlighter,
        Boolean(active?.backgroundColor),
        active?.backgroundColor ?? null
      )}

      {openPopover === 'heading' && (
        <ToolbarPopover anchorRef={headingRef} width={168} onClose={closePopover}>
          <div role="listbox" className="flex flex-col">
            {HEADING_LEVELS.map((level) => {
              const selected = active?.headingLevel === level;
              return (
                <button
                  key={level}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    applyFormat((c) => c.toggleHeading({ level }));
                    closePopover();
                  }}
                  style={{ fontSize: HEADING_PREVIEW_SIZE[level] }}
                  className={`flex items-center justify-between rounded-[4px] px-2 py-1 text-left font-semibold text-[#212121] hover:bg-[#F5F5F5] ${
                    selected ? 'bg-[#EDEDED]' : ''
                  }`}
                >
                  <span>제목 {level}</span>
                  <span className="text-[11px] font-normal text-[#919191]">H{level}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                applyFormat((c) => c.setParagraph());
                closePopover();
              }}
              className="mt-1 w-full rounded-[4px] border border-[#DEDEDE] py-1 text-[13px] text-[#454545] hover:bg-[#F5F5F5]"
            >
              본문으로
            </button>
          </div>
        </ToolbarPopover>
      )}

      {openPopover === 'text' && (
        <ToolbarPopover anchorRef={textColorRef} onClose={closePopover}>
          <ColorPalette
            colors={TEXT_COLORS}
            current={active?.textColor}
            onPick={(value) => {
              applyFormat((c) => c.setColor(value));
              closePopover();
            }}
            onClear={() => {
              applyFormat((c) => c.unsetColor());
              closePopover();
            }}
          />
        </ToolbarPopover>
      )}

      {openPopover === 'background' && (
        <ToolbarPopover anchorRef={bgColorRef} onClose={closePopover}>
          <ColorPalette
            colors={BACKGROUND_COLORS}
            current={active?.backgroundColor}
            onPick={(value) => {
              applyFormat((c) => c.setBackgroundColor(value));
              closePopover();
            }}
            onClear={() => {
              applyFormat((c) => c.unsetBackgroundColor());
              closePopover();
            }}
          />
        </ToolbarPopover>
      )}

      {allowAttachment && (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="첨부파일"
            title="첨부파일"
            className={buttonClass(false)}
          >
            <FileText size={22} strokeWidth={2} />
          </button>

          <input ref={fileInputRef} type="file" multiple hidden onChange={handlePickFiles} />
        </>
      )}
    </div>
  );
}
