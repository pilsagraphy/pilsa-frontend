'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { formatSlashDateTime } from '@/lib/boardDetail';

// 관리자 상세의 '이전 본문'.
//
// 서버가 세 시점의 본문을 남긴다 — 신고가 들어온 순간, 작성자가 고치기 직전, 관리자가 조치한 순간.
// 작성자가 신고당한 뒤 지워지기 전에 고쳐 버려도, 관리자는 여기서 그때 문장을 본다.
// 기본은 접혀 있다 — 평소에는 지금 본문만 보면 되고, 검토할 때만 편다.
const TRIGGER_LABEL = {
  report: '신고 시점',
  edit: '수정 전',
  moderation: '조치 시점',
};

export default function ContentRevisions({ revisions = [], compact = false }) {
  const [open, setOpen] = useState(false);
  const list = Array.isArray(revisions) ? revisions : [];
  if (list.length === 0) return null;

  // 최근 것이 위로 — 검토는 보통 마지막 상태부터 거슬러 올라간다
  const ordered = [...list].reverse();

  return (
    <div className={compact ? 'mt-[4px]' : 'mt-[8px]'}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="inline-flex items-center gap-[4px] text-[13px] leading-[1.6] tracking-[-0.26px] text-[#757575] underline underline-offset-2 hover:text-[#212121]"
      >
        이전 본문 {list.length}건
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <ol className="mt-[6px] flex flex-col gap-[6px]">
          {ordered.map((rev) => (
            <li
              key={rev.revisionId}
              className="rounded-[6px] border border-[#E5E5E5] bg-[#FAFAFA] px-[12px] py-[8px]"
            >
              <div className="flex flex-wrap items-center gap-x-[8px] gap-y-[2px] text-[12px] leading-[1.6] tracking-[-0.24px] text-[#919191]">
                <span className="rounded-full border border-[#B9B9B9] px-[7px] text-[#454545]">
                  {TRIGGER_LABEL[rev.triggerType] ?? rev.triggerType}
                </span>
                <span>{rev.savedByName ?? (rev.triggerType === 'moderation' ? '자동' : '(탈퇴)')}</span>
                <span>{formatSlashDateTime(rev.createdAt)}</span>
              </div>
              {rev.title && (
                <p className="mt-[4px] text-[14px] font-semibold leading-[1.5] tracking-[-0.28px] text-[#212121]">
                  {rev.title}
                </p>
              )}
              <p className="mt-[4px] whitespace-pre-line break-words text-[14px] leading-[1.6] tracking-[-0.28px] text-[#454545]">
                {rev.content}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
