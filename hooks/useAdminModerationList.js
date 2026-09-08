'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import useDebouncedValue from '@/hooks/useDebouncedValue';
import useAdminBoardStore from '@/stores/useAdminBoardStore';
import { BOARD_FILTER_ALL, buildBoardFilterOptions } from '@/constants/adminPosts';
import { getReasonId } from '@/constants/report';
import { ROUTES } from '@/constants/routes';

const PAGE_SIZE = 10;

// 조치 모달을 닫고 안내 모달을 열기까지 기다리는 시간.
// 두 모달이 한 번에 떠 있으면 Radix가 body의 pointer-events를 되돌려놓지 못해
// 화면 전체가 클릭되지 않는다. ui/dialog.jsx의 퇴장 애니메이션(duration-200)만큼 띄운다.
// (신고 관리 ReportListSection도 같은 이유로 같은 값을 쓴다)
const DIALOG_HANDOFF_MS = 200;

/**
 * 관리자 - 게시글 관리 · 댓글 관리 목록 화면의 동작.
 *
 * 두 화면은 표에 무엇이 들어가는지만 다르고 나머지가 같다 —
 * 게시판 필터 · 검색(디바운스) · 페이지네이션 · 선택 · 블라인드/삭제 조치 · 부분 성공 안내.
 * 그래서 화면 컴포넌트에는 마크업만 남기고 여기로 모았다.
 * (신고 관리 API 연동에서 세 번째 사본이 생기지 않도록)
 *
 * @param {Function} store        목록 스토어 훅 (useAdminPostStore | useAdminCommentStore)
 * @param {string} idKey          행의 식별자 필드 ('postId' | 'commentId')
 * @param {string} contentKey     조치 모달의 '대상' 칸에 넣을 필드 ('title' | 'content')
 * @param {'post'|'comment'} reportTarget  '신고 관리로 이동'이 열 탭
 */
export default function useAdminModerationList({ store, idKey, contentKey, reportTarget }) {
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const [boardFilter, setBoardFilter] = useState(BOARD_FILTER_ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // 글자를 칠 때마다 조회하지 않도록 서버에 보낼 검색어만 늦춘다 (입력창은 즉시 반응)
  const searchKeyword = useDebouncedValue(searchQuery);

  const items = store((s) => s.data);
  const totalPages = store((s) => s.totalPages);
  const isLoading = store((s) => s.isLoading);
  const isSubmitting = store((s) => s.isSubmitting);
  const hasFetched = store((s) => s.hasFetched);
  const error = store((s) => s.error);
  const fetchList = store((s) => s.fetchList);
  const moderate = store((s) => s.moderate);
  const takeError = store((s) => s.takeError);
  const reset = store((s) => s.reset);

  // 게시판 필터 선택지는 관리자 게시판 목록에서 받아온다 (이름 하드코딩 금지).
  // 필터는 목록만 있으면 되므로 ensureBoards 로 부른다 —
  // 이미 받아둔 게 있으면 화면을 옮겨 다녀도 다시 받지 않는다.
  const boards = useAdminBoardStore((s) => s.data);
  const ensureBoards = useAdminBoardStore((s) => s.ensureBoards);

  // 블라인드 · 삭제 조치 모달 { action, ids, items }
  // Radix Dialog는 open이 false가 돼도 퇴장 애니메이션 동안 화면에 남는다.
  // 그때 대상 정보가 사라지면 제목이 '영구 삭제' → '블라인드'로 바뀌거나 표가 비어 보이므로,
  // 열림 여부만 따로 두고 대상 정보는 다음에 열 때까지 그대로 남겨둔다.
  const [moderationState, setModerationState] = useState(null);
  const [moderationOpen, setModerationOpen] = useState(false);
  const [alertState, setAlertState] = useState(null); // { title, description }

  // 안내 모달을 여는 타이머. 화면을 떠날 때 걷어내야 사라진 컴포넌트에 setState 하지 않는다.
  const handoffTimerRef = useRef(null);

  const boardFilterOptions = useMemo(() => buildBoardFilterOptions(boards), [boards]);

  useEffect(() => {
    ensureBoards();
  }, [ensureBoards]);

  // 화면을 떠나면 목록을 비운다 (스토어가 싱글턴이라 다음 진입 때 지난 페이지가 잠깐 보인다)
  useEffect(() => {
    return () => {
      clearTimeout(handoffTimerRef.current);
      reset();
    };
  }, [reset]);

  // 조회 조건을 한 곳에서 만든다 (첫 조회와 조치 후 재조회가 같은 조건을 써야 한다)
  const listParams = useMemo(
    () => ({
      page: currentPage,
      size: PAGE_SIZE,
      ...(boardFilter !== BOARD_FILTER_ALL ? { boardId: Number(boardFilter) } : {}),
      ...(searchKeyword.trim() ? { keyword: searchKeyword.trim() } : {}),
    }),
    [currentPage, boardFilter, searchKeyword]
  );

  // 검색어 디바운스가 아직 끝나지 않았는지.
  // 타이핑을 시작하면 페이지를 1로 되돌리는데, 그 사이에 조회가 나가면
  // '옛 검색어 + 1페이지'로 한 번, 디바운스가 끝나고 또 한 번 — 두 번 나간다.
  const isKeywordPending = searchQuery.trim() !== searchKeyword.trim();

  // 필터·검색·페이지네이션 모두 서버가 처리하므로 화면에서 자르지 않는다.
  useEffect(() => {
    if (isKeywordPending) return;
    fetchList(listParams);
  }, [fetchList, listParams, isKeywordPending]);

  // 삭제로 목록이 줄어 보던 페이지가 사라지면 빈 표에 갇힌다
  // (마지막 페이지의 항목을 모두 지운 경우). 남아 있는 마지막 페이지로 되돌린다.
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // 목록이 바뀌면 화면에 없는 항목이 선택된 채로 남지 않도록 선택을 비운다.
  const resetToFirstPage = () => {
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleBoardFilterChange = (value) => {
    setBoardFilter(value);
    resetToFirstPage();
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    resetToFirstPage();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedIds([]);
  };

  // 이미 담긴 id 는 다시 붙이지 않는다.
  // 체크박스가 같은 값으로 두 번 발화하면 선택 목록에 중복이 쌓이고,
  // 그대로 조치 요청에 실리면 작성자 벌점이 두 번 붙을 수 있다.
  const handleSelectOne = (id, checked) => {
    setSelectedIds((prev) => {
      if (!checked) return prev.filter((selected) => selected !== id);
      return prev.includes(id) ? prev : [...prev, id];
    });
  };

  // 전체 선택은 현재 페이지에 보이는 항목만 대상으로 한다.
  const handleSelectAll = (checked) => {
    setSelectedIds(checked ? items.map((item) => item[idKey]) : []);
  };

  // ── 블라인드 · 삭제 ───────────────────────────────────────────────────
  // 조치 모달에 넘길 대상 목록을 만든다.
  // 삭제하면 목록에서 사라지므로 열 때 한 번 떠서 들고 있는다.
  // 선택한 순서가 아니라 목록에 보이는 순서로 번호가 매겨지도록 items 에서 추린다.
  //
  // 대상 회원은 시안대로 '로그인ID / 학번 / 이름' 으로 보여준다.
  // 조립은 모달이 formatMemberLabel 로 처리하고, 값이 없는 필드는 알아서 빠진다
  // (탈퇴 회원처럼 로그인ID·학번이 null 로 오면 이름만 남는다).
  const buildModerationItems = (ids) => {
    const targetIds = new Set(ids);

    return items
      .filter((item) => targetIds.has(item[idKey]))
      .map((item) => ({
        id: item[idKey],
        // 모달(formatMemberLabel)이 쓰는 이름은 studentId 지만 서버 필드는 authorStudentNo 다
        user: {
          loginId: item.authorLoginId,
          studentId: item.authorStudentNo,
          name: item.authorName,
        },
        // 게시판 이름은 모달이 [게시판명]으로 따로 붙이므로 제목 · 댓글 내용만 넘긴다
        boardName: item.boardName,
        content: item[contentKey],
      }));
  };

  const openModeration = (action, ids) => {
    if (ids.length === 0) return;

    setModerationState({ action, ids, items: buildModerationItems(ids) });
    setModerationOpen(true);
  };

  const openBulkConfirm = (action) => openModeration(action, selectedIds);

  const openRowConfirm = (action, item) => openModeration(action, [item[idKey]]);

  // 조치 모달이 완전히 닫힌 뒤에 안내 모달을 연다.
  // 두 모달이 겹치면 화면 전체가 클릭되지 않는다 (DIALOG_HANDOFF_MS 참고).
  const showAlertAfterClose = (next) => {
    clearTimeout(handoffTimerRef.current);
    handoffTimerRef.current = setTimeout(() => setAlertState(next), DIALOG_HANDOFF_MS);
  };

  // 모달이 넘겨주는 { reason, detail } 로 조치를 요청한다.
  // 항목마다 독립 트랜잭션이라 일부만 실패할 수 있어(부분 성공) 응답을 보고 안내를 나눈다.
  const handleConfirm = async ({ reason, detail }) => {
    if (!moderationState || isSubmitting) return;

    const { action, ids } = moderationState;
    const actionLabel = action === 'delete' ? '삭제' : '블라인드';

    const result = await moderate(action, ids, { reasonId: getReasonId(reason), detail });

    // 성공이든 실패든 조치 모달을 먼저 닫는다. 열어둔 채로 안내 모달을 띄우면
    // 두 모달이 겹쳐 화면이 잠긴다. 실패해도 선택은 그대로라 다시 열어 재시도할 수 있다.
    setModerationOpen(false);

    // 요청 자체가 실패한 경우 (권한 · 네트워크 등)
    if (!result) {
      showAlertAfterClose({
        title: `${actionLabel} 처리에 실패했습니다.`,
        description: takeError() ?? '잠시 후 다시 시도해 주세요.',
      });
      return;
    }

    // 처리한 항목만 선택에서 뺀다. 행 단위 액션 때문에 다른 선택이 풀리면 안 된다.
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));

    // 삭제된 항목은 목록에서 빠지고 블라인드는 상태가 바뀐다 → 서버 목록을 다시 받는다
    await fetchList(listParams);

    // 일부만 실패했으면 어떤 항목이 왜 실패했는지 서버 문구를 그대로 보여준다
    const failures = Array.isArray(result.failures) ? result.failures : [];
    if (failures.length > 0) {
      showAlertAfterClose({
        title: `${result.successCount}건은 ${actionLabel} 처리했고 ${result.failCount}건은 실패했습니다.`,
        description: failures.map((failure) => `· ${failure.message}`).join('\n'),
      });
    }
  };

  // 블라인드된 항목은 신고 내역을 확인해 최종 판단(삭제 또는 복원)한다 → 신고 관리로 넘긴다.
  // TODO: 신고 관리 API 연동 후에는 해당 항목의 신고 내역으로 바로 보낼 것 (지금은 탭만 연다)
  const handleMoveToReport = () => {
    router.push(ROUTES.ADMIN_REPORTS_TAB(reportTarget));
  };

  // 첫 조회 중에만 안내문으로 덮는다. 이미 목록이 있으면 그대로 두고 버튼만 잠근다
  // (페이지를 넘길 때마다 표가 비었다 다시 차면 깜빡인다).
  // hasFetched 는 '아직 첫 응답 전'을 가린다 — 없으면 요청도 하기 전인 첫 프레임이
  // '결과 없음'으로 스친다 (isLoading 초기값이 false 라서).
  const isEmpty = items.length === 0;

  return {
    // 목록
    items,
    currentPage,
    totalPages,
    isSubmitting,
    isFirstLoad: !hasFetched || (isLoading && isEmpty),
    // 조치 중이거나 목록을 다시 받는 중. 표는 그대로 두고 버튼만 잠근다.
    // 조치 요청(isSubmitting)이 끝나도 뒤이은 재조회(isLoading)가 남아 있으므로 둘을 함께 본다 —
    // 바뀌는 중인 목록 위에서 다음 조치를 시작하지 못하게 하려는 것이다.
    isBusy: isSubmitting || isLoading,
    errorMessage: isEmpty && error ? error : '',

    // 필터 · 검색
    boardFilter,
    boardFilterOptions,
    searchQuery,
    handleBoardFilterChange,
    handleSearchChange,
    handlePageChange,

    // 선택
    selectedIds,
    // 선택 블라인드 · 선택 삭제는 고른 것이 있어야 의미가 있다.
    // openModeration 이 빈 목록을 걸러내긴 하지만, 눌러도 아무 일이 없으면
    // 조치가 실패한 것처럼 보이므로 버튼을 아예 잠근다.
    hasSelection: selectedIds.length > 0,
    handleSelectOne,
    handleSelectAll,

    // 조치
    moderationState,
    moderationOpen,
    closeModeration: () => setModerationOpen(false),
    openBulkConfirm,
    openRowConfirm,
    handleConfirm,
    handleMoveToReport,

    // 안내
    alertState,
    closeAlert: () => setAlertState(null),
  };
}
