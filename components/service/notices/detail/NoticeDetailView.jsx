'use client';

import React from 'react';
import { DUMMY_NOTICE_DETAILS } from '@/mocks/noticesData.js';

import NoticeHead from './NoticeHead';
import NoticeInfo from './NoticeInfo';
import NoticeAttachments from './NoticeAttachments';
import NoticeContent from './NoticeContent';
import NoticeActions from './NoticeActions';
import NoticePrevNext from './NoticePrevNext';

export default function NoticeDetailView() {
  const notice = DUMMY_NOTICE_DETAILS[0];

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
          <NoticeActions likes={notice.likes} />
        </div>
      </div>

      <NoticePrevNext links={notice.links} />
    </section>
  );
}
