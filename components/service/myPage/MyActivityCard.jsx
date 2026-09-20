'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';

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

  // '이번 학기'가 언제부터인지 묻는 사람이 많아 i 를 누르면 기준을 알려 준다.
  // 경계는 서버 정책값(policy_settings semester1_start_month / semester2_start_month)이고 기본이 3월·9월이다.
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="flex h-full w-full flex-col rounded-[10px] border border-black/20 bg-white px-[17px] py-[16px] lg:flex-1">
      <div className="flex items-center gap-[8px]">
        <h3 className="text-[16px] font-bold leading-[1.5] tracking-[-0.02em] text-black">
          이번 학기 활동 요약
        </h3>

        {/* 설명은 카드 위에 떠서 보여 준다. 예전처럼 카드 안에서 펼치면 아래 숫자들이 밀려 내려가
            카드 높이가 들썩였다. PC 는 마우스를 올리면, 폰은 눌러서 띄운다 */}
        <span className="relative flex">
          <button
            type="button"
            aria-label="이번 학기 기준 설명"
            aria-expanded={helpOpen}
            onClick={() => setHelpOpen((prev) => !prev)}
            onMouseEnter={() => setHelpOpen(true)}
            onMouseLeave={() => setHelpOpen(false)}
            onBlur={() => setHelpOpen(false)}
            className="grid size-5 place-items-center rounded-full text-[#B9B9B9] transition hover:bg-[#F5F5F5] hover:text-[#757575]"
          >
            <Info size={16} strokeWidth={1.5} />
          </button>

          {helpOpen && (
            <span
              role="tooltip"
              // 아이콘 바로 아래 왼쪽 끝을 맞춘다. 카드가 좁아 오른쪽으로 펼치면 화면 밖으로 나간다
              className="absolute left-1/2 top-[26px] z-30 w-[220px] -translate-x-[40px] rounded-[6px] bg-[#212121] px-3 py-2 text-[12px] font-normal leading-[1.6] tracking-[-0.02em] text-white shadow-[0_6px_20px_rgba(0,0,0,0.18)]"
            >
              {/* 말풍선 꼬리 */}
              <span
                aria-hidden
                className="absolute -top-[4px] left-[38px] size-[8px] rotate-45 bg-[#212121]"
              />
              학기는 <strong className="font-semibold">3월</strong>과{' '}
              <strong className="font-semibold">9월</strong>에 시작해요. 지금 학기에 쓴 글·댓글과, 그
              기간에 받은 좋아요를 셉니다.
            </span>
          )}
        </span>
      </div>

      {/* 선을 '작성한 글' 바로 위(목록 상단)에 붙임 */}
      <dl className="-mx-[12px] mt-auto flex flex-col border-t border-[#BDBDBD] px-[12px] lg:mt-[40px]">
        {ACTIVITY_META.map((item, index) => (
          <div
            key={item.key}
            className={`-mx-[12px] flex items-center justify-between px-[12px] py-[14px] ${
              index !== ACTIVITY_META.length - 1 ? 'border-b border-[#BDBDBD]' : ''
            }`}
          >
            <dt className="text-[13px] leading-[1.6] tracking-[-0.02em] text-[#454545]">
              {item.label}
            </dt>
            <dd className="text-[13px] leading-[1.6] tracking-[-0.02em] text-black">
              {semester ? `${semester[item.key] ?? 0}개` : '-'}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
