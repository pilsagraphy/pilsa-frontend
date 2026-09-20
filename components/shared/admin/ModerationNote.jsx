'use client';

import { formatShortDotDate } from '@/lib/boardDetail';

// 관리자 상세에서 '왜 이 상태인가'를 한 줄로.
//
// 서버가 글·댓글마다 마지막 조치(moderation)를 붙여 준다.
//  - 조치가 있고 actorName 이 있으면: 관리자 OOO 이 블라인드/삭제/복원 · 사유 · 날짜
//  - 조치가 있고 isAuto 면: 신고 누적 자동 블라인드 · 날짜
//  - 조치가 없는데 상태가 삭제면: 작성자가 스스로 지운 것
// 상태가 공개이고 조치도 없으면 아무것도 그리지 않는다.
const STATE_WORD = { blind: '블라인드', deleted: '삭제', normal: '복원' };

export default function ModerationNote({ state, moderation, className = '' }) {
  let text = null;

  if (moderation) {
    const what = STATE_WORD[moderation.appliedState] ?? moderation.appliedState;
    const reason = moderation.reasonLabel
      ? `${moderation.reasonLabel}${moderation.detail ? ` (${moderation.detail})` : ''}`
      : moderation.detail || null;
    const when = formatShortDotDate(moderation.createdAt);
    const who = moderation.isAuto
      ? '신고 누적 자동'
      : `관리자 ${moderation.actorName ?? '(탈퇴)'}`;
    text = [`${who} ${what}`, reason, when].filter(Boolean).join(' · ');
  } else if (state === 'deleted') {
    text = '작성자 삭제';
  }

  if (!text) return null;

  return (
    <p
      className={`rounded-[4px] bg-[#F5F5F5] px-[10px] py-[6px] text-[13px] leading-[1.6] tracking-[-0.26px] text-[#454545] [word-break:keep-all] ${className}`}
    >
      {text}
    </p>
  );
}
