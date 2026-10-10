'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import SettingsContent from './SettingsContent';
import useMyPageStore from '@/stores/useMyPageStore';
import { formatDotDate } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';

// 설정 페이지 (/mypage/settings) — 폰에서는 모달 대신 이 페이지로 온다 (PM 2026-10-10 "모바일에서는 페이지처럼").
// PC 에서 주소로 직접 들어와도 같은 내용이 보인다. 본문은 모달과 같은 SettingsContent.
export default function MyPageSettingsSection() {
  const summary = useMyPageStore((s) => s.summary);
  const fetchSummary = useMyPageStore((s) => s.fetchSummary);

  // 마이페이지를 거치지 않고 바로 들어오면 요약이 없다 — 여기서 받아온다
  useEffect(() => {
    if (!summary) fetchSummary?.();
  }, [summary, fetchSummary]);

  const myInfo = {
    loginId: summary?.loginId ?? '-',
    joinedAt: formatDotDate(summary?.joinedAt) || '-',
  };

  return (
    <section className="mx-auto flex w-full max-w-[520px] flex-col gap-4 px-4 py-4 sm:px-6 sm:py-7">
      <Link
        href={ROUTES.MY_PAGE}
        className="inline-flex items-center gap-[4px] text-[14px] tracking-[-0.28px] text-[#919191] hover:text-[#212121]"
      >
        <ChevronLeft size={16} strokeWidth={2} aria-hidden />
        마이페이지로 돌아가기
      </Link>
      <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-black">설정</h2>
      <SettingsContent myInfo={myInfo} />
    </section>
  );
}
