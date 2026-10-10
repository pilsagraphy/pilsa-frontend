'use client';

import { apiUrl } from '@/lib/apiBase';
import { LINE_HEIGHT_PX, STICKER_SLOTS, inkColor, linedStyle, paperClass, penFont } from './guestbookStyle';

const fmtDate = (iso) => (iso ? String(iso).slice(0, 10).replace(/-/g, '.') : '');

// 방명록 한 장 — 종이 카드 위에 손글씨. 위에 테이프 한 조각, 모서리에 스티커, 아래 오른쪽에 서명.
// compact: 관리자 목록처럼 좁은 자리에 쓸 때(기울기 없음, 작은 글씨)
export default function GuestbookNote({ note, onDelete, compact = false }) {
  const lined = note.paper === 'lined';
  return (
    <article
      className={`relative break-inside-avoid border border-[#e3e0d8] px-[18px] pb-[14px] pt-[22px] shadow-[2px_3px_0_rgba(0,0,0,0.05)] ${paperClass(
        note.paper
      )}`}
      style={{ transform: compact ? undefined : `rotate(${note.tilt ?? 0}deg)` }}
    >
      {/* 테이프 조각 — 무채색 반투명 */}
      <span
        aria-hidden
        className="absolute -top-[9px] left-1/2 h-[18px] w-[52px] -translate-x-1/2 rotate-[-2deg] bg-[#d9d6cd]/70"
      />

      {/* 글씨가 번지지 않게 — 테이프의 backdrop-blur 가 카드를 합성 레이어로 만들어 회전된 글자가 비트맵처럼 흐려졌다(10/10 밤). 블러는 뺐다 */}
      <p
        className={`${penFont.className} whitespace-pre-wrap break-words antialiased ${compact ? 'text-[18px]' : 'text-[21px] md:text-[23px]'}`}
        style={{
          color: inkColor(note.ink),
          lineHeight: `${LINE_HEIGHT_PX}px`,
          ...(lined ? linedStyle : {}),
        }}
      >
        {note.content}
      </p>

      <div className="mt-3 flex items-end justify-between gap-2">
        <span className="text-[11px] tracking-[-0.02em] text-[#a3a09a]">{fmtDate(note.createdAt)}</span>
        <span className={`${penFont.className} flex items-center gap-1 text-[17px]`} style={{ color: inkColor(note.ink) }}>
          — {note.displayName}
          {note.isMember && (
            <span
              aria-label="회원"
              title="회원 이름으로 남긴 글"
              className="ml-1 inline-block rounded-[2px] border border-[#8d8d8d] px-[3px] font-sans text-[9px] leading-[14px] text-[#8d8d8d]"
            >
              회원
            </span>
          )}
        </span>
      </div>

      {note.isMine && onDelete && (
        <button
          type="button"
          onClick={() => onDelete(note)}
          className="mt-1 text-[11px] text-[#a3a09a] underline-offset-2 hover:text-[#454545] hover:underline"
        >
          지우기
        </button>
      )}

      {/* 스티커 — 관리자가 등록한 그림을 모서리에 */}
      {(note.stickers ?? []).map((s, i) => {
        const slot = STICKER_SLOTS[Math.min(s.slot ?? i, STICKER_SLOTS.length - 1)];
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${s.stickerId}-${i}`}
            src={apiUrl(s.imageUrl)}
            alt={s.name ?? ''}
            title={s.name ?? ''}
            draggable={false}
            className={`pointer-events-none absolute h-[46px] w-[46px] select-none object-contain drop-shadow-[1px_1px_0_rgba(0,0,0,0.12)] ${slot.className}`}
            style={{ transform: `rotate(${slot.rotate}deg)` }}
          />
        );
      })}
    </article>
  );
}
