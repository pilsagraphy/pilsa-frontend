'use client';

import React from 'react';
import { getMockInfoDetail } from '@/mocks/infoData';

import InfoHead from './InfoHead';
import InfoInfo from './InfoInfo';
import InfoAttachments from './InfoAttachments';
import InfoContent from './InfoContent';
import InfoActions from './InfoActions';
import InfoComments from './InfoComments';
import InfoPrevNext from './InfoPrevNext';

function formatKoreanDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}. ${mm}. ${dd}.`;
}

export default function InfoDetailView({ postId }) {
  const raw = getMockInfoDetail(postId);

  const post = {
    id: raw.postId,
    categoryName: raw.categoryName,
    title: raw.title,
    date: formatKoreanDate(raw.updated),
    author: raw.authorName,
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
      <InfoHead categoryName={post.categoryName} />

      <div className="flex flex-col">
        <InfoInfo
          categoryName={post.categoryName}
          title={post.title}
          date={post.date}
          author={post.author}
        />
        <InfoAttachments attachments={post.attachments} />
      </div>

      <div className="flex flex-col">
        <InfoContent content={post.content} />

        <div className="w-full h-px bg-[#DEDEDE] mt-[48px]" />

        <div className="mt-[60px]">
          <InfoActions likecount={post.likecount} liked={post.liked} />
        </div>
      </div>

      <InfoComments comments={post.comments} />

      <InfoPrevNext links={post.links} />
    </section>
  );
}
