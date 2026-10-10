'use client';

import OrganizationChart from './organization/OrganizationChart';
import AppLoading from '@/components/common/AppLoading';
import useOrganization from '@/hooks/useOrganization';
import { findCurrentTerm } from '@/apis/org';

// 소개 페이지 조직도 — 서버의 가장 최근 학기(currentTerm)를 그린다. 운영 관리 > 조직도 편집에서 고친다 (PM 2026-10-10)
// 회장단 카드: 회장이 맨 위(굵게), 나머지 회장단(부회장·총무·임원)은 아래에 이름만. 팀 카드: 팀장 위, 팀원 아래
export default function IntroOrgChart() {
  const { data, loading, error } = useOrganization();
  const current = findCurrentTerm(data);

  const chairman = current
    ? {
        title: '회장단',
        leader: current.roles.find((r) => r.role === '회장')?.names?.[0] ?? current.president?.name ?? '',
        members: current.roles.filter((r) => r.role !== '회장').flatMap((r) => r.names ?? []),
      }
    : null;
  const teams = (current?.teams ?? []).map((t) => ({ title: t.title, leader: t.leader ?? '', members: t.members ?? [] }));

  return (
    <div className="flex flex-col gap-5 w-full">
      <h3 className="text-[18px] font-semibold leading-[1.6] tracking-[-0.02em] text-[#212121]">
        조직도
        {current && <span className="ml-[6px] text-[14px] font-medium text-[#919191]">{current.term}</span>}
      </h3>
      <div className="flex justify-start">
        {loading ? (
          <AppLoading />
        ) : error || !current ? (
          <p className="text-[14px] text-[#919191]">{error ?? '등록된 조직도가 없습니다.'}</p>
        ) : (
          <OrganizationChart chairman={chairman} teams={teams} />
        )}
      </div>
    </div>
  );
}
