'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import useMyPageStore from '@/stores/useMyPageStore';
import { formatDotDate } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';

export default function MyInfoCard() {
  const router = useRouter();

  // 내 정보(아이디·가입일)도 스토어에서 읽기만 한다 (호출은 MyPageSection이 담당)
  const summary = useMyPageStore((s) => s.summary);

  // 불러오기 전에는 '-'
  const loginId = summary?.loginId ?? '-';
  const joinedAt = formatDotDate(summary?.joinedAt) || '-';

  // h-full 을 두지 않는다 — 폰 2열 그리드가 알아서 같은 높이로 늘려 준다 (MyActivityCard 와 같은 이유)
  return (
    <div className="flex w-full flex-col rounded-[10px] border border-line bg-surface px-[17px] py-[16px] lg:shrink-0">
      <h3 className="-mx-[12px] border-b border-line-strong px-[12px] pb-[12px] text-[16px] font-bold leading-[1.5] tracking-[-0.02em] text-ink">
        내 정보
      </h3>

      <dl className="mb-[8px] mt-[4px] flex flex-col">
        <div className="-mx-[12px] flex items-center justify-between border-b border-line-strong px-[12px] py-[14px]">
          <dt className="pl-[4px] text-[13px] leading-[1.6] tracking-[-0.02em] text-ink-2">
            아이디
          </dt>
          <dd className="text-[13px] leading-[1.6] tracking-[-0.02em] text-ink">{loginId}</dd>
        </div>
        <div className="flex items-center justify-between py-[14px]">
          <dt className="pl-[4px] text-[13px] leading-[1.6] tracking-[-0.02em] text-ink-2">
            가입일
          </dt>
          <dd className="text-[13px] leading-[1.6] tracking-[-0.02em] text-ink">{joinedAt}</dd>
        </div>
      </dl>

      {/* 설정 — 알림·간편로그인·캘린더·계정까지 다루므로 '정보 수정' 이 아니라 '설정'. PC 도 모달이 아니라 페이지(/mypage/settings)로 —
          내용이 길어져 모달에 안 들어간다 (PM 2026-10-12) */}
      <button
        type="button"
        onClick={() => router.push(ROUTES.MY_PAGE_SETTINGS)}
        className="mt-auto flex h-[38px] w-full shrink-0 items-center justify-center rounded-[4px] bg-inverse px-4 text-[16px] leading-[1.6] tracking-[-0.02em] text-inverse-fg transition hover:bg-inverse-hover"
      >
        설정
      </button>
    </div>
  );
}
