'use client';

import { useEffect, useRef, useState } from 'react';
import { apiUrl } from '@/lib/apiBase';
import InkBlot from './InkBlot';
import { DESIGN_WIDTH, LINE_HEIGHT_PX, fontOf, inkColor, paperOf, paperStyle, textAlignOf } from './guestbookStyle';

const fmtDate = (iso) => (iso ? String(iso).slice(0, 10).replace(/-/g, '.') : '');

// 칸 폭 ÷ 설계 폭(320). 카드는 항상 320px 로 그린 뒤 이 배율로 줄인다 — 작성 칸과 줄바꿈·스티커 자리가 똑같아진다
function useFitScale(outerRef, innerRef) {
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(null);
  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return undefined;
    const update = () => {
      const s = outer.clientWidth > 0 ? outer.clientWidth / DESIGN_WIDTH : 1;
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

// 방명록 한 장 — 종이 카드 위에 손글씨. 위에 테이프 한 조각, 작성자가 그린 스티커(위치·크기·회전·투명도·겹침 순서), 아래 오른쪽에 서명.
// canManage(본인 또는 관리자)면 수정·지우기, 관리자가 숨긴 글(state=hidden)은 흐리게 + 복원.
// compact: 관리자 목록 — 기울기만 없다
export default function GuestbookNote({ note, onEdit, onDelete, onRestore, compact = false }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const { scale, height } = useFitScale(outerRef, innerRef);
  const font = fontOf(note.font);
  const paper = paperOf(note.paper);
  const ink = inkColor(note.ink);
  const hidden = note.state === 'hidden';
  const drawings = [...(note.drawings ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <div
      ref={outerRef}
      className={`relative w-full ${hidden ? 'opacity-50' : ''}`}
      style={{ height: height ?? undefined, transform: compact ? undefined : `rotate(${note.tilt ?? 0}deg)` }}
    >
      <article
        ref={innerRef}
        className="absolute left-0 top-0 border border-black/[0.07] px-[18px] pb-[14px] pt-[22px] shadow-[2px_3px_0_rgba(0,0,0,0.05)]"
        style={{ ...paperStyle(note.paper), width: DESIGN_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        {/* 테이프 조각 — 무채색 반투명 */}
        <span aria-hidden className="absolute -top-[9px] left-1/2 h-[18px] w-[52px] -translate-x-1/2 rotate-[-2deg] bg-[#d9d6cd]/70" />
        {/* 무지는 잉크 색 얼룩, 빈티지는 진한 커피색 얼룩 */}
        {paper.blot && <InkBlot color={paper.vintage ? '#6b4a2b' : ink} strength={paper.vintage ? 2.2 : 1} />}

        <p
          className={`${font.className} relative whitespace-pre-wrap break-words antialiased`}
          style={{
            color: ink,
            fontSize: `${Math.round(22 * font.scale)}px`,
            lineHeight: `${LINE_HEIGHT_PX}px`,
            textAlign: textAlignOf(note.align),
          }}
        >
          {note.content}
        </p>

        <div className="relative mt-3 flex items-end justify-between gap-2">
          <span className="text-[11px] tracking-[-0.02em] text-[#a3a09a]">
            {fmtDate(note.createdAt)}
            {hidden && <span className="ml-1 rounded-[2px] bg-[#454545] px-1 text-[10px] text-white">숨김</span>}
          </span>
          <span className={`${font.className} text-[17px]`} style={{ color: ink }}>
            — {note.displayName}
          </span>
        </div>

        {note.canManage && (onEdit || onDelete || onRestore) && (
          <div className="relative mt-1 flex justify-end gap-3 text-[12px] text-[#a3a09a]">
            {hidden ? (
              onRestore && (
                <button type="button" onClick={() => onRestore(note)} className="underline-offset-2 hover:text-[#454545] hover:underline">
                  복원
                </button>
              )
            ) : (
              <>
                {onEdit && (
                  <button type="button" onClick={() => onEdit(note)} className="underline-offset-2 hover:text-[#454545] hover:underline">
                    수정
                  </button>
                )}
                {onDelete && (
                  <button type="button" onClick={() => onDelete(note)} className="underline-offset-2 hover:text-[#454545] hover:underline">
                    지우기
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* 작성자가 그려 붙인 스티커 — 위치·크기는 카드 기준 %, 배열 순서가 겹침 순서(뒤에 올수록 위) */}
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
      </article>
    </div>
  );
}
