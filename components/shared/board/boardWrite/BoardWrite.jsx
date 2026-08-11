'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BoardWriteForm from './BoardWriteForm';
import useBoard from '@/hooks/useBoard';
import useBoardWriteStore from '@/stores/useBoardWriteStore';
import { createBoardPost } from '@/apis/board';
import { getErrorMessage } from '@/apis/auth';
import { ROUTES } from '@/constants/routes';

const MESSAGE_CLASS = 'px-4 py-12 text-center text-sm text-[#919191] md:py-20 md:text-base';

// 공통게시판 글쓰기.
// 게시판 정책(플래그)에 따라 카테고리·첨부·익명 입력 노출 여부가 달라진다.
export default function BoardWrite({ boardId }) {
  const router = useRouter();
  const { board, boards, error: boardError } = useBoard(boardId);

  const { title, content, categoryId, isAnonymous, files, resetForm } = useBoardWriteStore();

  const [submitting, setSubmitting] = useState(false);

  // 페이지 진입 시 폼 초기화
  useEffect(() => {
    resetForm();
  }, [resetForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }
    if (board?.categoryMode && !categoryId) {
      alert('카테고리를 선택해주세요.');
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      if (board?.categoryMode && categoryId) formData.append('categoryId', String(categoryId));
      if (board?.allowAnonymous) formData.append('isAnonymous', String(Boolean(isAnonymous)));
      if (board?.allowAttachment && Array.isArray(files)) {
        files.forEach((file) => {
          if (file) formData.append('files', file);
        });
      }

      await createBoardPost(boardId, formData);

      alert('작성이 완료되었습니다.');
      resetForm();
      router.push(ROUTES.BOARD(boardId));
    } catch (error) {
      alert(getErrorMessage(error, '게시글 작성에 실패했습니다.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('작성을 취소하시겠습니까? 작성 중인 내용은 저장되지 않습니다.')) {
      resetForm();
      router.back();
    }
  };

  // 게시판 정책(플래그)이 확정되기 전에는 폼을 그리지 않는다.
  // 플래그가 없는 상태로 제출하면 카테고리·익명·첨부가 조용히 빠진 채 저장된다.
  if (boardError) {
    return <div className={MESSAGE_CLASS}>{boardError}</div>;
  }

  if (!boards) {
    return <div className={MESSAGE_CLASS}>불러오는 중입니다.</div>;
  }

  if (!board) {
    return <div className={MESSAGE_CLASS}>존재하지 않는 게시판입니다.</div>;
  }

  // 목록의 글쓰기 버튼은 canWrite 로 감춰지지만, URL 로 직접 들어올 수 있다.
  if (!board.canWrite) {
    return <div className={MESSAGE_CLASS}>이 게시판에 글을 등록할 권한이 없습니다.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-[1000px] flex-col gap-[20px] p-8">
      <div className="flex w-full flex-col gap-[36px]">
        <h1 className="text-[24px] leading-[1.5] tracking-[-0.48px] font-bold text-black">
          {board?.boardName ?? ''} 글쓰기
        </h1>

        <BoardWriteForm boardId={boardId} board={board} />
      </div>

      <div className="mt-4 flex w-full flex-col gap-[12px]">
        <button
          type="submit"
          disabled={submitting}
          className="flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[4px] bg-[#212121] text-[16px] tracking-[-0.32px] text-white transition-colors hover:bg-black disabled:opacity-60"
        >
          {submitting ? '작성 중...' : '글 작성하기'}
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
