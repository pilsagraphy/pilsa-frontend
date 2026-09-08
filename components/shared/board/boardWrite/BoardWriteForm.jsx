'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import BoardWriteBox from './BoardWriteBox';
import BoardWriteToolbar from './BoardWriteToolbar';
import BoardMarkdownEditor from './BoardMarkdownEditor';
import DraftLoadButton from './DraftLoadButton';
import useBoardWriteStore from '@/stores/useBoardWriteStore';
import { getBoardCategories } from '@/apis/board';

// 공통게시판 글쓰기/수정 공용 폼.
// 노출 항목은 게시판 플래그(board)로 결정한다:
//  - categoryMode: 카테고리 셀렉트
//  - allowAttachment: 첨부파일 입력
//  - allowAnonymous: 익명 게시 체크박스
//
// enableDraft 는 글쓰기 화면만 켠다. 초안은 '게시판별 작성 중인 글'이라
// 특정 글의 수정본을 담는 그릇이 아니므로 수정(Edit) 화면에는 두지 않는다.
//
// busy 는 저장·발행이 진행 중인지다. 그동안 다른 초안을 불러오면 화면 내용과
// 이어쓰는 초안 번호가 어긋나므로 불러오기 버튼을 잠근다.
export default function BoardWriteForm({ boardId, board, enableDraft = false, busy = false }) {
  const categoryMode = Boolean(board?.categoryMode);
  const allowAttachment = Boolean(board?.allowAttachment);
  const allowAnonymous = Boolean(board?.allowAnonymous);

  const title = useBoardWriteStore((s) => s.title);
  const content = useBoardWriteStore((s) => s.content);
  const categoryId = useBoardWriteStore((s) => s.categoryId);
  const files = useBoardWriteStore((s) => s.files);
  const isAnonymous = useBoardWriteStore((s) => s.isAnonymous);
  const existingAttachments = useBoardWriteStore((s) => s.existingAttachments);
  const deleteAttachmentIds = useBoardWriteStore((s) => s.deleteAttachmentIds);
  const draftAttachments = useBoardWriteStore((s) => s.draftAttachments);
  const removeDraftAttachment = useBoardWriteStore((s) => s.removeDraftAttachment);
  const setTitle = useBoardWriteStore((s) => s.setTitle);
  const setContent = useBoardWriteStore((s) => s.setContent);
  const setCategoryId = useBoardWriteStore((s) => s.setCategoryId);
  const setFiles = useBoardWriteStore((s) => s.setFiles);
  const setIsAnonymous = useBoardWriteStore((s) => s.setIsAnonymous);
  const removeFileAt = useBoardWriteStore((s) => s.removeFileAt);
  const toggleDeleteAttachment = useBoardWriteStore((s) => s.toggleDeleteAttachment);

  // 툴바가 아래 '내용' 입력창에 서식을 넣어야 해서 ref 를 여기서 만들어 둘에 나눠준다
  const contentRef = useRef(null);

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!boardId || !categoryMode) return;

    let isIgnore = false;
    const fetchCategories = async () => {
      try {
        const data = await getBoardCategories(boardId);
        if (isIgnore) return;
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        if (isIgnore) return;
        setCategories([]);
        console.error('카테고리 조회 실패', error);
      }
    };

    fetchCategories();
    return () => {
      isIgnore = true;
    };
  }, [boardId, categoryMode]);

  return (
    <div className="flex flex-col gap-[12px] w-full">
      <BoardWriteBox label="제목">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요."
          required
          className="w-full h-full px-[16px] bg-transparent text-[16px] tracking-[-0.32px] outline-none"
        />
      </BoardWriteBox>

      <div className="flex flex-col md:flex-row gap-[12px] w-full">
        <BoardWriteBox label="툴바">
          <BoardWriteToolbar
            contentRef={contentRef}
            value={content}
            onChange={setContent}
            files={files}
            onFilesChange={setFiles}
            allowAttachment={allowAttachment}
          />
        </BoardWriteBox>

        {categoryMode && (
          <BoardWriteBox label="카테고리">
            {/* 카테고리는 선택 사항이다.
                안내 문구를 고른 채로 두면 categoryId 없이(=null) 저장된다. */}
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-full px-[16px] bg-transparent text-[16px] text-[#212121] tracking-[-0.32px] outline-none appearance-none cursor-pointer relative z-10"
            >
              <option value="">게시글 카테고리를 선택하세요</option>

              {categories.map((category) => (
                <option key={category.categoryId} value={String(category.categoryId)}>
                  {category.name}
                </option>
              ))}
            </select>

            <ChevronDown
              className="absolute right-[16px] pointer-events-none"
              size={15}
              strokeWidth={2}
              color="#212121"
            />
          </BoardWriteBox>
        )}

        {/* 임시저장 불러오기.
            시안에서 툴바·카테고리는 남은 공간을 반씩 나눠 갖고(flex:1) 이 버튼만 135px 로 고정이다.
            라벨이 없으므로 옆 칸의 입력 박스 아래쪽에 맞춘다(self-end). */}
        {enableDraft && (
          <div className="flex w-full shrink-0 md:w-[135px] md:self-end">
            <DraftLoadButton boardId={boardId} disabled={busy} />
          </div>
        )}
      </div>

      {/* 이미 글에 붙어 있는 첨부 (수정 화면).
          서버는 증분 방식이라 유지할 첨부는 보내지 않고 지울 것만 보낸다 →
          여기서 '삭제' 표시한 것만 deleteAttachmentIds 로 전송된다. */}
      {allowAttachment && existingAttachments.length > 0 && (
        <div className="flex flex-col gap-[6px] px-[4px]">
          <span className="text-[14px] tracking-[-0.28px] text-[#919191]">기존 첨부파일</span>
          {existingAttachments.map((file) => {
            const marked = deleteAttachmentIds.includes(file.attachmentId);
            return (
              <div key={file.attachmentId} className="flex items-center gap-[8px]">
                <span
                  className={`min-w-0 flex-1 truncate text-[14px] tracking-[-0.28px] ${
                    marked ? 'text-[#b9b9b9] line-through' : 'text-[#454545]'
                  }`}
                >
                  {file.originName}
                </span>
                <button
                  type="button"
                  onClick={() => toggleDeleteAttachment(file.attachmentId)}
                  className="shrink-0 text-[14px] tracking-[-0.28px] text-[#919191] underline transition-colors hover:text-[#212121]"
                >
                  {marked ? '복원' : '삭제'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 임시저장에서 이어받은 첨부 — 이미 서버에 올라가 있어 id 로만 다룬다.
          여기서 '제거'하면 다음 저장·발행의 attachmentIds 에서 빠지고,
          그때 서버가 DB 행과 파일까지 정리한다 (별도 삭제 호출 없음). */}
      {allowAttachment && draftAttachments.length > 0 && (
        <div className="flex flex-col gap-[6px] px-[4px]">
          <span className="text-[14px] tracking-[-0.28px] text-[#919191]">임시저장 첨부파일</span>
          {draftAttachments.map((file) => (
            <div key={file.attachmentId} className="flex items-center gap-[8px]">
              <span className="min-w-0 flex-1 truncate text-[14px] tracking-[-0.28px] text-[#454545]">
                {file.originName}
              </span>
              <button
                type="button"
                onClick={() => removeDraftAttachment(file.attachmentId)}
                className="shrink-0 text-[14px] tracking-[-0.28px] text-[#919191] underline transition-colors hover:text-[#212121]"
              >
                제거
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 이번에 새로 고른 파일 (개별 제거 가능) */}
      {allowAttachment && Array.isArray(files) && files.length > 0 && (
        <div className="flex flex-col gap-[6px] px-[4px]">
          {files.map((file, index) => (
            <div key={`${file?.name}-${index}`} className="flex items-center gap-[8px]">
              <span className="min-w-0 flex-1 truncate text-[14px] tracking-[-0.28px] text-[#666666]">
                {file?.name}
              </span>
              <button
                type="button"
                onClick={() => removeFileAt(index)}
                className="shrink-0 text-[14px] tracking-[-0.28px] text-[#919191] underline transition-colors hover:text-[#212121]"
              >
                제거
              </button>
            </div>
          ))}
        </div>
      )}

      <BoardWriteBox label="내용" heightClass="h-[615px]">
        <BoardMarkdownEditor
          boardId={boardId}
          value={content}
          onChange={setContent}
          allowUpload={allowAttachment}
          textareaRef={contentRef}
        />
      </BoardWriteBox>

      {allowAnonymous && (
        <div className="flex items-center pt-[8px] pb-[4px]">
          <label className="flex items-center gap-[8px] cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-[16px] h-[16px] cursor-pointer accent-[#212121]"
            />
            <span className="text-[14px] text-[#212121] tracking-[-0.28px]">익명으로 게시</span>
          </label>
        </div>
      )}
    </div>
  );
}
