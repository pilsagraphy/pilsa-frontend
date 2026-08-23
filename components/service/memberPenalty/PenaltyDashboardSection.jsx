'use client';
import React, { useMemo, useState } from 'react';
import MemberListSection from './MemberListSection';
import PenaltyStatCard from './PenaltyStatCard';
import ReportSection from './ReportSection';
import { SANCTIONED_MEMBERS } from '@/mocks/memberPenalty';

// 합치는 곳: 제재 회원 관리 화면
// 좌측에 회원 목록, 우측에 선택 회원 상세를 보여준다.
export default function PenaltyDashboardSection() {
  const members = SANCTIONED_MEMBERS;
  const [selectedId, setSelectedId] = useState(members[0]?.memberId ?? null);

  const selected = useMemo(
    () => members.find((m) => m.memberId === selectedId) ?? null,
    [members, selectedId],
  );

  // 회원 상태 문구: 정지(정지기간) 또는 주의
  const statusText = selected
    ? selected.currentStatus === '정지'
      ? `정지 (${selected.suspension?.start} - ${selected.suspension?.end})`
      : '주의'
    : '';

  return (
    <section className="mx-auto flex w-full max-w-[980px] flex-col gap-[24px] bg-white p-8 font-['Pretendard',sans-serif]">
      {/* 화면 정체성 */}
      <h2 className="text-[24px] font-medium tracking-[-0.48px] text-[#212121]">제재 회원 관리</h2>

      <div className="flex gap-[28px]">
        {/* 좌측: 회원 목록 */}
        <MemberListSection members={members} selectedId={selectedId} onSelect={setSelectedId} />

        {/* 우측: 선택 회원 상세 (디자인 폭에 맞춰 고정) */}
        <div className="w-[618px] shrink-0">
          {selected ? (
            <div className="flex flex-col">
              {/* 회원명 (아이디) + 회색 가로선 */}
              <div className="border-b border-[#b9b9b9] pb-[18px]">
                <p className="text-[24px] font-medium tracking-[-0.48px] text-[#212121]">
                  {selected.name} ({selected.loginId})
                </p>
              </div>

              {/* 회원 상태 + 회색 가로선 */}
              <div className="flex items-center justify-between border-b border-[#b9b9b9] py-[12px]">
                <span className="text-[14px] font-medium tracking-[-0.28px] text-[#b9b9b9]">
                  회원 상태
                </span>
                <span className="text-[14px] tracking-[-0.28px] text-[#ae0000]">{statusText}</span>
              </div>

              {/* 통계 카드 4개: 양끝 여백(=0)이 같고 카드 간격이 일정하도록 justify-between */}
              <div className="mt-[24px] flex justify-between">
                <PenaltyStatCard
                  value={`${selected.stats.cumulativeCaution.count}/${selected.stats.cumulativeCaution.max}`}
                  label="누적 주의"
                />
                <PenaltyStatCard
                  value={`${selected.stats.cumulativeWarning.count}/${selected.stats.cumulativeWarning.max}`}
                  label="누적 경고"
                />
                <PenaltyStatCard value={selected.stats.currentStatus} label="현재 상태" />
                <PenaltyStatCard value={selected.stats.reportDeletedCount} label="신고 삭제 수" />
              </div>

              {/* 길쭉한 회색 박스 안에 신고 게시글 / 신고 댓글 */}
              <div className="mt-[24px] flex flex-col gap-[28px] rounded-[15px] border border-[#dedede] p-[18px] shadow-[0px_1px_8.3px_0px_rgba(0,0,0,0.25)]">
                <ReportSection title="신고 게시글" reports={selected.reportedPosts} />
                <ReportSection title="신고 댓글" reports={selected.reportedComments} />
              </div>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-[#919191]">
              회원을 선택하세요.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
