'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import PaginationWithEllipsis from '@/components/shared/PaginationWithEllipsis';
import AlertModal from '@/components/common/AlertModal';
import { Button } from '@/components/ui/button';
import {
  actionButtonClass,
  listSectionClass,
  listSubtitleClass,
  listTitleClass,
} from '@/components/shared/admin/CommunityListStyles';
import useAdminBoardStore from '@/stores/useAdminBoardStore';

import BoardTable from './BoardTable';
import BoardFormModal from './BoardFormModal';

const PAGE_SIZE = 10;

// Radix Dialog는 닫히는 애니메이션(ui/dialog.jsx의 duration-200) 동안 화면에 남는다.
// 그 사이에 다른 모달을 열면 body의 pointer-events가 되돌려지지 않아
// 화면 전체가 클릭되지 않는 일이 생긴다. 모달을 이어 띄울 때는 이만큼 기다린다.
const DIALOG_HANDOFF_MS = 200;

export default function BoardListSection({ title = '게시판 관리' }) {
  const [currentPage, setCurrentPage] = useState(1);

  // 순서 변경(드래그) 상태
  const [draggingId, setDraggingId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);

  // 순서 변경은 요청을 여러 건 순차로 보낸다. 그 사이 스토어의 isLoading 이 요청마다
  // true → false 를 반복해서 잠깐씩 풀리므로, 진행 중임을 따로 들고 있어야 한다.
  //  - ref  : 다시 들어오는 것을 막는 판정용 (렌더를 기다리지 않고 즉시 반영된다)
  //  - state: 그동안 드래그 핸들과 버튼을 잠가두는 표시용 (렌더가 필요하다)
  const reorderingRef = useRef(false);
  const [isReordering, setIsReordering] = useState(false);

  // 게시판 수정 · 생성 모달
  const [formModal, setFormModal] = useState(null); // { mode, board }
  const [alertState, setAlertState] = useState(null); // { title, description }

  // 목록은 서버가 정답이다. 화면에서 따로 들고 있지 않고 스토어의 data를 그대로 쓴다.
  const boards = useAdminBoardStore((state) => state.data);
  const isLoading = useAdminBoardStore((state) => state.isLoading);
  const error = useAdminBoardStore((state) => state.error);
  const fetchBoards = useAdminBoardStore((state) => state.fetchBoards);
  const createBoard = useAdminBoardStore((state) => state.createBoard);
  const updateBoard = useAdminBoardStore((state) => state.updateBoard);

  // 모달을 이어 띄울 때 쓰는 대기 타이머.
  // 화면을 벗어나면 취소해서, 사라진 컴포넌트의 상태를 건드리지 않게 한다.
  const handoffTimerRef = useRef(null);
  useEffect(() => () => clearTimeout(handoffTimerRef.current), []);

  const waitForDialogClose = () =>
    new Promise((resolve) => {
      handoffTimerRef.current = setTimeout(resolve, DIALOG_HANDOFF_MS);
    });

  useEffect(() => {
    const load = async () => {
      const result = await fetchBoards();
      if (result) return;

      // 목록이 비어 있으면 표 안에 실패 문구가 뜨므로 모달까지 띄우지 않는다.
      // 이미 목록이 있는데 재조회가 실패한 경우는 표에 표시할 자리가 없어(옛 목록이 그대로 남는다)
      // 안내 모달로 알린다. 그러지 않으면 오래된 목록을 최신인 줄 알고 작업하게 된다.
      const { data: loaded, error: loadError } = useAdminBoardStore.getState();
      if (loaded.length === 0) return;

      setAlertState({
        title: loadError ?? '게시판 목록을 새로 불러오지 못했습니다.',
        description: '지금 보이는 목록은 최신이 아닐 수 있습니다.',
      });
    };

    load();
  }, [fetchBoards]);

  // 네 가지 화면 상태를 나눈다.
  //  - 첫 로딩  : 목록이 아직 없는데 요청 중        → 표에 '불러오는 중입니다.'
  //  - 에러     : 목록이 비어 있고 실패            → 표에 서버 문장
  //  - 데이터 없음 : 요청이 끝났고 실패도 아닌데 0건 → 표에 '등록된 게시판이 없습니다.'
  //  - 데이터 있음 : 목록 렌더링
  // 목록이 이미 있는 상태에서의 실패(삭제 실패 등)를 표에 넣으면 목록이 사라져 버리므로,
  // 그때는 표를 그대로 두고 안내 모달로 알린다.
  const isEmpty = boards.length === 0;
  const isFirstLoading = isLoading && isEmpty;
  const listErrorMessage = isEmpty && error ? error : '';
  // 순서 변경은 요청 사이에 isLoading 이 잠깐 풀리므로 isReordering 을 함께 본다.
  // 그러지 않으면 요청 도중에 드래그가 다시 열려 두 작업이 겹칠 수 있다.
  const isSaving = (isLoading && !isEmpty) || isReordering;
  const isBusy = isLoading || isReordering;

  // 실패한 조치를 안내 모달로 알린다.
  // 스토어 액션은 실패 시 null을 주므로, 그 직후의 최신 error를 읽어 쓴다.
  const alertStoreError = (fallbackTitle) => {
    const message = useAdminBoardStore.getState().error;
    setAlertState({ title: message ?? fallbackTitle });
  };

  // displayOrder가 작을수록 위에 표시된다.
  const sortedBoards = useMemo(
    () => [...boards].sort((a, b) => a.displayOrder - b.displayOrder),
    [boards]
  );

  // 놓았을 때 실제로 들어갈 자리를 표시선으로 알려준다.
  // 아래로 끌면 대상 '아래', 위로 끌면 대상 '위'에 놓인다.
  const dropPosition = useMemo(() => {
    if (draggingId === null || dropTargetId === null || draggingId === dropTargetId) return null;

    const fromIndex = sortedBoards.findIndex((board) => board.boardId === draggingId);
    const toIndex = sortedBoards.findIndex((board) => board.boardId === dropTargetId);
    if (fromIndex === -1 || toIndex === -1) return null;

    return fromIndex < toIndex ? 'below' : 'above';
  }, [draggingId, dropTargetId, sortedBoards]);

  const totalPages = Math.max(1, Math.ceil(sortedBoards.length / PAGE_SIZE));

  // 삭제·생성으로 목록 길이가 바뀌어 currentPage가 사라진 페이지를 가리킬 수 있다.
  const page = Math.min(currentPage, totalPages);

  const pagedBoards = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedBoards.slice(start, start + PAGE_SIZE);
  }, [sortedBoards, page]);

  // ── 순서 변경 (네이티브 HTML5 drag & drop) ───────────────────────────
  // 여러 건을 한 번에 재정렬하는 API가 없다. 그래서 옮긴 결과를 화면에서 1..N으로 계산하고,
  // 번호가 실제로 바뀐 게시판만 골라 하나씩 보낸다.
  //
  // 옮긴 게시판 하나만 보내면 안 된다. 서버가 나머지를 밀어주지 않아서
  // displayOrder 가 중복되고(예: 1,2,2,3,3), 표시선이 알려준 자리와 결과가 달라진다.
  const handleDrop = async (targetId) => {
    const fromId = draggingId;
    setDraggingId(null);
    setDropTargetId(null);

    // 앞선 순서 변경이 아직 끝나지 않았으면 무시한다.
    // 반쯤 번호가 바뀐 목록에서 계산하면 두 작업이 뒤엉켜 엉뚱한 순서가 된다.
    if (reorderingRef.current) return;
    if (fromId === null || fromId === targetId) return;

    const fromIndex = sortedBoards.findIndex((board) => board.boardId === fromId);
    const toIndex = sortedBoards.findIndex((board) => board.boardId === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    // 뽑아낸 뒤 toIndex 에 끼우면, 아래로 끌면 대상 '아래' · 위로 끌면 대상 '위'가 된다.
    // (dropPosition 이 그리는 표시선과 같은 계산이라 미리보기와 결과가 일치한다)
    const reordered = [...sortedBoards];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    // 번호가 그대로인 게시판은 보내지 않는다 (요청 수를 줄인다)
    const changed = reordered
      .map((board, index) => ({ board, displayOrder: index + 1 }))
      .filter(({ board, displayOrder }) => board.displayOrder !== displayOrder);

    if (changed.length === 0) return;

    reorderingRef.current = true;
    setIsReordering(true);

    try {
      for (const { board, displayOrder } of changed) {
        // 순차로 보낸다. 중간에 실패하면 순서가 반쯤 적용된 상태이므로
        // 화면에서 짐작하지 않고 목록을 다시 받아 서버의 실제 상태를 보여준다.
        // eslint-disable-next-line no-await-in-loop
        const updated = await updateBoard(board.boardId, { displayOrder });
        if (updated) continue;

        const message = useAdminBoardStore.getState().error;
        // eslint-disable-next-line no-await-in-loop
        await fetchBoards();
        setAlertState({
          title: message ?? '게시판 순서를 바꾸지 못했습니다.',
          description: '순서가 일부만 적용됐을 수 있습니다. 목록을 다시 확인해 주세요.',
        });
        return;
      }
    } finally {
      // 성공 · 실패 · 중간 이탈 어느 경로로 빠져나가도 잠금을 반드시 푼다
      reorderingRef.current = false;
      setIsReordering(false);
    }
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTargetId(null);
  };

  // ── 게시판 수정 · 생성 · 삭제 ─────────────────────────────────────────
  // 권한은 표에서 바로 못 바꾼다(읽기 전용). 행의 '수정'으로 모달을 열어서 고친다.
  const handleOpenEdit = (board) => {
    setFormModal({ mode: 'edit', board });
  };

  const handleOpenCreate = () => {
    setFormModal({ mode: 'create', board: null });
  };

  // 모달이 넘겨주는 값은 서버 형식({ name, readScope, writeLevel })이다.
  const handleFormSubmit = async ({ name, readScope, writeLevel }) => {
    const isEdit = formModal?.mode === 'edit';

    const result = isEdit
      ? await updateBoard(formModal.board?.boardId, { name, readScope, writeLevel })
      : await createBoard({ name, readScope, writeLevel });

    setFormModal(null);

    if (!result) {
      // 이름 중복(409) 등 서버가 알려준 이유를 그대로 보여준다.
      // 모달이 완전히 닫힌 뒤 안내한다 — 겹쳐 띄우면 화면이 클릭되지 않는다.
      await waitForDialogClose();
      alertStoreError(isEdit ? '게시판 정보를 수정하지 못했습니다.' : '게시판을 만들지 못했습니다.');
    }
  };

  return (
    <div className={listSectionClass}>
      <h2 className={listTitleClass}>{title}</h2>

      {/* 목록 (왼쪽) / 새 게시판 생성 (오른쪽)
          수정은 시안대로 표의 '관리' 열에서 행마다 처리한다. */}
      <div className="mb-[5px] mt-[5px] flex flex-col gap-3 md:mb-4 md:mt-[10px] md:flex-row md:items-center md:justify-between">
        <span className={listSubtitleClass}>목록</span>

        <Button
          type="button"
          onClick={handleOpenCreate}
          disabled={isBusy}
          className={`${actionButtonClass} bg-[#212121] text-white`}
        >
          새 게시판 생성
        </Button>
      </div>

      <BoardTable
        boards={pagedBoards}
        onEdit={handleOpenEdit}
        loading={isFirstLoading}
        saving={isSaving}
        errorMessage={listErrorMessage}
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
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
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
