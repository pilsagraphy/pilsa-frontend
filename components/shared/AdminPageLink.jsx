'use client';

import Link from 'next/link';
import useAuthStore from '@/stores/useAuthStore';

// 관리자에게만 보이는 '관리 페이지' 버튼 — 방명록·활동 사진처럼 회원 화면에서 바로 관리 화면으로 건너간다 (PM 2026-10-10 밤)
export default function AdminPageLink({ href, label = '관리 페이지', className = '' }) {
  const adminLevel = useAuthStore((s) => s.adminLevel);
  if (!(adminLevel >= 1)) return null;
  return (
    <Link
      href={href}
      className={`inline-flex h-[34px] shrink-0 items-center gap-1 rounded-[6px] border border-[#212121] bg-white px-3 text-[13px] text-[#212121] transition-colors hover:bg-[#f5f5f5] ${className}`}
    >
      <span aria-hidden>⚙</span>
      {label}
    </Link>
  );
}
