'use client';

import { useEffect, useRef, useState } from 'react';
import { apiUrl } from '@/lib/apiBase';
import PaperMarks from './PaperMarks';
import { DESIGN_WIDTH, fontOf, inkColor, paperOf, paperStyle, randomTilt, tapeColor, textAlignOf, textStyle } from './guestbookStyle';

const fmtDate = (iso) => (iso ? String(iso).slice(0, 10).replace(/-/g, '.') : '');

// 칸 폭 ÷ 설계 폭(DESIGN_WIDTH). 카드는 항상 설계 폭으로 그린 뒤 이 배율로 줄인다 — 작성 칸과 줄바꿈·스티커 자리가 똑같아진다.
// 칸이 더 넓어도 키우지는 않는다(글자가 커지면 어색하다)
function useFitScale(outerRef, innerRef) {
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(null);
  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return undefined;
    const update = () => {
      const s = outer.clientWidth > 0 ? Math.min(1, outer.clientWidth / DESIGN_WIDTH) : 1;
      setScale(s);
      // offsetHeight 는 transform 전 값이라 배율을 곱하면 실제 차지할 높이
      setHeight(inner.offsetHeight * s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [outerRef, innerRef]);
  return { scale, height };
}

// 방명록 한 장 — 종이 카드 위에 손글씨. 위에 작성자가 고른 색의 테이프 한 조각, 작성자가 그린 스티커(위치·크기·회전·투명도·겹침 순서),
// 아래 오른쪽에 서명. 기울기는 새로고침마다 랜덤. canManage(로그인해서 남긴 본인 글)면 종이 아래에 수정·지우기,
// 관리자가 숨긴 글(state=hidden)은 흐리게 + 복원. compact: 관리자 목록 — 기울기만 없다
export default function GuestbookNote({ note, onEdit, onDelete, onRestore, compact = false }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const { scale, height } = useFitScale(outerRef, innerRef);
  const [tilt] = useState(() => (compact ? 0 : randomTilt()));
  const font = fontOf(note.font);
  const paper = paperOf(note.paper);
  const ink = inkColor(note.ink);
  const hidden = note.state === 'hidden';
  const drawings = [...(note.drawings ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const manage = Boolean(note.canManage && (onEdit || onDelete || onRestore));

  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: DESIGN_WIDTH }}>
      <div
        ref={outerRef}
        className={`relative w-full ${hidden ? 'opacity-50' : ''}`}
        style={{ height: height ?? undefined, transform: tilt ? `rotate(${tilt}deg)` : undefined }}
      >
        <article
          ref={innerRef}
          className="absolute left-0 top-0 border border-black/[0.07] px-[18px] pb-[14px] pt-[22px] shadow-[2px_3px_0_rgba(0,0,0,0.05)]"
          style={{ ...paperStyle(note.paper), width: DESIGN_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          {/* 테이프 조각 — 작성자가 고른 색(없으면 무채색), 반투명 */}
          <span
            aria-hidden
            className="absolute -top-[9px] left-1/2 h-[18px] w-[52px] -translate-x-1/2 rotate-[-2deg]"
            style={{ backgroundColor: `${tapeColor(note.tape)}b3` }}
          />
          {/* 얼룩은 저장된 씨앗으로 늘 같은 자리 (씨앗이 없는 옛 글은 글 번호로) */}
          {paper.marks && <PaperMarks kind={paper.marks} color={ink} seed={note.marksSeed ?? note.noteId ?? 1} />}

          <p className={`${font.className} relative whitespace-pre-wrap break-words antialiased`} style={textStyle(note.paper, note.font, ink, textAlignOf(note.align))}>
            {note.content}
          </p>

          {/* 아래 줄은 작성 칸과 같은 높이여야 한다(여백 mt-2 · 서명 18px + 밑줄 1px) — 칸에서 본 크기가 곧 카드 크기 (검토 지적 10/11) */}
          <div className="relative mt-2 flex items-end justify-between gap-2">
            <span className="text-[11px] tracking-[-0.02em] text-[#a3a09a]">
              {fmtDate(note.createdAt)}
              {hidden && <span className="ml-1 rounded-[2px] bg-inverse-2 px-1 text-[10px] text-inverse-fg">숨김</span>}
            </span>
            <span className={`${font.className} border-b border-transparent text-[18px]`} style={{ color: ink }}>
              — {note.displayName}
            </span>
          </div>

          {/* 작성자가 그려 붙인 스티커 — 위치·크기는 카드 기준 %, 배열 순서가 겹침 순서(뒤에 올수록 위).
              종이 밖으로 나간 부분은 잘라 보이지 않는다 — 커피 자국처럼 가장자리에 걸치게 붙일 수 있다 (PM 10/11) */}
          <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
          {drawings.map((d, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={d.drawingId}
              src={apiUrl(d.imageUrl)}
              alt=""
              draggable={false}
              className="pointer-events-none absolute select-none drop-shadow-[1px_1px_0_rgba(0,0,0,0.08)]"
              style={{
                left: `${d.posX}%`,
                top: `${d.posY}%`,
                width: `${d.widthPct}%`,
                opacity: d.opacity ?? 1,
                zIndex: 1 + i,
                transform: `translate(-50%, -50%) rotate(${d.rotation ?? 0}deg)`,
              }}
            />
          ))}
          </div>
        </article>
      </div>

      {/* 수정·지우기는 종이 밖(축소·기울기 없음)에 — 종이 안에 있으면 작성 칸에는 없는 줄이라 카드가 더 길어졌다 (검토 지적 10/11) */}
      {manage && (
        <div className="mt-1 flex justify-end gap-3 text-[12px] text-[#a3a09a]">
          {hidden ? (
            onRestore && (
              <button type="button" onClick={() => onRestore(note)} className="underline-offset-2 hover:text-ink-2 hover:underline">
                복원
              </button>
            )
          ) : (
            <>
              {onEdit && (
                <button type="button" onClick={() => onEdit(note)} className="underline-offset-2 hover:text-ink-2 hover:underline">
                  수정
                </button>
              )}
              {onDelete && (
                <button type="button" onClick={() => onDelete(note)} className="underline-offset-2 hover:text-ink-2 hover:underline">
                  지우기
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
