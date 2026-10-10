'use client';

import LeaderContent from './LeaderContent';
import AppLoading from '@/components/common/AppLoading';
import useOrganization from '@/hooks/useOrganization';
import { orgPhotoSrc } from '@/apis/org';
import AdminPageLink from '@/components/shared/AdminPageLink';
import { ROUTES } from '@/constants/routes';

// 역대 회장 — 명단은 서버(org_presidents · org_members)에서 온다. 운영 관리 > 조직도 편집에서 고친다 (PM 2026-10-10)
export default function Leader() {
  const { data, loading, error } = useOrganization();
  const presidents = data?.presidents ?? [];

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-8 bg-white px-4 py-4 sm:px-6 sm:py-7 md:gap-[40px] md:p-10">
      {/* 타이틀 영역 */}
      <header className="flex flex-col gap-[8px] border-b-[1.5px] border-[#DEDEDE] pb-6 md:gap-[12px] md:pb-[40px]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-['Pretendard',sans-serif] font-semibold text-[24px] leading-[1.5] tracking-[-0.48px] text-[#212121]">역대 회장</h2>
          <AdminPageLink href={ROUTES.ADMIN_ORGANIZATION} label="조직도 편집" />
        </div>
        <p className="font-['Pretendard',sans-serif] font-normal text-[16px] leading-[1.6] tracking-[-0.32px] text-[#919191]">
          필사그래피를 이끌어 온 회장들
        </p>
      </header>

      {loading ? (
        <AppLoading />
      ) : error ? (
        <p className="py-10 text-center text-[14px] text-[#919191]">{error}</p>
      ) : (
        /* 회장 카드 그리드 — 모바일도 2열. 1열이면 카드 하나가 화면을 다 먹어 스크롤만 길어진다 */
        <section className="grid grid-cols-2 justify-items-center gap-x-4 gap-y-10 sm:gap-x-10 sm:gap-y-20 md:grid-cols-3">
          {presidents.map((p) => (
            <LeaderContent
              key={p.presidentId}
              order={p.order}
              name={p.name}
              period={p.period}
              imageSrc={orgPhotoSrc(p.photoUrl)}
              officers={p.officers ?? []}
            />
          ))}
        </section>
      )}
    </div>
  );
}
