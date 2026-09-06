'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getDrafts } from '@/apis/draft';
import { getErrorMessage } from '@/apis/auth';

// updatedAt(ISO) → 'YY.MM.DD' (피그마 예시 '26.00.00')
function formatDraftDate(iso) {
  const parts = String(iso ?? '').slice(0, 10).split('-');
  if (parts.length < 3) return '';
  return `${parts[0].slice(2)}.${parts[1]}.${parts[2]}`;
}

// 임시저장 글 불러오기 모달 (#183, 모바일 전용)
// 글쓰기 화면 '저장' 버튼으로 연다. 목록은 getDrafts, 선택 시 부모가 getDraft 로 폼에 채운다.
// 체크박스는 여러 개 체크되지만 폼은 하나뿐이라 '선택'은 1개만 허용한다.
export default function DraftLoadModal({ open, boardId, onClose, onSelect, onCountChange }) {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkedIds, setCheckedIds] = useState([]);

  useEffect(() => {
    if (!open || !boardId) return;

    let ignore = false;
    setLoading(true);
    setError('');
    setCheckedIds([]);

    getDrafts(boardId)
      .then((data) => {
        if (ignore) return;
        const list = Array.isArray(data?.drafts) ? data.drafts : [];
        setDrafts(list);
        onCountChange?.(list.length);
      })
      .catch((err) => {
        if (ignore) return;
        setError(getErrorMessage(err, '임시저장 글을 불러오지 못했습니다.'));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [open, boardId, onCountChange]);

  const toggle = (id) =>
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSelect = () => {
    if (checkedIds.length === 0) return;
    if (checkedIds.length > 1) {
      alert('임시저장 글은 하나만 불러올 수 있어요. 하나만 선택해주세요.');
      return;
    }
    onSelect?.(checkedIds[0]);
  };

  const showEmpty = !loading && !error && drafts.length === 0;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose?.()}>
      <DialogContent
        hideCloseButton
        overlayClassName="bg-black/30"
        className="flex max-w-[362px] flex-col items-center gap-[12px] rounded-[4px] border-[#212121] px-[16px] py-[20px]"
      >
        <DialogTitle className="text-[16px] font-semibold leading-[19px] tracking-tight text-[#454545]">
          임시저장 글 불러오기
        </DialogTitle>

        <div className="flex w-full flex-col">
          {loading && (
            <div className="py-6 text-center text-[14px] text-[#919191]">불러오는 중…</div>
          )}

          {!loading && error && (
            <div className="py-6 text-center text-[14px] text-[#919191]">{error}</div>
          )}

          {showEmpty && (
            <div className="py-6 text-center text-[14px] text-[#919191]">
              임시저장한 글이 없어요.
            </div>
          )}

          {!loading &&
            !error &&
            drafts.map((draft, index) => {
              const checked = checkedIds.includes(draft.draftId);
              return (
                <label
                  key={draft.draftId}
                  className={`flex h-[52px] w-full cursor-pointer items-center justify-between gap-[10px] px-[10px] ${
                    index > 0 ? 'border-t border-[#B9B9B9]' : ''
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-[10px]">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(draft.draftId)}
                      className="h-[24px] w-[24px] shrink-0 cursor-pointer rounded-[2px] border border-[#919191] accent-[#212121]"
                    />
                    <span className="min-w-0 truncate text-[16px] leading-[19px] text-[#454545]">
                      {draft.title || '(제목 없음)'}
                    </span>
                  </span>
                  <span className="shrink-0 text-[14px] leading-[17px] text-[#919191]">
                    {formatDraftDate(draft.updatedAt)}
                  </span>
                </label>
              );
            })}
        </div>

        <DialogFooter className="flex w-full flex-row justify-center gap-[12px] sm:justify-center sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-[48px] w-[87px] rounded-[4px] border-[#b9b9b9] text-[16px] text-[#212121]"
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleSelect}
            disabled={checkedIds.length === 0}
            className="h-[48px] w-[87px] rounded-[4px] bg-[#212121] text-[16px] text-white hover:bg-[#424242] disabled:opacity-60"
          >
            선택
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
