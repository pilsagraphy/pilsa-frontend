'use client';

import React, { useState } from 'react';
import MyInfoEditModal from './MyInfoEditModal';

// TODO: API 연결 (내 정보)
const myInfo = {
  loginId: 'pilsagraphy',
  joinedAt: '2026.07.14',
};

export default function MyInfoCard() {
  const [editOpen, setEditOpen] = useState(false);

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
          <dd className="text-[13px] leading-[1.6] tracking-[-0.02em] text-black">
            {myInfo.loginId}
          </dd>
        </div>
        <div className="flex items-center justify-between py-[14px]">
          <dt className="pl-[4px] text-[13px] leading-[1.6] tracking-[-0.02em] text-[#454545]">
            가입일
          </dt>
          <dd className="text-[13px] leading-[1.6] tracking-[-0.02em] text-black">
            {myInfo.joinedAt}
          </dd>
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
