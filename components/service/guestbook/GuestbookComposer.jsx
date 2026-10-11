'use client';

import { useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '@/apis/auth';
import { editGuestbookNote, writeGuestbookNote } from '@/apis/guestbook';
import useAuthStore from '@/stores/useAuthStore';
import { apiUrl } from '@/lib/apiBase';
import { toast } from '@/lib/toast';
import ColorPicker from '@/components/shared/ColorPicker';
import DrawingModal from './DrawingModal';
import PaperMarks, { newMarksSeed } from './PaperMarks';
import { ALIGNS, DESIGN_WIDTH, FONTS, INKS, PAPERS, TAPES, fontOf, inkColor, paperOf, paperStyle, tapeColor, textStyle } from './guestbookStyle';

// 이름은 기억하지 않는다 — 매번 새로 적는다 (PM 10/11). 예전엔 localStorage 에 남겨 관리자가 남의 글을 고친 이름이 기본값으로 남는 일이 있었다
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const isHex = (v) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
// 글 칸 높이를 내용에 맞춘다 — 한 줄로 시작해 글 양만큼만 늘어난다
const fitTextarea = (el) => {
  if (!el) return;
  el.style.height = '0px';
  el.style.height = `${el.scrollHeight}px`;
};

// 종이 안쪽 여백(px) — 스티커는 이 안에만 붙는다 (카드의 padding 과 같은 값)
const PAD = { left: 18, right: 18, top: 22, bottom: 14 };
const MIN_W = 8;
const MAX_W = 80;
// 고른 스티커의 모서리 손잡이 네 개 — 끌면 가운데를 기준으로 커지고 작아진다
const CORNERS = [
  { key: 'tl', className: '-left-[7px] -top-[7px]', cursor: 'nwse-resize' },
  { key: 'tr', className: '-right-[7px] -top-[7px]', cursor: 'nesw-resize' },
  { key: 'bl', className: '-bottom-[7px] -left-[7px]', cursor: 'nesw-resize' },
  { key: 'br', className: '-bottom-[7px] -right-[7px]', cursor: 'nwse-resize' },
];
const SNAP_ANGLES = [-180, -90, 0, 90, 180];

// 방명록 쓰기 칸 — 편지지 한 장을 그대로 쓰는 느낌. 쓰는 종이가 곧 미리보기다.
// 종이는 카드와 같은 폭(DESIGN_WIDTH)으로 두어 줄바꿈·스티커 자리가 카드에서 똑같이 보인다 (어긋나던 원인, PM 10/10 밤).
// 글씨체·잉크(기본 6색 + 컬러피커)·종이·테이프 색·정렬을 고르고, 그림판에서 그린 스티커를 붙여 끌어서 자리를 잡는다 —
// 잡은 지점을 유지하며 끌기, 안쪽 여백 밖으로 못 나감, 고르는 동안 바깥은 어둡게. 크기·회전은 PPT 처럼 도형의 모서리·위 손잡이를 끌어
// 바로 바꾸고, 투명도·순서·떼기만 아래 작은 창에서 (PM 10/11 "슬라이더는 불편, ppt 처럼").
// mode='edit' 면 initial(기존 글)을 채워 놓고 PUT 으로 고친다 (로그인해서 남긴 본인 글만).
export default function GuestbookComposer({ mode = 'create', initial = null, maxLength = 300, maxDrawings = 3, drawingMaxKb = 200, onDone, onCancel }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [name, setName] = useState(initial?.displayName ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [font, setFont] = useState(initial?.font ?? FONTS[0].key);
  const [ink, setInk] = useState(initial?.ink ?? INKS[0].key);
  const [paper, setPaper] = useState(initial?.paper ?? PAPERS[0].key);
  const [align, setAlign] = useState(initial?.align ?? 'left');
  // 테이프 색 — 기본 무채색, 파스텔 몇 가지 + 직접 고르기 (PM 10/11)
  const [tape, setTape] = useState(() => tapeColor(initial?.tape));
  const [tapePickerOpen, setTapePickerOpen] = useState(false);
  // 얼룩 배치 씨앗 — 종이 버튼을 누를 때마다 새로 뽑고(마음에 드는 배치를 고른다), 글과 함께 저장돼 카드에서도 그대로 (PM 10/11)
  const [marksSeed, setMarksSeed] = useState(() => initial?.marksSeed ?? initial?.noteId ?? newMarksSeed());
  const [inkPickerOpen, setInkPickerOpen] = useState(false);
  // 스티커: { id(화면용), drawingId?, dataUrl?, imageUrl?, posX, posY, widthPct, rotation, opacity, aspect(세로÷가로) }. 배열 순서 = 겹침 순서
  const [drawings, setDrawings] = useState(() =>
    [...(initial?.drawings ?? [])]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((d) => ({
        id: `d${d.drawingId}`,
        drawingId: d.drawingId,
        imageUrl: d.imageUrl,
        posX: d.posX,
        posY: d.posY,
        widthPct: d.widthPct,
        rotation: d.rotation ?? 0,
        opacity: d.opacity ?? 1,
        aspect: 1,
      }))
  );
  const [selected, setSelected] = useState(null);
  const [drawOpen, setDrawOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const paperRef = useRef(null);
  const textareaRef = useRef(null);
  const drag = useRef(null);
  const gesture = useRef(null); // 모서리(크기)·손잡이(회전) 끌기 상태

  // 글 칸 높이를 내용에 맞춘다 (글씨체가 바뀌어도). 늘어난 종이 높이에 맞춰 스티커 자리도 다시 가둔다
  useEffect(() => {
    fitTextarea(textareaRef.current);
    setDrawings((list) => list.map((d) => ({ ...d, ...clampPos(d, d.posX, d.posY) })));
    // clampPos 는 ref 로 종이 크기를 읽는 순수 함수 — 의존성에 넣으면 렌더마다 돈다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, font, paper]);
  // 폭이 바뀌거나(폰 회전) 글꼴이 뒤늦게 내려오면 줄 수가 달라지므로 다시 잰다 (검토 지적 10/11)
  useEffect(() => {
    const measure = () => fitTextarea(textareaRef.current);
    const fonts = document.fonts;
    window.addEventListener('resize', measure);
    fonts?.ready?.then(measure);
    fonts?.addEventListener?.('loadingdone', measure);
    return () => {
      window.removeEventListener('resize', measure);
      fonts?.removeEventListener?.('loadingdone', measure);
    };
  }, []);

  const f = fontOf(font);
  const p = paperOf(paper);
  const inkHex = inkColor(ink);

  // 종이 안쪽 여백 안에 스티커 전체가 들어가도록 중심 좌표를 가둔다 (스티커가 영역보다 크면 가운데)
  const clampPos = (d, posX, posY) => {
    const rect = paperRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return { posX, posY };
    const halfW = d.widthPct / 2;
    const heightPct = (((d.widthPct / 100) * rect.width * (d.aspect || 1)) / rect.height) * 100;
    const halfH = heightPct / 2;
    const minX = (PAD.left / rect.width) * 100 + halfW;
    const maxX = 100 - (PAD.right / rect.width) * 100 - halfW;
    const minY = (PAD.top / rect.height) * 100 + halfH;
    const maxY = 100 - (PAD.bottom / rect.height) * 100 - halfH;
    return {
      posX: minX > maxX ? 50 : clamp(posX, minX, maxX),
      posY: minY > maxY ? 50 : clamp(posY, minY, maxY),
    };
  };

  const patch = (id, part) =>
    setDrawings((list) =>
      list.map((d) => {
        if (d.id !== id) return d;
        const next = { ...d, ...part };
        return { ...next, ...clampPos(next, next.posX, next.posY) };
      })
    );

  const addDrawing = ({ dataUrl, aspect }) => {
    if (drawings.length >= maxDrawings) {
      toast.error(`스티커는 ${maxDrawings}개까지 붙일 수 있어요.`);
      return;
    }
    const id = `n${Date.now()}`;
    const n = drawings.length;
    const fresh = { id, dataUrl, posX: 78 - n * 14, posY: 26 + n * 12, widthPct: 28, rotation: 0, opacity: 1, aspect: aspect || 1 };
    setDrawings([...drawings, { ...fresh, ...clampPos(fresh, fresh.posX, fresh.posY) }]);
    setSelected(id);
    setDrawOpen(false);
  };

  const removeDrawing = (id) => {
    setDrawings((list) => list.filter((d) => d.id !== id));
    if (selected === id) setSelected(null);
  };

  // 겹침 순서 — 배열에서 이웃과 자리를 바꾼다 (뒤에 올수록 위에 보인다)
  const reorder = (id, dir) => {
    setDrawings((list) => {
      const i = list.findIndex((d) => d.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  // 끌기 — 처음 누른 지점과 스티커 중심의 차이를 유지한다 (중심이 손가락으로 튀어 오지 않게)
  const onStickerDown = (event, d) => {
    event.preventDefault();
    event.stopPropagation();
    setSelected(d.id);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { id: d.id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, origX: d.posX, origY: d.posY };
  };
  const onStickerMove = (event) => {
    const g = drag.current;
    if (!g || g.pointerId !== event.pointerId) return;
    const rect = paperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = ((event.clientX - g.startX) / rect.width) * 100;
    const dy = ((event.clientY - g.startY) / rect.height) * 100;
    patch(g.id, { posX: g.origX + dx, posY: g.origY + dy });
  };
  const onStickerUp = (event) => {
    if (drag.current && drag.current.pointerId === event.pointerId) drag.current = null;
  };

  // 모서리·회전 손잡이 — 스티커 중심(화면 좌표)을 기준으로 거리는 크기, 각도는 회전이 된다 (PPT 식, PM 10/11)
  const onHandleDown = (event, d, type) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const box = event.currentTarget.closest('[data-sticker]')?.getBoundingClientRect();
    if (!box) return;
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    gesture.current = { type, id: d.id, pointerId: event.pointerId, cx, cy, startDist: Math.hypot(dx, dy) || 1, startWidth: d.widthPct, startAngle: Math.atan2(dy, dx), startRot: d.rotation };
  };
  const onHandleMove = (event) => {
    const g = gesture.current;
    if (!g || g.pointerId !== event.pointerId) return;
    const dx = event.clientX - g.cx;
    const dy = event.clientY - g.cy;
    if (g.type === 'resize') {
      const w = clamp((g.startWidth * Math.hypot(dx, dy)) / g.startDist, MIN_W, MAX_W);
      patch(g.id, { widthPct: Math.round(w * 10) / 10 });
      return;
    }
    let rot = g.startRot + ((Math.atan2(dy, dx) - g.startAngle) * 180) / Math.PI;
    rot = ((((rot + 180) % 360) + 360) % 360) - 180;
    // 0°·90° 근처는 딱 맞춰 준다 — 손으로는 똑바로 세우기 어렵다
    const snap = SNAP_ANGLES.find((a) => Math.abs(rot - a) < 4);
    patch(g.id, { rotation: Math.round(snap ?? rot) });
  };
  const onHandleUp = (event) => {
    if (gesture.current && gesture.current.pointerId === event.pointerId) gesture.current = null;
  };

  const submit = async () => {
    if (!name.trim()) {
      toast.error('이름이나 닉네임을 적어 주세요.');
      return;
    }
    if (!content.trim()) {
      toast.error('내용을 적어 주세요.');
      return;
    }
    setSending(true);
    try {
      const body = {
        displayName: name.trim(),
        content, // 끝의 빈 줄도 그대로 — 스티커 자리를 만들려고 넣은 줄이 저장 뒤 사라지면 카드가 작아진다 (검토 지적 10/11)
        font,
        ink,
        paper,
        align,
        marksSeed,
        tape,
        drawings: drawings.map((d) => ({
          drawingId: d.drawingId ?? null,
          dataUrl: d.dataUrl ?? null,
          posX: Math.round(d.posX * 100) / 100,
          posY: Math.round(d.posY * 100) / 100,
          widthPct: Math.round(d.widthPct * 100) / 100,
          rotation: Math.round(d.rotation),
          opacity: Math.round(d.opacity * 100) / 100,
        })),
      };
      const saved = mode === 'edit' ? await editGuestbookNote(initial.noteId, body) : await writeGuestbookNote(body);
      // 새로 쓴 뒤에는 이름까지 비운다 — 기억하지 않는다 (PM 10/11)
      if (mode === 'create') {
        setName('');
        setContent('');
        setDrawings([]);
        setSelected(null);
        setMarksSeed(newMarksSeed());
      }
      toast.success(mode === 'edit' ? '고쳤어요.' : '방명록에 한 장 붙였어요.');
      onDone?.(saved);
    } catch (err) {
      toast.error(getErrorMessage(err, mode === 'edit' ? '고치지 못했어요.' : '남기지 못했어요. 잠시 뒤 다시 해 주세요.'));
    } finally {
      setSending(false);
    }
  };

  const sel = drawings.find((d) => d.id === selected) ?? null;
  const selIndex = drawings.findIndex((d) => d.id === selected);
  const isCustomTape = !TAPES.some((t) => t.key === tape);
  const chip = (active) =>
    `h-[28px] rounded-full px-[10px] text-[12px] transition ${active ? 'bg-[#212121] text-white' : 'bg-white text-[#454545] ring-1 ring-[#dedede] hover:bg-[#f5f5f5]'}`;

  return (
    <section className="flex flex-col gap-4">
      {/* 스티커를 고르는 동안 — 종이 밖은 어둡게 해서 붙일 수 없는 곳임을 보여 준다. 어두운 곳을 누르면 선택 해제 */}
      {sel && <div className="fixed inset-0 z-[60] bg-black/45" onClick={() => setSelected(null)} aria-hidden />}

      <div className={`flex flex-col gap-3 ${sel ? 'relative z-[61]' : ''}`}>
        {/* 편지지 — 카드와 같은 폭 */}
        <div
          ref={paperRef}
          className="relative mx-auto border border-black/[0.07] px-[18px] pb-[14px] pt-[22px] shadow-[2px_3px_0_rgba(0,0,0,0.05)]"
          style={{ ...paperStyle(paper), width: DESIGN_WIDTH, maxWidth: '100%' }}
        >
          {!sel && (
            <span
              aria-hidden
              className="absolute -top-[9px] left-1/2 h-[18px] w-[52px] -translate-x-1/2 rotate-[2deg]"
              style={{ backgroundColor: `${tape}b3` }}
            />
          )}
          {p.marks && <PaperMarks kind={p.marks} color={inkHex} seed={marksSeed} />}
          {/* 글 칸은 한 줄로 시작해 글 양만큼만 늘어난다 — 카드도 글 양만큼만 커지므로 작성 칸이 곧 실제 크기 (얼룩·스티커 자리를 실제 크기에서 고른다, PM 10/11) */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
            placeholder="필사그래피에 한 줄 남겨 주세요."
            rows={1}
            className={`${f.className} relative block w-full resize-none overflow-hidden bg-transparent outline-none antialiased placeholder:text-[#b8b5ad]`}
            style={textStyle(paper, font, inkHex, align)}
          />
          <div className="relative mt-2 flex items-end justify-between gap-3">
            <span className="text-[11px] text-[#a3a09a]">
              {content.length} / {maxLength}
            </span>
            <span className={`${f.className} flex items-center gap-1 text-[18px]`} style={{ color: inkHex }}>
              —
              <input
                type="text"
                value={name}
                maxLength={30}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름 또는 닉네임"
                className={`${f.className} w-[150px] border-b border-dashed border-[#b8b5ad] bg-transparent text-[18px] outline-none placeholder:text-[#b8b5ad]`}
                style={{ color: inkHex }}
              />
            </span>
          </div>

          {/* 붙일 수 있는 영역 — 고르는 동안만 점선으로 보이고 여백 띠는 어둡게. 띠 네 개로 그려 종이 밖으로 번지지 않으니
              overflow 를 막지 않아도 되고, 그래서 회전 손잡이가 종이 위로 나와도 잘리지 않는다 */}
          {sel && (
            <>
              <div aria-hidden className="pointer-events-none absolute left-0 right-0 top-0 z-[5] bg-black/20" style={{ height: PAD.top }} />
              <div aria-hidden className="pointer-events-none absolute bottom-0 left-0 right-0 z-[5] bg-black/20" style={{ height: PAD.bottom }} />
              <div aria-hidden className="pointer-events-none absolute left-0 z-[5] bg-black/20" style={{ top: PAD.top, bottom: PAD.bottom, width: PAD.left }} />
              <div aria-hidden className="pointer-events-none absolute right-0 z-[5] bg-black/20" style={{ top: PAD.top, bottom: PAD.bottom, width: PAD.right }} />
              <div
                aria-hidden
                className="pointer-events-none absolute z-[5]"
                style={{ left: PAD.left, right: PAD.right, top: PAD.top, bottom: PAD.bottom, outline: '1px dashed rgba(0,0,0,0.45)' }}
              />
            </>
          )}

          {/* 붙인 스티커 — 끌어서 옮긴다. 배열 순서 = 겹침 순서. 고른 스티커는 점선 테두리 + 모서리 손잡이(크기) + 위 손잡이(회전) */}
          {drawings.map((d, i) => {
            const isSel = selected === d.id;
            return (
              <div
                key={d.id}
                data-sticker
                className="absolute"
                style={{
                  left: `${d.posX}%`,
                  top: `${d.posY}%`,
                  width: `${d.widthPct}%`,
                  zIndex: isSel ? 40 : 10 + i,
                  transform: `translate(-50%, -50%) rotate(${d.rotation}deg)`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={d.dataUrl ?? apiUrl(d.imageUrl)}
                  alt=""
                  draggable={false}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth > 0 && !d.dataUrl) patch(d.id, { aspect: img.naturalHeight / img.naturalWidth });
                  }}
                  onPointerDown={(e) => onStickerDown(e, d)}
                  onPointerMove={onStickerMove}
                  onPointerUp={onStickerUp}
                  onPointerCancel={onStickerUp}
                  className={`block w-full cursor-move select-none touch-none drop-shadow-[1px_1px_0_rgba(0,0,0,0.08)] ${
                    isSel ? 'outline outline-1 outline-dashed outline-[#212121]' : ''
                  }`}
                  style={{ opacity: d.opacity }}
                />
                {isSel && (
                  <>
                    {CORNERS.map((c) => (
                      <span
                        key={c.key}
                        role="presentation"
                        title="끌어서 크기"
                        onPointerDown={(e) => onHandleDown(e, d, 'resize')}
                        onPointerMove={onHandleMove}
                        onPointerUp={onHandleUp}
                        onPointerCancel={onHandleUp}
                        className={`absolute h-[14px] w-[14px] touch-none rounded-[2px] border border-[#212121] bg-white shadow-sm ${c.className}`}
                        style={{ cursor: c.cursor }}
                      />
                    ))}
                    <span aria-hidden className="absolute left-1/2 top-[-22px] h-[22px] w-px -translate-x-1/2 bg-[#212121]/60" />
                    <span
                      role="presentation"
                      title="끌어서 회전"
                      onPointerDown={(e) => onHandleDown(e, d, 'rotate')}
                      onPointerMove={onHandleMove}
                      onPointerUp={onHandleUp}
                      onPointerCancel={onHandleUp}
                      className="absolute left-1/2 top-[-38px] flex h-[18px] w-[18px] -translate-x-1/2 cursor-grab touch-none items-center justify-center rounded-full border border-[#212121] bg-white text-[11px] leading-none text-[#212121] shadow-sm active:cursor-grabbing"
                    >
                      ↻
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* 고른 스티커의 작은 창 — 크기·회전은 도형에서 직접, 여기서는 투명도·순서·떼기만 (PM 10/11) */}
        {sel && (
          <div className="mx-auto flex w-full flex-col gap-2 rounded-[6px] border border-[#dedede] bg-white px-3 py-2 text-[12px] text-[#454545] shadow-lg" style={{ maxWidth: DESIGN_WIDTH }}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-[#212121]">스티커 {selIndex + 1}</span>
              <span className="text-[11px] text-[#a3a09a]">
                {Math.round(sel.widthPct)}% · {sel.rotation}°
              </span>
              <button type="button" onClick={() => setSelected(null)} className={chip(true)}>
                완료
              </button>
            </div>
            <label className="flex items-center gap-2">
              <span className="w-[40px] shrink-0 text-[#a3a09a]">투명도</span>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={Math.round(sel.opacity * 100)}
                onChange={(e) => patch(sel.id, { opacity: Number(e.target.value) / 100 })}
                className="min-w-0 flex-1 accent-[#212121]"
              />
              <span className="w-[36px] shrink-0 text-right tabular-nums">{Math.round(sel.opacity * 100)}%</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-[40px] shrink-0 text-[#a3a09a]">순서</span>
              <button type="button" disabled={selIndex >= drawings.length - 1} onClick={() => reorder(sel.id, 1)} className={`${chip(false)} disabled:opacity-40`}>
                앞으로
              </button>
              <button type="button" disabled={selIndex <= 0} onClick={() => reorder(sel.id, -1)} className={`${chip(false)} disabled:opacity-40`}>
                뒤로
              </button>
              <button type="button" onClick={() => removeDrawing(sel.id)} className={`${chip(false)} ml-auto text-[#b3261e]`}>
                떼기
              </button>
            </div>
            <p className="text-[11px] leading-[1.5] text-[#a3a09a]">끌어서 옮기고, 모서리를 끌면 크기, 위의 ↻ 를 끌면 회전해요 (0°·90° 근처는 딱 맞춰져요).</p>
          </div>
        )}
      </div>

      {/* 문구 서랍: 글씨체 · 잉크 · 종이 · 정렬 · 스티커 */}
      <div className="flex flex-col gap-3 rounded-[6px] border border-dashed border-[#cfcbc1] bg-white/60 p-3 text-[12px] text-[#6b6b6b]">
        <Row label="글씨체">
          {FONTS.map((x) => (
            <button key={x.key} type="button" onClick={() => setFont(x.key)} className={`${chip(font === x.key)} ${x.className} text-[15px]`}>
              {x.label}
            </button>
          ))}
        </Row>
        <Row label="잉크">
          {INKS.map((i) => (
            <button
              key={i.key}
              type="button"
              title={i.label}
              aria-label={i.label}
              aria-pressed={ink === i.key}
              onClick={() => setInk(i.key)}
              className={`h-[22px] w-[22px] rounded-full border-2 ${ink === i.key ? 'border-[#212121] ring-1 ring-[#212121] ring-offset-1' : 'border-white'}`}
              style={{ backgroundColor: i.color }}
            />
          ))}
          {/* + 를 누르면 포토샵 식 컬러피커 — 고른 색은 옆에 칩으로 (PM 10/11) */}
          <button
            type="button"
            title="직접 고르기"
            aria-label="잉크 색 직접 고르기"
            onClick={() => setInkPickerOpen((v) => !v)}
            className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border text-[14px] leading-none ${
              isHex(ink) ? 'border-[#212121] ring-1 ring-[#212121] ring-offset-1' : 'border-dashed border-[#919191] text-[#919191]'
            }`}
            style={isHex(ink) ? { backgroundColor: ink, color: '#fff' } : undefined}
          >
            +
          </button>
        </Row>
        {inkPickerOpen && (
          <ColorPicker
            value={inkHex}
            swatches={INKS.map((i) => i.color)}
            onCancel={() => setInkPickerOpen(false)}
            onConfirm={(hex) => {
              setInk(hex.toLowerCase());
              setInkPickerOpen(false);
            }}
          />
        )}
        <Row label="종이">
          {PAPERS.map((x) => (
            <button
              key={x.key}
              type="button"
              title={x.label}
              aria-pressed={paper === x.key}
              onClick={() => {
                // 같은 종이를 또 눌러도 얼룩을 새로 뽑는다 — 마음에 드는 배치가 나올 때까지 (PM 10/11)
                setPaper(x.key);
                setMarksSeed(newMarksSeed());
              }}
              className={`h-[26px] rounded-[4px] border px-[8px] text-[11px] ${paper === x.key ? 'border-[#212121] ring-1 ring-[#212121] ring-offset-1' : 'border-[#d4d1c8]'}`}
              style={paperStyle(x.key)}
            >
              {x.label}
            </button>
          ))}
        </Row>
        <Row label="테이프">
          {TAPES.map((t) => (
            <button
              key={t.key}
              type="button"
              title={t.label}
              aria-label={`테이프 ${t.label}`}
              aria-pressed={tape === t.key}
              onClick={() => setTape(t.key)}
              className={`h-[14px] w-[34px] rotate-[-2deg] border ${tape === t.key ? 'border-[#212121] ring-1 ring-[#212121] ring-offset-1' : 'border-black/10'}`}
              style={{ backgroundColor: t.key }}
            />
          ))}
          <button
            type="button"
            title="직접 고르기"
            aria-label="테이프 색 직접 고르기"
            onClick={() => setTapePickerOpen((v) => !v)}
            className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border text-[14px] leading-none ${
              isCustomTape ? 'border-[#212121] ring-1 ring-[#212121] ring-offset-1' : 'border-dashed border-[#919191] text-[#919191]'
            }`}
            style={isCustomTape ? { backgroundColor: tape, color: '#454545' } : undefined}
          >
            +
          </button>
        </Row>
        {tapePickerOpen && (
          <ColorPicker
            value={tape}
            swatches={TAPES.map((t) => t.key)}
            onCancel={() => setTapePickerOpen(false)}
            onConfirm={(hex) => {
              setTape(hex.toLowerCase());
              setTapePickerOpen(false);
            }}
          />
        )}
        <Row label="정렬">
          {ALIGNS.map((a) => (
            <button key={a.key} type="button" onClick={() => setAlign(a.key)} className={chip(align === a.key)}>
              {a.label}
            </button>
          ))}
        </Row>
        <Row label="스티커">
          <button type="button" onClick={() => setDrawOpen(true)} disabled={drawings.length >= maxDrawings} className={`${chip(false)} disabled:opacity-40`}>
            + 그려서 붙이기 ({drawings.length}/{maxDrawings})
          </button>
          {drawings.map((d, i) => (
            <button key={d.id} type="button" onClick={() => setSelected(d.id)} className={chip(selected === d.id)}>
              스티커 {i + 1}
            </button>
          ))}
          {drawings.length > 0 && <span className="text-[#a3a09a]">누르면 골라서 옮기고 모서리로 크기, 손잡이로 회전해요</span>}
        </Row>

        <div className="flex items-center justify-between gap-3 border-t border-dashed border-[#e0ddd4] pt-3">
          <span className="text-[11px] leading-[1.5] text-[#a3a09a]">
            {isLoggedIn ? '로그인 상태에서 남긴 글만 고치거나 지울 수 있어요.' : '로그인 없이도 남길 수 있어요. 로그인 상태에서 남긴 글만 고치거나 지울 수 있어요.'}
          </span>
          <span className="flex shrink-0 gap-2">
            {onCancel && (
              <button type="button" onClick={onCancel} className="h-[38px] rounded-[4px] border border-[#dedede] bg-white px-4 text-[14px] text-[#454545]">
                취소
              </button>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={sending}
              className="h-[38px] rounded-[4px] bg-[#212121] px-5 text-[14px] text-white transition-colors hover:bg-black disabled:opacity-50"
            >
              {sending ? (mode === 'edit' ? '고치는 중' : '붙이는 중') : mode === 'edit' ? '고치기' : '남기기'}
            </button>
          </span>
        </div>
      </div>

      <DrawingModal open={drawOpen} onClose={() => setDrawOpen(false)} onDone={addDrawing} maxKb={drawingMaxKb} />
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-[40px] shrink-0 text-[#a3a09a]">{label}</span>
      {children}
    </div>
  );
}
