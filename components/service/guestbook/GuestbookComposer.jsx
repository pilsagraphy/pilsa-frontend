'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getErrorMessage } from '@/apis/auth';
import { editGuestbookNote, writeGuestbookNote } from '@/apis/guestbook';
import useAuthStore from '@/stores/useAuthStore';
import { apiUrl } from '@/lib/apiBase';
import { toast } from '@/lib/toast';
import ColorPicker from '@/components/shared/ColorPicker';
import DrawingModal from './DrawingModal';
import PaperMarks, { newMarksSeed } from './PaperMarks';
import MarksToggle from './MarksToggle';
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

// 스티커는 종이 밖으로 절반까지 삐져나갈 수 있다(커피 자국처럼). 종이 밖 부분은 카드에서 잘려 보이지 않는다 (PM 10/11 "붙일 영역이 너무 좁다")
const MIN_W = 8;
const MAX_W = 80;
// 고른 스티커의 모서리 손잡이 네 개 — 끌면 가운데를 기준으로 커지고 작아진다
const CORNERS = [
  { key: 'tl', className: '-left-[11px] -top-[11px] sm:-left-[7px] sm:-top-[7px]', cursor: 'nwse-resize' },
  { key: 'tr', className: '-right-[11px] -top-[11px] sm:-right-[7px] sm:-top-[7px]', cursor: 'nesw-resize' },
  { key: 'bl', className: '-bottom-[11px] -left-[11px] sm:-bottom-[7px] sm:-left-[7px]', cursor: 'nesw-resize' },
  { key: 'br', className: '-bottom-[11px] -right-[11px] sm:-bottom-[7px] sm:-right-[7px]', cursor: 'nwse-resize' },
];
const SNAP_ANGLES = [-180, -90, 0, 90, 180];

// 방명록 쓰기 칸 — 편지지 한 장을 그대로 쓰는 느낌. 쓰는 종이가 곧 미리보기다.
// 종이는 카드와 같은 폭(DESIGN_WIDTH)으로 두어 줄바꿈·스티커 자리가 카드에서 똑같이 보인다 (어긋나던 원인, PM 10/10 밤).
// 글씨체·잉크(기본 6색 + 컬러피커)·종이·테이프 색·정렬을 고르고, 그림판에서 그린 스티커를 붙여 끌어서 자리를 잡는다 —
// 잡은 지점을 유지하며 끌기, 종이 밖으로 절반까지 삐져나갈 수 있음(밖은 카드에서 잘림), 고르는 동안 바깥은 어둡게. 크기·회전은 PPT 처럼 도형의 모서리·위 손잡이를 끌어
// 바로 바꾸고, 투명도·순서·떼기만 아래 작은 창에서 (PM 10/11 "슬라이더는 불편, ppt 처럼").
// mode='edit' 면 initial(기존 글)을 채워 놓고 PUT 으로 고친다 (로그인해서 남긴 본인 글만).
// marksOn/onMarksOnChange: 새로 쓸 때는 Guestbook 의 학기 머리줄 스위치가 얼룩 켬/끔을 쥔다(제어 prop). onPaperMarksChange: 고른 종이에 얼룩이 있는지('ink'|'coffee'|null) 알려 스위치를 보이고 숨긴다
export default function GuestbookComposer({
  mode = 'create',
  initial = null,
  maxLength = 300,
  maxDrawings = 3,
  drawingMaxKb = 200,
  onDone,
  onCancel,
  marksOn: marksOnProp = null,
  onMarksOnChange = null,
  onPaperMarksChange = null,
}) {
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
  // 얼룩(무지 잉크 자국·빈티지 커피 자국) 켬/끔 — 기본 켬, 글과 함께 저장 (PM 10/11)
  const [marksOnState, setMarksOnState] = useState(initial?.marksOn !== false);
  const marksOn = marksOnProp ?? marksOnState;
  const setMarksOn = onMarksOnChange ?? setMarksOnState;
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
  // 새 글은 글씨체·종이·테이프를 랜덤으로 시작한다 — 다들 똑같은 기본값으로 남기지 않게 (PM 10/11). 마운트 뒤에 돌리는 이유: 서버 렌더와 어긋나지 않게
  const randomizeLook = () => {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    setFont(pick(FONTS).key);
    setPaper(pick(PAPERS).key);
    setTape(pick(TAPES).key);
    setMarksSeed(newMarksSeed());
  };
  useEffect(() => {
    if (mode === 'create' && !initial) randomizeLook();
    // 처음 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [drawOpen, setDrawOpen] = useState(false);
  const [sending, setSending] = useState(false);
  // 스티커를 고른 상태에서 스티커·손잡이·조절창 밖을 누르면 편집 완료로 본다 (PM 10/11). 그림판이 열려 있을 땐 그대로 둔다
  useEffect(() => {
    if (!selected || drawOpen) return undefined;
    const onDown = (e) => {
      if (e.target?.closest?.('[data-sticker], [data-sticker-panel]')) return;
      setSelected(null);
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [selected, drawOpen]);
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
  // 고른 종이에 얼룩이 있는지 부모(학기 머리줄 스위치)에 알린다
  useEffect(() => {
    onPaperMarksChange?.(p.marks ?? null);
  }, [p.marks, onPaperMarksChange]);
  const inkHex = inkColor(ink);

  // 스티커 중심은 종이 안(0~100%)에만 — 절반까지는 종이 밖으로 나갈 수 있고, 완전히 밖으로 나가 잃어버리는 일은 없다
  const clampPos = (d, posX, posY) => ({ posX: clamp(posX, 0, 100), posY: clamp(posY, 0, 100) });

  const patch = (id, part) =>
    setDrawings((list) =>
      list.map((d) => {
        if (d.id !== id) return d;
        const next = { ...d, ...part };
        return { ...next, ...clampPos(next, next.posX, next.posY) };
      })
    );

  const addDrawing = ({ dataUrl, aspect }) => {
    // 고른 스티커의 그림만 바꾸는 경우 — 자리·크기·회전·투명도는 그대로. 서버에 있던 그림(drawingId)은 새 그림으로 갈아 끼운다(목록에서 빠진 옛 그림은 서버가 뗀다) (PM 10/11)
    const editId = drawOpen?.editId;
    if (editId) {
      setDrawings((list) => list.map((d) => (d.id === editId ? { ...d, dataUrl, imageUrl: undefined, drawingId: null, aspect: aspect || 1 } : d)));
      setDrawOpen(false);
      return;
    }
    if (drawings.length >= maxDrawings) {
      toast.error(`스티커는 ${maxDrawings}개까지 붙일 수 있어요.`);
      return;
    }
    const id = `n${Date.now()}`;
    const n = drawings.length;
    // 캔버스를 통째로 붙이므로 처음 크기를 종이의 40% 로 — 그릴 때 본 크기와 비슷하게 (PM 10/11)
    const fresh = { id, dataUrl, posX: 70 - n * 14, posY: 30 + n * 12, widthPct: 40, rotation: 0, opacity: 1, aspect: aspect || 1 };
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
    // 이름은 필수, 내용은 스티커가 하나라도 있으면 비워도 된다 (PM 10/11)
    if (!content.trim() && drawings.length === 0) {
      toast.error('내용을 쓰거나 스티커를 하나 붙여 주세요.');
      return;
    }
    setSending(true);
    try {
      // 로그인 상태면 먼저 세션을 갱신 — 만료된 토큰으로 보내면 익명 글이 되어 나중에 못 고친다 (PM 10/11)
      if (isLoggedIn) await useAuthStore.getState().fetchRole().catch(() => {});
      const body = {
        displayName: name.trim(),
        content, // 끝의 빈 줄도 그대로 — 스티커 자리를 만들려고 넣은 줄이 저장 뒤 사라지면 카드가 작아진다 (검토 지적 10/11)
        font,
        ink,
        paper,
        align,
        marksSeed,
        tape,
        marksOn,
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
        randomizeLook();
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
    `h-[40px] rounded-full px-[14px] text-[14px] transition sm:h-[28px] sm:px-[10px] sm:text-[12px] ${active ? 'bg-inverse text-inverse-fg' : 'bg-surface text-ink-2 ring-1 ring-line hover:bg-surface-2'}`;

  return (
    <section className="flex min-w-0 flex-col gap-4">
      {/* 스티커를 고르는 동안 — 종이 밖은 어둡게 해서 붙일 수 없는 곳임을 보여 준다. 어두운 곳을 누르면 선택 해제 */}
      {/* 어둡게는 새로 쓸 때만 — 고치기 모달 안에서는 fixed 가 모달 상자(transform)에 갇혀 반쪽만 어두워졌다. 모달은 자기 막이 있다 (PM 10/11) */}
      {sel && mode === 'create' && <div className="fixed inset-0 z-[60] bg-black/45" onClick={() => setSelected(null)} aria-hidden />}

      <div className={`flex flex-col gap-3 ${sel ? 'relative z-[61]' : ''}`}>
        {/* 얼룩 켬/끔 — 고칠 때는 종이 오른쪽 위에 작은 스위치(새로 쓸 때는 Guestbook 의 학기 머리줄 스위치가 대신), 무지·빈티지에만 (PM 10/11) */}
        {p.marks && !onMarksOnChange && (
          <div className="flex justify-end">
            <MarksToggle kind={p.marks} on={marksOn} onChange={setMarksOn} />
          </div>
        )}
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
          {p.marks && marksOn && <PaperMarks kind={p.marks} color={inkHex} seed={marksSeed} />}
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

          {/* 고르는 동안 종이 테두리를 점선으로 — 이 선 밖은 카드에서 잘려 보이지 않는다 */}
          {sel && <div aria-hidden className="pointer-events-none absolute inset-0 z-[5]" style={{ outline: '1px dashed rgba(0,0,0,0.45)' }} />}

          {/* 붙인 스티커 층 — 끌어서 옮긴다. 배열 순서 = 겹침 순서. 고른 스티커는 점선 테두리 + 모서리 손잡이(크기) + 위 손잡이(회전).
              고르는 동안은 종이 밖으로 나간 부분도 보여 주고(손잡이를 잡을 수 있게), 완료하면 카드처럼 종이 안만 보인다 */}
          <div className={`pointer-events-none absolute inset-0 z-[10] ${sel ? '' : 'overflow-hidden'}`}>
          {drawings.map((d, i) => {
            const isSel = selected === d.id;
            return (
              <div
                key={d.id}
                data-sticker
                className="pointer-events-auto absolute"
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
                    isSel ? 'outline outline-1 outline-dashed outline-ink' : ''
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
                        className={`absolute h-[22px] w-[22px] touch-none rounded-[2px] sm:h-[14px] sm:w-[14px] border border-ink bg-surface shadow-sm ${c.className}`}
                        style={{ cursor: c.cursor }}
                      />
                    ))}
                    <span aria-hidden className="absolute left-1/2 top-[-22px] h-[22px] w-px -translate-x-1/2 bg-inverse/60" />
                    <span
                      role="presentation"
                      title="끌어서 회전"
                      onPointerDown={(e) => onHandleDown(e, d, 'rotate')}
                      onPointerMove={onHandleMove}
                      onPointerUp={onHandleUp}
                      onPointerCancel={onHandleUp}
                      className="absolute left-1/2 top-[-46px] flex h-[26px] w-[26px] -translate-x-1/2 cursor-grab touch-none items-center justify-center rounded-full border border-ink bg-surface text-[14px] sm:top-[-38px] sm:h-[18px] sm:w-[18px] sm:text-[11px] leading-none text-ink shadow-sm active:cursor-grabbing"
                    >
                      ↻
                    </span>
                  </>
                )}
              </div>
            );
          })}
          </div>
        </div>

        {/* 고른 스티커의 작은 창 — 크기·회전은 도형에서 직접, 여기서는 투명도·순서·스티커 수정·떼기만. 화면 아래에 떠 있는 팝업(포털)이라
            글 흐름을 밀지 않고, 고치기 모달 안에서도 모달 상자에 갇히지 않는다. 모달의 바깥 클릭 판정은 data-sticker-panel 로 제외 (PM 10/11) */}
        {sel &&
          !drawOpen &&
          typeof document !== 'undefined' &&
          createPortal(
          <div
            data-sticker-panel
            className="pointer-events-auto fixed inset-x-3 z-[70] mx-auto flex max-w-[360px] flex-col gap-2 rounded-[10px] border border-line bg-elevated px-3 py-2 text-[12px] text-ink-2 shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
            style={{ bottom: 'calc(12px + var(--bottom-bar, 0px))' }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-ink">스티커 {selIndex + 1}</span>
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
                className="min-w-0 flex-1 accent-ink"
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
              <button type="button" onClick={() => setDrawOpen({ editId: sel.id })} className={chip(false)}>
                스티커 수정
              </button>
              <button type="button" onClick={() => removeDrawing(sel.id)} className={`${chip(false)} ml-auto text-danger`}>
                떼기
              </button>
            </div>
            <p className="text-[11px] leading-[1.5] text-[#a3a09a]">
              끌어서 옮기고, 모서리를 끌면 크기, 위의 ↻ 를 끌면 회전해요 (0°·90° 근처는 딱 맞춰져요). 종이 밖으로 나간 부분은 붙인 뒤 잘려 보여요.
            </p>
          </div>,
          document.body
          )}
      </div>

      {/* 문구 서랍: 글씨체 · 잉크 · 종이 · 정렬 · 스티커 */}
      <div className="flex flex-col gap-3 rounded-[6px] border border-dashed border-[#cfcbc1] bg-surface/60 p-3 text-[12px] text-ink-2">
        <Row label="글씨체">
          {FONTS.map((x) => (
            <button key={x.key} type="button" onClick={() => setFont(x.key)} className={`${chip(font === x.key)} ${x.className} text-[17px] sm:text-[15px]`}>
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
              className={`h-[34px] w-[34px] rounded-full border-2 sm:h-[22px] sm:w-[22px] ${ink === i.key ? 'border-ink ring-1 ring-ink ring-offset-1' : 'border-white'}`}
              style={{ backgroundColor: i.color }}
            />
          ))}
          {/* + 를 누르면 포토샵 식 컬러피커 — 고른 색은 옆에 칩으로 (PM 10/11) */}
          <button
            type="button"
            title="직접 고르기"
            aria-label="잉크 색 직접 고르기"
            onClick={() => setInkPickerOpen((v) => !v)}
            className={`flex h-[34px] w-[34px] items-center justify-center rounded-full border text-[16px] leading-none sm:h-[22px] sm:w-[22px] sm:text-[14px] ${
              isHex(ink) ? 'border-ink ring-1 ring-ink ring-offset-1' : 'border-dashed border-ink-3 text-ink-3'
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
              className={`h-[40px] rounded-[4px] border px-[12px] text-[13px] sm:h-[26px] sm:px-[8px] sm:text-[11px] ${paper === x.key ? 'border-ink ring-1 ring-ink ring-offset-1' : 'border-[#d4d1c8]'}`}
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
              className={`h-[22px] w-[48px] rotate-[-2deg] border sm:h-[14px] sm:w-[34px] ${tape === t.key ? 'border-ink ring-1 ring-ink ring-offset-1' : 'border-line'}`}
              style={{ backgroundColor: t.key }}
            />
          ))}
          <button
            type="button"
            title="직접 고르기"
            aria-label="테이프 색 직접 고르기"
            onClick={() => setTapePickerOpen((v) => !v)}
            className={`flex h-[34px] w-[34px] items-center justify-center rounded-full border text-[16px] leading-none sm:h-[22px] sm:w-[22px] sm:text-[14px] ${
              isCustomTape ? 'border-ink ring-1 ring-ink ring-offset-1' : 'border-dashed border-ink-3 text-ink-3'
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
        </Row>

        <div className="flex items-center justify-between gap-3 border-t border-dashed border-[#e0ddd4] pt-3">
          <span className="text-[11px] leading-[1.5] text-[#a3a09a]">
            {isLoggedIn ? '로그인 상태에서 남긴 글만 고치거나 지울 수 있어요.' : '로그인 없이도 남길 수 있어요. 로그인 상태에서 남긴 글만 고치거나 지울 수 있어요.'}
          </span>
          <span className="flex shrink-0 gap-2">
            {onCancel && (
              <button type="button" onClick={onCancel} className="h-[44px] rounded-[4px] sm:h-[38px] border border-line bg-surface px-4 text-[14px] text-ink-2">
                취소
              </button>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={sending}
              className="h-[44px] rounded-[4px] sm:h-[38px] bg-inverse px-5 text-[14px] text-inverse-fg transition-colors hover:bg-inverse-hover disabled:opacity-50"
            >
              {sending ? (mode === 'edit' ? '고치는 중' : '붙이는 중') : mode === 'edit' ? '고치기' : '남기기'}
            </button>
          </span>
        </div>
      </div>

      {/* drawOpen: false | true(새로 그리기) | { editId }(고른 스티커 그림 수정 — 기존 그림을 캔버스에 깔고 시작) */}
      <DrawingModal
        open={Boolean(drawOpen)}
        initialImage={drawOpen?.editId ? (drawings.find((d) => d.id === drawOpen.editId)?.dataUrl ?? apiUrl(drawings.find((d) => d.id === drawOpen.editId)?.imageUrl)) : null}
        onClose={() => setDrawOpen(false)}
        onDone={addDrawing}
        maxKb={drawingMaxKb}
      />
    </section>
  );
}

// 옵션 한 줄 — 폰(sm 미만)에서는 줄바꿈 없이 한 줄로 두고 넘치는 것은 손가락으로 옆으로 밀어 본다(스크롤바는 숨김, PM 10/11 "미닫이 문처럼").
// PC 에서는 전처럼 줄바꿈
function Row({ label, children }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[40px] shrink-0 text-[#a3a09a]">{label}</span>
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-[3px] py-[3px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 sm:flex-wrap sm:overflow-visible">
        {children}
      </div>
    </div>
  );
}
