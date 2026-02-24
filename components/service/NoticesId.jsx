'use client';

import React from 'react';

/* =========================
 * Small UI Pieces
 * ========================= */

function Chip() {
  return (
    <div className="bg-[#212121] h-[27px] rounded-[103px] px-[12px] flex items-center justify-center">
      <span className="text-white text-[12px] tracking-[-0.24px]">중요</span>
    </div>
  );
}

function Divider() {
  return <div className="w-full h-px bg-[#DEDEDE]" />;
}

function LikeButton() {
  return (
    <button
      type="button"
      className="h-[52px] w-[135px] border border-[#b9b9b9] rounded-[4px] flex items-center justify-center gap-[6px] text-[16px] text-[#212121]"
      onClick={() => console.log('좋아요 클릭')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M7 10V20H4V10H7ZM9 20H15.5C16.3 20 17 19.4 17.2 18.6L18.9 11.6C19.1 10.8 18.5 10 17.7 10H13V5.5C13 4.7 12.3 4 11.5 4L9 10V20Z"
          stroke="#1E1E1E"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      좋아요 0
    </button>
  );
}

function EditDeleteButtons() {
  return (
    <div className="flex gap-[20px]">
      <button
        type="button"
        className="h-[52px] w-[135px] bg-[#212121] text-white rounded-[4px]"
        onClick={() => console.log('수정 클릭')}
      >
        수정
      </button>
      <button
        type="button"
        className="h-[52px] w-[135px] bg-[#212121] text-white rounded-[4px]"
        onClick={() => console.log('삭제 클릭')}
      >
        삭제
      </button>
    </div>
  );
}

/* =========================
 * Sidebar
 * ========================= */

function CaretDown({ active = false }) {
  const stroke = active ? '#000000' : '#B9B9B9';

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
      aria-hidden="true"
    >
      <path
        d="M6 9l6 6 6-6"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SidebarButton({ label, active = false, onClick, rightIcon }) {
  const color = active ? 'text-black' : 'text-[#b9b9b9] hover:text-[#212121]';

  return (
    <button
      type="button"
      className={[
        'w-full py-[6px]',
        'flex items-center justify-end gap-[6px]',
        'text-[16px] tracking-[-0.32px] font-semibold transition-colors',
        color,
      ].join(' ')}
      onClick={onClick}
    >
      <span className="whitespace-nowrap">{label}</span>
      {rightIcon}
    </button>
  );
}

function Sidebar() {
  const clickOnly = (name) => console.log(`${name} 클릭`);

  return (
    <aside className="w-[260px] pr-[80px] text-right">
      <SidebarButton
        label="ABOUT PILSA"
        onClick={() => clickOnly('ABOUT PILSA')}
        rightIcon={<CaretDown />}
      />

      <div className="mt-[6px]">
        <SidebarButton
          label="게시판"
          onClick={() => clickOnly('게시판')}
          rightIcon={<CaretDown />}
        />

        <SidebarButton label="공지사항" active onClick={() => clickOnly('공지사항')} />

        <div className="mt-[10px]">
          <SidebarButton label="방명록" onClick={() => clickOnly('방명록')} />
        </div>

        <SidebarButton label="일정 달력" onClick={() => clickOnly('일정 달력')} />

        <div className="mt-[120px]">
          <SidebarButton label="로그인" onClick={() => clickOnly('로그인')} />
        </div>
      </div>
    </aside>
  );
}

/* =========================
 * Notice Detail
 * ========================= */

function NoticeHeader() {
  return (
    <div className="flex justify-between items-center w-full">
      <h1 className="text-[24px] font-semibold tracking-[-0.48px]">공지사항</h1>

      <button
        type="button"
        className="h-[52px] w-[135px] bg-[#212121] text-white rounded-[4px]"
        onClick={() => console.log('목록 클릭')}
      >
        목록
      </button>
    </div>
  );
}

function NoticeTitle() {
  return (
    <div className="flex items-center gap-[12px]">
      <Chip />
      <h2 className="text-[18px] tracking-[-0.36px]">2026-1 임원진 수칙</h2>
    </div>
  );
}

function NoticeMeta() {
  return (
    <div className="flex justify-between text-[14px] text-[#919191]">
      <div className="flex gap-[24px]">
        <span>등록일</span>
        <span className="text-[#454545]">2026. 00. 00.</span>
      </div>
      <div className="flex gap-[24px]">
        <span>작성자</span>
        <span className="text-[#454545]">가성연</span>
      </div>
    </div>
  );
}

function NoticeAttachment() {
  return (
    <div className="flex gap-[24px] text-[16px]">
      <span className="text-[#919191]">첨부파일</span>
      <button
        type="button"
        className="text-[#454545] hover:underline"
        onClick={() => console.log('첨부파일 클릭')}
      >
        [붙임1] 필사그래피.pdf
      </button>
    </div>
  );
}

function NoticeContent() {
  return (
    <div className="text-[16px] leading-[1.6] text-[#212121] whitespace-pre-line">
      2026 필사그래피 임원진 안내입니다.
      {'\n\n'}
      본문
      {'\n\n'}
      야호~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    </div>
  );
}

function PrevNext() {
  return (
    <div className="flex gap-[40px] text-[#919191] text-[16px]">
      <button type="button" className="hover:text-[#212121]">
        ◀ 이전
      </button>
      <button type="button" className="hover:text-[#212121]">
        다음 ▶
      </button>
    </div>
  );
}

/* =========================
 * Export
 * ========================= */

export default function NoticesId() {
  return (
    <div className="flex justify-center bg-white w-full">
      <div className="flex gap-[5px] w-[1280px]">
        <Sidebar />

        <main className="w-[920px] flex flex-col gap-[60px]">
          <NoticeHeader />

          <div className="flex flex-col gap-[20px]">
            <Divider />
            <NoticeTitle />
            <Divider />
            <NoticeMeta />
            <Divider />
            <NoticeAttachment />
            <Divider />
          </div>

          <NoticeContent />

          <Divider />

          <div className="flex justify-between">
            <LikeButton />
            <EditDeleteButtons />
          </div>

          <div className="flex justify-center mt-[20px]">
            <PrevNext />
          </div>
        </main>
      </div>
    </div>
  );
}
