'use client';

import React, { useEffect, useState } from 'react';
import { getNoticeDetail } from '@/apis/notice';
import { getErrorMessage } from '@/apis/auth';

import NoticeHead from './NoticeHead';
import NoticeInfo from './NoticeInfo';
import NoticeAttachments from './NoticeAttachments';
import NoticeContent from './NoticeContent';
import NoticeActions from './NoticeActions';
import NoticePrevNext from './NoticePrevNext';

const NOTICE_SORT_MAP = {
  latest: 'created',
  views: 'viewCount',
};

function formatKoreanDate(value) {
  if (!value) return '';

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');

  return `${yyyy}. ${mm}. ${dd}.`;
}

function extractPostId(apiPath) {
  if (!apiPath) return null;
  const match = String(apiPath).match(/\/(\d+)$/);
  return match ? match[1] : null;
}

function buildNoticeHref(postId, sort) {
  if (!postId) return null;
  return `/students/notices/${postId}?sort=${encodeURIComponent(sort)}`;
}

export default function NoticeDetailView({ noticeId, sort = 'latest' }) {
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchNoticeDetail = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        const apiSort =
          sort === 'created' || sort === 'viewCount' ? sort : (NOTICE_SORT_MAP[sort] ?? 'created');

        const raw = await getNoticeDetail(noticeId, apiSort);

        if (!isMounted) return;

        const prevPostId = extractPostId(raw?.prevPostApi);
        const nextPostId = extractPostId(raw?.nextPostApi);

        setNotice({
          postId: raw?.postId,
          isImportant: Boolean(raw?.isPinned),
          title: raw?.title ?? '',
          date: formatKoreanDate(raw?.updated ?? raw?.created),
          author: raw?.authorName ?? '',
          content: raw?.content ?? '',
          likecount: Number(raw?.likeCount ?? 0),
          liked: Boolean(raw?.liked),
          attachments: Array.isArray(raw?.attachments) ? raw.attachments : [],
          links: {
            prev: prevPostId ? { href: buildNoticeHref(prevPostId, sort) } : null,
            next: nextPostId ? { href: buildNoticeHref(nextPostId, sort) } : null,
            hasPrev: Boolean(prevPostId),
            hasNext: Boolean(nextPostId),
            self: { href: buildNoticeHref(raw?.postId, sort) },
          },
        });
      } catch (error) {
        if (!isMounted) return;
        setNotice(null);
        setErrorMessage(getErrorMessage(error, '공지사항을 불러오지 못했습니다.'));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchNoticeDetail();

    return () => {
      isMounted = false;
    };
  }, [noticeId, sort]);

  if (loading) {
    return <div className="py-20 text-center text-[#919191]">불러오는 중입니다.</div>;
  }

  if (errorMessage) {
    return <div className="py-20 text-center text-[#919191]">{errorMessage}</div>;
  }

  if (!notice) {
    return <div className="py-20 text-center text-[#919191]">존재하지 않는 게시글입니다.</div>;
  }

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
          <NoticeActions postId={notice.postId} likecount={notice.likecount} liked={notice.liked} />
        </div>
      </div>

      <NoticePrevNext links={notice.links} />
    </section>
  );
}
