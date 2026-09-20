'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, ImagePlus, Trash2 } from 'lucide-react';
import { EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { BackgroundColor, Color, TextStyle } from '@tiptap/extension-text-style';

import AuthedImage from '@/components/shared/board/AuthedImage';
import { uploadFile } from '@/apis/file';
import { getErrorMessage } from '@/apis/auth';
import { alertDialog } from '@/stores/useDialogStore';

// 본문 편집기 — 노션처럼 "보이는 그대로" 쓴다.
//
// 화면에서는 제목·굵게·목록·이미지가 실제 글처럼 보이지만, 값(value/onChange)은 지금까지와 같은
// **마크다운 문자열**이다. 서버·상세 화면(BoardMarkdown)·임시저장은 아무것도 바뀌지 않았다.
// 예전엔 마크다운 원문을 치고 미리보기 탭으로 확인해야 했는데, 글 쓰는 회원에게 '## 제목' 은 낯설다 (PM, 2026-09-21).
//
// 툴바(BoardWriteToolbar)는 따로 그려지므로, 만들어진 editor 를 onEditorReady 로 올려 보낸다.

// 올리는 중인 이미지의 임시 주소 — 업로드가 끝나면 서버 주소로 바뀌고, 실패하면 노드째 지운다
const UPLOADING_PREFIX = 'uploading:';

// 우리 서버 이미지(/api/user/files/{id})는 Authorization 이 필요해 <img src> 로는 안 뜬다.
// 상세 화면과 같은 AuthedImage 로 그리되, 노드의 src 는 서버 주소 그대로 둬야 마크다운으로 저장된다.
//
// PC 는 끌어서 옮기지만 폰은 HTML 드래그가 안 되고 꾹 누르면 브라우저 메뉴(이미지 저장…)가 뜬다.
// 그래서 이미지를 누르면(선택) 위로·아래로·삭제 버튼이 떠서 그걸로 옮긴다 (PM, 2026-09-21)
function EditorImageView({ node, selected, editor, getPos, deleteNode }) {
  const { src, alt } = node.attrs;
  const uploading = typeof src === 'string' && src.startsWith(UPLOADING_PREFIX);

  // 이웃 블록과 자리를 바꾼다. 이미지는 최상위 블록이라 부모는 doc 이다
  const moveBy = (direction) => {
    const pos = typeof getPos === 'function' ? getPos() : null;
    if (pos == null || !editor) return;
    const { state } = editor;
    const $pos = state.doc.resolve(pos);
    const parent = $pos.parent;
    const index = $pos.index();
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= parent.childCount) return;

    const current = parent.child(index);
    const neighbor = parent.child(targetIndex);
    // 지운 뒤 좌표: 위로 가면 이웃이 시작하던 자리, 아래로 가면 이웃(이제 pos 에서 시작) 바로 뒤
    const insertAt = direction < 0 ? pos - neighbor.nodeSize : pos + neighbor.nodeSize;
    const tr = state.tr.delete(pos, pos + current.nodeSize).insert(insertAt, current);
    tr.setSelection(NodeSelection.create(tr.doc, insertAt)).scrollIntoView();
    editor.view.dispatch(tr);
  };

  const controlClass =
    'flex size-[30px] items-center justify-center rounded-full bg-white/95 text-[#212121] shadow-[0_2px_8px_rgba(0,0,0,0.18)] disabled:opacity-30';

  return (
    <NodeViewWrapper className="my-3" data-drag-handle>
      {uploading ? (
        <span className="inline-block h-[120px] w-full max-w-[320px] animate-pulse rounded-[4px] bg-[#f5f5f5]" />
      ) : (
        <span
          className={`relative inline-block rounded-[4px] ${selected ? 'ring-2 ring-[#212121]/40' : ''}`}
          // 폰에서 꾹 눌러도 브라우저의 이미지 메뉴가 뜨지 않게 (편집 중에는 옮기는 게 목적이다)
          onContextMenu={(e) => e.preventDefault()}
        >
          <span className="[&_img]:pointer-events-none [&_img]:select-none [-webkit-touch-callout:none]">
            <AuthedImage src={src} alt={alt ?? ''} />
          </span>

          {selected && (
            <span
              className="absolute right-2 top-2 flex gap-1"
              contentEditable={false}
              // 버튼을 눌러도 편집기 선택이 풀리지 않게
              onMouseDown={(e) => e.preventDefault()}
            >
              <button type="button" onClick={() => moveBy(-1)} aria-label="위로" title="위로" className={controlClass}>
                <ChevronUp size={18} strokeWidth={2} />
              </button>
              <button type="button" onClick={() => moveBy(1)} aria-label="아래로" title="아래로" className={controlClass}>
                <ChevronDown size={18} strokeWidth={2} />
              </button>
              <button type="button" onClick={() => deleteNode?.()} aria-label="삭제" title="삭제" className={controlClass}>
                <Trash2 size={16} strokeWidth={2} />
              </button>
            </span>
          )}
        </span>
      )}
    </NodeViewWrapper>
  );
}

const EditorImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(EditorImageView);
  },
  // 크기가 지정된 이미지(<img width=…>)는 마크다운 문법으로는 크기를 못 적는다 → 원래대로 HTML 로 남긴다.
  // 안 그러면 옛 글을 한 번 수정하기만 해도 이미지가 전부 원본 크기로 커진다
  renderMarkdown(node) {
    const { src = '', alt = '', width, height } = node.attrs ?? {};
    if (!width && !height) return `![${alt ?? ''}](${src})`;
    const size = [width ? `width="${width}"` : '', height ? `height="${height}"` : ''].filter(Boolean).join(' ');
    return `<img ${size} src="${src}" alt="${alt ?? ''}" />`;
  },
});

// 글자색·배경색은 마크다운 문법이 없다 → HTML <span style> 로 저장한다 (마크다운 안의 HTML 은 표준이다).
// 상세 화면(BoardMarkdown)은 이 span 의 색만 통과시켜 그린다. 수정 때는 같은 span 을 다시 마크로 읽는다
const ColoredTextStyle = TextStyle.extend({
  renderMarkdown(node, h) {
    const { color, backgroundColor } = node.attrs ?? {};
    const style = [color ? `color: ${color}` : '', backgroundColor ? `background-color: ${backgroundColor}` : '']
      .filter(Boolean)
      .join('; ');
    const children = h.renderChildren(node);
    return style ? `<span style="${style}">${children}</span>` : children;
  },
});

const pickImageFiles = (fileList) =>
  Array.from(fileList ?? []).filter((file) => file?.type?.startsWith('image/'));

export default function BoardRichEditor({
  boardId,
  value,
  onChange,
  allowUpload = false,
  onEditorReady,
  placeholder = '내용을 입력하세요.',
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // 마지막으로 편집기 ↔ 바깥이 주고받은 마크다운. 바깥 value 가 이것과 다를 때만(초안 불러오기·수정 화면 로드)
  // 편집기 내용을 갈아끼운다 — 타이핑할 때마다 다시 파싱해 커서가 튀는 일을 막는다
  const lastMarkdownRef = useRef(null);
  // 편집기 안에서 쓰는 콜백들이 항상 최신 onChange 를 보게 한다 (useEditor 는 처음 한 번만 만든다)
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    // Next 는 서버에서 먼저 그린다 — 편집기는 브라우저에서만 만든다
    immediatelyRender: false,
    // 처음 값은 옵션으로 넘긴다 (onCreate 에서 setContent 를 하면 React 가 렌더 중 flushSync 라고 경고한다)
    content: value ?? '',
    contentType: 'markdown',
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        link: { openOnClick: false, autolink: true },
        // 코드블록·인용은 마크다운으로는 남지만 툴바에 없다 — 붙여넣기 글에 있으면 그대로 보존된다
      }),
      Markdown,
      ColoredTextStyle,
      Color,
      BackgroundColor,
      EditorImage.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    editorProps: {
      attributes: {
        class: 'board-editor w-full outline-none',
      },
    },
    onCreate: () => {
      lastMarkdownRef.current = value ?? '';
    },
    onUpdate: ({ editor: updated }) => {
      const markdown = updated.getMarkdown();
      lastMarkdownRef.current = markdown;
      onChangeRef.current?.(markdown);
    },
  });

  // 바깥에서 값이 바뀐 경우(초안 불러오기, 수정 화면 로드, 이미지 업로드 치환)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const next = value ?? '';
    if (next === lastMarkdownRef.current) return;
    lastMarkdownRef.current = next;
    editor.commands.setContent(next, { contentType: 'markdown', emitUpdate: false });
  }, [editor, value]);

  // 툴바에 편집기를 넘긴다. onCreate 안에서 부모 state 를 바꾸면 React 가 렌더 중 flushSync 라고 경고한다 → effect 에서
  useEffect(() => {
    onEditorReady?.(editor ?? null);
    return () => onEditorReady?.(null);
  }, [editor, onEditorReady]);

  // 이미지 노드의 src 를 바꾸거나(업로드 완료) 노드를 지운다(실패)
  const replaceImage = useCallback(
    (tempSrc, attrs) => {
      if (!editor || editor.isDestroyed) return;
      const { state, view } = editor;
      let found = null;
      state.doc.descendants((node, pos) => {
        if (found != null) return false;
        if (node.type.name === 'image' && node.attrs.src === tempSrc) found = { node, pos };
        return true;
      });
      if (!found) return;

      const tr = attrs
        ? state.tr.setNodeMarkup(found.pos, undefined, { ...found.node.attrs, ...attrs })
        : state.tr.delete(found.pos, found.pos + found.node.nodeSize);
      view.dispatch(tr);
    },
    [editor]
  );

  // 고른 이미지들을 커서 자리에 넣고(자리표시자), 업로드가 끝나는 대로 서버 주소로 바꾼다.
  // 업로드를 기다리는 동안 이어서 타이핑해도 그 내용은 그대로다 — 노드만 골라 바꾸기 때문
  const insertImages = useCallback(
    async (files) => {
      if (!editor || !boardId || files.length === 0) return;

      const entries = files.map((file, index) => ({
        file,
        tempSrc: `${UPLOADING_PREFIX}${Date.now()}-${index}-${file.name}`,
      }));

      let chain = editor.chain().focus();
      entries.forEach(({ file, tempSrc }) => {
        chain = chain.setImage({ src: tempSrc, alt: file.name });
      });
      chain.run();

      try {
        setUploading(true);

        for (const { file, tempSrc } of entries) {
          try {
            // usage=inline: 본문 삽입용 → 상세의 첨부파일 목록에는 나오지 않는다
            // eslint-disable-next-line no-await-in-loop
            const uploaded = await uploadFile(boardId, file, 'inline');
            replaceImage(tempSrc, { src: uploaded?.url ?? '', alt: file.name });
          } catch (error) {
            replaceImage(tempSrc, null);
            alertDialog(getErrorMessage(error, '이미지를 업로드하지 못했습니다.'));
          }
        }
      } finally {
        setUploading(false);
      }
    },
    [editor, boardId, replaceImage]
  );

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
    <div className="flex w-full flex-col">
      {allowUpload && (
        <div className="flex items-center justify-end border-b border-[#DEDEDE] px-2 py-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !editor}
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
        </div>
      )}

      {/* 편집 영역 — 빈 곳을 눌러도 커서가 들어가게 상자 전체가 클릭 대상이다.
          안쪽 스크롤은 두지 않는다: 본문이 길어지면 상자가 자라고 페이지가 스크롤된다 */}
      <div
        className="w-full flex-1 cursor-text p-[16px]"
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => allowUpload && e.preventDefault()}
        onClick={(e) => {
          if (e.target !== e.currentTarget || !editor) return;
          // commands.focus() 는 폰에서 dom.focus() 를 그냥 불러, 긴 본문이면 편집 영역 맨 위로 스크롤이 튀었다
          // (이미지 아래 빈 곳을 누르면 위로 올라갔다가 타이핑하면 다시 내려오던 현상, PM 2026-09-21).
          // 커서만 끝으로 보내고 ProseMirror 의 focus(preventScroll) 를 쓴다
          editor.commands.setTextSelection(editor.state.doc.content.size);
          editor.view.focus();
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
