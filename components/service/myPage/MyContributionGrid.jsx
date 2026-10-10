'use client';

import { useEffect, useMemo, useState } from 'react';
import { getMyActivityGrid } from '@/apis/mypage';

// 마이페이지 '잔디' — 깃허브 기여 그래프처럼 주(열) × 요일(행) 격자 두 개: 활동(글+댓글)과 접속 (PM 2026-10-10).
// 무채색 컨셉이라 칸의 진하기로만 양을 나타낸다. 값이 없는 날은 연회색, 많을수록 검정에 가깝다.
const WEEKS = 16; // 16주 = 112일. 폰에서는 격자가 가로로 스크롤된다
const DAYS = WEEKS * 7;
const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const SHADES = ['#f3f3f3', '#d9d9d9', '#a8a8a8', '#5f5f5f', '#212121'];

const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 오늘이 마지막 열의 자기 요일 칸에 오도록, 시작일은 (오늘 - DAYS + 1) 이 속한 주의 일요일
function buildWeeks() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - DAYS + 1);
  const gridStart = new Date(start.getFullYear(), start.getMonth(), start.getDate() - start.getDay());
  const weeks = [];
  for (let d = new Date(gridStart); d <= today; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    if (d.getDay() === 0 || weeks.length === 0) weeks.push([]);
    weeks[weeks.length - 1].push({ key: ymd(d), date: new Date(d), inRange: d >= start });
  }
  return weeks;
}

function Grid({ title, rows, unit }) {
  const weeks = useMemo(buildWeeks, []);
  const byDate = useMemo(() => new Map((rows ?? []).map((r) => [String(r.date).slice(0, 10), Number(r.count) || 0])), [rows]);
  const max = Math.max(1, ...byDate.values());
  const total = [...byDate.values()].reduce((a, b) => a + b, 0);
  const activeDays = [...byDate.values()].filter((v) => v > 0).length;

  // 달이 바뀌는 첫 주에만 월 이름을 적는다
  const monthLabels = weeks.map((week, i) => {
    const first = week[0]?.date;
    if (!first) return '';
    const prev = weeks[i - 1]?.[0]?.date;
    return !prev || prev.getMonth() !== first.getMonth() ? `${first.getMonth() + 1}월` : '';
  });

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-[14px] font-semibold tracking-[-0.02em] text-black">{title}</h4>
        <span className="text-[12px] tracking-[-0.02em] text-[#919191]">
          {activeDays}일 · {total}
          {unit}
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="inline-grid grid-flow-col gap-[3px]" style={{ gridTemplateRows: 'auto repeat(7, 11px)' }}>
          {/* 왼쪽 요일 라벨 열 */}
          <span className="h-[14px]" />
          {DOW.map((d, i) => (
            <span key={d} className="pr-1 text-right text-[9px] leading-[11px] text-[#b9b9b9]">
              {i % 2 === 1 ? d : ''}
            </span>
          ))}
          {weeks.map((week, wi) => (
            <div key={week[0].key} className="contents">
              <span className="h-[14px] whitespace-nowrap text-[9px] leading-[14px] text-[#919191]">{monthLabels[wi]}</span>
              {Array.from({ length: 7 }, (_, dow) => {
                const cell = week.find((c) => c.date.getDay() === dow);
                if (!cell || !cell.inRange) return <span key={dow} className="size-[11px]" />;
                const v = byDate.get(cell.key) ?? 0;
                const level = v === 0 ? 0 : Math.min(4, Math.ceil((v / max) * 4));
                return (
                  <span
                    key={cell.key}
                    title={`${cell.key} · ${v}${unit}`}
                    className="size-[11px] rounded-[2px]"
                    style={{ backgroundColor: SHADES[level] }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MyContributionGrid() {
  const [data, setData] = useState(null);
  useEffect(() => {
    let alive = true;
    getMyActivityGrid(DAYS)
      .then((res) => {
        if (alive) setData(res);
      })
      .catch(() => {
        if (alive) setData({ activity: [], access: [] });
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="flex flex-col gap-3 rounded-[10px] border border-black/20 bg-white px-[17px] py-[16px]">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[16px] font-bold leading-[1.5] tracking-[-0.02em] text-black">내 잔디</h3>
        <span className="text-[12px] tracking-[-0.02em] text-[#919191]">최근 {WEEKS}주 · 진할수록 많음</span>
      </div>
      <div className="flex flex-col gap-5 md:flex-row md:gap-8">
        <Grid title="글 · 댓글" rows={data?.activity} unit="개" />
        <Grid title="접속" rows={data?.access} unit="회" />
      </div>
    </section>
  );
}
