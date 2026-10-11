'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

// 종이 위 얼룩 — 카드 안쪽(overflow hidden)에만 그려 사각형 밖으로 삐져나오지 않는다 (PM 10/10 밤).
// 무지(ink): 왼쪽 아래 튄 자국(글 모서리에 걸쳐도 됨 — PM 이 마음에 들어 함) + 그런 큰 잉크 장식(물방울·붓 자국·펜 뚜껑 고리) 0~2개가 가장자리에 잘리게 + 네 변의 여백 띠에 작은 잉크 방울 여러 개
//   (동그라미·찌그러진 방울·튄 자국이 섞이고 크기가 1~7px 로 확 다르다 — PM 10/11 "너무 동그래, 사이즈도 거기서 거기", 타원은 뺌).
// 빈티지(coffee): 커피잔 고리 자국 — **항상 종이 가장자리에 잘리게** 놓고(가운데 떠 있지 않게), 가끔은 꼭짓점에 걸쳐 1/4 만 보인다.
//   두 개가 나오면 크기가 확연히 다르다(큰 것 84~110px, 작은 것 56~70px). 고리는 글 위에 걸쳐도 옅어서 괜찮다. + 여백 띠의 작은 방울.
// **작은 방울·점은 글자 영역에 절대 안 들어간다** — 종이의 글 블록 바깥 여백(왼·오른쪽 18px, 위 22px, 아래 14px, 카드 padding 과 같다)에만
// px 로 놓는다. % 로 놓으면 카드가 길어질수록 글 위로 올라왔다 (PM 10/11 "점 자국이 글자 영역에는 없었으면").
// **개수는 종이 높이에 따라** — 짧은 종이(한두 줄)는 방울 2~3개·고리 1개, 글이 길어져 종이가 커질수록 방울 개수의 랜덤 범위가 넓어지고(최대 7) 고리도 가끔 2개
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
// 변 번호: 0 위 · 1 아래 · 2 왼쪽 · 3 오른쪽. 꼭짓점 번호: 0 좌상 · 1 우상 · 2 좌하 · 3 우하
const SIDE_BAND = [BAND.top, BAND.bottom, BAND.left, BAND.right];

// 찌그러진 방울 두 가지 (100×100 상자) — 동그라미 대신 쓴다
const BLOBS = [
  'M52 14c16-4 32 8 34 24 2 14-8 28-22 34-14 6-32 2-42-10C12 48 14 30 26 22c8-6 18-6 26-8z',
  'M40 18c18-10 40 2 44 20 4 16-6 30-20 38-14 8-34 6-44-6C8 56 14 36 24 26c5-4 10-6 16-8z',
];
// 튄 자국 (100×100 상자)
const SPLAT = 'M50 18c14-6 30 4 32 18 2 12-8 22-18 28-12 8-28 6-36-4-8-12-2-30 10-38 4-2 8-3 12-4z';
// 무지의 큰 잉크 장식 — 왼쪽 아래 튄 자국 같은 것이 가장자리에 랜덤으로 0~2개 더 (PM 10/11 "그런 디자인이 좀 생기면"). 물방울 · 붓 자국 · 펜 뚜껑 고리
const DECO_KINDS = ['drip', 'dab', 'ring'];
const DECO_PATHS = {
  drip: 'M50 6c6 18 16 30 16 46 0 12-7 22-16 22s-16-10-16-22c0-16 10-28 16-46z M46 84a4 4 0 1 0 8 0a4 4 0 1 0-8 0z',
  dab: 'M12 58c10-16 30-26 50-24 14 2 28 10 26 22-2 10-16 14-30 16-18 2-38 0-46-14z',
};

// 고리 — 반드시 가장자리에 잘리게. 35% 는 꼭짓점에 걸쳐 1/4 만 보이고, 나머지는 한 변에 걸쳐 중심이 변에서 반지름 안쪽(-0.45r ~ +0.55r)
function edgeRing(r, size) {
  const rand = (min, max) => min + r() * (max - min);
  const radius = size / 2;
  if (r() < 0.35) {
    return { corner: Math.floor(r() * 4), dx: rand(-0.15, 0.15) * radius, dy: rand(-0.15, 0.15) * radius, size, rot: rand(-30, 30) };
  }
  return { side: Math.floor(r() * 4), along: rand(15, 85), near: rand(-0.45, 0.55) * radius, size, rot: rand(-30, 30) };
}

// 고리·방울의 대략적인 % 위치 (서로 겹치는지 볼 때만 쓴다)
const CORNER_PCT = [
  { x: 2, y: 2 },
  { x: 98, y: 2 },
  { x: 2, y: 98 },
  { x: 98, y: 98 },
];
const approxPct = (m) => {
  if (m.corner != null) return CORNER_PCT[m.corner];
  return m.side === 0 ? { x: m.along, y: 2 } : m.side === 1 ? { x: m.along, y: 98 } : m.side === 2 ? { x: 2, y: m.along } : { x: 98, y: m.along };
};
// 고리 위에 방울이 올라가지 않게 — 고리 지름이 카드 폭의 1/3 쯤이고 카드가 짧으면 세로로는 고리가 거의 다 차지하므로 넉넉히 피한다
const nearRing = (d, rings) => {
  const p = approxPct(d);
  return rings.some((ring) => {
    const q = approxPct(ring);
    return Math.abs(q.x - p.x) < 26 && Math.abs(q.y - p.y) < 60;
  });
};
// 같은 변의 방울끼리 겹치지 않게
const nearDrop = (d, drops) => drops.some((o) => o.side === d.side && Math.abs(o.along - d.along) < 9);
// 무지의 왼쪽 아래 튄 자국(76px) 자리 — 아래 변 왼쪽 끝·왼쪽 변 아래 끝에는 방울을 안 놓는다
const nearSplash = (d) => (d.side === 1 && d.along < 26) || (d.side === 2 && d.along > 78);
// 큰 것(고리·장식)끼리 — 대략 위치가 가로나 세로로 dist% 이상 떨어져야 한다. 커피 고리끼리는 절대 안 겹친다 (PM 10/11)
const farApart = (a, b, dist) => {
  const p = approxPct(a);
  const q = approxPct(b);
  return Math.abs(p.x - q.x) >= dist || Math.abs(p.y - q.y) >= dist;
};
// 큰 장식이 왼쪽 아래 튄 자국 자리에 오지 않게
const nearSplashBig = (m) => {
  const p = approxPct(m);
  return p.x < 35 && p.y > 65;
};

function makeMarks(kind, seed) {
  const r = rng(seed);
  const rand = (min, max) => min + r() * (max - min);
  const coffee = kind === 'coffee';
  // 두 번째 고리를 허용할지(종이가 커졌을 때만 쓰인다)와 방울 개수 자리(0~1, 높이별 범위 안에서 어디쯤인지) — 씨앗마다 다르다
  const extraRing = r() < 0.45;
  const dropFactor = r();
  // 후보는 넉넉히 뽑아 두고 실제 개수는 종이 높이가 정한다 (visibleCounts). 고리 둘은 크기가 확연히 다르고 서로 절대 안 겹친다
  const rings = [];
  if (coffee) {
    rings.push(edgeRing(r, rand(84, 110)));
    for (let tries = 0; tries < 20; tries += 1) {
      const cand = edgeRing(r, rand(56, 70));
      if (farApart(cand, rings[0], 45)) {
        rings.push(cand);
        break;
      }
    }
  }
  // 무지의 큰 잉크 장식 0~2개 — 가장자리·꼭짓점에 잘리게, 서로·튄 자국과 안 겹치게
  const decos = [];
  if (!coffee) {
    const roll = r();
    const want = roll < 0.3 ? 2 : roll < 0.85 ? 1 : 0;
    for (let i = 0; i < want; i += 1) {
      for (let tries = 0; tries < 20; tries += 1) {
        const cand = { ...edgeRing(r, rand(36, 64)), kind: DECO_KINDS[Math.floor(r() * DECO_KINDS.length)] };
        if (nearSplashBig(cand) || decos.some((o) => !farApart(cand, o, 30))) continue;
        decos.push(cand);
        break;
      }
    }
  }
  const bigOnes = [...rings, ...decos];
  const count = coffee ? 5 : 9;
  const drops = [];
  for (let i = 0; i < count; i += 1) {
    for (let tries = 0; tries < 24; tries += 1) {
      const side = Math.floor(r() * 4);
      const along = rand(5, 95);
      // 모양: 동그라미 / 찌그러진 방울 / 튄 자국(무지만) — 타원은 뺐다 (PM 10/11). 크기는 아주 작은 점부터 띠에 꽉 차는 것까지 확 다르게
      const roll = r();
      const shape = coffee ? (roll < 0.5 ? 'dot' : 'blob') : roll < 0.35 ? 'dot' : roll < 0.75 ? 'blob' : 'splat';
      const radius = 1 + 6 * r() ** 1.6; // 1~7px, 작은 쪽이 더 흔하다
      const squash = rand(0.75, 1.1);
      // 그려지는 반지름(px) — 상자 대각선까지 넉넉히
      const extent = shape === 'splat' ? radius * 2.2 : shape === 'blob' ? radius * 1.5 : radius;
      // 띠 안에서 변으로부터 중심까지의 거리 — 모양 전체가 띠 안에 들어가도록 (글 영역에 닿지 않게)
      const band = SIDE_BAND[side];
      if (band - extent * 2 < 2) continue; // 띠보다 큰 모양은 다시 뽑는다
      const near = rand(extent + 1, band - extent - 1);
      const d = { side, along, near, r: radius, o: rand(0.14, 0.28), shape, rot: rand(0, 360), squash, blob: Math.floor(r() * BLOBS.length) };
      if (!nearRing(d, bigOnes) && !nearDrop(d, drops) && (coffee || !nearSplash(d))) {
        drops.push(d);
        break;
      }
    }
  }
  return { drops, rings, decos, extraRing, dropFactor };
}

// 종이 높이(px)에 따른 개수 — 개수 자체는 씨앗별 랜덤(dropFactor)이고, 그 범위가 종이가 길어질수록 넓어진다 (PM 10/11 "작을 때도 몇 개는").
// 무지: 한두 줄(≈95px) 2~3개 → 두 줄(≈60px)쯤 길어질 때마다 위가 1씩 올라가 최대 3~7개. 빈티지 점: 1~2개 → 최대 1~4개.
// 고리: 1개, 220px 이상이면 씨앗에 따라 2개
const clampInt = (v, min, max) => Math.max(min, Math.min(max, v));
function visibleCounts(marks, coffee, height) {
  const grown = Math.max(0, height - 95);
  const lo = coffee ? 1 : height >= 220 ? 3 : 2;
  const hi = coffee ? clampInt(2 + Math.floor(grown / 110), 2, 4) : clampInt(3 + Math.floor(grown / 60), 3, 7);
  const drops = Math.min(marks.drops.length, lo + Math.round(marks.dropFactor * (hi - lo)));
  const rings = coffee ? (height >= 220 && marks.extraRing ? 2 : 1) : 0;
  return { drops, rings };
}

// 변·꼭짓점에 붙는 좌표 — 위·왼쪽은 top/left, 아래·오른쪽은 bottom/right 로 잡고 그 방향으로 반만큼 밀어 중심을 맞춘다 (음수면 종이 밖으로 나가 잘린다)
function anchorStyle(m) {
  if (m.corner != null) {
    const sx = m.corner % 2 === 0 ? -50 : 50;
    const sy = m.corner < 2 ? -50 : 50;
    return {
      [m.corner % 2 === 0 ? 'left' : 'right']: m.dx,
      [m.corner < 2 ? 'top' : 'bottom']: m.dy,
      transform: `translate(${sx}%, ${sy}%)`,
    };
  }
  if (m.side === 0) return { left: `${m.along}%`, top: m.near, transform: 'translate(-50%, -50%)' };
  if (m.side === 1) return { left: `${m.along}%`, bottom: m.near, transform: 'translate(-50%, 50%)' };
  if (m.side === 2) return { top: `${m.along}%`, left: m.near, transform: 'translate(-50%, -50%)' };
  return { top: `${m.along}%`, right: m.near, transform: 'translate(50%, -50%)' };
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
  const decos = marks.decos.slice(0, shown.decos);

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

      {/* 큰 잉크 장식 — 무지에만. 물방울·붓 자국·펜 뚜껑 고리가 가장자리·꼭짓점에 걸쳐 잘린다 */}
      {decos.map((m, i) => {
        const anchor = anchorStyle(m);
        return (
          <svg
            key={`deco-${i}`}
            viewBox="0 0 100 100"
            className="absolute"
            style={{ ...anchor, width: m.size, height: m.size, transform: `${anchor.transform} rotate(${m.rot}deg)` }}
          >
            {m.kind === 'ring' ? (
              <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="7" opacity="0.18" />
            ) : (
              <path d={DECO_PATHS[m.kind]} fill="currentColor" fillRule="evenodd" opacity="0.17" />
            )}
          </svg>
        );
      })}

      {/* 커피잔 고리 — 빈티지에만. 늘 가장자리·꼭짓점에 걸쳐 잘린다(둘이면 서로 안 겹침). 테두리가 진하고 안은 옅다 */}
      {rings.map((ring, i) => {
        const anchor = anchorStyle(ring);
        return (
          <svg
            key={`ring-${i}`}
            viewBox="0 0 120 120"
            className="absolute"
            style={{ ...anchor, width: ring.size, height: ring.size, transform: `${anchor.transform} rotate(${ring.rot}deg)` }}
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
        );
      })}

      {/* 작은 방울 — 여백 띠 안에만. 동그라미는 span, 찌그러진 방울·튄 자국은 SVG */}
      {drops.map((d, i) => {
        const anchor = anchorStyle(d);
        if (d.shape === 'dot') {
          return (
            <span
              key={`drop-${i}`}
              className="absolute rounded-full"
              style={{ ...anchor, width: d.r * 2, height: d.r * 2, backgroundColor: 'currentColor', opacity: coffee ? d.o + 0.1 : d.o }}
            />
          );
        }
        const splat = d.shape === 'splat';
        const size = splat ? d.r * 4.4 : d.r * 3;
        return (
          <svg
            key={`drop-${i}`}
            viewBox="0 0 100 100"
            className="absolute"
            style={{
              ...anchor,
              width: size,
              height: splat ? size : size * d.squash,
              opacity: (coffee ? d.o + 0.1 : d.o) + 0.04,
              transform: `${anchor.transform} rotate(${d.rot}deg)`,
            }}
            preserveAspectRatio="none"
          >
            <g fill="currentColor">
              <path d={splat ? SPLAT : BLOBS[d.blob]} />
              {splat && (
                <>
                  <circle cx="16" cy="38" r="4" />
                  <circle cx="86" cy="74" r="3.5" />
                  <circle cx="40" cy="88" r="2.5" />
                  <circle cx="74" cy="14" r="2" />
                </>
              )}
            </g>
          </svg>
        );
      })}
    </div>
  );
}
