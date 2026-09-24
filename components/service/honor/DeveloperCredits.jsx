'use client';

import { useMemo, useState } from 'react';

import { DEVELOPER_GENERATIONS } from '@/constants/developers';

// 명예의 전당 아래 '홈페이지 개발자' 칸.
//
// 후원자와 같은 페이지에 두는 이유: 둘 다 '이 공간을 만든 사람들'이다.
// 기수를 탭으로 가르고, 한 사람이 카드 하나다. 역할은 배지(팀장·PM 은 검정 채움), 맡은 일은 목록.
//
// 정렬: PM → 팀장 → 팀원. 같은 층에서는 역할 묶음(백엔드 · 프론트 · DB · 디자인 · 기획) 순.
// 맡은 일이 많은 사람과 역할만 있는 사람이 섞여 있어 카드 높이는 맞추지 않고, 대신 순서로 정돈한다.

const ROLE_ORDER = ['백엔드', '프론트', 'DB', '디자인', '기획'];

// 역할 문자열에서 묶음 순서를 찾는다 ('백엔드 팀장' → 백엔드)
const roleRank = (role) => {
  const index = ROLE_ORDER.findIndex((key) => role.includes(key));
  return index === -1 ? ROLE_ORDER.length : index;
};

const isLead = (role) => role === 'PM' || role.includes('팀장') || role.includes('고문');

// PM 0 · 팀장 1 · 고문 2 · 팀원 3 (고문은 팀장 바로 아래 — PM 요청)
const tier = (member) => {
  if (member.roles.includes('PM')) return 0;
  if (member.roles.some((r) => r.includes('팀장'))) return 1;
  if (member.roles.some((r) => r.includes('고문'))) return 2;
  return 3;
};

function sortMembers(members) {
  return [...members].sort((a, b) => {
    const t = tier(a) - tier(b);
    if (t !== 0) return t;
    const ra = Math.min(...a.roles.map(roleRank));
    const rb = Math.min(...b.roles.map(roleRank));
    if (ra !== rb) return ra - rb;
    // 같은 묶음이면 맡은 일이 많은 사람 먼저 — 카드 높이가 위에서 아래로 줄어들어 격자가 덜 들쭉날쭉하다
    return b.works.length - a.works.length;
  });
}

function RoleBadge({ role }) {
  const lead = isLead(role);
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-[8px] py-[1px] text-[12px] leading-[1.6] tracking-[-0.24px] ${
        lead ? 'border-[#212121] bg-[#212121] text-white' : 'border-[#B9B9B9] text-[#454545]'
      }`}
    >
      {role}
    </span>
  );
}

function MemberCard({ member }) {
  // 팀장·PM 배지를 앞에
  const roles = [...member.roles].sort((a, b) => Number(isLead(b)) - Number(isLead(a)));

  return (
    <div className="flex flex-col gap-[8px] rounded-[10px] border border-[#E5E5E5] bg-white px-[16px] py-[14px]">
      <div className="flex items-center justify-between gap-[8px]">
        <span className="shrink-0 text-[16px] font-semibold leading-[1.5] tracking-[-0.32px] text-[#212121]">
          {member.name}
        </span>
        <div className="flex flex-wrap justify-end gap-[4px]">
          {roles.map((role) => (
            <RoleBadge key={role} role={role} />
          ))}
        </div>
      </div>

      {member.works.length > 0 && (
        <ul className="flex flex-col gap-[3px] border-t border-[#F0F0F0] pt-[8px]">
          {member.works.map((work) => (
            <li
              key={work}
              className="flex gap-[6px] text-[13px] leading-[1.6] tracking-[-0.26px] text-[#757575] [word-break:keep-all]"
            >
              <span aria-hidden className="shrink-0 text-[#B9B9B9]">
                ·
              </span>
              <span>{work}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DeveloperCredits() {
  // 최신 기수를 먼저 보여 준다
  const [generation, setGeneration] = useState(
    DEVELOPER_GENERATIONS[DEVELOPER_GENERATIONS.length - 1].generation
  );
  const current =
    DEVELOPER_GENERATIONS.find((g) => g.generation === generation) ?? DEVELOPER_GENERATIONS[0];
  const members = useMemo(() => sortMembers(current.members), [current]);

  return (
    <section className="flex flex-col gap-[20px] border-t-[1.5px] border-[#212121] pt-[32px]">
      <div className="flex flex-wrap items-end justify-between gap-[10px]">
        <div className="flex flex-col gap-[4px]">
          <h3 className="font-['Pretendard',sans-serif] text-[20px] font-semibold leading-[1.5] tracking-[-0.4px] text-[#212121] md:text-[22px]">
            홈페이지 개발자{' '}
            {/* 명단이 아직 다 안 채워졌다 — 완성되면 이 표시를 뗀다 (PM, 2026-09-24) */}
            <span className="text-[15px] font-normal text-[#919191] md:text-[16px]">(작성 중)</span>
          </h3>
          <p className="text-[14px] leading-[1.6] tracking-[-0.28px] text-[#919191]">
            이 홈페이지를 만든 필사그래피 제작단 · {current.label} {current.period}
          </p>
        </div>

        {/* 기수 탭 */}
        <div role="tablist" className="flex gap-[6px]">
          {DEVELOPER_GENERATIONS.map((g) => {
            const active = g.generation === generation;
            return (
              <button
                key={g.generation}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setGeneration(g.generation)}
                className={`rounded-full px-[14px] py-[5px] text-[14px] leading-[1.6] tracking-[-0.28px] transition-colors ${
                  active
                    ? 'bg-[#212121] text-white'
                    : 'border border-[#B9B9B9] text-[#454545] hover:bg-[#F5F5F5]'
                }`}
              >
                {g.label}
                <span className={`ml-[6px] text-[12px] ${active ? 'text-[#B9B9B9]' : 'text-[#919191]'}`}>
                  {g.members.length}명
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 카드는 위에서 아래로 흐르는 열 배치(columns) — 높이가 제각각이라 격자로 두면 빈 칸이 생긴다 */}
      <div className="columns-1 gap-[10px] md:columns-2 lg:columns-3 [&>*]:mb-[10px] [&>*]:break-inside-avoid">
        {members.map((member) => (
          <MemberCard key={member.name} member={member} />
        ))}
      </div>
    </section>
  );
}
