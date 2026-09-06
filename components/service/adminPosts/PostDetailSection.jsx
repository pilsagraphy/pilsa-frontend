'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import BoardInfo from '@/components/shared/board/boardDetail/BoardInfo';
import BoardContent from '@/components/shared/board/boardDetail/BoardContent';
import BoardAttachments from '@/components/shared/board/boardDetail/BoardAttachments';
import useCommentAnchor from '@/hooks/useCommentAnchor';
import useAdminPostStore from '@/stores/useAdminPostStore';
import {
  DETAIL_FROM_COMMENTS,
  DETAIL_FROM_POSTS,
  getPostStateLabel,
} from '@/constants/adminPosts';
import { ROUTES } from '@/constants/routes';

import PostDetailComments from './PostDetailComments';

const MESSAGE_CLASS = 'px-4 py-12 text-center text-sm text-[#919191] md:py-20 md:text-base';

// '돌아가기'가 가리킬 곳. 들어온 화면으로 되돌린다.
const BACK_TARGETS = {
  [DETAIL_FROM_POSTS]: { label: '게시글 관리', href: ROUTES.ADMIN_POSTS },
  [DETAIL_FROM_COMMENTS]: { label: '댓글 관리', href: ROUTES.ADMIN_COMMENTS },
};

/**
 * 관리자 전용 게시글 상세.
 *
 * 사용자 상세(/students/boards/...)는 블라인드·삭제 글을 보여주지 않고 익명글의
 * 실작성자도 가리므로, 조치를 판단해야 하는 관리자에게는 쓸 수 없다.
 * 이 화면은 GET /api/admin/posts/{postId} 를 쓴다 — 모든 상태를 열람할 수 있고
 * 조회수도 올라가지 않는다.
 *
 * 화면 구성은 일반 회원이 글을 읽을 때와 같게 맞춘다.
 * 제목·등록일·작성자(BoardInfo) · 첨부(BoardAttachments) · 본문(BoardContent)은
 * 사용자 상세와 같은 컴포넌트를 그대로 쓴다. 관리자에게만 필요한 값(상태·수치·수정일)만
 * 게시판 이름 아래 한 줄로 덧붙인다.
 *
 * 조치(블라인드·삭제)는 게시글 관리 · 댓글 관리 목록에서 한다. 여기서는 보기만 한다.
 */
export default function PostDetailSection({ postId, from }) {
  const post = useAdminPostStore((s) => s.detail);
  const isLoading = useAdminPostStore((s) => s.isDetailLoading);
  const error = useAdminPostStore((s) => s.detailError);
  const fetchPost = useAdminPostStore((s) => s.fetchPost);

  useEffect(() => {
    if (postId) fetchPost(postId);
  }, [postId, fetchPost]);

  // 댓글 관리에서 #comment-{id} 를 달고 들어오면 그 댓글로 옮겨 강조한다
  const focusedAnchor = useCommentAnchor(post?.comments ?? []);

  const back = BACK_TARGETS[from] ?? BACK_TARGETS[DETAIL_FROM_POSTS];

  const backLink = (
    <Link
      href={back.href}
      className="inline-flex items-center gap-[4px] text-[15px] tracking-[-0.3px] text-[#919191] transition-colors hover:text-[#212121]"
    >
      <ChevronLeft size={16} strokeWidth={2} aria-hidden />
      {back.label}
    </Link>
  );

  if (isLoading && !post) {
    return (
      <section className="mx-auto w-full max-w-[920px] px-4 md:px-0">
        {backLink}
        <p className={MESSAGE_CLASS}>불러오는 중입니다.</p>
      </section>
    );
  }

  // 없는 글이면 서버가 404 를 준다 → 그 문장을 그대로 보여준다
  if (error || !post) {
    return (
      <section className="mx-auto w-full max-w-[920px] px-4 md:px-0">
        {backLink}
        <p className={MESSAGE_CLASS}>{error ?? '게시글을 찾을 수 없습니다.'}</p>
      </section>
    );
  }

  // 사용자 상세와 같은 규칙: 카테고리가 있으면 카테고리, 없으면 중요글은 '중요'
  const badgeLabel = post.categoryName || (post.isPinned ? '중요' : '');

  const hasAttachments = Array.isArray(post.attachments) && post.attachments.length > 0;

  // 익명글도 관리자에게는 실작성자가 내려온다.
  // 익명 여부는 표시하지 않는다 — 이 화면은 실작성자를 보여주는 곳이고,
  // 익명이든 아니든 조치 판단과 벌점 대상이 달라지지 않는다.

  return (
    <section className="mx-auto flex w-full max-w-[920px] flex-col gap-8 px-4 pb-12 md:gap-[60px] md:px-0 md:pb-[60px]">
      <div className="flex flex-col gap-[8px]">
        {backLink}

        <h1 className="text-[20px] font-semibold tracking-[-0.48px] text-[#212121] md:text-[24px]">
          {post.boardName}
        </h1>
      </div>

      {/* 아래는 사용자 상세(BoardDetailView)와 같은 묶음·간격을 그대로 쓴다 */}
      <div className="flex flex-col gap-2 md:gap-[15px]">
        <div className="flex flex-col">
          {/* 상태(공개·블라인드·삭제)는 제목 옆에 붙는다 — 게시판 이름 옆에 두면
              '게시판이 공개'라는 뜻으로 읽힌다.
              조회·좋아요·댓글 수와 수정일은 넣지 않는다 — 앞의 셋은 게시글 관리 목록 표에
              이미 있고 댓글 수는 아래 '댓글 N' 과 겹치며, 수정일은 조치 판단에 쓰이지 않는다. */}
          <BoardInfo
            badgeLabel={badgeLabel}
            title={post.title}
            date={post.created}
            author={post.authorName}
            stateLabel={getPostStateLabel(post.state)}
          />
          {/* 블라인드·삭제된 글의 첨부도 관리자는 열람할 수 있다.
              fileUrl 은 토큰이 필요한 주소라 눌렀을 때 blob 으로 받아 내려준다.
              첨부가 없으면 BoardAttachments 가 아무것도 그리지 않는데, 등록일 아래 구분선을
              그 컴포넌트가 그리고 있어서 선까지 함께 사라진다 → 그때는 선만 대신 그린다. */}
          {hasAttachments ? (
            <BoardAttachments attachments={post.attachments} />
          ) : (
            <div className="h-px w-full bg-[#DEDEDE]" />
          )}
        </div>

        <div className="flex flex-col">
          {post.content?.trim() ? (
            <BoardContent content={post.content} />
          ) : (
            <p className="text-[15px] tracking-[-0.3px] text-[#919191]">본문이 없습니다.</p>
          )}

          <div className="mt-2 h-px w-full bg-[#DEDEDE] md:mt-[15px]" />
        </div>
      </div>

      <PostDetailComments comments={post.comments} focusedAnchor={focusedAnchor} />
    </section>
  );
}
