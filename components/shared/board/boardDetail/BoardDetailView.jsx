'use client';

import React, { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import useBoard from '@/hooks/useBoard';
import useApiRequest from '@/hooks/useApiRequest';
import { getBoardPost } from '@/apis/board';
import { ROUTES } from '@/constants/routes';

import BoardHead from './BoardHead';
import BoardInfo from './BoardInfo';
import BoardAttachments from './BoardAttachments';
import BoardContent from './BoardContent';
import BoardActions from './BoardActions';
import BoardComments from './BoardComments';
import PostPrevNext from '@/components/shared/board/PostPrevNext';

const MESSAGE_CLASS = 'px-4 py-12 text-center text-sm text-[#919191] md:py-20 md:text-base';

// 공통게시판 게시글 상세.
// boardId 로 게시판 정책(플래그)을, postId 로 글을 조회한다. 댓글은 별도 API(BoardComments)로 조회.
export default function BoardDetailView({ boardId, postId, sort = 'created', listQuery = '' }) {
  const router = useRouter();
  const { board, boards, error: boardError } = useBoard(boardId);
  const { isLoading, data: post, error, run } = useApiRequest();

  // 목록으로 돌아갈 주소. 넘어올 때 실어 온 상태(페이지·검색어 등)를 그대로 붙여
  // 보고 있던 목록 화면이 복원되게 한다.
  const listPath = listQuery
    ? `${ROUTES.BOARD(boardId)}?${listQuery}`
    : ROUTES.BOARD(boardId);

  const fetchDetail = useCallback(
    () =>
      run(() => getBoardPost(boardId, postId, sort), {
        fallbackMessage: '게시글을 불러오지 못했습니다.',
      }),
    [run, boardId, postId, sort]
  );

  useEffect(() => {
    if (boardId && postId) fetchDetail();
  }, [fetchDetail, boardId, postId]);

  if (boardError) {
    return <div className={MESSAGE_CLASS}>{boardError}</div>;
  }

  if (boards && !board) {
    return <div className={MESSAGE_CLASS}>존재하지 않는 게시판입니다.</div>;
  }

  // 아직 요청이 시작되지 않은 첫 렌더도 '로딩'으로 본다.
  // 그러지 않으면 정상 글인데 '존재하지 않는 게시글입니다.' 가 한 프레임 스친다.
  if (!boards || isLoading || (!post && !error)) {
    return <div className={MESSAGE_CLASS}>불러오는 중입니다.</div>;
  }

  if (!post) {
    return <div className={MESSAGE_CLASS}>{error || '존재하지 않는 게시글입니다.'}</div>;
  }

  // 카테고리가 있으면 카테고리, 없으면 중요글은 '중요' 배지
  // (익명 마스킹은 서버가 처리하므로 authorName 은 그대로 쓴다)
  const badgeLabel = post.categoryName || (post.isPinned ? '중요' : '');

  // 다른 글로 옮겨가도 목록 상태(페이지·검색어 등)를 계속 들고 다닌다 →
  // 글에서 글로 몇 번을 넘어가도 목록 화살표는 처음 보던 목록으로 돌아간다.
  const postHref = (targetPostId) => {
    if (!targetPostId) return null;
    const href = ROUTES.BOARD_POST(boardId, targetPostId);
    return listQuery ? `${href}?${listQuery}` : href;
  };

  const listButton = (
    <button
      type="button"
      className="h-12 w-full rounded-[4px] bg-[#212121] text-white"
      onClick={() => router.push(listPath)}
    >
      목록
    </button>
  );

  return (
    <section className="mx-auto flex w-full max-w-[920px] flex-col gap-8 px-4 pb-12 md:gap-[60px] md:px-0 md:pb-0">
      <BoardHead label={board?.boardName ?? ''} listPath={listPath} />

      {/* 글 정보(제목·등록일·작성자)와 본문은 한 덩어리로 묶고 사이 간격만 좁게 준다.
          섹션의 일괄 간격(모바일 32px · 데스크톱 60px)을 그대로 쓰면 본문이 너무 멀어진다. */}
      <div className="flex flex-col gap-2 md:gap-[15px]">
        <div className="flex flex-col">
          {/* '등록일' 칸이므로 created 를 넘긴다.
              updated 를 우선하면 수정된 글에서 목록의 등록일과 값이 어긋난다. */}
          <BoardInfo
            badgeLabel={badgeLabel}
            title={post.title}
            date={post.created}
            author={post.authorName}
          />
          <BoardAttachments attachments={post.attachments} />
        </div>

        <div className="flex flex-col">
          <BoardContent content={post.content} />

          {/* 본문 아래 여백은 본문 위쪽(글 정보 ↔ 본문) 간격과 같은 값으로 맞춘다 */}
          <div className="mt-2 h-px w-full bg-[#DEDEDE] md:mt-[15px]" />

          {/* 구분선 ↔ 좋아요·수정 버튼 간격도 본문 여백과 같은 값으로 맞춘다 */}
          <div className="mt-2 md:mt-[15px]">
            <BoardActions
              boardId={boardId}
              postId={post.postId}
              authorId={post.userId}
              likeCount={post.likeCount}
              liked={post.isLiked}
              onDeleted={() => router.push(listPath)}
              afterLikeOnMobile={listButton}
            />
          </div>
        </div>
      </div>

      {board?.allowComment && (
        <BoardComments
          boardId={boardId}
          postId={post.postId}
          board={board}
          commentCount={post.commentCount}
        />
      )}

      <PostPrevNext
        boardLabel={`${board?.boardName ?? ''}의 글`}
        listPath={listPath}
        current={{ categoryName: badgeLabel, title: post.title, date: post.created }}
        prev={post.prevPost}
        next={post.nextPost}
        prevHref={postHref(post.prevPost?.postId)}
        nextHref={postHref(post.nextPost?.postId)}
      />
    </section>
  );
}
