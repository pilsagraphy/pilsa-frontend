'use client';

import HintPopover from '@/components/shared/HintPopover';
import { MODERATION_LEGEND } from '@/constants/moderation';

// 관리자 목록 제목 옆 (i) — 조치 종류가 각각 무슨 뜻인지 (PM, 2026-09-27).
// 마이페이지 활동 카드의 풍선(HintPopover)을 그대로 쓴다. 항목이 여섯이라 풍선만 조금 넓힌다.
export default function ModerationLegend({ className = '' }) {
  return (
    <HintPopover label="조치 종류 설명" width={320} className={className}>
      <span className="mb-1 block font-semibold">조치 종류</span>
      <dl className="flex flex-col gap-[6px]">
        {MODERATION_LEGEND.map((kind) => (
          <div key={kind.label}>
            <dt className="font-semibold">{kind.label}</dt>
            <dd className="text-[#dedede] [word-break:keep-all]">{kind.description}</dd>
          </div>
        ))}
      </dl>
    </HintPopover>
  );
}
