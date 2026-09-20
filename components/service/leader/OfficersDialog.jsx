'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';

// 역대 회장 카드의 '임원진 보기' — 재임 중 학기별 임원진(회장단·팀별 팀장과 팀원·자문)을 팝업으로.
// 카드 아래에 그대로 나열하면 임원이 많은 기수는 카드가 한없이 길어지고 옆 카드와 줄이 안 맞는다 (PM, 2026-09-21)
export default function OfficersDialog({ order, name, officers = [] }) {
  const [open, setOpen] = useState(false);
  // 학기는 탭으로 고른다 — 처음엔 가장 최근 학기 (PM, 2026-09-21)
  const [termIndex, setTermIndex] = useState(Math.max(0, officers.length - 1));
  if (officers.length === 0) return null;
  const current = officers[Math.min(termIndex, officers.length - 1)];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-[#DEDEDE] px-3 py-1 text-[12px] font-medium tracking-[-0.24px] text-[#454545] transition hover:border-[#212121] hover:text-[#212121] md:text-[13px]"
      >
        임원진 보기
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          hideCloseButton
          className="max-h-[85dvh] max-w-[362px] gap-[16px] overflow-y-auto rounded-[4px] border-[#DEDEDE] px-[20px] py-[24px] md:max-w-[520px]"
        >
          <DialogTitle className="text-center text-[18px] font-semibold leading-[1.5] tracking-[-0.36px] text-[#212121]">
            {order} {name} · 임원진
          </DialogTitle>
          <DialogDescription className="sr-only">재임 중 학기별 임원진 명단</DialogDescription>

          {/* 학기 탭 */}
          <div className="flex justify-center gap-2" role="tablist">
            {officers.map(({ term }, index) => {
              const active = index === termIndex;
              return (
                <button
                  key={term}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTermIndex(index)}
                  className={`rounded-full px-3 py-1 text-[13px] font-medium tracking-[-0.26px] transition ${
                    active ? 'bg-[#212121] text-white' : 'bg-[#F5F5F5] text-[#454545] hover:bg-[#EDEDED]'
                  }`}
                >
                  {term}
                </button>
              );
            })}
          </div>

          <section className="flex flex-col gap-[10px]">
            {current.chairman && (
              <Group
                title={current.chairman.title ?? '회장단'}
                leader={current.chairman.leader}
                leaderLabel="회장"
                members={current.chairman.members}
              />
            )}

            {(current.teams ?? []).map((team) => (
              <Group
                key={team.title}
                title={team.title}
                leader={team.leader}
                leaderLabel="팀장"
                membersLabel="팀원"
                members={team.members}
              />
            ))}

            {(current.advisors ?? []).length > 0 && <Group title="자문" members={current.advisors} />}
          </section>

          <DialogFooter className="flex flex-row justify-center sm:justify-center sm:space-x-0">
            <Button
              type="button"
              onClick={() => setOpen(false)}
              className="h-[44px] w-[87px] rounded-[4px] bg-[#212121] text-[15px] text-white hover:bg-[#424242]"
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// 한 묶음: 제목 · 대표(회장/팀장) · 구성원. membersLabel 이 없으면(회장단·자문) 이름만 적는다
function Group({ title, leader, leaderLabel, membersLabel, members = [] }) {
  return (
    <div className="grid grid-cols-[84px_1fr] gap-x-3 gap-y-[2px] text-[14px] leading-[1.6] tracking-[-0.28px]">
      <span className="font-medium text-[#212121]">{title}</span>
      <div className="flex flex-col text-[#454545]">
        {leader && (
          <span>
            <span className="text-[#919191]">{leaderLabel}</span> {leader}
          </span>
        )}
        {members.length > 0 && (
          <span>
            {membersLabel && <span className="text-[#919191]">{membersLabel} </span>}
            {members.join(' · ')}
          </span>
        )}
      </div>
    </div>
  );
}
