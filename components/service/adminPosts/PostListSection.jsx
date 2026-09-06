'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import SortSelect from '@/components/shared/board/boardList/SortSelect';
import SearchInput from '@/components/shared/board/boardList/SearchInput';
import PaginationWithEllipsis from '@/components/shared/PaginationWithEllipsis';
import AlertModal from '@/components/common/AlertModal';
import ModerationModal from '@/components/shared/admin/ModerationModal';
import { Button } from '@/components/ui/button';
import {
  actionButtonClass,
  listSectionClass,
  listSubtitleClass,
  listTitleClass,
} from '@/components/shared/admin/CommunityListStyles';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import useAdminBoardStore from '@/stores/useAdminBoardStore';
import useAdminPostStore from '@/stores/useAdminPostStore';
import { getReasonId } from '@/constants/report';
import { ROUTES } from '@/constants/routes';
// 신고 관리의 탭 값. 문자열을 손으로 적으면 한쪽이 바뀔 때 조용히 어긋난다.
import { REPORT_TARGET_POST } from '@/constants/adminReports';

import PostTable from './PostTable';
import { BOARD_FILTER_ALL, buildBoardFilterOptions } from '@/constants/adminPosts';

const PAGE_SIZE = 10;

export default function PostListSection({ title = '게시글 관리' }) {
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const [boardFilter, setBoardFilter] = useState(BOARD_FILTER_ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // 글자를 칠 때마다 조회하지 않도록 서버에 보낼 검색어만 늦춘다 (입력창은 즉시 반응)
  const searchKeyword = useDebouncedValue(searchQuery);

  const posts = useAdminPostStore((s) => s.data);
  const totalPages = useAdminPostStore((s) => s.totalPages);
  const isLoading = useAdminPostStore((s) => s.isLoading);
  const error = useAdminPostStore((s) => s.error);
  const fetchPosts = useAdminPostStore((s) => s.fetchPosts);
  const moderatePosts = useAdminPostStore((s) => s.moderatePosts);
  const takeError = useAdminPostStore((s) => s.takeError);

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
  const [submitting, setSubmitting] = useState(false);

  const boardFilterOptions = useMemo(() => buildBoardFilterOptions(boards), [boards]);

  useEffect(() => {
    ensureBoards();
  }, [ensureBoards]);

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

  // 필터·검색·페이지네이션 모두 서버가 처리하므로 화면에서 자르지 않는다.
  useEffect(() => {
    fetchPosts(listParams);
  }, [fetchPosts, listParams]);

  // 삭제로 목록이 줄어 보던 페이지가 사라지면 빈 표에 갇힌다
  // (마지막 페이지의 글을 모두 지운 경우). 남아 있는 마지막 페이지로 되돌린다.
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // 목록이 바뀌면 화면에 없는 게시글이 선택된 채로 남지 않도록 선택을 비운다.
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
  const handleSelectOne = (postId, checked) => {
    setSelectedIds((prev) => {
      if (!checked) return prev.filter((id) => id !== postId);
      return prev.includes(postId) ? prev : [...prev, postId];
    });
  };

  // 전체 선택은 현재 페이지에 보이는 게시글만 대상으로 한다.
  const handleSelectAll = (checked) => {
    setSelectedIds(checked ? posts.map((post) => post.postId) : []);
  };

  // ── 블라인드 · 삭제 ───────────────────────────────────────────────────
  // 조치 모달에 넘길 대상 목록을 만든다.
  // 삭제하면 목록에서 사라지므로 열 때 한 번 떠서 들고 있는다.
  // 선택한 순서가 아니라 목록에 보이는 순서로 번호가 매겨지도록 posts에서 추린다.
  //
  // 대상 회원은 시안대로 '로그인ID / 학번 / 이름' 으로 보여준다.
  // 조립은 모달이 formatMemberLabel 로 처리하고, 값이 없는 필드는 알아서 빠진다
  // (탈퇴 회원처럼 로그인ID·학번이 null 로 오면 이름만 남는다).
  const buildModerationItems = (ids) => {
    const targetIds = new Set(ids);

    return posts
      .filter((post) => targetIds.has(post.postId))
      .map((post) => ({
        id: post.postId,
        // 모달(formatMemberLabel)이 쓰는 이름은 studentId 지만 서버 필드는 authorStudentNo 다
        user: {
          loginId: post.authorLoginId,
          studentId: post.authorStudentNo,
          name: post.authorName,
        },
        boardName: post.boardName,
        // 게시판 이름은 모달이 [게시판명]으로 따로 붙이므로 제목만 넘긴다
        content: post.title,
      }));
  };

  const openModeration = (action, ids) => {
    setModerationState({ action, ids, items: buildModerationItems(ids) });
    setModerationOpen(true);
  };

  // 선택 액션은 고른 게시글이 없으면 안내만 하고 끝낸다.
  const openBulkConfirm = (action) => {
    if (selectedIds.length === 0) {
      setAlertState({
        title: `${action === 'blind' ? '블라인드' : '삭제'}할 게시글을 선택해 주세요.`,
        description: '목록에서 게시글을 선택한 뒤 다시 시도해 주세요.',
      });
      return;
    }

    openModeration(action, selectedIds);
  };

  const openRowConfirm = (action, post) => {
    openModeration(action, [post.postId]);
  };

  // 모달이 넘겨주는 { reason, detail } 로 조치를 요청한다.
  // 항목마다 독립 트랜잭션이라 일부만 실패할 수 있어(부분 성공) 응답을 보고 안내를 나눈다.
  const handleConfirm = async ({ reason, detail }) => {
    if (!moderationState || submitting) return;

    const { action, ids } = moderationState;
    const actionLabel = action === 'delete' ? '삭제' : '블라인드';

    setSubmitting(true);
    try {
      const result = await moderatePosts(action, ids, { reasonId: getReasonId(reason), detail });

      // 요청 자체가 실패한 경우 (권한 · 네트워크 등) — 모달은 닫지 않는다
      if (!result) {
        setAlertState({
          title: `${actionLabel} 처리에 실패했습니다.`,
          description: takeError() ?? '잠시 후 다시 시도해 주세요.',
        });
        return;
      }

      setModerationOpen(false);
      // 처리한 게시글만 선택에서 뺀다. 행 단위 액션 때문에 다른 선택이 풀리면 안 된다.
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));

      // 삭제된 글은 목록에서 빠지고 블라인드는 상태가 바뀐다 → 서버 목록을 다시 받는다
      await fetchPosts(listParams);

      // 일부만 실패했으면 어떤 항목이 왜 실패했는지 서버 문구를 그대로 보여준다
      const failures = Array.isArray(result.failures) ? result.failures : [];
      if (failures.length > 0) {
        setAlertState({
          title: `${result.successCount}건은 ${actionLabel} 처리했고 ${result.failCount}건은 실패했습니다.`,
          description: failures.map((failure) => `· ${failure.message}`).join('\n'),
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 블라인드된 글은 신고 내역을 확인해 최종 판단(삭제 또는 복원)한다 → 신고 관리로 넘긴다.
  // 게시글 신고 탭으로 열리게 ?tab=post 를 달아 보낸다.
  const handleMoveToReport = () => {
    router.push(ROUTES.ADMIN_REPORTS_TAB(REPORT_TARGET_POST));
  };

  // 첫 조회 중에만 안내문으로 덮는다. 이미 목록이 있으면 그대로 두고 버튼만 잠근다
  // (페이지를 넘길 때마다 표가 비었다 다시 차면 깜빡인다).
  const isEmpty = posts.length === 0;

  return (
    <div className={listSectionClass}>
      <h2 className={listTitleClass}>{title}</h2>

      <span className={listSubtitleClass}>목록</span>

      {/* 게시판 필터 · 검색 (왼쪽) / 선택 블라인드 · 선택 삭제 (오른쪽) */}
      <div className="mb-[5px] mt-[5px] flex flex-col gap-3 md:mb-4 md:mt-[10px] md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          {/* 정렬이 아니라 게시판 필터지만, 디자인상 트리거가 같아 SortSelect를 그대로 쓴다.
              (회원 관리에서도 options를 주입해 같은 방식으로 사용한다.) */}
          <SortSelect
            value={boardFilter}
            onValueChange={handleBoardFilterChange}
            options={boardFilterOptions}
          />
          <div className="min-w-0 sm:w-[296px]">
            {/* 검색 대상은 제목 · 글쓴이지만 안내 문구는 시안대로 '검색어 입력'으로 둔다. */}
            <SearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="검색어 입력"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => openBulkConfirm('blind')}
            className={`${actionButtonClass} border-[#212121] text-[#212121]`}
          >
            선택 블라인드
          </Button>
          <Button
            type="button"
            disabled={submitting}
            onClick={() => openBulkConfirm('delete')}
            className={`${actionButtonClass} bg-[#212121] text-white`}
          >
            선택 삭제
          </Button>
        </div>
      </div>

      <PostTable
        posts={posts}
        selectedIds={selectedIds}
        onSelectOne={handleSelectOne}
        onSelectAll={handleSelectAll}
        onBlind={(post) => openRowConfirm('blind', post)}
        onDelete={(post) => openRowConfirm('delete', post)}
        onMoveToReport={handleMoveToReport}
        loading={isLoading && isEmpty}
        saving={submitting || isLoading}
        errorMessage={isEmpty && error ? error : ''}
      />

      <div className="mt-6 mb-16 flex justify-center md:mt-[34px] md:mb-[120px]">
        <PaginationWithEllipsis
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* 블라인드 · 삭제 조치 모달 - 대상 목록을 다시 보여주고 사유를 받는다 */}
      <ModerationModal
        open={moderationOpen}
        actionLabel={moderationState?.action === 'delete' ? '영구 삭제' : '블라인드'}
        targetLabel="게시글"
        items={moderationState?.items ?? []}
        onClose={() => setModerationOpen(false)}
        onSubmit={handleConfirm}
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
