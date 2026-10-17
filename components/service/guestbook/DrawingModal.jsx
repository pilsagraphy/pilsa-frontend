'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ColorPicker from '@/components/shared/ColorPicker';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/lib/toast';
import { INKS } from './guestbookStyle';

// 그림판 — 방명록에 붙일 스티커를 직접 그린다 (PM 10/10 밤: 관리자 등록 스티커 대신 유저가 그려서 붙이기).
// 투명 바탕 캔버스에 펜/지우개, 굵기 4단, 되돌리기, 지우기. 완료하면 **캔버스 전체(정사각형)를 그대로** 투명 PNG data URL 로 돌려준다
// — 그림 부분만 잘라내면 붙였을 때 모양·크기가 그릴 때와 달라져서(직사각형이 되거나 확대돼 보여서) PM 이 두 번 지적 (10/11). 그린 화면 = 스티커.
// 도구는 네 줄 — 색(기본색 + 직접 고른 색은 열 개까지 칩으로 누적) / 굵기 / 도구(펜·색연필·스프레이·채우기·지우개) / 되돌리기·전부 지우기·확대 초기화 (PM 10/11).
// 좌표는 화면에 보이는 캔버스 크기와 실제 픽셀 크기의 비율로 바로 환산한다 — 손가락이 닿은 자리에 그려진다 (어긋나던 문제, PM 10/11).
const SIZE = 320;
const BRUSHES = [2, 4, 8, 14];
const PRESETS = [...INKS.map((i) => i.color), '#e2b007', '#d9534f', '#3b82f6', '#ffffff'];
const MAX_CUSTOM = 10;

// initialImage: 고른 스티커의 그림을 수정할 때 캔버스에 미리 깔 이미지(data URL 또는 서버 주소). 없으면 빈 캔버스
export default function DrawingModal({ open, onClose, onDone, maxKb = 200, initialImage = null }) {
  const initialImageRef = useRef(initialImage);
  initialImageRef.current = initialImage;
  // 한 손가락이 닿자마자 찍히는 점·채우기를 핀치가 시작되면 되돌리기 위해 — 아직 거의 안 움직였을 때만
  const tap = useRef({ armed: false, dist: 0 });
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const history = useRef([]);
  const [color, setColor] = useState(PRESETS[0]);
  const [customs, setCustoms] = useState([]); // 컬러피커로 고른 색들 — '+' 를 누를 때마다 칩이 하나 늘고, 열 개가 넘으면 오래된 것부터 빠진다 (PM 10/11)
  const [pickerOpen, setPickerOpen] = useState(false);
  const [brush, setBrush] = useState(BRUSHES[1]);
  // 도구: 펜(매끈한 선) · 색연필(거칠게 겹친 선) · 스프레이(점 뿌리기) · 채우기(닫힌 영역 색 채우기) · 지우개 (PM 10/11)
  const [tool, setTool] = useState('pen');
  const eraser = tool === 'eraser';
  const [dirty, setDirty] = useState(false);
  // 핀치 줌 — 두 손가락을 벌리면 캔버스 안에서만 1~4배 확대되고(화면은 그대로), 같이 움직이면 이동, 한 손가락으로 돌아오면 다시 그린다 (PM 10/11)
  const frameRef = useRef(null); // 체크무늬 상자(overflow hidden) — 확대된 캔버스를 이 안에서만 보여 준다
  const pointers = useRef(new Map()); // 눌려 있는 손가락들
  const pinch = useRef(null); // 두 손가락 시작 상태
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });
  // PC 확대 이동 — 확대한 뒤 손(이동) 도구로 끌거나, 스페이스바를 누른 채 끌거나, 휠 버튼으로 끌면 캔버스가 상하좌우로 움직인다 (PM 10/17 "가운데만 보인다").
  // 마우스(정밀 포인터)에서만 확대 시 손 도구로 자동 전환한다 — 폰은 기존 핀치 그대로
  const pan = useRef(null); // 끌기 시작 상태 { x, y, view0 }
  const [panning, setPanning] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const toolBeforeHand = useRef('pen');

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
    // 그림 수정이면 기존 스티커를 캔버스 전체에 깔고 시작한다 (스티커는 캔버스 통째라 비율이 같다)
    if (initialImageRef.current) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setDirty(true);
      };
      img.src = initialImageRef.current;
    }
  }, []);

  // 열 때마다 도구 상태 초기화 (캔버스 자체는 닫히면 사라지고 다시 열면 새로 붙어 위 콜백이 비운다)
  useEffect(() => {
    if (!open) return;
    history.current = [];
    pointers.current.clear();
    pinch.current = null;
    pan.current = null;
    setPanning(false);
    setView({ scale: 1, tx: 0, ty: 0 });
    setDirty(false);
    setTool((t) => (t === 'eraser' ? 'pen' : t));
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

  // 색연필 — 가늘고 반투명한 선을 살짝 어긋나게 두 번 긋는다 (종이에 긁히는 느낌)
  const pencilStroke = (ctx, from, to, scale) => {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = Math.max(1, brush * 0.55) * scale;
    const j = brush * 0.35 * scale;
    for (let k = 0; k < 2; k += 1) {
      ctx.beginPath();
      ctx.moveTo(from.x + (Math.random() - 0.5) * j, from.y + (Math.random() - 0.5) * j);
      ctx.lineTo(to.x + (Math.random() - 0.5) * j, to.y + (Math.random() - 0.5) * j);
      ctx.stroke();
    }
    ctx.restore();
  };
  // 스프레이 — 손가락 둘레에 점을 흩뿌린다 (굵기가 곧 반지름)
  const sprayAt = (ctx, p, scale) => {
    const radius = brush * 3 * scale;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = color;
    for (let k = 0; k < brush * 6; k += 1) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random()) * radius;
      ctx.fillRect(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, scale, scale);
    }
    ctx.restore();
  };
  // 채우기 — 누른 자리와 비슷한 색(투명 포함)으로 이어진 영역을 지금 색으로 채운다. 선의 안티에일리어싱 가장자리는 넉넉한 오차로 넘어간다
  const floodFill = (ctx, x0, y0) => {
    const { width, height } = ctx.canvas;
    const sx = Math.floor(x0);
    const sy = Math.floor(y0);
    if (sx < 0 || sy < 0 || sx >= width || sy >= height) return;
    const img = ctx.getImageData(0, 0, width, height);
    const d = img.data;
    const i0 = (sy * width + sx) * 4;
    const target = [d[i0], d[i0 + 1], d[i0 + 2], d[i0 + 3]];
    const fr = parseInt(color.slice(1, 3), 16);
    const fg = parseInt(color.slice(3, 5), 16);
    const fb = parseInt(color.slice(5, 7), 16);
    const transparentTarget = target[3] < 16;
    const match = (i) => {
      if (transparentTarget) return d[i + 3] < 48;
      return Math.abs(d[i + 3] - target[3]) < 48 && Math.abs(d[i] - target[0]) + Math.abs(d[i + 1] - target[1]) + Math.abs(d[i + 2] - target[2]) < 96;
    };
    const seen = new Uint8Array(width * height);
    const stack = [sy * width + sx];
    while (stack.length) {
      const p = stack.pop();
      if (seen[p]) continue;
      const i = p * 4;
      if (!match(i)) continue;
      seen[p] = 1;
      d[i] = fr;
      d[i + 1] = fg;
      d[i + 2] = fb;
      d[i + 3] = 255;
      const x = p % width;
      if (x > 0) stack.push(p - 1);
      if (x < width - 1) stack.push(p + 1);
      if (p >= width) stack.push(p - width);
      if (p + width < width * height) stack.push(p + width);
    }
    ctx.putImageData(img, 0, 0);
  };

  const start = (event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    snapshot();
    tap.current = { armed: true, dist: 0 };
    const p = pos(event);
    const ctx = canvasRef.current.getContext('2d');
    ctx.globalCompositeOperation = eraser ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    setDirty(true);
    if (tool === 'fill') {
      floodFill(ctx, p.x, p.y);
      return;
    }
    drawing.current = true;
    last.current = p;
    if (tool === 'spray') {
      sprayAt(ctx, p, p.scale);
      return;
    }
    if (tool === 'pencil') {
      pencilStroke(ctx, p, { x: p.x + 0.1, y: p.y + 0.1 }, p.scale);
      return;
    }
    ctx.lineWidth = (eraser ? brush * 2.5 : brush) * p.scale;
    // 점 하나도 찍히게
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.1, p.y + 0.1);
    ctx.stroke();
  };

  const move = (event) => {
    if (!drawing.current) return;
    event.preventDefault();
    const p = pos(event);
    tap.current.dist += Math.hypot(p.x - last.current.x, p.y - last.current.y);
    const ctx = canvasRef.current.getContext('2d');
    if (tool === 'spray') {
      sprayAt(ctx, p, p.scale);
    } else if (tool === 'pencil') {
      pencilStroke(ctx, last.current, p, p.scale);
    } else {
      ctx.beginPath();
      ctx.moveTo(last.current.x, last.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    last.current = p;
  };

  const end = () => {
    drawing.current = false;
  };

  // 확대한 캔버스가 상자 밖으로 빠져 빈 곳이 보이지 않게 이동량을 가둔다
  const clampView = (v) => {
    const frame = frameRef.current?.getBoundingClientRect();
    if (!frame) return v;
    return {
      scale: v.scale,
      tx: Math.min(0, Math.max(frame.width - frame.width * v.scale, v.tx)),
      ty: Math.min(0, Math.max(frame.height - frame.height * v.scale, v.ty)),
    };
  };
  // 슬라이더·± 버튼 확대 — 보이는 영역의 가운데를 기준으로
  const zoomTo = (next) => {
    const scale = Math.min(4, Math.max(1, Math.round(next * 100) / 100));
    const frame = frameRef.current?.getBoundingClientRect();
    if (!frame) return;
    // 마우스로 처음 확대하면 바로 끌어 볼 수 있게 손 도구로 (다시 그리려면 도구 줄에서 펜 등을 고른다)
    if (view.scale <= 1 && scale > 1 && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) chooseHand();
    const cx = frame.width / 2;
    const cy = frame.height / 2;
    const px = (cx - view.tx) / view.scale;
    const py = (cy - view.ty) / view.scale;
    setView(clampView({ scale, tx: cx - px * scale, ty: cy - py * scale }));
  };
  // 확대를 풀면 손 도구는 쓸 데가 없으니 원래 도구로
  useEffect(() => {
    if (view.scale <= 1 && tool === 'hand') setTool(toolBeforeHand.current);
  }, [view.scale, tool]);
  const chooseHand = () => {
    if (tool !== 'hand') toolBeforeHand.current = tool;
    setTool('hand');
  };
  // 스페이스바를 누르는 동안 잠깐 손 도구 (그림판 프로그램들처럼). 글자 입력 칸에서는 건드리지 않는다
  useEffect(() => {
    if (!open) return undefined;
    const typing = (e) => e.target?.closest?.('input, textarea, [contenteditable="true"]');
    const down = (e) => {
      if (e.code !== 'Space' || typing(e)) return;
      e.preventDefault();
      setSpaceHeld(true);
    };
    const up = (e) => {
      if (e.code === 'Space') setSpaceHeld(false);
    };
    const blur = () => setSpaceHeld(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [open]);
  const handActive = view.scale > 1 && (tool === 'hand' || spaceHeld);
  const onDown = (event) => {
    // 확대 상태의 마우스 끌기 이동 — 손 도구·스페이스바·휠 버튼. 그리기보다 먼저 가로챈다
    if (view.scale > 1 && event.pointerType !== 'touch' && pointers.current.size === 0 && (handActive || event.button === 1)) {
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      pan.current = { id: event.pointerId, x: event.clientX, y: event.clientY, view0: view };
      setPanning(true);
      return;
    }
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      // 두 번째 손가락 — 그리기를 멈추고 핀치 시작. 첫 손가락이 찍어 둔 점(이나 채우기)이 거의 안 움직였으면 되돌린다 (PM 10/11 "확대했는데 점이 찍힌다")
      if (tap.current.armed && tap.current.dist < 12 * (canvasRef.current.width / SIZE)) undo();
      tap.current.armed = false;
      drawing.current = false;
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      const [a, b] = [...pointers.current.values()];
      const frame = frameRef.current.getBoundingClientRect();
      pinch.current = {
        d0: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        mid0: { x: (a.x + b.x) / 2 - frame.left, y: (a.y + b.y) / 2 - frame.top },
        view0: view,
      };
      return;
    }
    if (pointers.current.size === 1 && tool !== 'hand') start(event); // 폰에서 손 도구를 골랐으면 한 손가락은 그리지 않는다(핀치는 그대로)
  };
  const onMove = (event) => {
    if (pan.current?.id === event.pointerId) {
      event.preventDefault();
      const { x, y, view0 } = pan.current;
      setView(clampView({ scale: view0.scale, tx: view0.tx + event.clientX - x, ty: view0.ty + event.clientY - y }));
      return;
    }
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinch.current && pointers.current.size >= 2) {
      event.preventDefault();
      const [a, b] = [...pointers.current.values()];
      const frame = frameRef.current.getBoundingClientRect();
      const { d0, mid0, view0 } = pinch.current;
      const scale = Math.min(4, Math.max(1, (view0.scale * Math.hypot(a.x - b.x, a.y - b.y)) / d0));
      const mid = { x: (a.x + b.x) / 2 - frame.left, y: (a.y + b.y) / 2 - frame.top };
      // 처음 두 손가락 가운데에 있던 그림 지점이 계속 손가락 가운데에 오도록
      const px = (mid0.x - view0.tx) / view0.scale;
      const py = (mid0.y - view0.ty) / view0.scale;
      setView(clampView({ scale, tx: mid.x - px * scale, ty: mid.y - py * scale }));
      return;
    }
    move(event);
  };
  const onUp = (event) => {
    if (pan.current?.id === event.pointerId) {
      pan.current = null;
      setPanning(false);
      return;
    }
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    end();
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
    const limit = maxKb * 1024;
    const bytesOf = (url) => (url.length * 3) / 4;
    let dataUrl = canvas.toDataURL('image/png');
    // 색을 꽉 채우면 기기 배율(2배) 비트맵은 한도를 넘을 수 있다 — 그러면 320px(1배)로 줄여 다시 담는다. 붙였을 때 최대 240px 이라 충분하다 (PM 10/11)
    if (bytesOf(dataUrl) > limit && canvas.width > SIZE) {
      const small = document.createElement('canvas');
      small.width = SIZE;
      small.height = SIZE;
      small.getContext('2d').drawImage(canvas, 0, 0, SIZE, SIZE);
      dataUrl = small.toDataURL('image/png');
    }
    if (bytesOf(dataUrl) > limit) {
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
      <DialogContent hideCloseButton className="max-h-[92dvh] w-[calc(100%-24px)] max-w-[380px] gap-3 [touch-action:pan-x_pan-y] overflow-x-hidden overflow-y-auto rounded-[8px] border-line p-4 sm:w-full">
        <DialogTitle className="text-[16px] font-semibold text-ink">스티커 그리기</DialogTitle>
        <DialogDescription className="text-[12px] text-ink-3">
          투명한 정사각형 종이에 그려요. 두 손가락을 벌리면 종이 안에서 확대돼 세밀하게 그릴 수 있어요. 그린 모양 그대로 방명록에 붙이고, 붙인 뒤 끌어서 옮기거나 모서리로 크기,
          손잡이로 회전을 바꿀 수 있어요.
        </DialogDescription>

        {/* 캔버스 — 투명이 보이도록 체크무늬 바탕.
            바탕색을 흰색으로 고정한다 — 비워 두면 다크모드에서 칸 사이가 모달의 검정 바탕이라 흑백 체크판이 되어 눈이 아팠다
            (테스터 제보 10/11 "체크판 대비가 강해서 연하게"). 종이는 종이 — 라이트와 같은 연한 체크무늬 */}
        <div
          ref={frameRef}
          className="mx-auto w-full overflow-hidden rounded-[6px] border border-line"
          style={{
            touchAction: 'none',
            maxWidth: SIZE,
            backgroundColor: '#ffffff',
            backgroundImage:
              'linear-gradient(45deg, #f1f1f1 25%, transparent 25%), linear-gradient(-45deg, #f1f1f1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f1f1 75%), linear-gradient(-45deg, transparent 75%, #f1f1f1 75%)',
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
          }}
        >
          <canvas
            ref={setCanvasRef}
            style={{
              width: '100%',
              height: 'auto',
              aspectRatio: '1 / 1',
              touchAction: 'none',
              display: 'block',
              cursor: handActive || panning ? (panning ? 'grabbing' : 'grab') : 'crosshair',
              transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`,
              transformOrigin: '0 0',
            }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onMouseDown={(e) => e.button === 1 && e.preventDefault() /* 휠 버튼 자동 스크롤 막기 */}
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
                setTool((t) => (t === 'eraser' ? 'pen' : t));
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
              setTool((t) => (t === 'eraser' ? 'pen' : t));
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

        {/* 3줄: 도구 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={rowLabel}>도구</span>
          {[
            { key: 'pen', label: '펜' },
            { key: 'pencil', label: '색연필' },
            { key: 'spray', label: '스프레이' },
            { key: 'fill', label: '채우기' },
            { key: 'eraser', label: '지우개' },
          ].map((t) => (
            <button key={t.key} type="button" onClick={() => setTool(t.key)} className={toolBtn(tool === t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* 4줄: 되돌리기 · 전부 지우기 · 확대 초기화 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={rowLabel}>편집</span>
          <button type="button" onClick={undo} className={toolBtn(false)}>
            되돌리기
          </button>
          <button type="button" onClick={clear} className={toolBtn(false)}>
            전부 지우기
          </button>
        </div>

        {/* 5줄: 확대 — 엑셀처럼 − 슬라이더 + 와 배율. 캔버스 가운데를 기준으로 1~4배 (PM 10/11) */}
        <div className="flex items-center gap-2">
          <span className={rowLabel}>확대</span>
          <button type="button" aria-label="축소" onClick={() => zoomTo(view.scale - 0.25)} className={toolBtn(false)}>
            −
          </button>
          <input
            type="range"
            min={100}
            max={400}
            step={5}
            value={Math.round(view.scale * 100)}
            onChange={(e) => zoomTo(Number(e.target.value) / 100)}
            aria-label="확대 배율"
            className="min-w-0 flex-1 accent-ink"
          />
          <button type="button" aria-label="확대" onClick={() => zoomTo(view.scale + 0.25)} className={toolBtn(false)}>
            +
          </button>
          <span className="w-[44px] shrink-0 text-right text-[12px] tabular-nums text-ink-2">{Math.round(view.scale * 100)}%</span>
          {view.scale > 1 && (
            <button
              type="button"
              title="끌어서 이동 (스페이스바를 누른 채 끌어도 돼요)"
              aria-pressed={tool === 'hand'}
              onClick={() => (tool === 'hand' ? setTool(toolBeforeHand.current) : chooseHand())}
              className={toolBtn(tool === 'hand')}
            >
              이동
            </button>
          )}
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
