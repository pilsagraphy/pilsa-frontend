'use client';

import React, { useEffect, useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { formatDraftDate } from '@/lib/draft';

// 체크박스 색은 시안 지정값을 쓴다 — 기본 #FFFFFF / 호버 #919191 / 선택 #212121.
// 기본 Checkbox 는 border-primary·bg-primary 를 갖고 있어 cn(twMerge) 으로 덮어써야 한다.
const CHECKBOX_CLASS = [
  'h-[20px] w-[20px] shrink-0 rounded-[2px] border-[#b9b9b9] bg-white shadow-none',
  'hover:border-[#919191] hover:bg-[#919191]',
  'data-[state=checked]:border-[#212121] data-[state=checked]:bg-[#212121] data-[state=checked]:text-white',
  'focus-visible:ring-2 focus-visible:ring-[#212121]',
].join(' ');

const ROW_CLASS =
  'flex cursor-pointer items-center gap-[12px] border-b border-[#dedede] px-[24px] py-[14px] transition-colors hover:bg-[#fafafa]';

// 임시저장 글 불러오기 모달.
// 한 번에 한 개만 고를 수 있다 (중복선택 불가) — 지금 폼을 그 초안으로 갈아끼우는 동작이라
// 여러 개를 동시에 이어쓸 수가 없다. 모양은 시안대로 체크박스를 쓰고 선택은 하나로 묶는다.
export default function DraftLoadModal({
  open,
  drafts = [],
  loading = false,
  error = '',
  onCancel,
  onSelect,
}) {
  const [selectedId, setSelectedId] = useState(null);

  // 닫았다 다시 열면 이전 선택이 남아 있지 않게 비운다
  useEffect(() => {
    if (open) setSelectedId(null);
  }, [open]);

  // 불러오는 중 · 실패 · 빈 목록일 때 목록 자리에 보여줄 안내문.
  // 이미 목록이 있는데 다시 받는 중이라면(모달을 다시 열었을 때) 안내문으로 덮지 않는다 —
  // 있던 줄이 사라졌다 나타나며 깜빡인다.
  const isEmpty = drafts.length === 0;
  const emptyMessage = !isEmpty
    ? ''
    : loading
      ? '불러오는 중입니다.'
      : error
        ? error
        : '임시저장한 글이 없습니다.';

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel?.()}>
      <DialogContent
        hideCloseButton
        className="max-w-[560px] gap-0 rounded-[4px] border-[#dedede] p-0"
      >
        <DialogTitle className="px-[24px] pb-[16px] pt-[24px] text-[16px] font-normal leading-[1.6] tracking-[-0.32px] text-[#212121]">
          임시저장 글
        </DialogTitle>

        <div className="border-t border-[#dedede]">
          {emptyMessage ? (
            <p className="px-[24px] py-[32px] text-center text-[14px] tracking-[-0.28px] text-[#919191]">
              {emptyMessage}
            </p>
          ) : (
            drafts.map((draft) => (
              <label key={draft.draftId} className={ROW_CLASS}>
                <Checkbox
                  className={CHECKBOX_CLASS}
                  checked={selectedId === draft.draftId}
                  // 하나만 고를 수 있다 — 다른 것을 누르면 이전 선택이 풀린다
                  onCheckedChange={(next) => setSelectedId(next ? draft.draftId : null)}
                  aria-label={`${draft.title || '제목 없음'} 임시저장 글 선택`}
                />

                {/* 제목이 길면 잘라 보여준다 (시안) */}
                <span className="w-[130px] shrink-0 truncate text-[14px] tracking-[-0.28px] text-[#212121]">
                  {draft.title || '(제목 없음)'}
                </span>

                {/* preview 는 서버가 본문 앞 20자까지만 잘라 보내준다 */}
                <span className="min-w-0 flex-1 truncate text-[14px] tracking-[-0.28px] text-[#919191]">
                  {draft.preview}
                </span>

                <span className="shrink-0 text-[14px] tracking-[-0.28px] text-[#919191]">
                  {formatDraftDate(draft.updatedAt)}
                </span>
              </label>
            ))
          )}
        </div>

        <DialogFooter className="flex flex-row justify-end gap-[12px] px-[24px] pb-[24px] pt-[20px] sm:justify-end sm:space-x-0">
          <button
            type="button"
            onClick={onCancel}
            className="h-[44px] w-[80px] cursor-pointer rounded-[4px] border border-[#b9b9b9] bg-white text-[15px] tracking-[-0.3px] text-[#212121] transition-colors hover:bg-gray-50"
          >
            취소
          </button>

          {/* loading 은 스토어 공용이라 자동저장이 돌 때도 켜진다.
              그걸로 버튼을 잠그면 30초마다 잠깐씩 눌리지 않으므로 선택 여부만 본다. */}
          <button
            type="button"
            disabled={!selectedId}
            onClick={() => onSelect?.(selectedId)}
            className="h-[44px] w-[80px] cursor-pointer rounded-[4px] bg-[#212121] text-[15px] tracking-[-0.3px] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            선택
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
