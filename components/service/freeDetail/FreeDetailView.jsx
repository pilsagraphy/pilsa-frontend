'use client';

import React from 'react';
import { DUMMY_BOARD_DETAILS } from '@/mocks/boardData';

import FreeHead from './FreeHead';
import FreeInfo from './FreeInfo';
import FreeAttachments from './FreeAttachments';
import FreeContent from './FreeContent';
import FreeActions from './FreeActions';
import FreeComments from './FreeComments';
import FreePrevNext from './FreePrevNext';

function formatKoreanDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}. ${mm}. ${dd}.`;
}

export default function FreeDetailView({ postId }) {
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
    likecount: raw.likeCount,
    liked: raw.liked,
    attachments: (raw.attachments ?? []).map((a) => ({
      attachmentId: a.attachmentId,
      originName: a.originName,
      fileUrl: a.fileUrl,
    })),
    comments: raw.comments ?? [],
    links: {
      hasPrev: Boolean(raw.prevPostApi),
      hasNext: Boolean(raw.nextPostApi),
      prevPostApi: raw.prevPostApi,
      nextPostApi: raw.nextPostApi,
    },
  };

  return (
    <section className="mx-auto w-[920px] flex flex-col gap-[60px]">
      <FreeHead categoryName={post.categoryName} />

      <div className="flex flex-col">
        <FreeInfo
          categoryName={post.categoryName}
          title={post.title}
          date={post.date}
          author={post.author}
        />
        <FreeAttachments attachments={post.attachments} />
      </div>

      <div className="flex flex-col">
        <FreeContent content={post.content} />

        <div className="w-full h-px bg-[#DEDEDE] mt-[48px]" />

        <div className="mt-[60px]">
          <FreeActions likecount={post.likecount} liked={post.liked} />
        </div>
      </div>

      <FreeComments comments={post.comments} />

      <FreePrevNext links={post.links} />
    </section>
  );
}
