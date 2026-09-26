'use client';

// 외부 차트 라이브러리 없이 그리는 꺾은선 그래프 (SVG). 숫자가 몇십 개 수준인 운영 화면용이라 이걸로 충분하다.
//
// props
//   labels  x축 라벨 배열 (예: 날짜)
//   series  [{ name, color, values: number[] }]  values 길이 = labels 길이
//   height  픽셀 (기본 220). 폭은 부모를 꽉 채운다 (viewBox + width 100%)
//   formatLabel  x축에 찍을 라벨 가공 (기본: 그대로). 라벨은 겹치지 않게 최대 8개만 찍는다
export default function SimpleLineChart({ labels = [], series = [], height = 220, formatLabel = (s) => s }) {
  const W = 720;
  const H = height;
  const PAD = { top: 16, right: 16, bottom: 34, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const n = labels.length;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  // y축 눈금: 1·2·5 단위로 올려 깔끔한 최댓값
  const step = niceStep(max / 4);
  const yMax = Math.ceil(max / step) * step;
  const x = (i) => (n <= 1 ? PAD.left + innerW / 2 : PAD.left + (innerW * i) / (n - 1));
  const y = (v) => PAD.top + innerH - (innerH * v) / yMax;
  const ticks = [];
  for (let v = 0; v <= yMax; v += step) ticks.push(v);
  const labelEvery = Math.max(1, Math.ceil(n / 8));

  if (!n) {
    return <p className="py-6 text-center text-[14px] text-[#919191]">표시할 데이터가 없습니다.</p>;
  }

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="꺾은선 그래프">
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
              <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="#fff" stroke={s.color} strokeWidth="2">
                <title>{`${labels[i]} · ${s.name} ${v}`}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
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

// 4~5 칸 정도로 나뉘는 보기 좋은 눈금 간격 (1, 2, 5 × 10^k)
export function niceStep(rough) {
  if (rough <= 1) return 1;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const unit = rough / pow;
  const m = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10;
  return m * pow;
}
