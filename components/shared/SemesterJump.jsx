'use client';

import { useEffect, useState } from 'react';

// 학기 드롭다운 — 한 페이지에 학기를 이어 붙인 화면(활동 사진·방명록)에서 쓴다 (PM 2026-10-10 밤).
// 지금 보고 있는 학기(화면 위쪽에 걸린 구간)를 값으로 보여 주고, 다른 학기를 고르면 그 구간으로 스크롤한다.
// 각 학기 구간은 id="sem-{라벨}" 과 scroll-margin 을 갖는다. 아직 안 불러온 학기는 호출하는 쪽이 먼저 채운다(방명록).
export const semesterAnchorId = (label) => `sem-${label}`;

export function scrollToSemester(label) {
  const el = document.getElementById(semesterAnchorId(label));
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 화면 위쪽 띠(헤더 아래 ~ 화면 35%)에 걸린 학기 구간을 '보고 있는 학기'로 본다
export function useActiveSemester(labels) {
  const [active, setActive] = useState(labels[0] ?? null);
  useEffect(() => {
    if (labels.length === 0) return undefined;
    const els = labels.map((l) => document.getElementById(semesterAnchorId(l))).filter(Boolean);
    if (els.length === 0) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id.replace(/^sem-/, ''));
      },
      { rootMargin: '-72px 0px -65% 0px', threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [labels]);
  return [active, setActive];
}

export default function SemesterJump({ semesters = [], value, onJump, currentSemester, className = '' }) {
  if (semesters.length === 0) return null;
  return (
    <label className={`flex items-center gap-2 text-[13px] text-[#919191] ${className}`}>
      <span className="shrink-0">학기</span>
      <select
        value={value ?? semesters[0]}
        onChange={(e) => onJump(e.target.value)}
        className="h-[34px] rounded-[6px] border border-[#dedede] bg-white px-2 pr-7 text-[13px] text-[#212121] outline-none focus:border-[#919191]"
      >
        {semesters.map((label) => (
          <option key={label} value={label}>
            {label}
            {label === currentSemester ? ' (이번 학기)' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
