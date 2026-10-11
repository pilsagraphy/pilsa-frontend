'use client';

// 얼룩(무지 잉크 자국 · 빈티지 커피 자국) 켬/끔 — '이번 학기' 배지만 한 작은 on/off 스위치 (PM 2026-10-11 "같은 가로 선에 그 정도 크기의 토글").
// 새로 쓸 때는 Guestbook 의 학기 머리줄 오른쪽 끝에, 고칠 때는 모달 안 종이 위에 놓인다
export default function MarksToggle({ kind, on, onChange, className = '' }) {
  const label = kind === 'coffee' ? '커피 자국' : '잉크 자국';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`${label} ${on ? '켬' : '끔'}`}
      onClick={() => onChange(!on)}
      className={`inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface pl-2 pr-[3px] text-[11px] font-medium text-ink-2 ${className}`}
    >
      {label}
      <span className={`relative inline-block h-[16px] w-[28px] rounded-full transition-colors ${on ? 'bg-inverse' : 'bg-line-strong'}`}>
        <span className={`absolute top-[2px] h-[12px] w-[12px] rounded-full bg-white shadow transition-all ${on ? 'left-[14px]' : 'left-[2px]'}`} />
      </span>
    </button>
  );
}
