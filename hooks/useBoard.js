'use client';

import { useEffect } from 'react';
import useBoardStore from '@/stores/useBoardStore';

/**
 * boardId 로 게시판(정책 플래그 포함)을 얻는다.
 * 게시판 목록이 없거나 다른 계정 것이면 새로 불러온다
 * (URL 로 상세/글쓰기에 바로 진입하거나 계정을 전환한 경우 대비).
 *
 * 반환하는 board:
 *  { boardId, boardName, displayOrder, canWrite, allowComment,
 *    allowAttachment, categoryMode, allowAnonymous, allowPrivateComment }
 *
 * boards 가 null 인 동안에는 board 도 null 이다. 소비하는 화면은
 * '로딩 중'과 '없는 게시판'을 구분해야 하므로 isLoading/error 도 함께 봐야 한다.
 *
 * @param {number|string} boardId
 * @returns {{ board: object|null, boards: array|null, isLoading: boolean, error: string|null }}
 */
export default function useBoard(boardId) {
  const boards = useBoardStore((s) => s.data);
  const isLoading = useBoardStore((s) => s.isLoading);
  const error = useBoardStore((s) => s.error);
  const ensureBoards = useBoardStore((s) => s.ensureBoards);

  useEffect(() => {
    ensureBoards();
  }, [ensureBoards]);

  const board = boards?.find((b) => String(b.boardId) === String(boardId)) ?? null;

  return { board, boards, isLoading, error };
}
