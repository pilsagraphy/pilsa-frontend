'use client';

import { useState } from 'react';

// 종이 위 얼룩 — 카드 안쪽(overflow hidden)에만 그려 사각형 밖으로 삐져나오지 않는다 (PM 10/10 밤).
// 무지(ink): 왼쪽 아래 잉크 튄 자국 + 오른쪽 위에 작은 잉크 방울 한두 개(위치·크기 랜덤, 새로고침마다 다르다).
// 빈티지(coffee): 커피잔 고리 자국 한두 개(위치 랜덤) + 작은 방울.
const rand = (min, max) => min + Math.random() * (max - min);

function makeMarks(kind) {
  const drops = Array.from({ length: Math.random() < 0.5 ? 1 : 2 }, () => ({
    x: rand(64, 92),
    y: rand(5, 26),
    r: rand(2, 4.5),
    o: rand(0.14, 0.26),
  }));
  if (kind === 'coffee') {
    const rings = Array.from({ length: Math.random() < 0.6 ? 1 : 2 }, (_, i) => ({
      x: i === 0 ? rand(58, 86) : rand(8, 36),
      y: i === 0 ? rand(10, 40) : rand(55, 90),
      size: rand(70, 100),
      rot: rand(-30, 30),
    }));
    return { drops, rings };
  }
  return { drops, rings: [] };
}

export default function PaperMarks({ kind = 'ink', color }) {
  // 처음 그릴 때 한 번 정하고 그 뒤로는 고정 — 글을 치는 동안 얼룩이 움직이면 안 된다
  const [marks] = useState(() => makeMarks(kind));
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
            <filter id={`coffeeSoft-${i}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.1" />
            </filter>
          </defs>
          <g filter={`url(#coffeeSoft-${i})`} fill="none" stroke="currentColor" strokeLinecap="round">
            <circle cx="60" cy="60" r="42" strokeWidth="5" opacity="0.28" />
            <circle cx="61.5" cy="58.5" r="41" strokeWidth="2.5" opacity="0.2" strokeDasharray="40 14 60 9 50 20" />
          </g>
          <circle cx="60" cy="60" r="39" fill="currentColor" opacity="0.08" />
        </svg>
      ))}

      {/* 오른쪽 위 작은 방울 — 랜덤 */}
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
