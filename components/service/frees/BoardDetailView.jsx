'use client';

import React from 'react';
import { DUMMY_BOARD_DETAILS } from '@/mocks/boardData';

import BoardHead from '@/components/service/frees/BoardHead';
import BoardInfo from '@/components/service/frees/BoardInfo';
import BoardContent from '@/components/service/frees/BoardContent';
import BoardActions from '@/components/service/frees/BoardActions';
import BoardComments from '@/components/service/frees/BoardComments';
import BoardPrevNext from '@/components/service/frees/BoardPrevNext';

function formatKoreanDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}. ${mm}. ${dd}.`;
}

export default function BoardDetailView({ postId }) {
  const raw = DUMMY_BOARD_DETAILS.find((item) => item.postId === Number(postId));

  if (!raw) {
    return <div className="py-20 text-center text-[#919191]">존재하지 않는 게시글입니다.</div>;
  }

  const post = {
    id: raw.postId,
    categoryName: raw.categoryName,
    title: raw.title,
    date: formatKoreanDate(raw.updated),
    author: raw.anonymous ? '익명' : raw.authorName,
    content: raw.content,
    likeCount: raw.likeCount,
    liked: raw.liked,
    attachments: raw.attachments ?? [],
    comments: raw.comments ?? [],
    links: {
      hasPrev: Boolean(raw.prevPostApi),
      hasNext: Boolean(raw.nextPostApi),
      prevPostApi: raw.prevPostApi,
      nextPostApi: raw.nextPostApi,
    },
  };

  return (
    <section className="mx-auto w-full max-w-[920px] flex flex-col gap-[80px]">
      <div className="flex flex-col gap-[20px]">
        <BoardHead categoryName={post.categoryName} />
        <BoardInfo
          categoryName={post.categoryName}
          title={post.title}
          date={post.date}
          author={post.author}
          attachments={post.attachments}
        />
        <BoardContent content={post.content} />
        <div className="w-full h-px bg-[#DEDEDE]" />
        <BoardActions likeCount={post.likeCount} liked={post.liked} />
      </div>

      <BoardComments comments={post.comments} />

      <BoardPrevNext links={post.links} />
    </section>
  );
}
