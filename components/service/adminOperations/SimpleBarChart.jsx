'use client';

import { niceStep } from './SimpleLineChart';

// 외부 라이브러리 없는 막대 그래프 (SVG). 시리즈가 여러 개면 같은 라벨 안에 나란히(grouped) 그린다.
//
// props
//   labels  x축 라벨 배열
//   series  [{ name, color, values: number[] }]
//   height  픽셀 (기본 220)
//   formatLabel  x축 라벨 가공. 최대 12개만 찍는다
export default function SimpleBarChart({ labels = [], series = [], height = 220, formatLabel = (s) => s }) {
  const W = 720;
  const H = height;
  const PAD = { top: 16, right: 16, bottom: 34, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const n = labels.length;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const step = niceStep(max / 4);
  const yMax = Math.ceil(max / step) * step;
  const groupW = n ? innerW / n : innerW;
  const barW = Math.max(2, (groupW * 0.7) / Math.max(1, series.length));
  const y = (v) => PAD.top + innerH - (innerH * v) / yMax;
  const ticks = [];
  for (let v = 0; v <= yMax; v += step) ticks.push(v);
  const labelEvery = Math.max(1, Math.ceil(n / 12));

  if (!n) {
    return <p className="py-6 text-center text-[14px] text-[#919191]">표시할 데이터가 없습니다.</p>;
  }

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="막대 그래프">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="#EEEEEE" strokeWidth="1" />
            <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#919191">
              {v}
            </text>
          </g>
        ))}
        {labels.map((label, i) => {
          const gx = PAD.left + groupW * i + (groupW - barW * series.length) / 2;
          return (
            <g key={label + i}>
              {series.map((s, si) => {
                const v = s.values[i] ?? 0;
                return (
                  <rect
                    key={s.name}
                    x={gx + barW * si}
                    y={y(v)}
                    width={barW - 1}
                    height={Math.max(0, PAD.top + innerH - y(v))}
                    fill={s.color}
                    rx="2"
                  >
                    <title>{`${label} · ${s.name} ${v}`}</title>
                  </rect>
                );
              })}
              {(i % labelEvery === 0 || i === n - 1) && (
                <text x={PAD.left + groupW * i + groupW / 2} y={H - 12} textAnchor="middle" fontSize="11" fill="#919191">
                  {formatLabel(label)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
        {series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1.5 text-[12px] text-[#5f5f5f]">
            <span className="inline-block size-3 rounded-[2px]" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
