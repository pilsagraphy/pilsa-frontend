'use client';

// 학기 건너뛰기 드롭다운 — 한 페이지에 학기를 이어 붙인 화면(활동 사진·방명록)에서 고른 학기 구간으로 스크롤한다 (PM 2026-10-10 밤).
// 각 학기 구간은 id="sem-{라벨}" 과 scroll-margin 을 갖는다. 아직 안 불러온 학기는 onBeforeJump 가 먼저 채운다(방명록).
export const semesterAnchorId = (label) => `sem-${label}`;

export function scrollToSemester(label) {
  const el = document.getElementById(semesterAnchorId(label));
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function SemesterJump({ semesters = [], value, onJump, currentSemester, className = '' }) {
  if (semesters.length === 0) return null;
  return (
    <label className={`flex items-center gap-2 text-[13px] text-[#919191] ${className}`}>
      <span className="shrink-0">학기</span>
      <select
        value={value ?? ''}
        onChange={(e) => {
          if (e.target.value) onJump(e.target.value);
        }}
        className="h-[34px] rounded-[6px] border border-[#dedede] bg-white px-2 pr-7 text-[13px] text-[#212121] outline-none focus:border-[#919191]"
      >
        <option value="">건너뛰기…</option>
        {semesters.map((label) => (
          <option key={label} value={label}>
            {label}
            {label === currentSemester ? ' (이번 학기)' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
