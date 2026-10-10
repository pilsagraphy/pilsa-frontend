'use client';

import { useEffect, useRef, useState } from 'react';

// 포토샵 식 컬러피커 (PM 2026-10-11 참고 이미지): 왼쪽 큰 네모에서 채도(가로)·명도(세로), 옆 세로 띠에서 색상(H),
// 오른쪽에 새 색/현재 색 미리보기와 HEX 입력. 방명록 잉크 '+' 와 스티커 그림판이 같이 쓴다.
// value/onChange 는 '#rrggbb'. 확인을 누를 때만 onConfirm 으로 넘기고, 취소면 원래 색으로 돌아간다.

const clamp01 = (v) => Math.max(0, Math.min(1, v));

export function hexToHsv(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? '');
  if (!m) return { h: 200, s: 0.75, v: 0.8 };
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

export function hsvToHex({ h, s, v }) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (q) =>
    Math.round((q + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

export default function ColorPicker({ value = '#1f1f1f', onConfirm, onCancel, swatches = [] }) {
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const [hexInput, setHexInput] = useState(value.toLowerCase());
  const squareRef = useRef(null);
  const hueRef = useRef(null);
  const dragging = useRef(null); // 'sv' | 'hue'

  const hex = hsvToHex(hsv);
  useEffect(() => setHexInput(hex), [hex]);

  // 포인터 위치 → 채도·명도 (네모) / 색상 (띠). 누른 채 끌어도 따라온다
  const pickSv = (event) => {
    const rect = squareRef.current?.getBoundingClientRect();
    if (!rect) return;
    const s = clamp01((event.clientX - rect.left) / rect.width);
    const v = 1 - clamp01((event.clientY - rect.top) / rect.height);
    setHsv((p) => ({ ...p, s, v }));
  };
  const pickHue = (event) => {
    const rect = hueRef.current?.getBoundingClientRect();
    if (!rect) return;
    const h = clamp01((event.clientY - rect.top) / rect.height) * 360;
    setHsv((p) => ({ ...p, h: Math.min(359.99, h) }));
  };
  const down = (kind) => (event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragging.current = kind;
    (kind === 'sv' ? pickSv : pickHue)(event);
  };
  const move = (kind) => (event) => {
    if (dragging.current !== kind) return;
    (kind === 'sv' ? pickSv : pickHue)(event);
  };
  const up = () => {
    dragging.current = null;
  };

  const applyHex = (raw) => {
    const v = raw.trim().replace(/^#?/, '#');
    if (/^#[0-9a-f]{6}$/i.test(v)) setHsv(hexToHsv(v));
  };

  const hueColor = hsvToHex({ h: hsv.h, s: 1, v: 1 });
  return (
    <div className="flex w-full max-w-[360px] flex-col gap-3 rounded-[8px] border border-[#dedede] bg-white p-3 shadow-lg" onClick={(e) => e.stopPropagation()}>
      <div className="flex gap-3">
        {/* 채도·명도 네모 */}
        <div
          ref={squareRef}
          role="slider"
          aria-label="채도와 명도"
          className="relative h-[160px] min-w-0 flex-1 cursor-crosshair touch-none rounded-[4px] border border-black/10"
          style={{
            backgroundColor: hueColor,
            backgroundImage: 'linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0))',
          }}
          onPointerDown={down('sv')}
          onPointerMove={move('sv')}
          onPointerUp={up}
          onPointerCancel={up}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute h-[12px] w-[12px] rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
            style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>
        {/* 색상 띠 */}
        <div
          ref={hueRef}
          role="slider"
          aria-label="색상"
          className="relative h-[160px] w-[16px] shrink-0 cursor-pointer touch-none rounded-[4px] border border-black/10"
          style={{ background: 'linear-gradient(to bottom, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }}
          onPointerDown={down('hue')}
          onPointerMove={move('hue')}
          onPointerUp={up}
          onPointerCancel={up}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -left-[3px] -right-[3px] h-[4px] rounded-[1px] border border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
            style={{ top: `${(hsv.h / 360) * 100}%`, transform: 'translateY(-50%)' }}
          />
        </div>
        {/* 새 색 / 현재 색 + HEX */}
        <div className="flex w-[84px] shrink-0 flex-col items-center gap-1 text-[11px] text-[#6b6b6b]">
          <span>새 색</span>
          <div className="w-full overflow-hidden rounded-[4px] border border-black/10">
            <div className="h-[28px]" style={{ backgroundColor: hex }} />
            <div className="h-[28px]" style={{ backgroundColor: value }} />
          </div>
          <span>현재</span>
          <label className="mt-1 flex w-full items-center gap-1">
            <span>#</span>
            <input
              type="text"
              value={hexInput.replace(/^#/, '')}
              maxLength={6}
              onChange={(e) => setHexInput(`#${e.target.value}`)}
              onBlur={(e) => applyHex(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyHex(e.currentTarget.value);
              }}
              className="h-[26px] w-full min-w-0 rounded-[4px] border border-[#dedede] px-1 font-mono text-[12px] text-[#212121] outline-none focus:border-[#919191]"
            />
          </label>
        </div>
      </div>

      {swatches.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {swatches.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              onClick={() => setHsv(hexToHsv(c))}
              className="h-[18px] w-[18px] rounded-full border border-black/10"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-[30px] rounded-[6px] border border-[#dedede] bg-white px-3 text-[12px] text-[#454545]">
          취소
        </button>
        <button type="button" onClick={() => onConfirm(hex)} className="h-[30px] rounded-[6px] bg-[#212121] px-3 text-[12px] text-white">
          확인
        </button>
      </div>
    </div>
  );
}
