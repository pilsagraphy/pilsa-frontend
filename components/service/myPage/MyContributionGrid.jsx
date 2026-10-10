'use client';

import { useEffect, useMemo, useState } from 'react';
import { getMyActivityGrid } from '@/apis/mypage';

// '잔디' — 깃허브 기여 그래프처럼 주(열) × 요일(행) 격자 두 개: 글·댓글과 접속 (PM 2026-10-10).
// 무채색 컨셉이라 칸의 진하기로만 양을 나타낸다. 값이 없는 날은 연회색, 많을수록 검정에 가깝다.
// 격자 위 제목은 두지 않는다(PM) — 격자 아래 한 줄 설명만. 칸을 올리면 날짜와 수가 말풍선으로 뜬다 (title 속성은 폰에서 안 떠서 직접 그린다).
const WEEKS = 16; // 16주 = 112일. 폭이 모자라면 격자가 가로로 스크롤된다
const DAYS = WEEKS * 7;
const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const SHADES = ['#f3f3f3', '#d9d9d9', '#a8a8a8', '#5f5f5f', '#212121'];
const CELL = 12;
const GAP = 3;

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

function Grid({ caption, rows, unit }) {
  const weeks = useMemo(buildWeeks, []);
  const byDate = useMemo(() => new Map((rows ?? []).map((r) => [String(r.date).slice(0, 10), Number(r.count) || 0])), [rows]);
  const max = Math.max(1, ...byDate.values());
  const total = [...byDate.values()].reduce((a, b) => a + b, 0);
  const activeDays = [...byDate.values()].filter((v) => v > 0).length;
  const [hover, setHover] = useState(null); // { key, v, x, y } — 격자 기준 좌표

  // 달이 바뀌는 첫 주에만 월 이름을 적는다
  const monthLabels = weeks.map((week, i) => {
    const first = week[0]?.date;
    if (!first) return '';
    const prev = weeks[i - 1]?.[0]?.date;
    return !prev || prev.getMonth() !== first.getMonth() ? `${first.getMonth() + 1}월` : '';
  });

  const show = (event, cell, v) => {
    const grid = event.currentTarget.parentElement.getBoundingClientRect();
    const rect = event.currentTarget.getBoundingClientRect();
    setHover({ key: cell.key, v, x: rect.left - grid.left + rect.width / 2, y: rect.top - grid.top });
  };

  return (
    <div className="flex shrink-0 flex-col gap-[6px]">
      <div className="overflow-x-auto pb-1">
        <div
          className="relative inline-grid grid-flow-col"
          style={{ gridTemplateRows: `14px repeat(7, ${CELL}px)`, gap: GAP }}
          onMouseLeave={() => setHover(null)}
        >
          {/* 왼쪽 요일 라벨 열 */}
          <span />
          {DOW.map((d, i) => (
            <span key={d} className="pr-1 text-right text-[9px] text-[#b9b9b9]" style={{ lineHeight: `${CELL}px` }}>
              {i % 2 === 1 ? d : ''}
            </span>
          ))}
          {weeks.map((week, wi) => (
            <div key={week[0].key} className="contents">
              <span className="whitespace-nowrap text-[9px] leading-[14px] text-[#919191]">{monthLabels[wi]}</span>
              {Array.from({ length: 7 }, (_, dow) => {
                const cell = week.find((c) => c.date.getDay() === dow);
                if (!cell || !cell.inRange) return <span key={dow} style={{ width: CELL, height: CELL }} />;
                const v = byDate.get(cell.key) ?? 0;
                const level = v === 0 ? 0 : Math.min(4, Math.ceil((v / max) * 4));
                return (
                  <button
                    type="button"
                    key={cell.key}
                    aria-label={`${cell.key} ${v}${unit}`}
                    onMouseEnter={(event) => show(event, cell, v)}
                    onFocus={(event) => show(event, cell, v)}
                    onClick={(event) => show(event, cell, v)}
                    className="rounded-[2px] outline-none ring-[#212121] focus-visible:ring-1"
                    style={{ width: CELL, height: CELL, backgroundColor: SHADES[level] }}
                  />
                );
              })}
            </div>
          ))}
          {hover && (
            <span
              role="tooltip"
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[4px] bg-[#212121] px-2 py-[2px] text-[11px] text-white"
              style={{ left: hover.x, top: hover.y - 4 }}
            >
              {hover.key} · {hover.v}
              {unit}
            </span>
          )}
        </div>
      </div>
      <p className="text-[11px] tracking-[-0.02em] text-[#919191]">
        {caption} {activeDays}일 · {total}
        {unit}
      </p>
    </div>
  );
}

export default function MyContributionGrid({ compact = false }) {
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
    <section
      className={
        compact
          ? 'flex flex-col gap-3'
          : 'flex flex-col gap-3 rounded-[10px] border border-black/20 bg-white px-[17px] py-[16px]'
      }
    >
      <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
        <Grid caption="글 · 댓글" rows={data?.activity} unit="개" />
        <Grid caption="접속" rows={data?.access} unit="회" />
      </div>
    </section>
  );
}
