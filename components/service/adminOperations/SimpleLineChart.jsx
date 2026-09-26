'use client';

import { useRef, useState } from 'react';

// 외부 차트 라이브러리 없이 그리는 꺾은선 그래프 (SVG). 숫자가 몇십 개 수준인 운영 화면용이라 이걸로 충분하다.
//
// props
//   labels  x축 라벨 배열 (예: 날짜)
//   series  [{ name, color, values: number[] }]  values 길이 = labels 길이
//   height  픽셀 (기본 220). 폭은 부모를 꽉 채운다 (viewBox + width 100%)
//   formatLabel  x축에 찍을 라벨 가공 (기본: 그대로). 라벨은 겹치지 않게 최대 8개만 찍는다
//
// 마우스를 올리면(폰은 손가락) 가장 가까운 점의 값을 세로선과 말풍선으로 보여 준다 (PM, 2026-09-26).
export default function SimpleLineChart({ labels = [], series = [], height = 220, formatLabel = (s) => s }) {
  const W = 720;
  const H = height;
  const PAD = { top: 16, right: 16, bottom: 34, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const n = labels.length;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const step = niceStep(max / 4);
  const yMax = Math.ceil(max / step) * step;
  const x = (i) => (n <= 1 ? PAD.left + innerW / 2 : PAD.left + (innerW * i) / (n - 1));
  const y = (v) => PAD.top + innerH - (innerH * v) / yMax;
  const ticks = [];
  for (let v = 0; v <= yMax; v += step) ticks.push(v);
  const labelEvery = Math.max(1, Math.ceil(n / 8));

  const svgRef = useRef(null);
  const [hover, setHover] = useState(null); // 가까운 점의 index

  const onMove = (e) => {
    const svg = svgRef.current;
    if (!svg || !n) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W; // 화면 좌표 → viewBox 좌표
    const ratio = Math.min(1, Math.max(0, (px - PAD.left) / innerW));
    setHover(n <= 1 ? 0 : Math.round(ratio * (n - 1)));
  };

  if (!n) {
    return <p className="py-6 text-center text-[14px] text-[#919191]">표시할 데이터가 없습니다.</p>;
  }

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-none"
        role="img"
        aria-label="꺾은선 그래프"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => onMove(e.touches[0])}
        onTouchMove={(e) => onMove(e.touches[0])}
        onTouchEnd={() => setHover(null)}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="#EEEEEE" strokeWidth="1" />
            <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#919191">
              {v}
            </text>
          </g>
        ))}
        {labels.map((label, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text key={label + i} x={x(i)} y={H - 12} textAnchor="middle" fontSize="11" fill="#919191">
              {formatLabel(label)}
            </text>
          ) : null
        )}
        {hover != null && (
          <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="#B9B9B9" strokeWidth="1" strokeDasharray="3 3" />
        )}
        {series.map((s) => (
          <g key={s.name}>
            <polyline
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
            />
            {s.values.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 5 : 3} fill="#fff" stroke={s.color} strokeWidth="2" />
            ))}
          </g>
        ))}
      </svg>

      {hover != null && (
        <ChartTooltip
          leftRatio={x(hover) / W}
          title={labels[hover]}
          rows={series.map((s) => ({ name: s.name, color: s.color, value: s.values[hover] ?? 0 }))}
        />
      )}

      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
        {series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1.5 text-[12px] text-[#5f5f5f]">
            <span className="inline-block h-[3px] w-4 rounded" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

// 말풍선 — SVG 위에 HTML 로 띄운다 (글자 크기가 뷰박스 배율에 안 끌려간다). 오른쪽 끝 가까이면 왼쪽으로 뒤집는다
export function ChartTooltip({ leftRatio, title, rows }) {
  const flip = leftRatio > 0.7;
  return (
    <div
      className="pointer-events-none absolute top-2 z-10 rounded-[6px] border border-[#EEEEEE] bg-white/95 px-3 py-2 text-[12px] shadow-md"
      style={{ left: `${leftRatio * 100}%`, transform: flip ? 'translateX(calc(-100% - 10px))' : 'translateX(10px)' }}
    >
      <p className="mb-1 font-medium text-[#212121]">{title}</p>
      {rows.map((r) => (
        <p key={r.name} className="flex items-center gap-1.5 whitespace-nowrap text-[#5f5f5f]">
          <span className="inline-block size-2 rounded-full" style={{ background: r.color }} />
          {r.name} <strong className="text-[#212121]">{Number(r.value).toLocaleString('ko-KR')}</strong>
        </p>
      ))}
    </div>
  );
}

// 4~5 칸 정도로 나뉘는 보기 좋은 눈금 간격 (1, 2, 5 × 10^k)
export function niceStep(rough) {
  if (rough <= 1) return 1;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const unit = rough / pow;
  const m = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10;
  return m * pow;
}
