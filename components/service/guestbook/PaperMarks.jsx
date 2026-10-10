'use client';

import { useMemo } from 'react';

// 종이 위 얼룩 — 카드 안쪽(overflow hidden)에만 그려 사각형 밖으로 삐져나오지 않는다 (PM 10/10 밤).
// 무지(ink): 왼쪽 아래 잉크 튄 자국 + 오른쪽 위에 작은 잉크 방울 여러 개(개수·위치·크기 랜덤).
// 빈티지(coffee): 커피잔 고리 자국 한두 개 — 글을 가리지 않게 가장자리 쪽에만 + 고리와 겹치지 않는 작은 방울 (PM 10/11).
// 배치는 seed(정수)로 정해진다 — 작성 칸에서 종이 버튼을 누를 때마다 새 씨앗을 뽑고, 글과 함께 저장해 카드에서도 똑같이 그린다
// ("확정된 디자인은 바뀌지 않게", PM 10/11).

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

// 고리는 가장자리 띠 안에서만 — 위·아래·왼쪽·오른쪽 중 하나를 골라 그 변에 붙인다 (일부는 종이 밖으로 잘려 자연스럽다)
function edgeRing(r) {
  const rand = (min, max) => min + r() * (max - min);
  const side = Math.floor(r() * 4);
  const along = rand(12, 88);
  const near = rand(-8, 14);
  const pos =
    side === 0 ? { x: along, y: near } : side === 1 ? { x: along, y: 100 - near } : side === 2 ? { x: near, y: along } : { x: 100 - near, y: along };
  return { ...pos, size: rand(72, 104), rot: rand(-30, 30) };
}

// 방울은 고리 근처(가로 20%·세로 18% 안)를 피한다
const nearRing = (d, rings) => rings.some((ring) => Math.abs(ring.x - d.x) < 20 && Math.abs(ring.y - d.y) < 18);

function makeMarks(kind, seed) {
  const r = rng(seed);
  const rand = (min, max) => min + r() * (max - min);
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const coffee = kind === 'coffee';
  const rings = coffee ? Array.from({ length: r() < 0.55 ? 1 : 2 }, () => edgeRing(r)) : [];
  const count = coffee ? randInt(2, 4) : randInt(3, 6);
  const drops = [];
  for (let i = 0; i < count; i += 1) {
    for (let tries = 0; tries < 20; tries += 1) {
      // 오른쪽 위 쪽에 흩뿌리되, 무지는 조금 더 넓게. 크기는 작은 것 안에서 들쭉날쭉
      const d = { x: rand(coffee ? 60 : 55, 94), y: rand(4, coffee ? 26 : 32), r: rand(1.2, 5), o: rand(0.14, 0.28) };
      if (!nearRing(d, rings)) {
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

      {/* 작은 방울 */}
      {marks.drops.map((d, i) => (
        <span
          key={`drop-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.r * 2,
            height: d.r * 2,
            backgroundColor: 'currentColor',
            opacity: coffee ? d.o + 0.1 : d.o,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}
