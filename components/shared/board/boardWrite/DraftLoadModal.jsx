'use client';

import React, { useEffect, useState } from 'react';

import RowActionButton from '@/components/shared/admin/RowActionButton';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { formatDraftDate } from '@/lib/draft';

// 체크박스 색은 시안 지정값을 쓴다 — 기본 #FFFFFF / 호버 #919191 / 선택 #212121.
const CHECKBOX_CLASS = [
  'h-[24px] w-[24px] shrink-0 rounded-[2px] border-ink-3 bg-surface shadow-none',
  'hover:border-ink-3 hover:bg-ink-3',
  'data-[state=checked]:border-ink data-[state=checked]:bg-inverse data-[state=checked]:text-inverse-fg',
  'focus-visible:ring-2 focus-visible:ring-ink',
].join(' ');

// 임시저장 글 불러오기 모달.
// 데이터 조회/삭제/선택 상태는 부모에서 관리하고,
// 이 컴포넌트는 모바일 시안에 맞춘 UI와 단일 선택만 담당한다.
export default function DraftLoadModal({
  open,
  drafts = [],
  loading = false,
  error = '',
  onCancel,
  onSelect,
  onDelete,
  deletingId = null,
}) {
  const [selectedId, setSelectedId] = useState(null);

  // 모달을 다시 열면 이전 선택 초기화
  useEffect(() => {
    if (open) setSelectedId(null);
  }, [open]);

  // 선택했던 초안이 삭제 등으로 목록에서 사라지면 선택 해제
  useEffect(() => {
    if (selectedId == null) return;
    if (!drafts.some((draft) => draft.draftId === selectedId)) {
      setSelectedId(null);
    }
  }, [drafts, selectedId]);

  const isEmpty = drafts.length === 0;
  const emptyMessage = !isEmpty
    ? ''
    : loading
      ? '불러오는 중…'
      : error
        ? error
        : '임시저장한 글이 없어요.';

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel?.()}>
      <DialogContent
        hideCloseButton
        overlayClassName="bg-black/30"
        className="flex max-w-[362px] flex-col items-center gap-[12px] rounded-[4px] border-ink px-[16px] py-[20px]"
      >
        <DialogTitle className="text-[16px] font-semibold leading-[19px] tracking-tight text-ink-2">
          임시저장 글 불러오기
        </DialogTitle>

        <div className="flex w-full flex-col">
          {emptyMessage ? (
            <div className="py-6 text-center text-[14px] text-ink-3">{emptyMessage}</div>
          ) : (
            drafts.map((draft, index) => (
              <label
                key={draft.draftId}
                className={`flex min-h-[52px] w-full cursor-pointer items-center justify-between gap-[10px] px-[10px] ${
                  index > 0 ? 'border-t border-line-strong' : ''
                }`}
              >
                <span className="flex min-w-0 flex-1 items-center gap-[10px]">
                  <Checkbox
                    className={CHECKBOX_CLASS}
                    checked={selectedId === draft.draftId}
                    onCheckedChange={(next) => setSelectedId(next ? draft.draftId : null)}
                    aria-label={`${draft.title || '제목 없음'} 임시저장 글 선택`}
                  />

                  <span className="min-w-0 truncate text-[16px] leading-[19px] text-ink-2">
                    {draft.title || '(제목 없음)'}
                  </span>
                </span>

                <span className="shrink-0 text-[14px] leading-[17px] text-ink-3">
                  {formatDraftDate(draft.updatedAt)}
                </span>

                {onDelete && (
                  <RowActionButton
                    className="min-w-[44px]"
                    disabled={deletingId !== null}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(draft);
                    }}
                  >
                    삭제
                  </RowActionButton>
                )}
              </label>
            ))
          )}
        </div>

        <DialogFooter className="flex w-full flex-row justify-center gap-[12px] sm:justify-center sm:space-x-0">
          <button
            type="button"
            onClick={onCancel}
            className="h-[48px] w-[87px] cursor-pointer rounded-[4px] border border-line-strong bg-surface text-[16px] text-ink"
          >
            취소
          </button>

          <button
            type="button"
            disabled={!selectedId}
            onClick={() => onSelect?.(selectedId)}
            className="h-[48px] w-[87px] cursor-pointer rounded-[4px] bg-inverse text-[16px] text-inverse-fg transition-colors hover:bg-inverse-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            선택
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
