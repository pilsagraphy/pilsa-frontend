'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ColorPicker from '@/components/shared/ColorPicker';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/lib/toast';
import { INKS } from './guestbookStyle';

// 그림판 — 방명록에 붙일 스티커를 직접 그린다 (PM 10/10 밤: 관리자 등록 스티커 대신 유저가 그려서 붙이기).
// 투명 바탕 캔버스에 펜/지우개, 굵기 4단, 되돌리기, 지우기. 완료하면 **캔버스 전체(정사각형)를 그대로** 투명 PNG data URL 로 돌려준다
// — 그림 부분만 잘라내면 붙였을 때 모양·크기가 그릴 때와 달라져서(직사각형이 되거나 확대돼 보여서) PM 이 두 번 지적 (10/11). 그린 화면 = 스티커.
// 도구는 세 줄 — 색(기본색 + 직접 고른 색은 열 개까지 칩으로 누적) / 굵기 / 지우개·되돌리기·전부 지우기 (PM 10/11).
// 좌표는 화면에 보이는 캔버스 크기와 실제 픽셀 크기의 비율로 바로 환산한다 — 손가락이 닿은 자리에 그려진다 (어긋나던 문제, PM 10/11).
const SIZE = 320;
const BRUSHES = [2, 4, 8, 14];
const PRESETS = [...INKS.map((i) => i.color), '#e2b007', '#d9534f', '#3b82f6', '#ffffff'];
const MAX_CUSTOM = 10;

export default function DrawingModal({ open, onClose, onDone, maxKb = 200 }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const history = useRef([]);
  const [color, setColor] = useState(PRESETS[0]);
  const [customs, setCustoms] = useState([]); // 컬러피커로 고른 색들 — '+' 를 누를 때마다 칩이 하나 늘고, 열 개가 넘으면 오래된 것부터 빠진다 (PM 10/11)
  const [pickerOpen, setPickerOpen] = useState(false);
  const [brush, setBrush] = useState(BRUSHES[1]);
  const [eraser, setEraser] = useState(false);
  const [dirty, setDirty] = useState(false);

  // 캔버스가 DOM 에 붙는 순간 정사각형 비트맵으로 잡는다 (선명하도록 기기 배율만큼 크게, 좌표는 pos() 가 실제 픽셀로 환산).
  // 예전엔 open 이 바뀔 때 useEffect 에서 잡았는데, Dialog 내용이 그 시점엔 아직 없어서 건너뛰었고 캔버스가 기본 300×150 그대로였다 —
  // 그려진 그대로 보이긴 했지만(pos 가 비율을 맞춰 줘서) 저장된 PNG 가 2:1 이라 붙이면 납작해졌다 (PM 10/11 "아직도 비율 깨진다", 서버 파일로 확인)
  const setCanvasRef = useCallback((canvas) => {
    canvasRef.current = canvas;
    if (!canvas) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * ratio;
    canvas.height = SIZE * ratio;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  // 열 때마다 도구 상태 초기화 (캔버스 자체는 닫히면 사라지고 다시 열면 새로 붙어 위 콜백이 비운다)
  useEffect(() => {
    if (!open) return;
    history.current = [];
    setDirty(false);
    setEraser(false);
    setPickerOpen(false);
  }, [open]);

  // 화면 좌표 → 캔버스 실제 픽셀 좌표. CSS 로 늘어나거나 줄어든 크기와 무관하게 닿은 자리에 그려진다
  const pos = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
      scale: canvas.width / SIZE,
    };
  };

  const snapshot = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    history.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (history.current.length > 30) history.current.shift();
  };

  const start = (event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    snapshot();
    drawing.current = true;
    const p = pos(event);
    last.current = p;
    const ctx = canvasRef.current.getContext('2d');
    ctx.globalCompositeOperation = eraser ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = (eraser ? brush * 2.5 : brush) * p.scale;
    // 점 하나도 찍히게
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.1, p.y + 0.1);
    ctx.stroke();
    setDirty(true);
  };

  const move = (event) => {
    if (!drawing.current) return;
    event.preventDefault();
    const p = pos(event);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const end = () => {
    drawing.current = false;
  };

  const undo = () => {
    const prev = history.current.pop();
    if (!prev) return;
    canvasRef.current.getContext('2d').putImageData(prev, 0, 0);
  };

  const clear = () => {
    snapshot();
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setDirty(false);
  };

  // 빈 캔버스인지만 확인하고(픽셀 훑기) 캔버스 전체를 돌려준다
  const done = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (data[(y * width + x) * 4 + 3] > 8) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) {
      toast.error('아직 아무것도 그리지 않았어요.');
      return;
    }
    // 캔버스를 자르지 않고 통째로 — 그린 부분만 잘라내면 작게 그린 그림이 확대돼 붙어 "비율이 깨진" 듯 보였다 (PM 10/11).
    // 이제 그린 화면이 곧 스티커다. 여백이 거슬리면 붙인 뒤 모서리로 줄이면 된다
    const dataUrl = canvas.toDataURL('image/png');
    if ((dataUrl.length * 3) / 4 > maxKb * 1024) {
      toast.error(`그림이 너무 커요 (${maxKb}KB 까지). 조금 단순하게 그려 주세요.`);
      return;
    }
    onDone({ dataUrl, aspect: 1 });
  };

  const toolBtn = (active) =>
    `flex h-[32px] min-w-[32px] items-center justify-center rounded-[6px] border px-2 text-[12px] transition ${
      active ? 'border-ink bg-inverse text-inverse-fg' : 'border-line bg-surface text-ink-2 hover:bg-surface-2'
    }`;
  const rowLabel = 'w-[40px] shrink-0 text-[12px] text-[#a3a09a]';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent hideCloseButton className="max-h-[92dvh] max-w-[380px] gap-3 overflow-y-auto rounded-[8px] border-line p-4">
        <DialogTitle className="text-[16px] font-semibold text-ink">스티커 그리기</DialogTitle>
        <DialogDescription className="text-[12px] text-ink-3">
          투명한 정사각형 종이에 그려요. 그린 모양 그대로(정사각형) 방명록에 붙이고, 붙인 뒤 끌어서 옮기거나 모서리로 크기, 손잡이로 회전을 바꿀 수 있어요.
        </DialogDescription>

        {/* 캔버스 — 투명이 보이도록 체크무늬 바탕 */}
        <div
          className="mx-auto w-full overflow-hidden rounded-[6px] border border-line"
          style={{
            maxWidth: SIZE,
            backgroundImage:
              'linear-gradient(45deg, #f1f1f1 25%, transparent 25%), linear-gradient(-45deg, #f1f1f1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f1f1 75%), linear-gradient(-45deg, transparent 75%, #f1f1f1 75%)',
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
          }}
        >
          <canvas
            ref={setCanvasRef}
            style={{ width: '100%', height: 'auto', aspectRatio: '1 / 1', touchAction: 'none', display: 'block', cursor: 'crosshair' }}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
            onPointerCancel={end}
          />
        </div>

        {/* 1줄: 색 — 기본색 + 직접 고른 색 칩(열 개까지 누적) + '+' */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={rowLabel}>색</span>
          {[...PRESETS, ...customs].map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              onClick={() => {
                setColor(c);
                setEraser(false);
              }}
              className={`h-[22px] w-[22px] rounded-full border-2 ${!eraser && color === c ? 'border-ink ring-1 ring-ink ring-offset-1' : 'border-line'}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <button
            type="button"
            title="직접 고르기"
            aria-label="색 직접 고르기"
            onClick={() => setPickerOpen((v) => !v)}
            className="flex h-[22px] w-[22px] items-center justify-center rounded-full border border-dashed border-ink-3 text-[14px] leading-none text-ink-3"
          >
            +
          </button>
        </div>
        {pickerOpen && (
          <ColorPicker
            value={color}
            swatches={[...PRESETS, ...customs]}
            onCancel={() => setPickerOpen(false)}
            onConfirm={(hex) => {
              const h = hex.toLowerCase();
              setCustoms((list) => (PRESETS.includes(h) || list.includes(h) ? list : [...list, h].slice(-MAX_CUSTOM)));
              setColor(h);
              setEraser(false);
              setPickerOpen(false);
            }}
          />
        )}

        {/* 2줄: 굵기 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={rowLabel}>굵기</span>
          {BRUSHES.map((b) => (
            <button key={b} type="button" aria-label={`굵기 ${b}`} onClick={() => setBrush(b)} className={toolBtn(brush === b)}>
              <span className="rounded-full bg-current" style={{ width: Math.min(b + 2, 16), height: Math.min(b + 2, 16) }} />
            </button>
          ))}
        </div>

        {/* 3줄: 지우개 · 되돌리기 · 전부 지우기 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={rowLabel}>지우개</span>
          <button type="button" onClick={() => setEraser((v) => !v)} className={toolBtn(eraser)}>
            {eraser ? '지우개 켜짐' : '지우개'}
          </button>
          <button type="button" onClick={undo} className={toolBtn(false)}>
            되돌리기
          </button>
          <button type="button" onClick={clear} className={toolBtn(false)}>
            전부 지우기
          </button>
        </div>

        <div className="flex justify-end gap-2 border-t border-line pt-3">
          <button type="button" onClick={onClose} className={toolBtn(false)}>
            취소
          </button>
          <button type="button" onClick={done} disabled={!dirty} className={`${toolBtn(true)} disabled:opacity-40`}>
            붙이기
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
