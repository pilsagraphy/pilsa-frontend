'use client';

import { useEffect, useState } from 'react';
import { getIntro } from '@/apis/about';
import { getErrorMessage } from '@/apis/auth';
import AdminPageLink from '@/components/shared/AdminPageLink';
import AppLoading from '@/components/common/AppLoading';
import { ROUTES } from '@/constants/routes';
import IntroContent from './IntroContent';
import IntroOrgChart from './IntroOrgChart';

// 동아리 소개 — 문단은 서버(intro_sections)에서 온다. 운영 관리 > 동아리 소개 관리에서 고친다 (PM 2026-10-11). 조직도는 조직도 편집에서
export default function Intro() {
  const [sections, setSections] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let alive = true;
    getIntro()
      .then((res) => alive && setSections(res))
      .catch((err) => alive && setError(getErrorMessage(err, '소개를 불러오지 못했습니다.')));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-8 bg-white px-4 py-4 sm:px-6 sm:py-7 md:gap-[40px] md:p-10">
      {/* 타이틀 영역 */}
      <header className="flex flex-col gap-[8px] border-b-[1.5px] border-[#DEDEDE] pb-6 md:gap-[12px] md:pb-[40px]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-['Pretendard',sans-serif] font-semibold text-[24px] leading-[1.5] tracking-[-0.02em] text-[#212121]">동아리 소개</h2>
          <div className="flex gap-2">
            <AdminPageLink href={ROUTES.ADMIN_INTRO} label="소개 관리" />
            <AdminPageLink href={ROUTES.ADMIN_ORGANIZATION} label="조직도 편집" />
          </div>
        </div>
        <p className="font-['Pretendard',sans-serif] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#919191]">
          경희대학교 국제캠퍼스 필사 동아리, 필사그래피를 소개합니다
        </p>
      </header>

      {/* 인트로 컨텐츠 영역 */}
      <section className="flex flex-col gap-[51px]">
        {sections == null && !error && <AppLoading />}
        {error && <p className="text-[14px] text-[#919191]">{error}</p>}
        {sections?.map((data) => (
          <IntroContent key={data.sectionId} title={data.title} content={data.content} />
        ))}
      </section>

      {/* 조직도 영역 */}
      <section className="flex flex-col">
        <IntroOrgChart />
      </section>
    </div>
  );
}
