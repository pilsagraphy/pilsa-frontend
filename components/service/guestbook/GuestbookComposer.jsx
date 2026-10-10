'use client';

import { useRef, useState } from 'react';
import { getErrorMessage } from '@/apis/auth';
import { editGuestbookNote, writeGuestbookNote } from '@/apis/guestbook';
import useAuthStore from '@/stores/useAuthStore';
import { apiUrl } from '@/lib/apiBase';
import { toast } from '@/lib/toast';
import DrawingModal from './DrawingModal';
import InkBlot from './InkBlot';
import { ALIGNS, FONTS, INKS, LINE_HEIGHT_PX, PAPERS, fontOf, inkColor, paperOf, paperStyle } from './guestbookStyle';

const NAME_KEY = 'pilsaGuestbookName';
const readSavedName = () => {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
};
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// 방명록 쓰기 칸 — 편지지 한 장을 그대로 쓰는 느낌. 쓰는 종이가 곧 미리보기다.
// 글씨체·잉크·종이·정렬을 고르고, 그림판에서 그린 스티커를 붙여 끌어서 자리를 잡는다.
// mode='edit' 면 initial(기존 글)을 채워 놓고 PUT 으로 고친다 (본인 또는 관리자).
export default function GuestbookComposer({ mode = 'create', initial = null, maxLength = 300, maxDrawings = 3, drawingMaxKb = 200, onDone, onCancel }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [name, setName] = useState(initial?.displayName ?? readSavedName);
  const [content, setContent] = useState(initial?.content ?? '');
  const [font, setFont] = useState(initial?.font ?? FONTS[0].key);
  const [ink, setInk] = useState(initial?.ink ?? INKS[0].key);
  const [paper, setPaper] = useState(initial?.paper ?? PAPERS[0].key);
  const [align, setAlign] = useState(initial?.align ?? 'left');
  // 스티커: { id(화면용), drawingId?, dataUrl?, imageUrl?, posX, posY, widthPct, rotation }
  const [drawings, setDrawings] = useState(() =>
    (initial?.drawings ?? []).map((d) => ({
      id: `d${d.drawingId}`,
      drawingId: d.drawingId,
      imageUrl: d.imageUrl,
      posX: d.posX,
      posY: d.posY,
      widthPct: d.widthPct,
      rotation: d.rotation ?? 0,
    }))
  );
  const [selected, setSelected] = useState(null);
  const [drawOpen, setDrawOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const paperRef = useRef(null);
  const drag = useRef(null);

  const f = fontOf(font);
  const p = paperOf(paper);
  const inkHex = inkColor(ink);

  const addDrawing = ({ dataUrl }) => {
    if (drawings.length >= maxDrawings) {
      toast.error(`스티커는 ${maxDrawings}개까지 붙일 수 있어요.`);
      return;
    }
    const id = `n${Date.now()}`;
    // 새 스티커는 오른쪽 위쯤에 — 겹치지 않게 조금씩 비껴 놓는다
    const n = drawings.length;
    setDrawings([...drawings, { id, dataUrl, posX: 82 - n * 14, posY: 22 + n * 10, widthPct: 28, rotation: 0 }]);
    setSelected(id);
    setDrawOpen(false);
  };

  const patch = (id, part) => setDrawings((list) => list.map((d) => (d.id === id ? { ...d, ...part } : d)));
  const removeDrawing = (id) => {
    setDrawings((list) => list.filter((d) => d.id !== id));
    if (selected === id) setSelected(null);
  };

  // 스티커 끌기 — 종이 기준 % 로 환산해 둔다 (카드 크기가 달라져도 같은 자리)
  const onStickerDown = (event, d) => {
    event.preventDefault();
    event.stopPropagation();
    setSelected(d.id);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { id: d.id, pointerId: event.pointerId };
  };
  const onStickerMove = (event) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    const rect = paperRef.current?.getBoundingClientRect();
    if (!rect) return;
    patch(drag.current.id, {
      posX: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      posY: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
    });
  };
  const onStickerUp = () => {
    drag.current = null;
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
        })),
      };
      const saved = mode === 'edit' ? await editGuestbookNote(initial.noteId, body) : await writeGuestbookNote(body);
      try {
        localStorage.setItem(NAME_KEY, name.trim());
      } catch {
        // 저장 못 해도 그만
      }
      if (mode === 'create') {
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
  const chip = (active) =>
    `h-[28px] rounded-full px-[10px] text-[12px] transition ${active ? 'bg-[#212121] text-white' : 'bg-white text-[#454545] ring-1 ring-[#dedede] hover:bg-[#f5f5f5]'}`;

  return (
    <section className="flex flex-col gap-4">
      {/* 편지지 */}
      <div
        ref={paperRef}
        className="relative border border-black/[0.07] px-[18px] pb-[14px] pt-[22px] shadow-[2px_3px_0_rgba(0,0,0,0.05)]"
        style={paperStyle(paper)}
        onPointerMove={onStickerMove}
        onPointerUp={onStickerUp}
        onPointerCancel={onStickerUp}
      >
        <span aria-hidden className="absolute -top-[9px] left-1/2 h-[18px] w-[52px] -translate-x-1/2 rotate-[2deg] bg-[#d9d6cd]/70" />
        {p.blot && <InkBlot color={inkHex} />}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
          placeholder="필사그래피에 한 줄 남겨 주세요."
          rows={4}
          className={`${f.className} relative w-full resize-none bg-transparent outline-none antialiased placeholder:text-[#b8b5ad]`}
          style={{ color: inkHex, fontSize: `${Math.round(23 * f.scale)}px`, lineHeight: `${LINE_HEIGHT_PX}px`, textAlign: align }}
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

        {/* 붙인 스티커 — 끌어서 옮긴다. 고른 스티커는 점선 테두리 */}
        {drawings.map((d) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={d.id}
            src={d.dataUrl ?? apiUrl(d.imageUrl)}
            alt=""
            draggable={false}
            onPointerDown={(e) => onStickerDown(e, d)}
            className={`absolute cursor-move select-none touch-none drop-shadow-[1px_1px_0_rgba(0,0,0,0.08)] ${
              selected === d.id ? 'outline outline-1 outline-dashed outline-[#919191]' : ''
            }`}
            style={{
              left: `${d.posX}%`,
              top: `${d.posY}%`,
              width: `${d.widthPct}%`,
              transform: `translate(-50%, -50%) rotate(${d.rotation}deg)`,
            }}
          />
        ))}
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
          {sel && (
            <span className="flex flex-wrap items-center gap-1">
              <span className="text-[#a3a09a]">고른 스티커:</span>
              <button type="button" onClick={() => patch(sel.id, { widthPct: clamp(sel.widthPct - 5, 8, 80) })} className={chip(false)}>
                작게
              </button>
              <button type="button" onClick={() => patch(sel.id, { widthPct: clamp(sel.widthPct + 5, 8, 80) })} className={chip(false)}>
                크게
              </button>
              <button type="button" onClick={() => patch(sel.id, { rotation: sel.rotation - 15 })} className={chip(false)}>
                ↺
              </button>
              <button type="button" onClick={() => patch(sel.id, { rotation: sel.rotation + 15 })} className={chip(false)}>
                ↻
              </button>
              <button type="button" onClick={() => removeDrawing(sel.id)} className={chip(false)}>
                떼기
              </button>
            </span>
          )}
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
