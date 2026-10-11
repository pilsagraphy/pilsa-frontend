'use client';

import React from 'react';

import HintPopover from '@/components/shared/HintPopover';
import useMyPageStore from '@/stores/useMyPageStore';

// 이번 학기 활동. key 는 요약 응답의 semester 필드명과 맞춘다.
const ACTIVITY_META = [
  { key: 'posts', label: '작성한 글' },
  { key: 'comments', label: '작성한 댓글' },
  { key: 'receivedLikes', label: '받은 좋아요' },
];

export default function MyActivityCard() {
  // 이번 학기 활동도 스토어에서 읽기만 한다 (호출은 MyPageSection이 담당)
  const summary = useMyPageStore((s) => s.summary);

  const semester = summary?.semester ?? null; // 불러오기 전에는 null

  // h-full 을 두지 않는다 — 폰 2열 그리드에서는 그리드가 알아서 같은 높이로 늘려 주고, 아이폰 사파리는 h-full(퍼센트)을
  // 엉뚱하게 풀어 카드가 길게 늘어나 아래 내용을 덮었다 (아이폰 테스터 제보 10/11)
  return (
    <div className="flex w-full flex-col rounded-[10px] border border-line bg-surface px-[17px] py-[16px] lg:flex-1">
      <div className="flex items-center gap-[8px]">
        {/* 폰 2열 카드는 폭이 좁아 '요약' 한 단어만 다음 줄로 떨어졌다 — 두 줄 길이를 고르게 (테스터 제보 10/11) */}
        <h3 className="min-w-0 text-balance break-keep text-[15px] font-bold leading-[1.5] tracking-[-0.02em] text-ink md:text-[16px]">
          이번 학기 활동 요약
        </h3>

        {/* 설명은 카드 위에 떠서 보여 준다. 카드 안에서 펼치면 아래 숫자들이 밀려 내려가 카드가 들썩였다.
            위치 계산은 HintPopover 가 한다 — 창 밖으로 나가지 않게 가두고, 카드에 잘리지 않게 body 에 붙인다 */}
        <HintPopover label="이번 학기 기준 설명">
          학기는 <strong className="font-semibold">3월</strong>과{' '}
          <strong className="font-semibold">9월</strong>에 시작해요. 지금 학기에 쓴 글·댓글과, 그
          기간에 받은 좋아요를 셉니다.
        </HintPopover>
      </div>

      {/* 선을 '작성한 글' 바로 위(목록 상단)에 붙임 */}
      <dl className="-mx-[12px] mt-auto flex flex-col border-t border-line-strong px-[12px] lg:mt-[40px]">
        {ACTIVITY_META.map((item, index) => (
          <div
            key={item.key}
            className={`-mx-[12px] flex items-center justify-between px-[12px] py-[14px] ${
              index !== ACTIVITY_META.length - 1 ? 'border-b border-line-strong' : ''
            }`}
          >
            <dt className="text-[13px] leading-[1.6] tracking-[-0.02em] text-ink-2">
              {item.label}
            </dt>
            <dd className="text-[13px] leading-[1.6] tracking-[-0.02em] text-ink">
              {semester ? `${semester[item.key] ?? 0}개` : '-'}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
