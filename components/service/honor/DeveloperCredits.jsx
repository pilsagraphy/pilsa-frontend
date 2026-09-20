'use client';

import { useState } from 'react';

import { DEVELOPER_GENERATIONS } from '@/constants/developers';

// 명예의 전당 아래 '홈페이지 개발자' 칸.
//
// 후원자와 같은 페이지에 두는 이유: 둘 다 '이 공간을 만든 사람들'이다.
// 기수를 탭으로 가르고, 한 사람이 카드 하나다. 역할은 배지, 맡은 일은 목록 —
// 맡은 일은 사람마다 한 줄에서 일곱 줄까지 길이가 다르니 카드 높이를 맞추지 않는다.

function RoleBadge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#454545] px-[8px] py-[1px] text-[12px] leading-[1.6] tracking-[-0.24px] text-[#454545]">
      {children}
    </span>
  );
}

function MemberCard({ member }) {
  return (
    <div className="flex flex-col gap-[8px] rounded-[10px] border border-[#E5E5E5] px-[16px] py-[14px]">
      <div className="flex flex-wrap items-center gap-x-[8px] gap-y-[4px]">
        <span className="text-[16px] font-semibold leading-[1.5] tracking-[-0.32px] text-[#212121]">
          {member.name}
        </span>
        {member.roles.map((role) => (
          <RoleBadge key={role}>{role}</RoleBadge>
        ))}
      </div>

      {member.works.length > 0 && (
        <ul className="flex flex-col gap-[3px]">
          {member.works.map((work) => (
            <li
              key={work}
              className="flex gap-[6px] text-[14px] leading-[1.6] tracking-[-0.28px] text-[#757575] [word-break:keep-all]"
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

  return (
    <section className="flex flex-col gap-[20px] border-t-[1.5px] border-[#212121] pt-[32px]">
      <div className="flex flex-col gap-[6px]">
        <h3 className="font-['Pretendard',sans-serif] text-[20px] font-semibold leading-[1.5] tracking-[-0.4px] text-[#212121] md:text-[22px]">
          홈페이지 개발자
        </h3>
        <p className="text-[14px] leading-[1.6] tracking-[-0.28px] text-[#919191]">
          이 홈페이지를 만든 필사그래피 제작단입니다.
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

      <p className="text-[13px] leading-[1.6] tracking-[-0.26px] text-[#919191]">
        {current.label} · {current.period}
      </p>

      <div className="grid grid-cols-1 gap-[10px] md:grid-cols-2">
        {current.members.map((member) => (
          <MemberCard key={member.name} member={member} />
        ))}
      </div>
    </section>
  );
}
