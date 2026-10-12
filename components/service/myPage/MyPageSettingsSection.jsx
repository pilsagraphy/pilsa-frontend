'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import SettingsContent from './SettingsContent';
import useOAuthResultToast from './useOAuthResultToast';
import useMyPageStore from '@/stores/useMyPageStore';
import { formatDotDate } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';

// 설정 페이지 (/mypage/settings) — 폰·PC 모두 이 페이지로 온다 (PM 2026-10-10 폰, 2026-10-12 PC 도 "내용이 많아 모달로 안 된다").
export default function MyPageSettingsSection() {
  const summary = useMyPageStore((s) => s.summary);
  const fetchSummary = useMyPageStore((s) => s.fetchSummary);

  // 마이페이지를 거치지 않고 바로 들어오면 요약이 없다 — 여기서 받아온다
  useEffect(() => {
    if (!summary) fetchSummary?.();
  }, [summary, fetchSummary]);

  // 연동 콜백이 이 페이지로 돌아오게 됐으니(returnTo) 결과 토스트도 여기서 띄운다
  useOAuthResultToast();

  const myInfo = {
    loginId: summary?.loginId ?? '-',
    joinedAt: formatDotDate(summary?.joinedAt) || '-',
    name: summary?.name ?? '',
    phone: summary?.phone ?? '',
    socialOnly: !!summary?.socialOnly, // 비밀번호 없는 소셜 가입 회원 — '비밀번호 만들기'·탈퇴 확인 문구
  };

  return (
    <section className="mx-auto flex w-full max-w-[520px] flex-col gap-4 px-4 py-4 sm:px-6 sm:py-7">
      <Link
        href={ROUTES.MY_PAGE}
        className="inline-flex items-center gap-[4px] text-[14px] tracking-[-0.28px] text-ink-3 hover:text-ink"
      >
        <ChevronLeft size={16} strokeWidth={2} aria-hidden />
        마이페이지로 돌아가기
      </Link>
      <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">설정</h2>
      <SettingsContent myInfo={myInfo} onProfileSaved={() => fetchSummary?.()} />
    </section>
  );
}
