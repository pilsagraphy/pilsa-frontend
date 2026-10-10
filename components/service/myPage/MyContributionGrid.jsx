'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getMyActivityGrid } from '@/apis/mypage';
import { useMinWidthMd } from '@/lib/useMinWidthMd';

// '잔디' — 깃허브 기여 그래프처럼 주(열) × 요일(행) 격자 두 개: 글·댓글과 접속 (PM 2026-10-10).
// 무채색 컨셉이라 칸의 진하기로만 양을 나타낸다. 값이 없는 날은 연회색, 많을수록 검정에 가깝다.
// 격자는 주어진 폭을 전부 쓴다(칸 크기가 폭에 맞춰 늘어난다). 제목은 없고 위에 숫자 요약, 아래에 범례만.
// PC: 16주, 칸에 마우스를 올리면 날짜·수 말풍선. 폰: 두 격자를 한 줄에 두되 8주만 보여 칸을 키우고,
// 요일 글자와 터치 말풍선은 없앤다 — 손가락으로 누르기엔 칸이 작고 말풍선이 거슬린다 (PM 10/10 밤).
const WEEKS_DESKTOP = 16; // 16주 = 112일 (API 도 이만큼 받는다)
const WEEKS_MOBILE = 8;
const DAYS = WEEKS_DESKTOP * 7;
const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const SHADES = ['#efefef', '#d4d4d4', '#a3a3a3', '#5c5c5c', '#212121'];

const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 오늘이 마지막 열의 자기 요일 칸에 오도록, 시작일은 (오늘 - 일수 + 1) 이 속한 주의 일요일
function buildWeeks(weekCount) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - weekCount * 7 + 1);
  const gridStart = new Date(start.getFullYear(), start.getMonth(), start.getDate() - start.getDay());
  const weeks = [];
  for (let d = new Date(gridStart); d <= today; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    if (d.getDay() === 0 || weeks.length === 0) weeks.push([]);
    weeks[weeks.length - 1].push({ key: ymd(d), date: new Date(d), inRange: d >= start });
  }
  return weeks;
}

// 손가락 기기인가 — 말풍선은 마우스에서만 띄운다
function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(pointer: coarse)');
    if (!mq) return undefined;
    const update = () => setCoarse(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return coarse;
}

function Grid({ caption, rows, unit, weekCount, compact, interactive }) {
  const weeks = useMemo(() => buildWeeks(weekCount), [weekCount]);
  const byDate = useMemo(() => new Map((rows ?? []).map((r) => [String(r.date).slice(0, 10), Number(r.count) || 0])), [rows]);
  // 진하기 기준(max)과 합계는 보이는 기간만 센다 — 폰에서 8주만 보이는데 16주 합계가 적히면 어긋난다
  const visible = useMemo(() => {
    const keys = new Set(weeks.flat().filter((c) => c.inRange).map((c) => c.key));
    return [...byDate.entries()].filter(([k]) => keys.has(k)).map(([, v]) => v);
  }, [weeks, byDate]);
  const max = Math.max(1, ...visible);
  const total = visible.reduce((a, b) => a + b, 0);
  const activeDays = visible.filter((v) => v > 0).length;
  const gridRef = useRef(null);
  const [hover, setHover] = useState(null); // { key, v, x, y } — 격자 상자 기준 좌표

  // 달이 바뀌는 첫 주에만 월 이름을 적는다
  const monthLabels = weeks.map((week, i) => {
    const first = week[0]?.date;
    if (!first) return '';
    const prev = weeks[i - 1]?.[0]?.date;
    return !prev || prev.getMonth() !== first.getMonth() ? `${first.getMonth() + 1}월` : '';
  });

  const show = (event, cell, v) => {
    if (!interactive) return;
    const box = gridRef.current?.getBoundingClientRect();
    const rect = event.currentTarget.getBoundingClientRect();
    if (!box) return;
    setHover({ key: cell.key, v, x: rect.left - box.left + rect.width / 2, y: rect.top - box.top });
  };

  const labelCol = compact ? 0 : 18;
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      {/* 숫자 요약 — 큰 숫자 하나, 옆에 작은 설명 */}
      <p className="flex items-baseline gap-[6px] leading-none">
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[#212121] md:text-[20px]">
          {total}
          <span className="ml-[1px] text-[12px] font-normal text-[#919191]">{unit}</span>
        </span>
        <span className="text-[11px] tracking-[-0.02em] text-[#919191]">
          {caption} · {activeDays}일
        </span>
      </p>

      {/* 바깥 상자: (PC) 요일 라벨 열 + 주 열들이 남는 폭을 똑같이 나눠 가진다. 칸은 정사각형 */}
      <div ref={gridRef} className="relative" onMouseLeave={() => setHover(null)}>
        <div
          className={compact ? 'grid gap-[4px]' : 'grid gap-[3px]'}
          style={{
            gridTemplateColumns: `${labelCol ? `${labelCol}px ` : ''}repeat(${weeks.length}, minmax(0, 1fr))`,
            gridTemplateRows: `14px repeat(7, auto)`,
          }}
        >
          {/* 첫 행: 월 라벨 (요일 라벨 열은 비움) */}
          {labelCol > 0 && <span />}
          {weeks.map((week, wi) => (
            <span key={`m-${week[0].key}`} className="overflow-visible whitespace-nowrap text-[9px] leading-[14px] text-[#919191]">
              {monthLabels[wi]}
            </span>
          ))}
          {/* 요일 행 × 주 열 */}
          {Array.from({ length: 7 }, (_, dow) => (
            <div key={DOW[dow]} className="contents">
              {labelCol > 0 && (
                <span className="self-center pr-1 text-right text-[9px] leading-none text-[#b9b9b9]">{dow % 2 === 1 ? DOW[dow] : ''}</span>
              )}
              {weeks.map((week) => {
                const cell = week.find((c) => c.date.getDay() === dow);
                if (!cell || !cell.inRange) return <span key={`${week[0].key}-${dow}`} className="aspect-square w-full" />;
                const v = byDate.get(cell.key) ?? 0;
                const level = v === 0 ? 0 : Math.min(4, Math.ceil((v / max) * 4));
                const Tag = interactive ? 'button' : 'span';
                return (
                  <Tag
                    {...(interactive ? { type: 'button', onMouseEnter: (e) => show(e, cell, v), onFocus: (e) => show(e, cell, v) } : {})}
                    key={cell.key}
                    aria-label={`${cell.key} ${v}${unit}`}
                    className={`aspect-square w-full outline-none ring-[#212121] focus-visible:ring-1 ${compact ? 'rounded-[3px]' : 'rounded-[2px]'}`}
                    style={{ backgroundColor: SHADES[level] }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        {hover && (
          <span
            role="tooltip"
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[4px] bg-[#212121] px-2 py-[2px] text-[11px] text-white shadow"
            style={{ left: hover.x, top: hover.y - 6 }}
          >
            {hover.key} · {hover.v}
            {unit}
          </span>
        )}
      </div>

      {/* 범례 */}
      <p className="flex items-center justify-end gap-[3px] text-[10px] leading-none text-[#b9b9b9]">
        <span className="mr-[2px]">적음</span>
        {SHADES.map((c) => (
          <span key={c} className="h-[9px] w-[9px] rounded-[2px]" style={{ backgroundColor: c }} />
        ))}
        <span className="ml-[2px]">많음</span>
      </p>
    </div>
  );
}

export default function MyContributionGrid({ compact = false }) {
  const [data, setData] = useState(null);
  const isMdUp = useMinWidthMd();
  const coarse = useCoarsePointer();
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

  const weekCount = isMdUp ? WEEKS_DESKTOP : WEEKS_MOBILE;
  const gridProps = { weekCount, compact: !isMdUp, interactive: isMdUp && !coarse };

  return (
    <section
      className={
        compact
          ? 'flex flex-col gap-3'
          : 'flex flex-col gap-3 rounded-[10px] border border-black/20 bg-white px-[17px] py-[16px]'
      }
    >
      {/* 폰에서도 두 격자를 한 줄에 — 대신 8주만 보여 칸이 손가락 크기에 가깝게 (PM 10/10) */}
      <div className="flex flex-row gap-5 md:gap-10">
        <Grid caption="글 · 댓글" rows={data?.activity} unit="개" {...gridProps} />
        <Grid caption="접속" rows={data?.access} unit="회" {...gridProps} />
      </div>
    </section>
  );
}
