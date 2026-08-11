'use client';

import { useMemo, useState } from 'react';

import PaginationWithEllipsis from '@/components/shared/PaginationWithEllipsis';
import AlertModal from '@/components/common/AlertModal';
import { Button } from '@/components/ui/button';

import BoardTable from './BoardTable';
import BoardFormModal from './BoardFormModal';
import { DUMMY_BOARDS, BOARD_READ_ROLES } from '@/constants/adminBoards';

const PAGE_SIZE = 10;

// 두 액션 버튼이 디자인상 크기가 같아 클래스를 공유한다.
const actionButtonClass = 'h-[52px] w-[180px] rounded-[4px] text-[16px] font-normal';

export default function BoardListSection({ title = '게시판 관리' }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  // 권한 변경 · 순서 변경 결과가 화면에 남아야 해서 목록을 상태로 들고 간다.
  // TODO: API 연동 시 서버 응답(목록·totalPages)을 사용하고 변경도 서버에 위임할 것
  const [boards, setBoards] = useState(DUMMY_BOARDS);

  // 순서 변경(드래그) 상태
  const [draggingId, setDraggingId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);

  // 게시판 수정 · 생성 모달
  const [formModal, setFormModal] = useState(null); // { mode, board }
  const [alertState, setAlertState] = useState(null); // { title, description }

  // priority가 작을수록 위에 표시된다.
  const sortedBoards = useMemo(
    () => [...boards].sort((a, b) => a.priority - b.priority),
    [boards]
  );

  // 놓았을 때 실제로 들어갈 자리를 표시선으로 알려준다.
  // 아래로 끌면 대상 '아래', 위로 끌면 대상 '위'에 놓인다.
  const dropPosition = useMemo(() => {
    if (draggingId === null || dropTargetId === null || draggingId === dropTargetId) return null;

    const fromIndex = sortedBoards.findIndex((board) => board.id === draggingId);
    const toIndex = sortedBoards.findIndex((board) => board.id === dropTargetId);
    if (fromIndex === -1 || toIndex === -1) return null;

    return fromIndex < toIndex ? 'below' : 'above';
  }, [draggingId, dropTargetId, sortedBoards]);

  const totalPages = Math.max(1, Math.ceil(sortedBoards.length / PAGE_SIZE));

  const pagedBoards = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedBoards.slice(start, start + PAGE_SIZE);
  }, [sortedBoards, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedIds([]);
  };

  const handleSelectOne = (boardId, checked) => {
    setSelectedIds((prev) => (checked ? [...prev, boardId] : prev.filter((id) => id !== boardId)));
  };

  // 전체 선택은 현재 페이지에 보이는 게시판만 대상으로 한다.
  const handleSelectAll = (checked) => {
    setSelectedIds(checked ? pagedBoards.map((board) => board.id) : []);
  };

  // 행에서 열람 · 작성 권한 select로 값을 바꿨을 때
  // TODO: API 연동 시 서버에 변경 요청을 보내고 응답으로 목록을 갱신할 것
  const handleFieldChange = (boardId, field, value) => {
    setBoards((prev) =>
      prev.map((board) => (board.id === boardId ? { ...board, [field]: value } : board))
    );
  };

  // ── 순서 변경 (네이티브 HTML5 drag & drop) ───────────────────────────
  // TODO: API 연동 시 변경된 priority 목록을 서버에 저장할 것
  const handleDrop = (targetId) => {
    if (draggingId === null || draggingId === targetId) {
      setDraggingId(null);
      setDropTargetId(null);
      return;
    }

    setBoards((prev) => {
      const sorted = [...prev].sort((a, b) => a.priority - b.priority);
      const from = sorted.findIndex((board) => board.id === draggingId);
      const to = sorted.findIndex((board) => board.id === targetId);
      if (from === -1 || to === -1) return prev;

      const [moved] = sorted.splice(from, 1);
      sorted.splice(to, 0, moved);

      // 옮긴 뒤 순서대로 priority를 다시 부여한다.
      return sorted.map((board, index) => ({ ...board, priority: index + 1 }));
    });

    setDraggingId(null);
    setDropTargetId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTargetId(null);
  };

  // ── 게시판 수정 · 생성 ────────────────────────────────────────────────
  const handleOpenEdit = () => {
    if (selectedIds.length !== 1) {
      setAlertState({
        title: '수정할 게시판을 선택해 주세요.',
        description: '게시판 하나만 선택한 뒤 다시 시도해 주세요.',
      });
      return;
    }

    const target = boards.find((board) => board.id === selectedIds[0]);
    setFormModal({ mode: 'edit', board: target });
  };

  const handleOpenCreate = () => {
    setFormModal({ mode: 'create', board: null });
  };

  // TODO: API 연동 시 생성 · 수정 요청을 보내고 응답으로 목록을 갱신할 것
  const handleFormSubmit = ({ boardName, writePermission }) => {
    if (formModal?.mode === 'edit') {
      const targetId = formModal.board?.id;
      setBoards((prev) =>
        prev.map((board) => (board.id === targetId ? { ...board, boardName, writePermission } : board))
      );
    } else {
      setBoards((prev) => {
        const nextId = prev.reduce((max, board) => Math.max(max, board.id), 0) + 1;
        const nextPriority = prev.reduce((max, board) => Math.max(max, board.priority), 0) + 1;

        return [
          ...prev,
          {
            id: nextId,
            boardName,
            postCount: 0,
            // 열람 권한은 목록에서 변경하도록 기본값으로 만든다.
            readPermission: BOARD_READ_ROLES.STUDENT,
            writePermission,
            priority: nextPriority,
          },
        ];
      });
    }

    setFormModal(null);
    setSelectedIds([]);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col bg-white px-4 py-4 sm:px-6 sm:py-7 md:p-10">
      <h2 className="my-[15px] font-['Pretendard',sans-serif] text-[20px] font-semibold leading-[1.5] tracking-[-0.02em] text-[#212121] md:text-[24px]">
        {title}
      </h2>

      {/* 목록 (왼쪽) / 선택 게시판 수정 · 새 게시판 생성 (오른쪽) */}
      <div className="mb-[5px] mt-[5px] flex flex-col gap-3 md:mb-4 md:mt-[10px] md:flex-row md:items-center md:justify-between">
        <span className="text-[18px] leading-[1.6] tracking-[-0.36px] text-[#212121]">목록</span>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleOpenEdit}
            className={`${actionButtonClass} border-[#212121] text-[#212121]`}
          >
            선택 게시판 수정
          </Button>
          <Button
            type="button"
            onClick={handleOpenCreate}
            className={`${actionButtonClass} bg-[#212121] text-white`}
          >
            새 게시판 생성
          </Button>
        </div>
      </div>

      <BoardTable
        boards={pagedBoards}
        selectedIds={selectedIds}
        onSelectOne={handleSelectOne}
        onSelectAll={handleSelectAll}
        onFieldChange={handleFieldChange}
        draggingId={draggingId}
        dropTargetId={dropTargetId}
        dropPosition={dropPosition}
        onDragStart={setDraggingId}
        onDragOver={setDropTargetId}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
      />

      <div className="mt-6 mb-16 flex justify-center md:mt-[34px] md:mb-[120px]">
        <PaginationWithEllipsis
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* 게시판 수정 · 생성 모달 */}
      <BoardFormModal
        open={Boolean(formModal)}
        mode={formModal?.mode ?? 'create'}
        board={formModal?.board ?? null}
        onClose={() => setFormModal(null)}
        onSubmit={handleFormSubmit}
      />

      {/* 안내 모달 */}
      <AlertModal
        open={Boolean(alertState)}
        title={alertState?.title ?? ''}
        description={alertState?.description ?? ''}
        onClose={() => setAlertState(null)}
      />
    </div>
  );
}
