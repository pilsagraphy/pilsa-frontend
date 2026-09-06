'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import BoardWriteBox from './BoardWriteBox';
import BoardWriteToolbar from './BoardWriteToolbar';
import BoardMarkdownEditor from './BoardMarkdownEditor';
import DraftLoadModal from './DraftLoadModal';
import useBoardWriteStore from '@/stores/useBoardWriteStore';
import { getBoardCategories } from '@/apis/board';
import { getDraft, getDrafts } from '@/apis/draft';
import { getErrorMessage } from '@/apis/auth';
import { useMinWidthMd } from '@/lib/useMinWidthMd';

// 공통게시판 글쓰기/수정 공용 폼.
// 노출 항목은 게시판 플래그(board)로 결정한다:
//  - categoryMode: 카테고리 셀렉트
//  - allowAttachment: 첨부파일 입력
//  - allowAnonymous: 익명 게시 체크박스
export default function BoardWriteForm({ boardId, board }) {
  const isMdUp = useMinWidthMd();
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

  // 임시저장 글 불러오기 모달 (모바일 '저장' 버튼)
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  // '저장 | N' 배지용 임시저장 개수 (모달을 열면 최신 개수로 동기화된다)
  const [draftCount, setDraftCount] = useState(0);

  // 진입 시 임시저장 개수 조회 (실패해도 조용히 0 유지)
  useEffect(() => {
    if (!boardId) return;
    let ignore = false;
    getDrafts(boardId)
      .then((data) => {
        if (!ignore) setDraftCount(Array.isArray(data?.drafts) ? data.drafts.length : 0);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [boardId]);

  // 선택한 초안을 폼에 채운다 (제목·본문·카테고리·익명).
  // 첨부는 발행 방식(파일 업로드)과 초안 첨부 모델이 달라 이번엔 텍스트 위주로 불러온다.
  const handleLoadDraft = async (draftId) => {
    try {
      const draft = await getDraft(boardId, draftId);
      setTitle(draft?.title ?? '');
      setContent(draft?.content ?? '');
      setCategoryId(draft?.categoryId != null ? String(draft.categoryId) : '');
      setIsAnonymous(Boolean(draft?.isAnonymous));
      setDraftModalOpen(false);
    } catch (error) {
      alert(getErrorMessage(error, '임시저장 글을 불러오지 못했습니다.'));
    }
  };

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

  // 모바일 전용 첨부 칩(피그마): 파일/이미지 첨부 시 회색 알약 + X 로 표시.
  // 기존 첨부(수정 화면)는 X 로 삭제 표시(토글), 표시된 건 흐리게 + 취소선.
  const hasAttachments =
    allowAttachment &&
    (existingAttachments.length > 0 || (Array.isArray(files) && files.length > 0));

  const attachmentChips = hasAttachments ? (
    <div className="flex w-full flex-row flex-wrap items-center gap-[6px]">
      {existingAttachments.map((file) => {
        const marked = deleteAttachmentIds.includes(file.attachmentId);
        return (
          <button
            key={`exist-${file.attachmentId}`}
            type="button"
            onClick={() => toggleDeleteAttachment(file.attachmentId)}
            className={`flex h-[27px] items-center gap-[8px] rounded-full bg-[#DEDEDE] px-[12px] text-[13px] text-[#212121] ${
              marked ? 'line-through opacity-50' : ''
            }`}
          >
            <span className="max-w-[180px] truncate">{file.originName}</span>
            <X size={10} strokeWidth={2} className="shrink-0" />
          </button>
        );
      })}

      {Array.isArray(files) &&
        files.map((file, index) => (
          <button
            key={`new-${file?.name}-${index}`}
            type="button"
            onClick={() => removeFileAt(index)}
            className="flex h-[27px] items-center gap-[8px] rounded-full bg-[#DEDEDE] px-[12px] text-[13px] text-[#212121]"
          >
            <span className="max-w-[180px] truncate">{file?.name}</span>
            <X size={10} strokeWidth={2} className="shrink-0" />
          </button>
        ))}
    </div>
  ) : null;

  // ── 모바일 폼 (#183 피그마 리디자인) ─────────────────────────────
  // 라벨 14px/#454545, 입력 40px, 카테고리 옆 120px 저장 버튼(역할 미정 → 표시만).
  // 데스크톱 렌더는 아래 return 그대로 유지하고, 모바일만 이 분기로 대체한다.
  if (!isMdUp) {
    return (
      <div className="flex w-full flex-col gap-[16px]">
        {/* 제목 */}
        <div className="flex flex-col gap-[8px]">
          <label className="text-[14px] tracking-[-0.28px] text-[#454545]">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요."
            required
            className="h-[40px] w-full rounded-[4px] border border-[#b9b9b9] bg-white px-[14px] text-[14px] tracking-[-0.28px] text-[#212121] outline-none placeholder:text-[#919191] focus:border-black"
          />
        </div>

        {/* 카테고리 + 저장 버튼 */}
        {categoryMode && (
          <div className="flex flex-col gap-[8px]">
            <label className="text-[14px] tracking-[-0.28px] text-[#454545]">카테고리</label>
            <div className="flex items-center gap-[8px]">
              <div className="relative flex h-[40px] flex-1 items-center rounded-[4px] border border-[#b9b9b9] bg-white focus-within:border-black">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="h-full w-full cursor-pointer appearance-none bg-transparent px-[14px] text-[14px] tracking-[-0.28px] text-[#212121] outline-none"
                >
                  <option value="">카테고리</option>
                  {categories.map((category) => (
                    <option key={category.categoryId} value={String(category.categoryId)}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-[12px]"
                  size={15}
                  strokeWidth={2}
                  color="#212121"
                />
              </div>
              {/* 저장 버튼 → 임시저장 글 불러오기 모달 ('저장 | N' 으로 개수 표시) */}
              <button
                type="button"
                onClick={() => setDraftModalOpen(true)}
                className="flex h-[40px] w-[120px] shrink-0 cursor-pointer items-center justify-center gap-[8px] rounded-[4px] bg-[#212121] text-[14px] tracking-[-0.28px] text-white"
              >
                <span>저장</span>
                <span className="text-white/40" aria-hidden="true">|</span>
                <span>{draftCount}</span>
              </button>
            </div>
          </div>
        )}

        {/* 툴바 (라벨 없는 42px 박스) */}
        <div className="relative flex h-[42px] w-full items-center rounded-[4px] border border-[#b9b9b9] bg-white focus-within:border-black">
          <BoardWriteToolbar
            contentRef={contentRef}
            value={content}
            onChange={setContent}
            files={files}
            onFilesChange={setFiles}
            allowAttachment={allowAttachment}
          />
        </div>

        {attachmentChips}

        {/* 본문 (라벨 없는 박스) */}
        <div className="relative flex h-[330px] w-full items-center rounded-[4px] border border-[#b9b9b9] bg-white focus-within:border-black">
          <BoardMarkdownEditor
            boardId={boardId}
            value={content}
            onChange={setContent}
            allowUpload={allowAttachment}
            textareaRef={contentRef}
          />
        </div>

        {/* 익명 게시 */}
        {allowAnonymous && (
          <div className="flex items-center pt-[4px]">
            <label className="flex cursor-pointer items-center gap-[8px]">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-[16px] w-[16px] cursor-pointer accent-[#212121]"
              />
              <span className="text-[14px] tracking-[-0.28px] text-[#212121]">익명으로 게시</span>
            </label>
          </div>
        )}

        <DraftLoadModal
          open={draftModalOpen}
          boardId={boardId}
          onClose={() => setDraftModalOpen(false)}
          onSelect={handleLoadDraft}
          onCountChange={setDraftCount}
        />
      </div>
    );
  }

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
