'use client';

import { useState } from 'react';
import { getErrorMessage } from '@/apis/auth';
import { writeGuestbookNote } from '@/apis/guestbook';
import useAuthStore from '@/stores/useAuthStore';
import { apiUrl } from '@/lib/apiBase';
import { toast } from '@/lib/toast';
import { INKS, LINE_HEIGHT_PX, PAPERS, STICKER_SLOTS, inkColor, linedStyle, paperClass, penFont } from './guestbookStyle';

const NAME_KEY = 'pilsaGuestbookName';
const readSavedName = () => {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
};

// 방명록 쓰기 칸 — 편지지 한 장을 그대로 쓰는 느낌. 쓰는 종이가 곧 미리보기다.
// 로그인이면 '회원 이름으로' 를 고를 수 있고(그때만 내 글로 남아 지울 수 있다), 아니면 닉네임을 적는다.
export default function GuestbookComposer({ stickers = [], maxLength = 300, maxStickers = 3, onPosted }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [name, setName] = useState(readSavedName);
  const [asMember, setAsMember] = useState(false);
  const [content, setContent] = useState('');
  const [ink, setInk] = useState(INKS[0].key);
  const [paper, setPaper] = useState(PAPERS[0].key);
  const [picked, setPicked] = useState([]); // stickerId 고른 순서
  const [sending, setSending] = useState(false);

  const toggleSticker = (id) => {
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= maxStickers) {
        toast.error(`스티커는 ${maxStickers}개까지 붙일 수 있어요.`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const submit = async () => {
    const useMember = isLoggedIn && asMember;
    if (!useMember && !name.trim()) {
      toast.error('이름이나 닉네임을 적어 주세요.');
      return;
    }
    if (!content.trim()) {
      toast.error('내용을 적어 주세요.');
      return;
    }
    setSending(true);
    try {
      const saved = await writeGuestbookNote({
        displayName: useMember ? null : name.trim(),
        asMember: useMember,
        content: content.trim(),
        ink,
        paper,
        stickerIds: picked,
      });
      try {
        if (!useMember) localStorage.setItem(NAME_KEY, name.trim());
      } catch {
        // 저장 못 해도 그만
      }
      setContent('');
      setPicked([]);
      toast.success('방명록에 한 장 붙였어요.');
      onPosted?.(saved);
    } catch (err) {
      toast.error(getErrorMessage(err, '남기지 못했어요. 잠시 뒤 다시 해 주세요.'));
    } finally {
      setSending(false);
    }
  };

  const lined = paper === 'lined';
  const pickedStickers = picked.map((id) => stickers.find((s) => s.stickerId === id)).filter(Boolean);

  return (
    <section className="flex flex-col gap-4">
      {/* 편지지 */}
      <div
        className={`relative border border-[#e3e0d8] px-[18px] pb-[14px] pt-[22px] shadow-[2px_3px_0_rgba(0,0,0,0.05)] ${paperClass(paper)}`}
      >
        <span aria-hidden className="absolute -top-[9px] left-1/2 h-[18px] w-[52px] -translate-x-1/2 rotate-[2deg] bg-[#d9d6cd]/70" />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
          placeholder="필사그래피에 한 줄 남겨 주세요."
          rows={4}
          className={`${penFont.className} w-full resize-none bg-transparent text-[22px] outline-none placeholder:text-[#b8b5ad] md:text-[24px]`}
          style={{ color: inkColor(ink), lineHeight: `${LINE_HEIGHT_PX}px`, ...(lined ? linedStyle : {}) }}
        />
        <div className="mt-2 flex items-end justify-between gap-3">
          <span className="text-[11px] text-[#a3a09a]">
            {content.length} / {maxLength}
          </span>
          <span className={`${penFont.className} flex items-center gap-1 text-[18px]`} style={{ color: inkColor(ink) }}>
            —
            {isLoggedIn && asMember ? (
              <span>회원 이름</span>
            ) : (
              <input
                type="text"
                value={name}
                maxLength={30}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름 또는 닉네임"
                className={`${penFont.className} w-[150px] border-b border-dashed border-[#b8b5ad] bg-transparent text-[18px] outline-none placeholder:text-[#b8b5ad]`}
                style={{ color: inkColor(ink) }}
              />
            )}
          </span>
        </div>
        {pickedStickers.map((s, i) => {
          const slot = STICKER_SLOTS[Math.min(i, STICKER_SLOTS.length - 1)];
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={s.stickerId}
              src={apiUrl(s.imageUrl)}
              alt={s.name}
              draggable={false}
              className={`pointer-events-none absolute h-[46px] w-[46px] select-none object-contain drop-shadow-[1px_1px_0_rgba(0,0,0,0.12)] ${slot.className}`}
              style={{ transform: `rotate(${slot.rotate}deg)` }}
            />
          );
        })}
      </div>

      {/* 문구 서랍: 잉크 · 종이 · 스티커 · 이름 방식 */}
      <div className="flex flex-col gap-3 rounded-[6px] border border-dashed border-[#cfcbc1] bg-white/60 p-3 text-[12px] text-[#6b6b6b]">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="w-[32px] text-[#a3a09a]">잉크</span>
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
          </div>
          <div className="flex items-center gap-2">
            <span className="w-[32px] text-[#a3a09a]">종이</span>
            {PAPERS.map((p) => (
              <button
                key={p.key}
                type="button"
                title={p.label}
                aria-label={p.label}
                aria-pressed={paper === p.key}
                onClick={() => setPaper(p.key)}
                className={`h-[22px] w-[22px] border ${p.className} ${paper === p.key ? 'border-[#212121] ring-1 ring-[#212121] ring-offset-1' : 'border-[#d4d1c8]'}`}
                style={p.key === 'lined' ? { backgroundImage: 'repeating-linear-gradient(transparent 0 5px, #d4d1c8 5px 6px)' } : undefined}
              />
            ))}
          </div>
          {isLoggedIn && (
            <label className="flex cursor-pointer items-center gap-[6px]">
              <input
                type="checkbox"
                checked={asMember}
                onChange={(e) => setAsMember(e.target.checked)}
                className="h-[14px] w-[14px] accent-[#212121]"
              />
              회원 이름으로 남기기
            </label>
          )}
        </div>

        {stickers.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-[32px] text-[#a3a09a]">스티커</span>
            {stickers.map((s) => {
              const on = picked.includes(s.stickerId);
              return (
                <button
                  key={s.stickerId}
                  type="button"
                  title={s.name}
                  aria-pressed={on}
                  onClick={() => toggleSticker(s.stickerId)}
                  className={`flex h-[44px] w-[44px] items-center justify-center rounded-[4px] border transition ${
                    on ? 'border-[#212121] bg-white' : 'border-transparent hover:border-[#d4d1c8]'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={apiUrl(s.imageUrl)} alt={s.name} draggable={false} className="h-[36px] w-[36px] object-contain" />
                </button>
              );
            })}
            <span className="text-[#a3a09a]">
              {picked.length}/{maxStickers}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] leading-[1.5] text-[#a3a09a]">
            이름이나 닉네임으로 누구나 남길 수 있어요. 회원 이름으로 남긴 글만 나중에 지울 수 있어요.
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={sending}
            className="h-[38px] shrink-0 rounded-[4px] bg-[#212121] px-5 text-[14px] text-white transition-colors hover:bg-black disabled:opacity-50"
          >
            {sending ? '붙이는 중' : '남기기'}
          </button>
        </div>
      </div>
    </section>
  );
}
