'use client';

import { useEffect, useState } from 'react';
import { getHistory, historyImageSrc } from '@/apis/about';
import { getErrorMessage } from '@/apis/auth';
import AdminPageLink from '@/components/shared/AdminPageLink';
import AppLoading from '@/components/common/AppLoading';
import { ROUTES } from '@/constants/routes';
import HistoryRow from './HistoryRow';

// 연혁 — 항목은 서버(history_items)에서 온다. 운영 관리 > 연혁 관리에서 고친다 (PM 2026-10-11)
// 서버 항목 → ActivityItem 이 쓰는 모양 { text, href?, video?, link?: { href, label }, images? }
const toActivity = (item) => ({
  text: item.text,
  href: item.href ?? null,
  video: item.video ?? null,
  link: item.linkHref ? { href: item.linkHref, label: item.linkLabel ?? '바로가기' } : null,
  images: item.images?.length ? item.images.map((im) => ({ ...im, src: historyImageSrc(im.src) })) : null,
});

export default function History() {
  const [years, setYears] = useState(null);
  const [error, setError] = useState(null);
  const [focusYear, setFocusYear] = useState(null);

  useEffect(() => {
    let alive = true;
    getHistory()
      .then((res) => alive && setYears(res.map((y) => ({ year: String(y.year), activities: y.activities.map(toActivity) }))))
      .catch((err) => alive && setError(getErrorMessage(err, '연혁을 불러오지 못했습니다.')));
    return () => {
      alive = false;
    };
  }, []);

  // 역대 회장 카드에서 #year-2021 처럼 들어온다. 그 해가 없으면 그다음 있는 해로 내려간다
  useEffect(() => {
    if (!years) return undefined;
    const apply = () => {
      const matched = /^#year-(\d{4})$/.exec(window.location.hash);
      if (!matched) return;
      const wanted = Number(matched[1]);
      const list = years.map((d) => Number(d.year)).sort((a, b) => a - b);
      const target = list.find((y) => y >= wanted) ?? list[list.length - 1];
      if (!target) return;
      setFocusYear(String(target));
      document.getElementById(`year-${target}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, [years]);

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-8 bg-white px-4 py-4 sm:px-6 sm:py-7 md:gap-[40px] md:p-10">
      {/* 타이틀 및 서브타이틀 영역 */}
      <header className="flex flex-col gap-[8px] border-b-[1.5px] border-[#DEDEDE] pb-6 md:gap-[12px] md:pb-[40px]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-['Pretendard'] text-[24px] font-semibold leading-[1.5] tracking-[-0.48px] text-[#212121]">연혁</h2>
          <AdminPageLink href={ROUTES.ADMIN_HISTORY} label="연혁 관리" />
        </div>
        <p className="font-['Pretendard'] text-[16px] font-normal leading-[1.6] tracking-[-0.32px] text-[#919191]">
          필사그래피 연도별 주요 활동
        </p>
      </header>

      {/* 리스트 렌더링 영역 */}
      <div className="flex w-full flex-col">
        {years == null && !error && <AppLoading />}
        {error && <p className="text-[14px] text-[#919191]">{error}</p>}
        {years?.map((data, index) => (
          <HistoryRow key={data.year} year={data.year} activities={data.activities} isFirst={index === 0} focused={focusYear === data.year} />
        ))}
      </div>
    </div>
  );
}
