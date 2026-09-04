'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import AlertModal from '@/components/common/AlertModal';
import PaginationWithEllipsis from '@/components/shared/PaginationWithEllipsis';
import SearchInput from '@/components/shared/board/boardList/SearchInput';
import SortSelect from '@/components/shared/board/boardList/SortSelect';
import {
  actionButtonClass,
  listSectionClass,
  listTitleClass,
} from '@/components/shared/admin/CommunityListStyles';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  BOARD_FILTER_ALL,
  REPORT_ACTION_DELETE,
  REPORT_ACTION_LABELS,
  REPORT_ACTION_RESTORE,
  REPORT_SORT_LATEST,
  REPORT_SORT_OPTIONS,
  REPORT_TARGET_LABELS,
  REPORT_TARGET_POST,
  STATUS_FILTER_ALL,
  STATUS_FILTER_OPTIONS,
  buildBoardFilterOptions,
  getReasonIdByCode,
  getReportPanelId,
  getReportTabId,
  isDeletable,
} from '@/constants/adminReports';
import useAdminReportStore from '@/stores/useAdminReportStore';
import useBoardStore from '@/stores/useBoardStore';

import ReportActionModal from './ReportActionModal';
import ReportTable from './ReportTable';
import ReportTabs from './ReportTabs';

const PAGE_SIZE = 10;

// 검색어를 한 글자 칠 때마다 요청이 나가지 않도록 입력이 멎을 때까지 기다린다
const SEARCH_DEBOUNCE_MS = 300;

// 안내 모달을 닫은 뒤 이어서 처리 모달을 열 때 기다리는 시간.
// 두 모달이 한 번에 겹치면 Radix가 body의 pointer-events를 되돌려놓지 못해
// 화면 전체가 클릭되지 않는 일이 생긴다. ui/dialog.jsx의 퇴장 애니메이션(duration-200)만큼 띄운다.
const DIALOG_HANDOFF_MS = 200;

export default function ReportListSection({ title = '신고 관리' }) {
  // 게시글 신고 / 댓글 신고 탭
  const [targetType, setTargetType] = useState(REPORT_TARGET_POST);

  const [currentPage, setCurrentPage] = useState(1);
  const [boardFilter, setBoardFilter] = useState(BOARD_FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [searchQuery, setSearchQuery] = useState('');
  // 서버에 실제로 보내는 검색어 (입력이 멎은 뒤에 따라온다)
  const [searchKeyword, setSearchKeyword] = useState('');
  // 선택 체크박스. 목록이 대상 단위로 그룹핑되어 오므로 신고 id 가 아니라 targetId 로 고른다
  const [selectedIds, setSelectedIds] = useState([]);

  const { isLoading, error, items, totalPages, fetchReports, runReportAction } =
    useAdminReportStore();

  // 게시판 필터 선택지. 게시판이 새로 생겨도 따라오도록 게시판 목록 API 를 쓴다
  const boards = useBoardStore((state) => state.data);
  const fetchBoards = useBoardStore((state) => state.fetchBoards);

  // 복원 · 삭제 확인 모달 { action, ids, items }
  // Radix Dialog는 open이 false가 돼도 퇴장 애니메이션 동안 화면에 남는다.
  // 그때 대상 정보가 사라지면 제목이 '삭제' → '복원'으로 바뀌거나 표가 비어 보이므로,
  // 열림 여부만 따로 두고 대상 정보는 다음에 열 때까지 그대로 남겨둔다.
  const [actionState, setActionState] = useState(null);
  const [actionOpen, setActionOpen] = useState(false);
  const [alertState, setAlertState] = useState(null); // { title, description }
  // 조치 요청이 나가 있는 동안 확인 버튼을 두 번 누르지 못하게 막는다
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 안내 모달을 닫으면 이어서 열어야 하는 처리 (삭제된 항목을 빼고 남은 대상)
  const [pendingAction, setPendingAction] = useState(null);
  const handoffTimerRef = useRef(null);
  // 처리 모달 → 결과 안내로 넘길 때 쓰는 타이머 (위와 같은 pointer-events 문제를 피한다)
  const resultTimerRef = useRef(null);

  // 예약된 처리 창 열기를 취소한다.
  // 남겨두면 다른 조치를 시작한 뒤에 옛 타이머가 터져서 이미 열린 모달의 대상을 덮어쓴다.
  const cancelHandoff = () => clearTimeout(handoffTimerRef.current);

  // 안내를 닫은 직후 화면을 벗어나면 타이머가 남아 사라진 컴포넌트의 상태를 건드린다
  useEffect(
    () => () => {
      clearTimeout(handoffTimerRef.current);
      clearTimeout(resultTimerRef.current);
    },
    []
  );

  const targetLabel = REPORT_TARGET_LABELS[targetType];

  const boardFilterOptions = useMemo(() => buildBoardFilterOptions(boards), [boards]);

  // 기획: 복원한 건도 '복원' 상태로 목록에 남는다. 그래서 서버가 준 목록을 그대로 그린다
  const reports = items;

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  // 입력이 멎으면 그때 검색어를 확정한다
  useEffect(() => {
    const timer = setTimeout(() => setSearchKeyword(searchQuery), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 검색어가 바뀌면 1페이지부터 다시 본다.
  // (입력 중에 페이지를 옮기지 않으려고 확정된 검색어를 기준으로 되돌린다)
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchKeyword]);

  // 목록 조회 — 탭 · 페이지 · 필터 · 검색어가 바뀔 때마다 서버에 다시 물어본다.
  // 거르기 · 정렬 · 잘라내기를 모두 서버가 하므로 화면은 받은 것을 그대로 그린다.
  const reloadKey = `${targetType}|${currentPage}|${boardFilter}|${statusFilter}|${searchKeyword}`;

  useEffect(() => {
    fetchReports(targetType, {
      page: currentPage,
      size: PAGE_SIZE,
      // 'all' 은 서버가 모르는 값이다 — 필터를 걸지 않을 때는 아예 보내지 않는다
      state: statusFilter === STATUS_FILTER_ALL ? undefined : statusFilter,
      boardId: boardFilter === BOARD_FILTER_ALL ? undefined : Number(boardFilter),
      keyword: searchKeyword,
      sort: REPORT_SORT_LATEST,
    });
    // reloadKey 하나로 묶어 조건이 바뀔 때만 다시 부른다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey, fetchReports]);

  // 복원으로 목록이 줄어 currentPage가 사라진 페이지를 가리키면 빈 목록이 보인다.
  // 서버가 알려준 마지막 페이지로 되돌린다.
  useEffect(() => {
    if (isLoading) return;
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [isLoading, currentPage, totalPages]);

  // 목록이 바뀌면 화면에 없는 신고가 선택된 채로 남지 않도록 선택을 비운다.
  const resetToFirstPage = () => {
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleTabChange = (value) => {
    if (value === targetType) return;
    setTargetType(value);
    // 탭을 옮기면 대상 종류가 달라지므로 필터·검색·선택을 모두 초기화한다.
    setBoardFilter(BOARD_FILTER_ALL);
    setStatusFilter(STATUS_FILTER_ALL);
    setSearchQuery('');
    setSearchKeyword('');
    resetToFirstPage();
  };

  const handleBoardFilterChange = (value) => {
    setBoardFilter(value);
    resetToFirstPage();
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    resetToFirstPage();
  };

  const handlePageChange = (nextPage) => {
    setCurrentPage(nextPage);
    setSelectedIds([]);
  };

  const handleSelectOne = (targetId, checked) => {
    setSelectedIds((prev) =>
      checked ? [...prev, targetId] : prev.filter((id) => id !== targetId)
    );
  };

  // 전체 선택은 현재 페이지에 보이는 신고만 대상으로 한다.
  const handleSelectAll = (checked) => {
    setSelectedIds(checked ? reports.map((report) => report.targetId) : []);
  };

  // ── 복원 · 삭제 ───────────────────────────────────────────────────────
  // 확인 모달에 넘길 대상 목록을 만든다.
  // 조치하면 목록이 바뀌므로 열 때 한 번 떠서 들고 있는다.
  // 선택한 순서가 아니라 목록에 보이는 순서로 나열되도록 현재 목록에서 추린다.
  const buildActionItems = (ids) => {
    const targetIds = new Set(ids);
    return reports.filter((report) => targetIds.has(report.targetId));
  };

  // fromBulk: 선택 복원 · 선택 삭제로 시작한 조치인지. 처리 후 선택을 비울지 판단에 쓴다.
  const openAction = (action, ids, fromBulk = false) => {
    // 앞선 안내에서 예약된 열기가 남아 있으면 취소한다.
    // 그대로 두면 이 모달이 열린 뒤 옛 타이머가 대상을 바꿔버린다.
    cancelHandoff();
    setPendingAction(null);

    setActionState({ action, ids, items: buildActionItems(ids), fromBulk });
    setActionOpen(true);
  };

  // 선택 액션. 삭제된 항목이 섞여 있으면 안내부터 하고, 남은 것만으로 처리 창을 연다.
  const openBulkConfirm = (action) => {
    const actionLabel = REPORT_ACTION_LABELS[action];

    // 새 안내를 띄우기 전에 앞선 안내가 예약해 둔 열기를 취소한다
    cancelHandoff();

    if (selectedIds.length === 0) {
      // 이어서 할 일이 없는 안내라 버튼은 기본값('닫기')을 쓴다
      setPendingAction(null);
      setAlertState({
        title: `${actionLabel}할 ${targetLabel}을 선택해 주세요.`,
        description: `목록에서 ${targetLabel}을 선택한 뒤 다시 시도해 주세요.`,
      });
      return;
    }

    // 복원은 블라인드든 삭제든 언제나 할 수 있어서 걸러낼 것이 없다.
    // 이미 삭제된 것을 다시 삭제하는 경우에만 대상에서 빼고 안내한다.
    const selected = buildActionItems(selectedIds);
    const allowed = action === REPORT_ACTION_DELETE ? selected.filter(isDeletable) : selected;
    const blocked = selected.length - allowed.length;

    if (blocked === 0) {
      openAction(action, selectedIds, true);
      return;
    }

    // 처리할 것이 남아 있으면 안내를 닫은 뒤 이어서 처리 창을 연다.
    // 하나도 남지 않으면 안내만 하고 끝낸다.
    setAlertState({
      title: `이미 삭제된 ${targetLabel}은 다시 삭제할 수 없습니다.`,
      description:
        allowed.length > 0
          ? `선택한 ${selected.length}건 중 삭제된 ${blocked}건을 제외하고\n${allowed.length}건만 ${actionLabel} 처리합니다.`
          : `선택한 ${selected.length}건이 모두 삭제된 ${targetLabel}입니다.`,
      // 남은 대상이 있으면 누른 뒤 처리 창으로 이어지므로 '확인',
      // 처리할 것이 없으면 그냥 닫고 끝나므로 '닫기'.
      closeText: allowed.length > 0 ? '확인' : '닫기',
    });

    setPendingAction(
      allowed.length > 0
        ? { action, ids: allowed.map((report) => report.targetId), items: allowed, fromBulk: true }
        : null
    );
  };

  // 안내 모달을 닫을 때 - 이어서 처리할 것이 있으면 잠시 뒤 처리 창을 연다
  const handleAlertClose = () => {
    setAlertState(null);
    if (!pendingAction) return;

    const next = pendingAction;
    setPendingAction(null);

    // 이전 예약이 남아 있으면 지운 뒤 새로 잡는다 (타이머 참조를 덮어쓰면 옛 것이 새어 나간다)
    cancelHandoff();
    handoffTimerRef.current = setTimeout(() => {
      setActionState(next);
      setActionOpen(true);
    }, DIALOG_HANDOFF_MS);
  };

  // 조치 결과 안내문. 항목마다 독립 트랜잭션이라 일부만 성공하는 경우가 정상 응답으로 온다
  const buildResultAlert = (actionLabel, data) => {
    const successCount = data?.successCount ?? 0;
    const failures = data?.failures ?? [];
    const failCount = data?.failCount ?? failures.length;

    if (failCount === 0) {
      return {
        title: `${successCount}건을 ${actionLabel} 처리했습니다.`,
        description: '',
      };
    }

    // 같은 사유로 여러 건이 실패하면 같은 문장이 반복되므로 사유별로 묶어 보여준다
    const reasons = [...new Set(failures.map(({ message }) => message))];

    return {
      title:
        successCount > 0
          ? `${successCount}건만 ${actionLabel} 처리했습니다.`
          : `${actionLabel} 처리하지 못했습니다.`,
      description: [`실패 ${failCount}건`, ...reasons.map((message) => `· ${message}`)].join('\n'),
    };
  };

  // 처리 모달의 확인 - 서버에 조치를 보내고, 결과를 안내한 뒤 목록을 다시 불러온다.
  // 응답만 보고 화면의 목록을 직접 고치지 않는다 — 부분 실패가 있고, 조치 뒤 그 행의 상태가
  // 어떻게 바뀌는지는 서버가 정하므로 프론트가 추측하면 실제와 어긋난다.
  const handleConfirm = async ({ reason, detail } = {}) => {
    if (!actionState || isSubmitting) return;

    const { action, ids, fromBulk } = actionState;
    const actionLabel = REPORT_ACTION_LABELS[action];

    setIsSubmitting(true);

    const result = await runReportAction(action, {
      targetType,
      targetIds: ids,
      // 복원은 사유를 받지 않는다. 삭제는 셀렉트가 code('SPAM')를 주므로 서버가 받는 숫자로 바꾼다
      // (변환에 실패해 null 이 되면 서버가 대표 신고 사유를 쓴다)
      reasonId: action === REPORT_ACTION_DELETE ? getReasonIdByCode(reason) : undefined,
      detail,
    });

    setIsSubmitting(false);
    setActionOpen(false);

    // 선택 액션을 확정했으면 그 선택은 다 쓴 것으로 보고 전부 비운다.
    // 처리한 것만 빼면, 삭제되어 제외된 항목이 체크된 채로 남아
    // 다음 작업을 하려면 하나하나 풀어야 한다.
    // 행 단위 버튼으로 시작한 조치는 그 한 건만 빼서 남은 선택을 건드리지 않는다.
    setSelectedIds((prev) => (fromBulk ? [] : prev.filter((id) => !ids.includes(id))));

    // 처리 모달이 닫히는 애니메이션이 끝난 뒤에 결과 안내를 띄운다
    // (두 모달이 겹치면 화면 전체가 클릭되지 않는다 - DIALOG_HANDOFF_MS 주석 참고)
    clearTimeout(resultTimerRef.current);
    resultTimerRef.current = setTimeout(() => {
      setPendingAction(null);
      setAlertState(
        result.ok
          ? buildResultAlert(actionLabel, result.data)
          : { title: `${actionLabel} 처리에 실패했습니다.`, description: result.error }
      );
    }, DIALOG_HANDOFF_MS);

    // 성공했든 일부 실패했든 서버 상태가 바뀌었으므로 목록을 다시 받는다
    if (result.ok) {
      fetchReports(targetType, {
        page: currentPage,
        size: PAGE_SIZE,
        state: statusFilter === STATUS_FILTER_ALL ? undefined : statusFilter,
        boardId: boardFilter === BOARD_FILTER_ALL ? undefined : Number(boardFilter),
        keyword: searchKeyword,
        sort: REPORT_SORT_LATEST,
      });
    }
  };

  return (
    // listSectionClass의 max-w-[1016px]는 main(1440px 레이아웃에서 1185px)보다 좁아서
    // 169px이 남는다. 이 잉여는 정렬로 없앨 수 없고 한쪽으로 몰릴 뿐이다
    // (mx-auto면 양옆 85px씩, ml-0이면 오른쪽에 169px).
    // 시안은 표가 콘텐츠 영역을 꽉 채우는 구조(영역 915px = 표 915px)라 잉여가 없다.
    // 그래서 폭 제한을 풀어 main을 그대로 채운다. 표의 하한은 시안 폭(915px)으로 둔다.
    <div className={cn(listSectionClass, 'max-w-none')}>
      <h2 className={listTitleClass}>{title}</h2>

      <ReportTabs value={targetType} onChange={handleTabChange} />

      {/* 탭이 바꾸는 내용 전체를 tabpanel로 묶어 탭과 이어 준다.
          필터 · 검색도 탭마다 초기화되므로 함께 들어간다.
          탭이 이미 Tab 키 순서에 있으므로 패널 자체에는 tabIndex를 주지 않는다. */}
      <div
        role="tabpanel"
        id={getReportPanelId(targetType)}
        aria-labelledby={getReportTabId(targetType)}
      >
        {/* 정렬 · 게시판 · 상태 필터 · 검색 (왼쪽) / 선택 복원 · 선택 삭제 (오른쪽)
            한 줄에 나란히 놓으려면 1000px쯤 필요해서, 좌우 배치는 desktop(1024px)부터 한다.
            그보다 좁으면 필터 묶음과 버튼 묶음이 위아래로 나뉜다. */}
        <div className="mb-[5px] mt-[10px] flex flex-col gap-3 md:mb-4 md:mt-[20px] lg:flex-row lg:items-center lg:justify-between">
          {/* flex-wrap이 핵심이다. 안쪽 요소들이 고정 폭이라 줄바꿈을 허용하지 않으면
              컨테이너 밖으로 삐져나와 오른쪽 버튼과 겹친다. */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 서버가 받는 정렬 값이 latest 하나뿐이라 고를 것이 없다. 시안의 드롭다운 자리만 지킨다. */}
            <SortSelect
              value={REPORT_SORT_LATEST}
              onValueChange={() => {}}
              options={REPORT_SORT_OPTIONS}
            />
            {/* 정렬이 아니라 게시판 · 상태 필터지만, 디자인상 트리거가 같아 SortSelect를 그대로 쓴다. */}
            <SortSelect
              value={boardFilter}
              onValueChange={handleBoardFilterChange}
              options={boardFilterOptions}
            />
            <SortSelect
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
              options={STATUS_FILTER_OPTIONS}
            />
            <div className="w-full sm:w-[180px]">
              {/* 서버 검색 대상은 본문 또는 글쓴이명 부분일치. 안내 문구는 시안대로 '검색어 입력'으로 둔다. */}
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="검색어 입력"
              />
            </div>
          </div>

          {/* 좁은 화면에서는 두 버튼이 한 줄을 반씩 나눠 쓴다.
              actionButtonClass의 고정 폭(w-[180px])을 덮어써야 해서 cn으로 병합한다.
              (문자열로 이어붙이면 어느 폭이 이길지 CSS 정의 순서에 따라 갈린다) */}
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => openBulkConfirm(REPORT_ACTION_RESTORE)}
              className={cn(
                actionButtonClass,
                'w-auto flex-1 border-[#212121] text-[#212121] lg:w-[120px] lg:flex-none'
              )}
            >
              선택 복원
            </Button>
            <Button
              type="button"
              onClick={() => openBulkConfirm(REPORT_ACTION_DELETE)}
              className={cn(
                actionButtonClass,
                'w-auto flex-1 bg-[#212121] text-white lg:w-[120px] lg:flex-none'
              )}
            >
              선택 삭제
            </Button>
          </div>
        </div>

        <ReportTable
          reports={reports}
          targetType={targetType}
          selectedIds={selectedIds}
          loading={isLoading}
          errorMessage={error ?? ''}
          onSelectOne={handleSelectOne}
          onSelectAll={handleSelectAll}
          onRestore={(report) => openAction(REPORT_ACTION_RESTORE, [report.targetId])}
          onDelete={(report) => openAction(REPORT_ACTION_DELETE, [report.targetId])}
        />

        <div className="mb-16 mt-6 flex justify-center md:mb-[120px] md:mt-[34px]">
          <PaginationWithEllipsis
            currentPage={Math.min(currentPage, totalPages)}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* 복원 · 삭제 확인 모달 - 대상 요약과 신고 건수를 다시 보여준다 */}
      <ReportActionModal
        open={actionOpen}
        action={actionState?.action ?? REPORT_ACTION_DELETE}
        targetType={targetType}
        items={actionState?.items ?? []}
        submitting={isSubmitting}
        onClose={() => setActionOpen(false)}
        onSubmit={handleConfirm}
      />

      {/* 안내 모달 - 버튼 문구는 안내마다 다르다.
          이어서 처리 창이 열리는 안내는 '확인', 닫고 끝나는 안내는 '닫기'(기본값). */}
      <AlertModal
        open={Boolean(alertState)}
        title={alertState?.title ?? ''}
        description={alertState?.description ?? ''}
        closeText={alertState?.closeText ?? '닫기'}
        onClose={handleAlertClose}
      />
    </div>
  );
}
