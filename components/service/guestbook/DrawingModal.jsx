'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/lib/toast';
import { INKS } from './guestbookStyle';

// 그림판 — 방명록에 붙일 스티커를 직접 그린다 (PM 10/10 밤: 관리자 등록 스티커 대신 유저가 그려서 붙이기).
// 투명 바탕 캔버스에 펜/지우개, 굵기 3단, 되돌리기, 지우기. 완료하면 그린 부분만 잘라낸(여백 제거) 투명 PNG data URL 을 돌려준다.
const SIZE = 320;
const BRUSHES = [3, 6, 12];
const COLORS = [...INKS.map((i) => i.color), '#e2b007', '#d9534f', '#3b82f6'];

export default function DrawingModal({ open, onClose, onDone, maxKb = 200 }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const history = useRef([]);
  const [color, setColor] = useState(COLORS[0]);
  const [brush, setBrush] = useState(BRUSHES[1]);
  const [eraser, setEraser] = useState(false);
  const [dirty, setDirty] = useState(false);

  // 열 때마다 깨끗한 캔버스. 선명하게 보이도록 기기 배율만큼 크게 그린다
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * ratio;
    canvas.height = SIZE * ratio;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    history.current = [];
    setDirty(false);
    setEraser(false);
  }, [open]);

  const pos = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * SIZE, y: ((event.clientY - rect.top) / rect.height) * SIZE };
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
    last.current = pos(event);
    const ctx = canvasRef.current.getContext('2d');
    ctx.globalCompositeOperation = eraser ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = eraser ? brush * 2.5 : brush;
    // 점 하나도 찍히게
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(last.current.x + 0.1, last.current.y + 0.1);
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
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.putImageData(prev, 0, 0);
    ctx.restore();
  };

  const clear = () => {
    snapshot();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    setDirty(false);
  };

  // 그린 부분만 남기고 여백을 잘라낸다 — 스티커가 카드에서 차지하는 자리가 그림 크기와 같아진다
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
    const pad = 6;
    const sx = Math.max(0, minX - pad);
    const sy = Math.max(0, minY - pad);
    const sw = Math.min(width, maxX + pad) - sx;
    const sh = Math.min(height, maxY + pad) - sy;
    const out = document.createElement('canvas');
    out.width = sw;
    out.height = sh;
    out.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    const dataUrl = out.toDataURL('image/png');
    if ((dataUrl.length * 3) / 4 > maxKb * 1024) {
      toast.error(`그림이 너무 커요 (${maxKb}KB 까지). 조금 단순하게 그려 주세요.`);
      return;
    }
    onDone({ dataUrl, aspect: sh / sw });
  };

  const toolBtn = (active) =>
    `flex h-[32px] min-w-[32px] items-center justify-center rounded-[6px] border px-2 text-[12px] transition ${
      active ? 'border-[#212121] bg-[#212121] text-white' : 'border-[#dedede] bg-white text-[#454545] hover:bg-[#f5f5f5]'
    }`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent hideCloseButton className="max-w-[380px] gap-3 rounded-[8px] border-[#dedede] p-4">
        <DialogTitle className="text-[16px] font-semibold text-[#212121]">스티커 그리기</DialogTitle>
        <DialogDescription className="text-[12px] text-[#919191]">
          투명한 종이에 그려요. 그린 부분만 잘라서 방명록에 붙이고, 자리는 붙인 뒤 끌어서 옮길 수 있어요.
        </DialogDescription>

        {/* 캔버스 — 투명이 보이도록 체크무늬 바탕 */}
        <div
          className="mx-auto overflow-hidden rounded-[6px] border border-[#dedede]"
          style={{
            width: SIZE,
            maxWidth: '100%',
            backgroundImage:
              'linear-gradient(45deg, #f1f1f1 25%, transparent 25%), linear-gradient(-45deg, #f1f1f1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f1f1 75%), linear-gradient(-45deg, transparent 75%, #f1f1f1 75%)',
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{ width: '100%', aspectRatio: '1 / 1', touchAction: 'none', display: 'block', cursor: 'crosshair' }}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
            onPointerCancel={end}
          />
        </div>

        {/* 색 · 굵기 · 지우개 */}
        <div className="flex flex-wrap items-center gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              onClick={() => {
                setColor(c);
                setEraser(false);
              }}
              className={`h-[22px] w-[22px] rounded-full border-2 ${!eraser && color === c ? 'border-[#212121] ring-1 ring-[#212121] ring-offset-1' : 'border-white'}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <span className="mx-1 h-[20px] w-px bg-[#dedede]" />
          {BRUSHES.map((b) => (
            <button key={b} type="button" aria-label={`굵기 ${b}`} onClick={() => setBrush(b)} className={toolBtn(brush === b)}>
              <span className="rounded-full bg-current" style={{ width: b + 2, height: b + 2 }} />
            </button>
          ))}
          <button type="button" onClick={() => setEraser((v) => !v)} className={toolBtn(eraser)}>
            지우개
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="flex gap-2">
            <button type="button" onClick={undo} className={toolBtn(false)}>
              되돌리기
            </button>
            <button type="button" onClick={clear} className={toolBtn(false)}>
              전부 지우기
            </button>
          </span>
          <span className="flex gap-2">
            <button type="button" onClick={onClose} className={toolBtn(false)}>
              취소
            </button>
            <button type="button" onClick={done} disabled={!dirty} className={`${toolBtn(true)} disabled:opacity-40`}>
              붙이기
            </button>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
