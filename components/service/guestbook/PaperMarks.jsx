'use client';

import { useMemo } from 'react';

// 종이 위 얼룩 — 카드 안쪽(overflow hidden)에만 그려 사각형 밖으로 삐져나오지 않는다 (PM 10/10 밤).
// 무지(ink): 왼쪽 아래 잉크 튄 자국 + 네 변의 가장자리 띠에 작은 잉크 방울 여러 개(동그라미·타원·튄 자국, 개수·위치·크기 랜덤).
//   가운데는 글이 오는 자리라 비워 두고, 방울끼리·튄 자국과는 겹치지 않는다 (PM 10/11 "잉크 위에 잉크 금지, 가운데 비우기, 모양 다양하게").
// 빈티지(coffee): 커피잔 고리 자국 한두 개 — 글을 가리지 않게 가장자리 쪽에만 + 고리 위에 올라가지 않는 작은 방울.
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

// 네 변 중 하나를 골라 그 변에 붙인다. near: 변에서 안쪽으로 얼마나(%), along: 변을 따라 어디쯤(%)
const onEdge = (side, along, near) =>
  side === 0 ? { x: along, y: near } : side === 1 ? { x: along, y: 100 - near } : side === 2 ? { x: near, y: along } : { x: 100 - near, y: along };

// 고리는 가장자리 띠 안에서만 (일부는 종이 밖으로 잘려 자연스럽다)
function edgeRing(r) {
  const rand = (min, max) => min + r() * (max - min);
  return { ...onEdge(Math.floor(r() * 4), rand(12, 88), rand(-8, 14)), size: rand(72, 104), rot: rand(-30, 30) };
}

// 방울은 네 변에 바짝(안쪽 2~9%)만 — 가운데는 글이 오는 자리 (PM 10/11 "조금 더 가장자리에만")
function edgeDrop(r) {
  const rand = (min, max) => min + r() * (max - min);
  return onEdge(Math.floor(r() * 4), rand(5, 95), rand(2, 9));
}

// 고리 위에 방울이 올라가지 않게. 고리 지름이 카드 폭의 1/3 쯤이고 카드가 짧으면 세로로는 고리가 거의 다 차지하므로
// 가로 26% 밖이면 안전하고, 가로로 가까우면 세로 60% 는 떨어져야 한다
const nearRing = (d, rings) => rings.some((ring) => Math.abs(ring.x - d.x) < 26 && Math.abs(ring.y - d.y) < 60);
// 방울끼리도 겹치지 않게
const nearDrop = (d, drops) => drops.some((o) => Math.abs(o.x - d.x) < 8 && Math.abs(o.y - d.y) < 8);
// 무지의 왼쪽 아래 튄 자국(76px) 근처
const nearSplash = (d) => d.x < 26 && d.y > 55;

function makeMarks(kind, seed) {
  const r = rng(seed);
  const rand = (min, max) => min + r() * (max - min);
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const coffee = kind === 'coffee';
  const rings = coffee ? Array.from({ length: r() < 0.55 ? 1 : 2 }, () => edgeRing(r)) : [];
  // 무지 방울은 3~5개 (PM 10/11 "한두 개 더 줄이기" — 4~7 에서)
  const count = coffee ? randInt(2, 4) : randInt(3, 5);
  const drops = [];
  for (let i = 0; i < count; i += 1) {
    for (let tries = 0; tries < 24; tries += 1) {
      // 모양: 동그라미 / 기울어진 타원 / 튄 자국 — 무지만 섞고 빈티지는 동그라미. 크기는 작은 것 안에서 들쭉날쭉
      const roll = r();
      const shape = coffee || roll < 0.5 ? 'dot' : roll < 0.8 ? 'oval' : 'splat';
      const d = { ...edgeDrop(r), r: rand(1.2, 5), o: rand(0.14, 0.28), shape, rot: rand(0, 180), squash: rand(0.4, 0.65) };
      if (!nearRing(d, rings) && !nearDrop(d, drops) && (coffee || !nearSplash(d))) {
        drops.push(d);
        break;
      }
    }
  }
  return { drops, rings };
}

export default function PaperMarks({ kind = 'ink', color, seed = 1 }) {
  const marks = useMemo(() => makeMarks(kind, seed), [kind, seed]);
  const coffee = kind === 'coffee';
  const tone = coffee ? '#6b4a2b' : color;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ color: tone }}>
      {/* 왼쪽 아래 튄 자국 — 무지에만 */}
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
      {marks.rings.map((ring, i) => (
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

      {/* 작은 방울 — 동그라미·타원은 span, 튄 자국은 작은 SVG */}
      {marks.drops.map((d, i) =>
        d.shape === 'splat' ? (
          <svg
            key={`drop-${i}`}
            viewBox="0 0 100 100"
            className="absolute"
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: d.r * 6,
              height: d.r * 6,
              opacity: d.o + 0.04,
              transform: `translate(-50%, -50%) rotate(${d.rot}deg)`,
            }}
          >
            <g fill="currentColor">
              <path d="M50 18c14-6 30 4 32 18 2 12-8 22-18 28-12 8-28 6-36-4-8-12-2-30 10-38 4-2 8-3 12-4z" />
              <circle cx="16" cy="38" r="4" />
              <circle cx="86" cy="74" r="3.5" />
              <circle cx="40" cy="88" r="2.5" />
              <circle cx="74" cy="14" r="2" />
            </g>
          </svg>
        ) : (
          <span
            key={`drop-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: d.shape === 'oval' ? d.r * 2.8 : d.r * 2,
              height: d.shape === 'oval' ? d.r * 2.8 * d.squash : d.r * 2,
              backgroundColor: 'currentColor',
              opacity: coffee ? d.o + 0.1 : d.o,
              transform: `translate(-50%, -50%) rotate(${d.shape === 'oval' ? d.rot : 0}deg)`,
            }}
          />
        )
      )}
    </div>
  );
}
