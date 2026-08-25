'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import AlertModal from '@/components/common/AlertModal';
import PaginationWithEllipsis from '@/components/shared/PaginationWithEllipsis';
import SearchInput from '@/components/shared/board/SearchInput';
import SortSelect from '@/components/shared/board/SortSelect';
import {
  actionButtonClass,
  listSectionClass,
  listTitleClass,
} from '@/components/shared/admin/CommunityListStyles';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  BOARD_FILTER_ALL,
  BOARD_FILTER_OPTIONS,
  DUMMY_COMMENT_REPORTS,
  DUMMY_POST_REPORTS,
  REPORT_ACTION_DELETE,
  REPORT_ACTION_LABELS,
  REPORT_ACTION_RESTORE,
  REPORT_STATUSES,
  REPORT_TARGET_COMMENT,
  REPORT_TARGET_LABELS,
  REPORT_TARGET_POST,
  STATUS_FILTER_ALL,
  STATUS_FILTER_OPTIONS,
  getReportPanelId,
  getReportTabId,
  isDeletable,
} from '@/constants/adminReports';

import ReportActionModal from './ReportActionModal';
import ReportTable from './ReportTable';
import ReportTabs from './ReportTabs';

const PAGE_SIZE = 10;

// 정렬은 지금 최신순만 제공한다. 시안의 드롭다운 자리를 지키기 위해 선택지 하나로 둔다.
// TODO: 신고순 등이 필요해지면 선택지를 늘리고 filteredReports의 비교 함수를 분기할 것
const SORT_LATEST = 'latest';
const SORT_OPTIONS = [{ value: SORT_LATEST, label: '최신순' }];

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
  const [selectedIds, setSelectedIds] = useState([]);

  // 복원 · 삭제 결과가 화면에 남아야 해서 목록을 상태로 들고 간다.
  // 탭을 옮겨도 앞서 처리한 결과가 유지되도록 두 목록을 함께 보관한다.
  const [reportsByTarget, setReportsByTarget] = useState({
    [REPORT_TARGET_POST]: DUMMY_POST_REPORTS,
    [REPORT_TARGET_COMMENT]: DUMMY_COMMENT_REPORTS,
  });

  // 복원 · 삭제 확인 모달 { action, ids, items }
  // Radix Dialog는 open이 false가 돼도 퇴장 애니메이션 동안 화면에 남는다.
  // 그때 대상 정보가 사라지면 제목이 '삭제' → '복원'으로 바뀌거나 표가 비어 보이므로,
  // 열림 여부만 따로 두고 대상 정보는 다음에 열 때까지 그대로 남겨둔다.
  const [actionState, setActionState] = useState(null);
  const [actionOpen, setActionOpen] = useState(false);
  const [alertState, setAlertState] = useState(null); // { title, description }

  // 안내 모달을 닫으면 이어서 열어야 하는 처리 (삭제된 항목을 빼고 남은 대상)
  const [pendingAction, setPendingAction] = useState(null);
  const handoffTimerRef = useRef(null);

  // 예약된 처리 창 열기를 취소한다.
  // 남겨두면 다른 조치를 시작한 뒤에 옛 타이머가 터져서 이미 열린 모달의 대상을 덮어쓴다.
  const cancelHandoff = () => clearTimeout(handoffTimerRef.current);

  // 안내를 닫은 직후 화면을 벗어나면 타이머가 남아 사라진 컴포넌트의 상태를 건드린다
  useEffect(() => cancelHandoff, []);

  const reports = reportsByTarget[targetType];
  const targetLabel = REPORT_TARGET_LABELS[targetType];

  // TODO: API 연동 시 더미 데이터 대신 서버 응답(목록·totalPages)을 사용하고,
  //       탭·필터·검색·정렬·페이지네이션도 서버에 위임할 것. (PostListSection.jsx와 같은 구조)
  const filteredReports = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    // 서버가 값을 주지 않는 경우(내용이 지워진 신고, 작성자 미상)에도 검색이 터지지 않게 한다
    const includesKeyword = (text) => (text ?? '').toLowerCase().includes(keyword);

    const matched = reports.filter((report) => {
      if (boardFilter !== BOARD_FILTER_ALL && report.boardName !== boardFilter) return false;
      if (statusFilter !== STATUS_FILTER_ALL && report.status !== statusFilter) return false;
      if (!keyword) return true;

      // 검색 대상은 대상 내용(미리보기 원문)과 작성자다.
      return includesKeyword(report.preview) || includesKeyword(report.author);
    });

    // reportId가 클수록 최근 신고 → 최신순(내림차순)
    return [...matched].sort((a, b) => b.reportId - a.reportId);
  }, [reports, boardFilter, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));

  // 복원으로 목록이 줄어 currentPage가 사라진 페이지를 가리키면 빈 목록이 보인다.
  // 렌더 시점에 잘라 마지막 페이지를 보여준다.
  const page = Math.min(currentPage, totalPages);

  const pagedReports = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredReports.slice(start, start + PAGE_SIZE);
  }, [filteredReports, page]);

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

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    resetToFirstPage();
  };

  const handlePageChange = (nextPage) => {
    setCurrentPage(nextPage);
    setSelectedIds([]);
  };

  const handleSelectOne = (reportId, checked) => {
    setSelectedIds((prev) =>
      checked ? [...prev, reportId] : prev.filter((id) => id !== reportId)
    );
  };

  // 전체 선택은 현재 페이지에 보이는 신고만 대상으로 한다.
  const handleSelectAll = (checked) => {
    setSelectedIds(checked ? pagedReports.map((report) => report.reportId) : []);
  };

  // ── 복원 · 삭제 ───────────────────────────────────────────────────────
  // 확인 모달에 넘길 대상 목록을 만든다.
  // 복원하면 목록에서 사라지므로 열 때 한 번 떠서 들고 있는다.
  // 선택한 순서가 아니라 목록에 보이는 순서로 나열되도록 filteredReports에서 추린다.
  const buildActionItems = (ids) => {
    const targetIds = new Set(ids);
    return filteredReports.filter((report) => targetIds.has(report.reportId));
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
    const allowed =
      action === REPORT_ACTION_DELETE ? selected.filter(isDeletable) : selected;
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
        ? { action, ids: allowed.map((report) => report.reportId), items: allowed, fromBulk: true }
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

  // 모달이 넘겨주는 { reason, detail }은 마크업 단계라 아직 쓰지 않는다.
  // TODO: API 연동 시 { action, ids, reason, detail }로 서버에 요청을 보내고 응답으로 목록을 갱신할 것
  const handleConfirm = () => {
    if (!actionState) return;

    const { action, ids, fromBulk } = actionState;

    setReportsByTarget((prev) => ({
      ...prev,
      [targetType]:
        // 복원하면 원래 상태로 돌아가 더 조치할 것이 없으므로 목록에서 뺀다.
        // 삭제는 소프트 딜리트라 상태만 '삭제'로 바꾸고 남겨둔다 (다시 복원할 수 있다).
        action === REPORT_ACTION_RESTORE
          ? prev[targetType].filter((report) => !ids.includes(report.reportId))
          : prev[targetType].map((report) =>
              ids.includes(report.reportId)
                ? { ...report, status: REPORT_STATUSES.DELETED }
                : report
            ),
    }));

    setActionOpen(false);

    // 선택 액션을 확정했으면 그 선택은 다 쓴 것으로 보고 전부 비운다.
    // 처리한 것만 빼면, 삭제되어 제외된 항목이 체크된 채로 남아
    // 다음 작업을 하려면 하나하나 풀어야 한다.
    // 행 단위 버튼으로 시작한 조치는 그 한 건만 빼서 남은 선택을 건드리지 않는다.
    setSelectedIds((prev) => (fromBulk ? [] : prev.filter((id) => !ids.includes(id))));
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
            {/* 선택지가 최신순 하나뿐이라 고를 것이 없다. 시안의 드롭다운 자리만 지킨다. */}
            <SortSelect value={SORT_LATEST} onValueChange={() => {}} options={SORT_OPTIONS} />
            {/* 정렬이 아니라 게시판 · 상태 필터지만, 디자인상 트리거가 같아 SortSelect를 그대로 쓴다. */}
            <SortSelect
              value={boardFilter}
              onValueChange={handleBoardFilterChange}
              options={BOARD_FILTER_OPTIONS}
            />
            <SortSelect
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
              options={STATUS_FILTER_OPTIONS}
            />
            <div className="w-full sm:w-[180px]">
              {/* 검색 대상은 대상 내용 · 작성자지만 안내 문구는 시안대로 '검색어 입력'으로 둔다. */}
              <SearchInput
                value={searchQuery}
                onChange={handleSearchChange}
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
          reports={pagedReports}
          targetType={targetType}
          selectedIds={selectedIds}
          onSelectOne={handleSelectOne}
          onSelectAll={handleSelectAll}
          onRestore={(report) => openAction(REPORT_ACTION_RESTORE, [report.reportId])}
          onDelete={(report) => openAction(REPORT_ACTION_DELETE, [report.reportId])}
        />

        <div className="mb-16 mt-6 flex justify-center md:mb-[120px] md:mt-[34px]">
          <PaginationWithEllipsis
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* 복원 · 삭제 확인 모달 - 대상 요약과 신고 내역을 다시 보여준다 */}
      <ReportActionModal
        open={actionOpen}
        action={actionState?.action ?? REPORT_ACTION_DELETE}
        targetType={targetType}
        items={actionState?.items ?? []}
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
