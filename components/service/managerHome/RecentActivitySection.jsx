'use client';
import React from 'react';
import { ArrowRight } from 'lucide-react';

const RECENT_REPORTS = [
  { id: 1, board: '자유게시판', content: '글 내용 글 내용 글 내용', date: '2026.05.03' },
  { id: 2, board: '자유게시판', content: '글 내용 글 내용 글 내용', date: '2026.05.03' },
  { id: 3, board: '자유게시판', content: '글 내용 글 내용 글 내용', date: '2026.05.03' },
  { id: 4, board: '자유게시판', content: '글 내용 글 내용 글 내용', date: '2026.05.03' },
  { id: 5, board: '자유게시판', content: '글 내용 글 내용 글 내용', date: '2026.05.03' },
];

const RECENT_MEMBERS = [
  { id: 1, role: '재학생', username: 'ch400', name: '김본명', joinDate: '2026.06.05' },
  { id: 2, role: '재학생', username: 'ch400', name: '김본명', joinDate: '2026.06.05' },
  { id: 3, role: '재학생', username: 'ch400', name: '김본명', joinDate: '2026.06.05' },
  { id: 4, role: '재학생', username: 'ch400', name: '김본명', joinDate: '2026.06.05' },
  { id: 5, role: '재학생', username: 'ch400', name: '김본명', joinDate: '2026.06.05' },
];

// 섹션 헤더: 제목 + 전체보기 →
function ActivityHeader({ title }) {
  return (
    <div className="flex h-[44px] items-center justify-between">
      <h3 className="text-[20px] font-semibold leading-[1.5] tracking-[-0.4px] text-[#212121]">
        {title}
      </h3>
      <div className="flex cursor-pointer items-center gap-[6px] text-[#B9B9B9] transition hover:text-[#919191]">
        <span className="text-[16px] leading-[1.6] tracking-[-0.32px]">전체보기</span>
        <ArrowRight size={16} strokeWidth={2} />
      </div>
    </div>
  );
}

// 최근 신고 목록
function RecentReports({ reports = [] }) {
  return (
    <div className="flex w-full flex-col lg:w-[442px]">
      <ActivityHeader title="최근 신고" />
      <div className="mt-[7px] flex flex-col border-t border-[#B9B9B9]">
        {reports.map((report) => (
          <div
            key={report.id}
            className="flex h-[44px] items-center gap-[12px] border-b border-[#B9B9B9] pr-[8px]"
          >
            <span className="flex-shrink-0 rounded-[11px] border border-[#AE0000] px-[9px] text-[14px] leading-[1.6] tracking-[-0.28px] text-[#AE0000]">
              신고
            </span>
            <span className="flex-shrink-0 text-[16px] leading-[1.6] tracking-[-0.32px] text-[#212121]">
              [{report.board}]
            </span>
            <span className="min-w-0 flex-1 truncate text-[16px] leading-[1.6] tracking-[-0.32px] text-[#212121]">
              &ldquo;{report.content}&rdquo;
            </span>
            <span className="flex-shrink-0 text-[14px] leading-[1.6] tracking-[-0.28px] text-[#919191]">
              {report.date}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 최근 가입 회원 목록
function RecentMembers({ members = [] }) {
  return (
    <div className="flex w-full flex-col lg:w-[442px]">
      <ActivityHeader title="최근 가입 회원" />
      <div className="mt-[7px] flex flex-col border-t border-[#B9B9B9]">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex h-[44px] items-center border-b border-[#B9B9B9] pl-[10px] pr-[8px]"
          >
            <span className="text-[18px] font-semibold leading-[1.6] tracking-[-0.36px] text-[#212121]">
              {member.role}
            </span>
            <span className="mx-[10px] h-[15px] w-px flex-shrink-0 bg-[#B9B9B9]" />
            <span className="text-[18px] leading-[1.6] tracking-[-0.36px] text-[#212121]">
              {member.username}
            </span>
            <span className="mx-[10px] h-[15px] w-px flex-shrink-0 bg-[#B9B9B9]" />
            <span className="text-[18px] leading-[1.6] tracking-[-0.36px] text-[#212121]">
              {member.name}
            </span>
            <span className="ml-auto text-[14px] leading-[1.6] tracking-[-0.28px] text-[#919191]">
              {member.joinDate} 가입
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 최근 신고 / 최근 가입 회원을 합치는 섹션
export default function RecentActivitySection() {
  return (
    <div className="flex w-full flex-col gap-10 lg:flex-row lg:gap-[28px]">
      <RecentReports reports={RECENT_REPORTS} />
      <RecentMembers members={RECENT_MEMBERS} />
    </div>
  );
}
