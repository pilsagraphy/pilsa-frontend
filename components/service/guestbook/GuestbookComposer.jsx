'use client';

import { useRef, useState } from 'react';
import { getErrorMessage } from '@/apis/auth';
import { editGuestbookNote, writeGuestbookNote } from '@/apis/guestbook';
import useAuthStore from '@/stores/useAuthStore';
import { apiUrl } from '@/lib/apiBase';
import { toast } from '@/lib/toast';
import DrawingModal from './DrawingModal';
import InkBlot from './InkBlot';
import { ALIGNS, DESIGN_WIDTH, FONTS, INKS, LINE_HEIGHT_PX, PAPERS, fontOf, inkColor, paperOf, paperStyle } from './guestbookStyle';

const NAME_KEY = 'pilsaGuestbookName';
const readSavedName = () => {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
};
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const isHex = (v) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);

// 종이 안쪽 여백(px) — 스티커는 이 안에만 붙는다 (카드의 padding 과 같은 값)
const PAD = { left: 18, right: 18, top: 22, bottom: 14 };
const MIN_W = 8;
const MAX_W = 80;

// 방명록 쓰기 칸 — 편지지 한 장을 그대로 쓰는 느낌. 쓰는 종이가 곧 미리보기다.
// 종이는 카드와 같은 320px 로 두어 줄바꿈·스티커 자리가 카드에서 똑같이 보인다 (어긋나던 원인, PM 10/10 밤).
// 글씨체·잉크(기본 6색 + 컬러피커)·종이·정렬을 고르고, 그림판에서 그린 스티커를 붙여 끌어서 자리를 잡는다 —
// 잡은 지점을 유지하며 끌기, 안쪽 여백 밖으로 못 나감, 고르는 동안 바깥은 어둡게, 크기·회전·투명도 슬라이더, 앞/뒤 순서, 떼기.
// mode='edit' 면 initial(기존 글)을 채워 놓고 PUT 으로 고친다 (본인 또는 관리자).
export default function GuestbookComposer({ mode = 'create', initial = null, maxLength = 300, maxDrawings = 3, drawingMaxKb = 200, onDone, onCancel }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [name, setName] = useState(initial?.displayName ?? readSavedName);
  const [content, setContent] = useState(initial?.content ?? '');
  const [font, setFont] = useState(initial?.font ?? FONTS[0].key);
  const [ink, setInk] = useState(initial?.ink ?? INKS[0].key);
  const [paper, setPaper] = useState(initial?.paper ?? PAPERS[0].key);
  const [align, setAlign] = useState(initial?.align ?? 'left');
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
  const colorRef = useRef(null);
  const drag = useRef(null);

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
        content: content.trim(),
        font,
        ink,
        paper,
        align,
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
      // 내 이름 기억은 새로 쓸 때만 — 관리자가 남의 글을 고친 뒤 그 이름이 기본값으로 남던 문제 (PM 10/10 밤)
      if (mode === 'create') {
        try {
          localStorage.setItem(NAME_KEY, name.trim());
        } catch {
          // 저장 못 해도 그만
        }
        setContent('');
        setDrawings([]);
        setSelected(null);
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
  const chip = (active) =>
    `h-[28px] rounded-full px-[10px] text-[12px] transition ${active ? 'bg-[#212121] text-white' : 'bg-white text-[#454545] ring-1 ring-[#dedede] hover:bg-[#f5f5f5]'}`;

  return (
    <section className="flex flex-col gap-4">
      {/* 스티커를 고르는 동안 — 종이 밖은 어둡게 해서 붙일 수 없는 곳임을 보여 준다. 어두운 곳을 누르면 선택 해제 */}
      {sel && <div className="fixed inset-0 z-[60] bg-black/45" onClick={() => setSelected(null)} aria-hidden />}

      <div className={`flex flex-col gap-3 ${sel ? 'relative z-[61]' : ''}`}>
        {/* 편지지 — 카드와 같은 320px */}
        <div
          ref={paperRef}
          className={`relative mx-auto border border-black/[0.07] px-[18px] pb-[14px] pt-[22px] shadow-[2px_3px_0_rgba(0,0,0,0.05)] ${sel ? 'overflow-hidden' : ''}`}
          style={{ ...paperStyle(paper), width: DESIGN_WIDTH, maxWidth: '100%' }}
        >
          {!sel && <span aria-hidden className="absolute -top-[9px] left-1/2 h-[18px] w-[52px] -translate-x-1/2 rotate-[2deg] bg-[#d9d6cd]/70" />}
          {p.blot && <InkBlot color={p.vintage ? '#6b4a2b' : inkHex} strength={p.vintage ? 2.2 : 1} />}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
            placeholder="필사그래피에 한 줄 남겨 주세요."
            rows={4}
            className={`${f.className} relative w-full resize-none bg-transparent outline-none antialiased placeholder:text-[#b8b5ad]`}
            style={{ color: inkHex, fontSize: `${Math.round(22 * f.scale)}px`, lineHeight: `${LINE_HEIGHT_PX}px`, textAlign: align }}
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

          {/* 붙일 수 있는 영역 — 고르는 동안만 점선으로 보이고 여백 띠는 어둡게 */}
          {sel && (
            <div
              aria-hidden
              className="pointer-events-none absolute z-[5]"
              style={{
                left: PAD.left,
                right: PAD.right,
                top: PAD.top,
                bottom: PAD.bottom,
                outline: '1px dashed rgba(0,0,0,0.45)',
                boxShadow: '0 0 0 600px rgba(0,0,0,0.22)',
              }}
            />
          )}

          {/* 붙인 스티커 — 끌어서 옮긴다. 배열 순서 = 겹침 순서. 고른 스티커는 점선 테두리 */}
          {drawings.map((d, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={d.id}
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
              className={`absolute cursor-move select-none touch-none drop-shadow-[1px_1px_0_rgba(0,0,0,0.08)] ${
                selected === d.id ? 'outline outline-1 outline-dashed outline-[#212121]' : ''
              }`}
              style={{
                left: `${d.posX}%`,
                top: `${d.posY}%`,
                width: `${d.widthPct}%`,
                opacity: d.opacity,
                zIndex: 10 + i,
                transform: `translate(-50%, -50%) rotate(${d.rotation}deg)`,
              }}
            />
          ))}
        </div>

        {/* 고른 스티커 조절판 */}
        {sel && (
          <div className="flex flex-col gap-2 rounded-[6px] border border-[#dedede] bg-white p-3 text-[12px] text-[#454545] shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#212121]">스티커 {selIndex + 1} — 종이 위에서 끌어 옮길 수 있어요</span>
              <button type="button" onClick={() => setSelected(null)} className={chip(true)}>
                완료
              </button>
            </div>
            <Slider label="크기" value={Math.round(sel.widthPct)} min={MIN_W} max={MAX_W} step={1} unit="%" onChange={(v) => patch(sel.id, { widthPct: v })} />
            <Slider label="회전" value={sel.rotation} min={-180} max={180} step={5} unit="°" onChange={(v) => patch(sel.id, { rotation: v })} />
            <Slider label="투명도" value={Math.round(sel.opacity * 100)} min={10} max={100} step={5} unit="%" onChange={(v) => patch(sel.id, { opacity: v / 100 })} />
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-[44px] text-[#a3a09a]">순서</span>
              <button type="button" disabled={selIndex >= drawings.length - 1} onClick={() => reorder(sel.id, 1)} className={`${chip(false)} disabled:opacity-40`}>
                앞으로
              </button>
              <button type="button" disabled={selIndex <= 0} onClick={() => reorder(sel.id, -1)} className={`${chip(false)} disabled:opacity-40`}>
                뒤로
              </button>
              <button type="button" onClick={() => patch(sel.id, { rotation: 0, opacity: 1 })} className={chip(false)}>
                회전·투명도 초기화
              </button>
              <button type="button" onClick={() => removeDrawing(sel.id)} className={`${chip(false)} ml-auto text-[#b3261e]`}>
                떼기
              </button>
            </div>
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
          {/* + 를 누르면 컬러피커 — 고른 색은 옆에 칩으로 (PM 10/10 밤) */}
          <button
            type="button"
            title="직접 고르기"
            aria-label="잉크 색 직접 고르기"
            onClick={() => colorRef.current?.click()}
            className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border text-[14px] leading-none ${
              isHex(ink) ? 'border-[#212121] ring-1 ring-[#212121] ring-offset-1' : 'border-dashed border-[#919191] text-[#919191]'
            }`}
            style={isHex(ink) ? { backgroundColor: ink, color: '#fff' } : undefined}
          >
            +
          </button>
          <input
            ref={colorRef}
            type="color"
            value={isHex(ink) ? ink : '#1f1f1f'}
            onChange={(e) => setInk(e.target.value.toLowerCase())}
            className="h-0 w-0 opacity-0"
            tabIndex={-1}
            aria-hidden
          />
        </Row>
        <Row label="종이">
          {PAPERS.map((x) => (
            <button
              key={x.key}
              type="button"
              title={x.label}
              aria-pressed={paper === x.key}
              onClick={() => setPaper(x.key)}
              className={`h-[26px] rounded-[4px] border px-[8px] text-[11px] ${paper === x.key ? 'border-[#212121] ring-1 ring-[#212121] ring-offset-1' : 'border-[#d4d1c8]'}`}
              style={paperStyle(x.key)}
            >
              {x.label}
            </button>
          ))}
        </Row>
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
          {drawings.length > 0 && <span className="text-[#a3a09a]">누르면 크기·회전·투명도·순서를 조절해요</span>}
        </Row>

        <div className="flex items-center justify-between gap-3 border-t border-dashed border-[#e0ddd4] pt-3">
          <span className="text-[11px] leading-[1.5] text-[#a3a09a]">
            {isLoggedIn
              ? '로그인 상태라 남긴 글을 나중에 고치거나 지울 수 있어요.'
              : '로그인 없이도 남길 수 있지만, 로그인하지 않고 남긴 글은 나중에 고치거나 지울 수 없어요.'}
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

function Slider({ label, value, min, max, step, unit, onChange }) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-[44px] shrink-0 text-[#a3a09a]">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="min-w-0 flex-1 accent-[#212121]" />
      <span className="w-[48px] shrink-0 text-right tabular-nums text-[#454545]">
        {value}
        {unit}
      </span>
    </label>
  );
}
