'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import MyInfoEditModal from './MyInfoEditModal';

import useMyPageStore from '@/stores/useMyPageStore';
import { formatDotDate } from '@/lib/utils';
import { useMinWidthMd } from '@/lib/useMinWidthMd';
import { ROUTES } from '@/constants/routes';

export default function MyInfoCard() {
  const router = useRouter();
  const isMdUp = useMinWidthMd();
  const [editOpen, setEditOpen] = useState(false);

  // 내 정보(아이디·가입일)도 스토어에서 읽기만 한다 (호출은 MyPageSection이 담당)
  const summary = useMyPageStore((s) => s.summary);

  // 불러오기 전에는 '-'
  const loginId = summary?.loginId ?? '-';
  const joinedAt = formatDotDate(summary?.joinedAt) || '-';
  const myInfo = { loginId, joinedAt }; // 수정 모달도 같은 값을 그대로 보여준다

  // 폰에서는 모달 대신 설정 페이지로 — 모달은 스위치·연동 설명이 들어오면서 폰 화면보다 길어졌다 (PM 2026-10-10)
  const openSettings = () => {
    if (isMdUp) setEditOpen(true);
    else router.push(ROUTES.MY_PAGE_SETTINGS);
  };

  return (
    <div className="flex h-full w-full flex-col rounded-[10px] border border-black/20 bg-white px-[17px] py-[16px] lg:h-auto lg:shrink-0">
      <h3 className="-mx-[12px] border-b border-[#BDBDBD] px-[12px] pb-[12px] text-[16px] font-bold leading-[1.5] tracking-[-0.02em] text-black">
        내 정보
      </h3>

      <dl className="mb-[8px] mt-[4px] flex flex-col">
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

      {/* 설정 — 알림·구글 연동·계정까지 다루므로 '정보 수정' 이 아니라 '설정' 이다. PC 는 모달, 폰은 페이지 */}
      <button
        type="button"
        onClick={openSettings}
        className="mt-auto flex h-[38px] w-full shrink-0 items-center justify-center rounded-[4px] bg-[#212121] px-4 text-[16px] leading-[1.6] tracking-[-0.02em] text-white transition hover:bg-black"
      >
        설정
      </button>

      <MyInfoEditModal open={editOpen} onOpenChange={setEditOpen} myInfo={myInfo} />
    </div>
  );
}
