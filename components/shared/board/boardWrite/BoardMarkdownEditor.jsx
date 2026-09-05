'use client';

import React, { useCallback, useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';

import BoardMarkdown from '@/components/shared/board/BoardMarkdown';
import { uploadFile } from '@/apis/file';
import { getErrorMessage } from '@/apis/auth';
import { uploadPlaceholder } from '@/lib/markdown';

const TAB_WRITE = 'write';
const TAB_PREVIEW = 'preview';

const tabClass = (active) =>
  `px-3 py-1 text-[14px] transition-colors ${
    active ? 'font-medium text-[#212121]' : 'text-[#919191] hover:text-[#212121]'
  }`;

// 마크다운 본문 편집기.
// 텍스트는 마크다운 원문 그대로 다루고, 이미지는 고르는 즉시 업로드해
// 서버가 준 markdown 문자열을 본문에 끼워 넣는다 (GitHub 방식).
//
// allowUpload=false 인 게시판(파일 업로드 미사용)에서는 이미지 삽입 UI를 감춘다.
export default function BoardMarkdownEditor({
  boardId,
  value,
  onChange,
  allowUpload = false,
  // 위쪽 툴바가 같은 textarea 에 서식을 넣어야 해서 ref 를 밖에서 받을 수 있게 열어둔다
  textareaRef: externalTextareaRef,
}) {
  const [tab, setTab] = useState(TAB_WRITE);
  const [uploading, setUploading] = useState(false);

  const innerTextareaRef = useRef(null);
  const textareaRef = externalTextareaRef ?? innerTextareaRef;
  const fileInputRef = useRef(null);

  // 고른 이미지들의 자리표시자를 커서 위치에 한 번에 넣고,
  // 업로드가 끝나는 대로 그 자리를 서버가 준 markdown 으로 바꾼다.
  //
  // 본문 갱신은 항상 '지금 값' 기준(업데이터)으로 한다 —
  // 업로드를 기다리는 동안 사용자가 이어서 타이핑해도 그 내용이 날아가지 않는다.
  const insertImages = useCallback(
    async (files) => {
      if (!boardId || files.length === 0) return;

      const entries = files.map((file) => ({ file, placeholder: uploadPlaceholder(file.name) }));
      const caret = textareaRef.current?.selectionStart ?? null;

      onChange((current) => {
        const base = current ?? '';
        const at = caret == null || caret > base.length ? base.length : caret;
        const before = base.slice(0, at);
        const after = base.slice(at);

        // 앞뒤 줄바꿈을 붙여 이미지가 문단 사이에 들어가게 한다
        const prefix = before && !before.endsWith('\n') ? '\n' : '';
        const suffix = after && !after.startsWith('\n') ? '\n' : '';
        const snippet = entries.map((entry) => entry.placeholder).join('\n');

        return `${before}${prefix}${snippet}${suffix}${after}`;
      });

      try {
        setUploading(true);

        // 넣은 순서대로 하나씩 처리한다.
        // 파일 이름이 같아 자리표시자가 겹쳐도, replace 가 앞에서부터 하나씩 바꾸므로 순서가 맞는다.
        for (const { file, placeholder } of entries) {
          try {
            // usage=inline: 본문 삽입용 → 상세의 첨부파일 목록에는 나오지 않는다
            // eslint-disable-next-line no-await-in-loop
            const uploaded = await uploadFile(boardId, file, 'inline');
            const markdown = uploaded?.markdown ?? `![${file.name}](${uploaded?.url ?? ''})`;

            // 치환 문자열의 $ 기호가 특수 패턴으로 해석되지 않도록 함수를 넘긴다
            onChange((current) => (current ?? '').replace(placeholder, () => markdown));
          } catch (error) {
            // 실패하면 자리표시자를 걷어내고 알린다 (본문에 찌꺼기가 남지 않도록)
            onChange((current) => (current ?? '').replace(placeholder, () => ''));
            alert(getErrorMessage(error, '이미지를 업로드하지 못했습니다.'));
          }
        }
      } finally {
        setUploading(false);
      }
    },
    [boardId, onChange, textareaRef]
  );

  const pickImageFiles = (fileList) =>
    Array.from(fileList ?? []).filter((file) => file?.type?.startsWith('image/'));

  const handlePaste = (e) => {
    if (!allowUpload) return;
    const images = pickImageFiles(e.clipboardData?.files);
    if (images.length === 0) return;

    e.preventDefault();
    insertImages(images);
  };

  const handleDrop = (e) => {
    if (!allowUpload) return;
    const images = pickImageFiles(e.dataTransfer?.files);
    if (images.length === 0) return;

    e.preventDefault();
    insertImages(images);
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* 탭 + 이미지 삽입 */}
      <div className="flex items-center justify-between border-b border-[#DEDEDE] px-2 py-1">
        <div className="flex items-center gap-1">
          <button type="button" className={tabClass(tab === TAB_WRITE)} onClick={() => setTab(TAB_WRITE)}>
            작성
          </button>
          <button
            type="button"
            className={tabClass(tab === TAB_PREVIEW)}
            onClick={() => setTab(TAB_PREVIEW)}
          >
            미리보기
          </button>
        </div>

        {allowUpload && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1 px-2 py-1 text-[14px] text-[#919191] transition-colors hover:text-[#212121] disabled:opacity-60"
            >
              <ImagePlus size={16} strokeWidth={1.5} aria-hidden />
              {uploading ? '올리는 중...' : '이미지'}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                insertImages(pickImageFiles(e.target.files));
                // 같은 파일을 다시 골라도 change 가 나도록 비운다
                e.target.value = '';
              }}
            />
          </>
        )}
      </div>

      {tab === TAB_WRITE ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={(e) => allowUpload && e.preventDefault()}
          placeholder={
            allowUpload
              ? '내용을 입력하세요. (마크다운 사용 가능 · 이미지는 붙여넣거나 끌어다 놓을 수 있습니다)'
              : '내용을 입력하세요. (마크다운 사용 가능)'
          }
          required
          className="w-full flex-1 resize-none bg-transparent p-[16px] text-[16px] tracking-[-0.32px] outline-none"
        />
      ) : (
        <div className="w-full flex-1 overflow-y-auto p-[16px]">
          {value?.trim() ? (
            <BoardMarkdown content={value} />
          ) : (
            <span className="text-[15px] text-[#919191]">미리볼 내용이 없습니다.</span>
          )}
        </div>
      )}
    </div>
  );
}
