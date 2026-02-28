'use client';

import React from 'react';
import { DUMMY_NOTICE_DETAILS } from '@/mocks/noticesData.js';

import NoticeHead from './NoticeHead';
import NoticeInfo from './NoticeInfo';
import NoticeAttachments from './NoticeAttachments';
import NoticeContent from './NoticeContent';
import NoticeActions from './NoticeActions';
import NoticePrevNext from './NoticePrevNext';

function formatKoreanDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}. ${mm}. ${dd}.`;
}

export default function NoticeDetailView({ noticeId }) {
  const raw = DUMMY_NOTICE_DETAILS.find((item) => item.postId === Number(noticeId));

  if (!raw) {
    return <div className="py-20 text-center text-[#919191]">존재하지 않는 게시글입니다.</div>;
  }

  const notice = {
    id: raw.postId,
    isImportant: raw.pinned,
    title: raw.title,
    date: formatKoreanDate(raw.created),
    author: raw.authorName,
    content: raw.content,
    likecount: raw.likecount,

    attachments: (raw.attachments ?? []).map((a) => ({
      name: a.originName,
      url: a.fileUrl,
    })),

    links: {
      prev: raw.prevPostId ? { href: `/board/students/notices/${raw.prevPostId}` } : null,
      next: raw.nextPostId ? { href: `/board/students/notices/${raw.nextPostId}` } : null,
      hasPrev: Boolean(raw.prevPostId),
      hasNext: Boolean(raw.nextPostId),
      self: { href: `/board/students/notices/${raw.postId}` },
    },
  };

  return (
    <section className="mx-auto w-[920px] flex flex-col gap-[60px]">
      <NoticeHead />

      <div className="flex flex-col">
        <NoticeInfo
          isImportant={notice.isImportant}
          title={notice.title}
          date={notice.date}
          author={notice.author}
        />
        <NoticeAttachments attachments={notice.attachments} />
      </div>

      <div className="flex flex-col">
        <NoticeContent content={notice.content} />

        <div className="w-full h-px bg-[#DEDEDE] mt-[48px]" />

        <div className="mt-[60px]">
          <NoticeActions likecount={notice.likecount} />
        </div>
      </div>

      <NoticePrevNext links={notice.links} />
    </section>
  );
}
