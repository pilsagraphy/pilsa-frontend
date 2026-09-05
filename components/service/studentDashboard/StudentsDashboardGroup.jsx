'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import useBoardStore from '@/stores/useBoardStore';
import { getTopPosts } from '@/apis/board';
import { getErrorMessage } from '@/apis/auth';
import { ROUTES } from '@/constants/routes';
import CategoryBadge from '@/components/shared/board/boardList/CategoryBadge';

// 각 게시판에서 대시보드에 노출할 상단 글 개수
const TOP_COUNT = 5;

// 게시판 하나의 상단 글 목록
function BoardList({ boardId, title, posts = [], loading = false, emptyText, className = '' }) {
  // 중요글은 번호 대신 배지를 쓰므로, 번호는 일반 글끼리만 1부터 센다
  let normalIndex = 0;
  const rows = posts.map((post) => {
    const pinned = Boolean(post.isPinned);
    if (!pinned) normalIndex += 1;
    return { post, pinned, number: pinned ? null : normalIndex };
  });

  return (
    <div className={`flex min-w-0 w-full flex-col gap-[10px] ${className}`}>
      <div className="flex justify-between items-center pr-[20px] h-[30px] w-full">
        <h3 className="font-['Pretendard',sans-serif] text-[20px] font-semibold tracking-[-0.02em] leading-[1.5] text-[#212121]">
          {title}
        </h3>

        {/* 목록 전체보기 */}
        <Link
          href={ROUTES.BOARD(boardId)}
          aria-label={`${title} 전체보기`}
          className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#F6F6F6] transition rounded-sm flex-shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#212121]"
        >
          <ArrowRight size={18} color="#1E1E1E" strokeWidth={2} aria-hidden />
        </Link>
      </div>

      <div className="flex flex-col w-full border-t border-[#B9B9B9]">
        {loading ? (
          <div className="flex items-center justify-center h-[56px] border-b border-[#B9B9B9] text-[14px] text-[#919191]">
            불러오는 중입니다.
          </div>
        ) : posts.length === 0 ? (
          <div className="flex items-center justify-center h-[56px] border-b border-[#B9B9B9] text-[14px] text-[#919191]">
            {emptyText}
          </div>
        ) : (
          rows.map(({ post, pinned, number }) => (
            <Link
              key={post.postId}
              href={ROUTES.BOARD_POST(boardId, post.postId)}
              className="flex items-center h-[56px] border-b border-[#B9B9B9] hover:bg-[#F6F6F6] transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#212121]"
            >
              <div className="w-[80px] flex justify-center items-center flex-shrink-0">
                {pinned ? (
                  <CategoryBadge variant="pinned">중요</CategoryBadge>
                ) : (
                  <span className="text-[16px] font-normal leading-[1.6] tracking-[-0.02em] text-[#454545]">
                    {number}
                  </span>
                )}
              </div>

              <div className="flex items-center flex-1 pr-[20px] overflow-hidden">
                <p className="text-[16px] font-normal leading-[1.6] tracking-[-0.02em] text-[#454545] truncate">
                  {post.title}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

// 대시보드: 게시판 목록(GET /api/user/boards)을 그대로 그리고, 각 게시판의 상단 글을 보여준다.
// 첫 번째 게시판(displayOrder 1, 보통 공지)은 전체 폭, 나머지는 2단 그리드.
export default function StudentsDashboardGroup() {
  const boards = useBoardStore((s) => s.data);
  const boardsLoading = useBoardStore((s) => s.isLoading);
  const boardsError = useBoardStore((s) => s.error);
  const ensureBoards = useBoardStore((s) => s.ensureBoards);

  // { [boardId]: { posts, loading, error } }
  const [topByBoard, setTopByBoard] = useState({});

  useEffect(() => {
    ensureBoards();
  }, [ensureBoards]);

  useEffect(() => {
    if (!Array.isArray(boards) || boards.length === 0) return;

    let isIgnore = false;

    setTopByBoard((prev) => {
      const next = { ...prev };
      boards.forEach((b) => {
        if (!next[b.boardId]) next[b.boardId] = { posts: [], loading: true, error: '' };
      });
      return next;
    });

    boards.forEach(async (b) => {
      try {
        const data = await getTopPosts(b.boardId, TOP_COUNT);
        if (isIgnore) return;
        setTopByBoard((prev) => ({
          ...prev,
          [b.boardId]: { posts: Array.isArray(data) ? data : [], loading: false, error: '' },
        }));
      } catch (error) {
        if (isIgnore) return;
        setTopByBoard((prev) => ({
          ...prev,
          [b.boardId]: {
            posts: [],
            loading: false,
            error: getErrorMessage(error, '게시글을 불러오지 못했습니다.'),
          },
        }));
      }
    });

    return () => {
      isIgnore = true;
    };
  }, [boards]);

  const list = Array.isArray(boards) ? boards : [];
  const [first, ...rest] = list;

  const sectionProps = (board) => ({
    boardId: board.boardId,
    title: board.boardName,
    posts: topByBoard[board.boardId]?.posts ?? [],
    loading: topByBoard[board.boardId]?.loading ?? true,
    emptyText: topByBoard[board.boardId]?.error || '등록된 게시글이 없습니다.',
  });

  // 게시판 목록을 못 받으면 아래 블록이 전부 비어 아무 안내도 없는 빈 화면이 된다.
  // 로딩·실패를 각각 알려주고 실패 시에는 재시도 수단을 준다.
  if (boardsError) {
    return (
      <div className="mt-[20px] flex w-full flex-col items-center gap-3 py-16">
        <span className="text-[14px] text-[#919191]">{boardsError}</span>
        <button
          type="button"
          onClick={ensureBoards}
          className="text-[14px] text-[#919191] underline transition-colors hover:text-[#212121]"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (boards == null || boardsLoading) {
    return (
      <div className="mt-[20px] py-16 text-center text-[14px] text-[#919191]">
        불러오는 중입니다.
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="mt-[20px] py-16 text-center text-[14px] text-[#919191]">
        열람 가능한 게시판이 없습니다.
      </div>
    );
  }

  return (
    <div className="mt-[20px] flex w-full flex-col gap-20 lg:gap-[60px]">
      {first && <BoardList {...sectionProps(first)} />}

      {rest.length > 0 && (
        <div className="grid w-full grid-cols-1 gap-20 lg:grid-cols-2 lg:gap-[66px]">
          {rest.map((board) => (
            <BoardList key={board.boardId} {...sectionProps(board)} />
          ))}
        </div>
      )}
    </div>
  );
}
