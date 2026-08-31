'use client';

import React, { useState } from 'react';
import MyInfoEditModal from './MyInfoEditModal';

import useMyPageStore from '@/stores/useMyPageStore';

// 가입일 표시용: '2026-03-01T00:00:00' → '2026.03.01'
function formatJoinedAt(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

export default function MyInfoCard() {
  const [editOpen, setEditOpen] = useState(false);

  // 내 정보(아이디·가입일)도 스토어에서 읽기만 한다 (호출은 MyPageSection이 담당)
  const summary = useMyPageStore((s) => s.summary);

  const loginId = summary?.loginId ?? '-';
  const joinedAt = summary ? formatJoinedAt(summary.joinedAt) : '-';
  const myInfo = { loginId, joinedAt };

  return (
    <div className="w-full rounded-[10px] border border-black/20 bg-white px-[17px] py-[16px] lg:shrink-0">
      <h3 className="-mx-[12px] border-b border-[#BDBDBD] px-[12px] pb-[12px] text-[16px] font-bold leading-[1.5] tracking-[-0.02em] text-black">
        내 정보
      </h3>

      <dl className="mt-[4px] flex flex-col">
        <div className="-mx-[12px] flex items-center justify-between border-b border-[#BDBDBD] px-[12px] py-[14px]">
          <dt className="pl-[4px] text-[13px] leading-[1.6] tracking-[-0.02em] text-[#454545]">
            아이디
          </dt>
          <dd className="text-[13px] leading-[1.6] tracking-[-0.02em] text-black">{loginId}</dd>
        </div>
        <div className="flex items-center justify-between py-[14px]">
          <dt className="pl-[4px] text-[13px] leading-[1.6] tracking-[-0.02em] text-[#454545]">
            가입일
          </dt>
          <dd className="text-[13px] leading-[1.6] tracking-[-0.02em] text-black">{joinedAt}</dd>
        </div>
      </dl>

      {/* 정보 수정 모달 */}
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        className="mt-[8px] flex h-[38px] w-full items-center justify-center rounded-[4px] bg-[#212121] px-4 text-[16px] leading-[1.6] tracking-[-0.02em] text-white transition hover:bg-black"
      >
        정보 수정
      </button>

      <MyInfoEditModal open={editOpen} onOpenChange={setEditOpen} myInfo={myInfo} />
    </div>
  );
}
