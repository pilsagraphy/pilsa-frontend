'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import BoardWriteForm from '@/components/shared/board/boardWrite/BoardWriteForm';
import useBoard from '@/hooks/useBoard';
import useBoardWriteStore from '@/stores/useBoardWriteStore';
import { getBoardPost, getBoardCategories, updateBoardPost } from '@/apis/board';
import { getErrorMessage } from '@/apis/auth';
import { ROUTES } from '@/constants/routes';

const MESSAGE_CLASS = 'py-20 text-center text-[#919191]';

// 공통게시판 게시글 수정. 글쓰기 폼(BoardWriteForm)을 재사용하고 기존 값으로 채운다.
export default function Edit({ boardId, postId }) {
  const router = useRouter();
  const { board, boards, error: boardError } = useBoard(boardId);

  const { title, content, categoryId, isAnonymous, files, deleteAttachmentIds, setForm, resetForm } =
    useBoardWriteStore();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const categoryMode = Boolean(board?.categoryMode);
  // 게시판 정책(플래그)이 확정된 뒤에 상세를 불러온다.
  // 먼저 불러오면 categoryMode 가 나중에 true 로 바뀌며 이 effect 가 재실행되고,
  // setForm 이 사용자가 그사이 고친 내용을 서버 값으로 덮어써 버린다.
  const boardReady = Boolean(board);

  useEffect(() => {
    if (!boardId || !postId || !boardReady) return;

    let isMounted = true;

    const fetchEditData = async () => {
      try {
        setLoading(true);

        const [detail, categoryData] = await Promise.all([
          getBoardPost(boardId, postId),
          categoryMode ? getBoardCategories(boardId) : Promise.resolve([]),
        ]);

        if (!isMounted) return;

        const categories = Array.isArray(categoryData) ? categoryData : [];
        const matched = categories.find((c) => c.name === detail?.categoryName);

        setForm({
          title: detail?.title ?? '',
          content: detail?.content ?? '',
          categoryId: matched?.categoryId ? String(matched.categoryId) : '',
          isAnonymous: Boolean(detail?.isAnonymous),
          files: [],
          // 이미 붙어 있는 첨부를 폼에 실어 화면에 보여주고, 지울 것만 골라내게 한다
          existingAttachments: Array.isArray(detail?.attachments) ? detail.attachments : [],
          deleteAttachmentIds: [],
        });
      } catch (error) {
        if (!isMounted) return;
        alert(getErrorMessage(error, '게시글 정보를 불러오지 못했습니다.'));
        router.push(ROUTES.BOARD(boardId));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchEditData();

    return () => {
      isMounted = false;
    };
  }, [boardId, postId, boardReady, categoryMode, setForm, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title?.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!content?.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }
    // 카테고리는 선택 사항이다 — 고르지 않으면 categoryId 없이 보낸다.

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      if (categoryMode && categoryId) formData.append('categoryId', String(categoryId));
      if (board?.allowAnonymous) formData.append('isAnonymous', String(Boolean(isAnonymous)));
      // 첨부는 증분 방식이다 — 유지할 기존 첨부는 아무것도 보내지 않고,
      // 지울 기존 첨부만 deleteAttachmentIds 로, 새로 올릴 파일만 files 로 보낸다.
      if (board?.allowAttachment) {
        deleteAttachmentIds.forEach((id) => {
          formData.append('deleteAttachmentIds', String(id));
        });

        if (Array.isArray(files)) {
          files.forEach((file) => {
            if (file) formData.append('files', file);
          });
        }
      }

      await updateBoardPost(boardId, postId, formData);

      alert('수정이 완료되었습니다.');
      resetForm();
      router.push(ROUTES.BOARD_POST(boardId, postId));
    } catch (error) {
      alert(getErrorMessage(error, '게시글 수정에 실패했습니다.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('수정을 취소하시겠습니까?')) {
      resetForm();
      router.back();
    }
  };

  // 게시판 목록 조회가 실패하면 플래그를 모르는 상태로 폼을 그리게 되므로 먼저 걸러낸다.
  if (boardError) {
    return <div className={MESSAGE_CLASS}>{boardError}</div>;
  }

  if (boards && !board) {
    return <div className={MESSAGE_CLASS}>존재하지 않는 게시판입니다.</div>;
  }

  // 게시판 플래그 대기 + 상세 조회 대기 (boardReady 전에는 loading 이 계속 true 다)
  if (!boards || loading) {
    return <div className={MESSAGE_CLASS}>불러오는 중입니다.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-[1000px] flex-col gap-[20px] p-8">
      <div className="flex w-full flex-col gap-[36px]">
        <h1 className="text-[24px] leading-[1.5] tracking-[-0.48px] font-bold text-black">
          {board?.boardName ?? ''} 글 수정
        </h1>

        <BoardWriteForm boardId={boardId} board={board} />
      </div>

      <div className="mt-4 flex w-full flex-col gap-[12px]">
        <button
          type="submit"
          disabled={submitting}
          className="flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[4px] bg-[#212121] text-[16px] tracking-[-0.32px] text-white transition-colors hover:bg-black disabled:opacity-60"
        >
          {submitting ? '수정 중...' : '수정 완료'}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          className="flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[4px] border border-[#b9b9b9] bg-white text-[16px] tracking-[-0.32px] text-[#212121] transition-colors hover:bg-gray-50"
        >
          취소
        </button>
      </div>
    </form>
  );
}
