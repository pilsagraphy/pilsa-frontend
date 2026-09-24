'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from '@/lib/toast';
import { GripVertical, Lock } from 'lucide-react';

import usePressDrag from '@/hooks/usePressDrag';

import { getErrorMessage } from '@/apis/auth';
import {
  createBoardCategory,
  deleteBoardCategory,
  getBoardCategories,
  updateBoardCategory,
} from '@/apis/admin/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import ConfirmModal from '@/components/common/ConfirmModal';

/**
 * 게시판별 카테고리(태그) 관리.
 *
 * 여기서 만든 카테고리는 그 게시판의 글쓰기 선택지와 목록 필터에 바로 나타난다.
 * 전에는 DB 를 직접 고쳐야만 바뀌었다 — 관리자가 만든 게시판은 태그를 아예 쓸 수 없었다는 뜻이다.
 *
 * 화면에서 지키는 두 가지 (서버도 같은 규칙으로 막는다):
 *  - '중요'는 상단 고정을 고르는 통로다. 이름을 바꾸거나 지우면 그 게시판에서 고정을 못 쓰게 되므로 잠가 둔다.
 *  - 글이 달고 있는 카테고리는 지우지 못한다. 그냥 지우면 그 글들의 배지만 조용히 사라진다.
 *    대신 몇 건이 쓰고 있는지 옆에 적어 둔다.
 */
export default function BoardCategoryModal({ board, open, onClose }) {
  const boardId = board?.boardId;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null); // 삭제 확인 중인 카테고리

  const load = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);
    setError('');
    try {
      setCategories(await getBoardCategories(boardId));
    } catch (err) {
      setError(getErrorMessage(err, '카테고리를 불러오지 못했습니다.'));
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (open) {
      setNewName('');
      setEditingId(null);
      load();
    }
  }, [open, load]);

  // 서버가 막은 이유(409·400)를 그대로 보여 준다 — 화면이 따로 지어내면 이유가 어긋난다
  const run = async (action, successMessage) => {
    setBusy(true);
    try {
      await action();
      if (successMessage) toast.success(successMessage);
      await load();
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err, '처리하지 못했습니다.'));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) {
      toast.error('카테고리 이름을 입력해 주세요.');
      return;
    }
    const ok = await run(() => createBoardCategory(boardId, { name }), '카테고리를 추가했습니다.');
    if (ok) setNewName('');
  };

  const handleRename = async (category) => {
    const name = editingName.trim();
    setEditingId(null);
    if (!name || name === category.name) return;
    await run(() => updateBoardCategory(boardId, category.categoryId, { name }), '이름을 바꿨습니다.');
  };

  const handleDelete = (category) => setDeleteTarget(category);

  const confirmDelete = async () => {
    const category = deleteTarget;
    setDeleteTarget(null);
    if (!category) return;
    await run(() => deleteBoardCategory(boardId, category.categoryId), '카테고리를 삭제했습니다.');
  };

  // 순서는 게시판 카드와 같은 손맛 — 손잡이를 꾹 눌러 들고 끌어 놓는다.
  // '중요'는 늘 맨 뒤라 목록에서 빼고 센다. 서버에는 '몇 번째 자리'(1부터)만 보내면 나머지가 밀린다
  const movable = categories.filter((item) => !item.isPinned);
  const drag = usePressDrag({
    disabled: busy,
    onMove: (from, to) => {
      const target = movable[from];
      if (!target) return;
      run(() => updateBoardCategory(boardId, target.categoryId, { displayOrder: to + 1 }));
    },
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose?.()}>
      <DialogContent
        // 열리자마자 '새 카테고리 이름'에 커서가 가서 폰 키보드가 올라왔다 — 목록부터 보는 화면이다
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="max-h-[85vh] w-[calc(100vw-32px)] max-w-[520px] gap-[16px] overflow-y-auto rounded-[6px] border-[#dedede] p-[20px] sm:p-[24px]">
        <DialogTitle className="text-[18px] font-semibold leading-[1.5] tracking-[-0.36px] text-[#212121]">
          {board?.boardName ?? '게시판'} 카테고리
        </DialogTitle>
        <DialogDescription className="text-[13px] leading-[1.7] tracking-[-0.26px] text-[#757575] [word-break:keep-all]">
          이 게시판의 글쓰기 선택지와 목록 필터에 바로 반영됩니다. 공개 중인 글이 달고 있는
          카테고리는 지울 수 없어요(관리자가 삭제한 글은 세지 않아요).{' '}
          <strong className="font-semibold text-[#454545]">중요</strong>는 상단 고정에 쓰는
          카테고리라 모든 게시판에 항상 있고, 이름을 바꾸거나 지울 수 없어요.
        </DialogDescription>

        {/* 목록 */}
        <div ref={drag.listRef} className="flex flex-col border-t border-[#B9B9B9]">
          {loading ? (
            <p className="py-8 text-center text-[14px] text-[#919191]">불러오는 중...</p>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <p className="text-[14px] text-[#919191]">{error}</p>
              <button
                type="button"
                onClick={load}
                className="text-[14px] text-[#919191] underline hover:text-[#212121]"
              >
                다시 시도
              </button>
            </div>
          ) : categories.length === 0 ? (
            <p className="py-8 text-center text-[14px] text-[#919191]">
              카테고리가 없습니다. 아래에서 추가해 주세요.
            </p>
          ) : (
            categories.map((category) => {
              const editing = editingId === category.categoryId;
              const inUse = (category.postCount ?? 0) > 0;
              // 끌 수 있는 목록 안에서의 자리. '중요'는 -1 (안 움직인다)
              const index = movable.findIndex((item) => item.categoryId === category.categoryId);
              const lifted = index >= 0 && drag.liftedIndex === index;
              const from = drag.liftedIndex ?? -1;
              const lineAbove = index >= 0 && drag.dropIndex === index && index < from;
              const lineBelow = index >= 0 && drag.dropIndex === index && index > from;

              return (
                <div
                  key={category.categoryId}
                  data-drag-item={index >= 0 ? '' : undefined}
                  className={`flex items-center gap-2 border-b border-[#EEEEEE] py-[10px] transition-opacity ${
                    lifted ? 'opacity-40' : ''
                  } ${lineAbove ? 'border-t-2 border-t-[#212121]' : ''} ${
                    lineBelow ? '!border-b-2 !border-b-[#212121]' : ''
                  }`}
                >
                  {/* 순서 손잡이 — '중요'는 늘 맨 뒤라 손잡이가 없다 */}
                  {category.isPinned ? (
                    <span className="size-7 shrink-0" aria-hidden />
                  ) : (
                    <button
                      type="button"
                      aria-label="꾹 눌러서 순서 바꾸기"
                      title="꾹 눌러서 순서 바꾸기"
                      disabled={busy}
                      {...drag.handleProps(index)}
                      className={`grid size-7 shrink-0 touch-none select-none place-items-center rounded-[4px] text-[#B9B9B9] ${
                        lifted ? 'bg-[#F0F0F0] text-[#212121]' : 'active:bg-[#F5F5F5]'
                      }`}
                    >
                      <GripVertical size={16} />
                    </button>
                  )}

                  {editing ? (
                    <Input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleRename(category)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(category);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="h-[34px] min-w-0 flex-1 rounded-[4px] border-[#212121] text-[15px]"
                    />
                  ) : (
                    <span className="flex min-w-0 flex-1 items-center gap-[6px]">
                      <span className="min-w-0 truncate text-[15px] leading-[1.6] text-[#212121]">
                        {category.name}
                      </span>
                      {category.isPinned && (
                        <Lock size={13} className="shrink-0 text-[#919191]" aria-label="잠김" />
                      )}
                      <span className="shrink-0 text-[12px] text-[#919191]">
                        글 {category.postCount ?? 0}
                      </span>
                    </span>
                  )}

                  {category.isPinned ? (
                    <span className="shrink-0 text-[12px] leading-[1.5] text-[#919191]">
                      상단 고정용
                    </span>
                  ) : (
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setEditingId(category.categoryId);
                          setEditingName(category.name);
                        }}
                        className="rounded-[4px] border border-[#b9b9b9] px-2 py-[3px] text-[13px] text-[#454545] hover:bg-[#F5F5F5]"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        disabled={busy || inUse}
                        title={inUse ? '이 카테고리를 쓰는 글이 있어 지울 수 없어요' : undefined}
                        onClick={() => handleDelete(category)}
                        className="rounded-[4px] border border-[#b9b9b9] px-2 py-[3px] text-[13px] text-[#454545] hover:bg-[#F5F5F5] disabled:border-[#E0E0E0] disabled:text-[#C4C4C4]"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 추가 */}
        <form onSubmit={handleCreate} className="flex items-center gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="새 카테고리 이름"
            maxLength={50}
            className="h-[40px] min-w-0 flex-1 rounded-[4px] border-[#b9b9b9] text-[15px]"
          />
          <Button
            type="submit"
            disabled={busy}
            className="h-[40px] shrink-0 rounded-[4px] bg-[#212121] px-4 text-[15px] text-white"
          >
            추가
          </Button>
        </form>

        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="h-[44px] w-full rounded-[4px] border-[#b9b9b9] text-[15px] text-[#212121]"
        >
          닫기
        </Button>
      </DialogContent>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={`'${deleteTarget?.name ?? ''}' 카테고리를 삭제할까요?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Dialog>
  );
}
