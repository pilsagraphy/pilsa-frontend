'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

// 종이 위 얼룩 — 카드 안쪽(overflow hidden)에만 그려 사각형 밖으로 삐져나오지 않는다 (PM 10/10 밤).
// 무지(ink): 왼쪽 아래 튄 자국(글 모서리에 걸쳐도 됨 — PM 이 마음에 들어 함) + 네 변의 여백 띠에 작은 잉크 방울 여러 개(동그라미·타원·튄 자국, 개수·위치·크기 랜덤).
// 빈티지(coffee): 커피잔 고리 자국 한두 개(글 위에 걸쳐도 됨) + 여백 띠의 작은 방울.
// **작은 방울·점은 글자 영역에 절대 안 들어간다** — 종이의 글 블록 바깥 여백(왼·오른쪽 18px, 위 22px, 아래 14px, 카드 padding 과 같다)에만
// px 로 놓는다. % 로 놓으면 카드가 길어질수록 글 위로 올라왔다 (PM 10/11 "점 자국이 글자 영역에는 없었으면").
// **개수는 종이 높이에 따라** — 짧은 종이(한두 줄)는 방울 0~1개·고리 1개, 글이 길어져 종이가 커질수록 방울이 랜덤하게 늘고(최대 6) 고리도 가끔 2개
// (PM 10/11 "작을 땐 1개만, 커지면 랜덤하게 추가"). 후보는 씨앗으로 전부 미리 뽑아 두고 높이만큼 앞에서부터 보여 주므로, 종이가 자라도
// 이미 있던 자국은 그 자리에 그대로 있고 새 것만 더해진다.
// 배치는 seed(정수)로 정해진다 — 작성 칸에서 종이 버튼을 누를 때마다 새 씨앗을 뽑고, 글과 함께 저장해 카드에서도 똑같이 그린다
// ("확정된 디자인은 바뀌지 않게", PM 10/11). 그리는 규칙을 바꾸면 같은 씨앗이라도 배치가 달라지니 함부로 손대지 말 것.

// 씨앗 하나로 같은 수열을 내는 작은 난수기 (mulberry32)
function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const newMarksSeed = () => Math.floor(Math.random() * 2147483647);

// 여백 띠 폭(px) — GuestbookNote/GuestbookComposer 의 종이 padding 과 같아야 한다
const BAND = { top: 22, bottom: 14, left: 18, right: 18 };
// 변 번호: 0 위 · 1 아래 · 2 왼쪽 · 3 오른쪽
const SIDE_BAND = [BAND.top, BAND.bottom, BAND.left, BAND.right];

// 고리는 가장자리 띠 근처 — 크기가 커서 글 위에 걸치지만 옅어서 괜찮다 (일부는 종이 밖으로 잘려 자연스럽다)
function edgeRing(r) {
  const rand = (min, max) => min + r() * (max - min);
  const side = Math.floor(r() * 4);
  const along = rand(12, 88);
  const near = rand(-8, 14);
  const pos =
    side === 0 ? { x: along, y: near } : side === 1 ? { x: along, y: 100 - near } : side === 2 ? { x: near, y: along } : { x: 100 - near, y: along };
  return { ...pos, size: rand(72, 104), rot: rand(-30, 30) };
}

// 방울의 대략적인 % 위치 (고리와 겹치는지 볼 때만 쓴다)
const approxPct = (d) => (d.side === 0 ? { x: d.along, y: 3 } : d.side === 1 ? { x: d.along, y: 97 } : d.side === 2 ? { x: 3, y: d.along } : { x: 97, y: d.along });
// 고리 위에 방울이 올라가지 않게 — 고리 지름이 카드 폭의 1/3 쯤이고 카드가 짧으면 세로로는 고리가 거의 다 차지하므로 넉넉히 피한다
const nearRing = (d, rings) => {
  const p = approxPct(d);
  return rings.some((ring) => Math.abs(ring.x - p.x) < 26 && Math.abs(ring.y - p.y) < 60);
};
// 같은 변의 방울끼리 겹치지 않게
const nearDrop = (d, drops) => drops.some((o) => o.side === d.side && Math.abs(o.along - d.along) < 9);
// 무지의 왼쪽 아래 튄 자국(76px) 자리 — 아래 변 왼쪽 끝·왼쪽 변 아래 끝에는 방울을 안 놓는다
const nearSplash = (d) => (d.side === 1 && d.along < 26) || (d.side === 2 && d.along > 78);

function makeMarks(kind, seed) {
  const r = rng(seed);
  const rand = (min, max) => min + r() * (max - min);
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const coffee = kind === 'coffee';
  // 두 번째 고리를 허용할지(종이가 커졌을 때만 쓰인다)와 방울 개수 배율(0.6~1) — 씨앗마다 다르다
  const extraRing = r() < 0.45;
  const dropFactor = 0.6 + 0.4 * r();
  // 후보는 넉넉히 뽑아 두고 실제 개수는 종이 높이가 정한다 (visibleCounts)
  const rings = coffee ? Array.from({ length: 2 }, () => edgeRing(r)) : [];
  const count = coffee ? 4 : 6;
  const drops = [];
  for (let i = 0; i < count; i += 1) {
    for (let tries = 0; tries < 24; tries += 1) {
      const side = Math.floor(r() * 4);
      const along = rand(5, 95);
      // 모양: 동그라미 / 기울어진 타원 / 튄 자국 — 무지만 섞고 빈티지는 동그라미. 크기는 작은 것 안에서 들쭉날쭉
      const roll = r();
      const shape = coffee || roll < 0.5 ? 'dot' : roll < 0.8 ? 'oval' : 'splat';
      const radius = rand(1.2, 4.5);
      // 그려지는 반지름(px) — 타원은 긴 쪽, 튄 자국은 SVG 상자의 절반
      const extent = shape === 'splat' ? radius * 2.2 : shape === 'oval' ? radius * 1.4 : radius;
      // 띠 안에서 변으로부터 중심까지의 거리 — 모양 전체가 띠 안에 들어가도록 (글 영역에 닿지 않게)
      const band = SIDE_BAND[side];
      if (band - extent * 2 < 2) continue; // 띠보다 큰 모양은 다시 뽑는다
      const near = rand(extent + 1, band - extent - 1);
      const d = { side, along, near, r: radius, o: rand(0.14, 0.28), shape, rot: rand(0, 180), squash: rand(0.4, 0.65) };
      if (!nearRing(d, rings) && !nearDrop(d, drops) && (coffee || !nearSplash(d))) {
        drops.push(d);
        break;
      }
    }
  }
  return { drops, rings, extraRing, dropFactor };
}

// 종이 높이(px)에 따른 개수. 한두 줄 종이(≈95px)는 방울 0개·고리 1개, 한 줄(≈29px)씩 길어질수록 늘어난다
const clampInt = (v, min, max) => Math.max(min, Math.min(max, v));
function visibleCounts(marks, coffee, height) {
  const base = coffee ? clampInt(Math.floor((height - 70) / 110), 0, 4) : clampInt(Math.floor((height - 70) / 75), 0, 6);
  const drops = Math.min(marks.drops.length, Math.round(base * marks.dropFactor));
  const rings = coffee ? (height >= 220 && marks.extraRing ? 2 : 1) : 0;
  return { drops, rings };
}

// 변에 붙는 좌표 — 위·왼쪽은 top/left, 아래·오른쪽은 bottom/right 로 잡고 그 방향으로 반만큼 밀어 중심을 맞춘다
function anchorStyle(d) {
  if (d.side === 0) return { left: `${d.along}%`, top: d.near, transform: 'translate(-50%, -50%)' };
  if (d.side === 1) return { left: `${d.along}%`, bottom: d.near, transform: 'translate(-50%, 50%)' };
  if (d.side === 2) return { top: `${d.along}%`, left: d.near, transform: 'translate(-50%, -50%)' };
  return { top: `${d.along}%`, right: d.near, transform: 'translate(50%, -50%)' };
}

export default function PaperMarks({ kind = 'ink', color, seed = 1 }) {
  const marks = useMemo(() => makeMarks(kind, seed), [kind, seed]);
  const coffee = kind === 'coffee';
  const tone = coffee ? '#6b4a2b' : color;
  // 종이 높이를 재서 개수를 정한다 — 작성 칸에서 글이 길어지면 그 자리에서 늘어난다 (카드의 transform scale 은 clientHeight 에 안 끼친다)
  const ref = useRef(null);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setHeight(el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const shown = visibleCounts(marks, coffee, height);
  const rings = marks.rings.slice(0, shown.rings);
  const drops = marks.drops.slice(0, shown.drops);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ color: tone }}>
      {/* 왼쪽 아래 튄 자국 — 무지에만. 이건 글 모서리에 걸쳐도 그대로 둔다 (PM 10/11 "이건 좋은데 유지해") */}
      {!coffee && (
        <svg viewBox="0 0 100 100" className="absolute -bottom-3 -left-3 h-[76px] w-[76px]">
          <g fill="currentColor">
            <path
              opacity="0.17"
              d="M38 58c-6-9 2-20 12-19 8 1 10-8 18-6 9 2 7 12 13 16 8 6 2 18-7 19-7 1-9 8-17 7-9-1-8-9-14-11-4-2-4-4-5-6z"
            />
            <circle cx="24" cy="44" r="3.2" opacity="0.2" />
            <circle cx="30" cy="34" r="1.8" opacity="0.18" />
            <circle cx="78" cy="38" r="2.4" opacity="0.18" />
            <circle cx="70" cy="84" r="2" opacity="0.16" />
            <circle cx="52" cy="90" r="1.3" opacity="0.16" />
            <circle cx="16" cy="60" r="1.4" opacity="0.14" />
          </g>
        </svg>
      )}

      {/* 커피잔 고리 — 빈티지에만. 테두리가 진하고 안은 옅다 */}
      {rings.map((ring, i) => (
        <svg
          key={`ring-${i}`}
          viewBox="0 0 120 120"
          className="absolute"
          style={{
            left: `${ring.x}%`,
            top: `${ring.y}%`,
            width: ring.size,
            height: ring.size,
            transform: `translate(-50%, -50%) rotate(${ring.rot}deg)`,
          }}
        >
          <defs>
            <filter id={`coffeeSoft-${seed}-${i}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.1" />
            </filter>
          </defs>
          <g filter={`url(#coffeeSoft-${seed}-${i})`} fill="none" stroke="currentColor" strokeLinecap="round">
            <circle cx="60" cy="60" r="42" strokeWidth="5" opacity="0.28" />
            <circle cx="61.5" cy="58.5" r="41" strokeWidth="2.5" opacity="0.2" strokeDasharray="40 14 60 9 50 20" />
          </g>
          <circle cx="60" cy="60" r="39" fill="currentColor" opacity="0.08" />
        </svg>
      ))}

      {/* 작은 방울 — 여백 띠 안에만. 동그라미·타원은 span, 튄 자국은 작은 SVG */}
      {drops.map((d, i) => {
        const anchor = anchorStyle(d);
        if (d.shape === 'splat') {
          return (
            <svg
              key={`drop-${i}`}
              viewBox="0 0 100 100"
              className="absolute"
              style={{ ...anchor, width: d.r * 4.4, height: d.r * 4.4, opacity: d.o + 0.04, transform: `${anchor.transform} rotate(${d.rot}deg)` }}
            >
              <g fill="currentColor">
                <path d="M50 18c14-6 30 4 32 18 2 12-8 22-18 28-12 8-28 6-36-4-8-12-2-30 10-38 4-2 8-3 12-4z" />
                <circle cx="16" cy="38" r="4" />
                <circle cx="86" cy="74" r="3.5" />
                <circle cx="40" cy="88" r="2.5" />
                <circle cx="74" cy="14" r="2" />
              </g>
            </svg>
          );
        }
        return (
          <span
            key={`drop-${i}`}
            className="absolute rounded-full"
            style={{
              ...anchor,
              width: d.shape === 'oval' ? d.r * 2.8 : d.r * 2,
              height: d.shape === 'oval' ? d.r * 2.8 * d.squash : d.r * 2,
              backgroundColor: 'currentColor',
              opacity: coffee ? d.o + 0.1 : d.o,
              transform: `${anchor.transform} rotate(${d.shape === 'oval' ? d.rot : 0}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}
