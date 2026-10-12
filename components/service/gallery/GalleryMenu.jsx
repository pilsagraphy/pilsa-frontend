'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MoreVertical } from 'lucide-react';
import useAuthStore from '@/stores/useAuthStore';
import { ROUTES } from '@/constants/routes';

// 활동 사진 머리줄의 ⋮ 메뉴 — 사진 올리기 · 내가 올린 사진 관리(켬/끔) · 관리자 메뉴로 이동(관리자만) (PM 2026-10-12 "세로 점 세 개에 모아")
// 관리자가 남의 사진을 고치는 건 사진 관리 메뉴에서만. 내 사진도 '관리' 를 켜야 ✎·× 가 뜬다.
export default function GalleryMenu({ manageMine, onUpload, onToggleManage }) {
  const adminLevel = useAuthStore((s) => s.adminLevel);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [open]);

  const item = 'flex h-[42px] w-full items-center px-4 text-left text-[14px] tracking-[-0.02em] text-ink-2 hover:bg-surface-2';

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-label="활동 사진 메뉴"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex h-[34px] w-[34px] items-center justify-center rounded-[6px] border transition-colors ${
          manageMine ? 'border-ink bg-inverse text-inverse-fg' : 'border-line bg-surface text-ink hover:bg-surface-2'
        }`}
      >
        <MoreVertical size={18} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-[40px] z-20 w-[200px] overflow-hidden rounded-[10px] border border-line bg-elevated py-1 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => {
              setOpen(false);
              onUpload();
            }}
          >
            + 사진 올리기
          </button>
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => {
              setOpen(false);
              onToggleManage();
            }}
          >
            {manageMine ? '관리 끝내기' : '내가 올린 사진 관리'}
          </button>
          {adminLevel >= 1 && (
            <Link href={ROUTES.ADMIN_GALLERY} role="menuitem" className={`${item} border-t border-line`} onClick={() => setOpen(false)}>
              ⚙ 사진 관리 (관리자)
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
