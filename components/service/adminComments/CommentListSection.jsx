'use client';

import { useMemo, useState } from 'react';

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

import CommentTable from './CommentTable';
import {
  BOARD_FILTER_ALL,
  BOARD_FILTER_OPTIONS,
  COMMENT_STATUSES,
  DUMMY_COMMENTS,
} from '@/constants/adminComments';

const PAGE_SIZE = 10;

export default function CommentListSection({ title = '댓글 관리' }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [boardFilter, setBoardFilter] = useState(BOARD_FILTER_ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // 블라인드 · 삭제 결과가 화면에 남아야 해서 목록을 상태로 들고 간다.
  const [comments, setComments] = useState(DUMMY_COMMENTS);

  // 블라인드 · 삭제 조치 모달 { action, ids, items }
  // Radix Dialog는 open이 false가 돼도 퇴장 애니메이션 동안 화면에 남는다.
  // 그때 대상 정보가 사라지면 제목이 '영구 삭제' → '블라인드'로 바뀌거나 표가 비어 보이므로,
  // 열림 여부만 따로 두고 대상 정보는 다음에 열 때까지 그대로 남겨둔다.
  const [moderationState, setModerationState] = useState(null);
  const [moderationOpen, setModerationOpen] = useState(false);
  const [alertState, setAlertState] = useState(null); // { title, description }

  // TODO: API 연동 시 DUMMY_COMMENTS 대신 서버 응답(목록·totalPages)을 사용하고,
  //       게시판 필터·검색·페이지네이션도 서버에 위임할 것. (BoardSection.jsx 참고)
  const filteredComments = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    const matched = comments.filter((comment) => {
      if (boardFilter !== BOARD_FILTER_ALL && comment.boardName !== boardFilter) return false;
      if (!keyword) return true;

      return (
        comment.content.toLowerCase().includes(keyword) ||
        comment.author.toLowerCase().includes(keyword)
      );
    });

    // commentId가 클수록 최근 댓글 → 최신순(내림차순)으로 보여준다.
    return [...matched].sort((a, b) => b.commentId - a.commentId);
  }, [comments, boardFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredComments.length / PAGE_SIZE));

  // 삭제로 목록이 줄어 currentPage가 사라진 페이지를 가리키면 빈 목록이 보인다.
  // 렌더 시점에 잘라 마지막 페이지를 보여준다.
  const page = Math.min(currentPage, totalPages);

  const pagedComments = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredComments.slice(start, start + PAGE_SIZE);
  }, [filteredComments, page]);

  // 목록이 바뀌면 화면에 없는 댓글이 선택된 채로 남지 않도록 선택을 비운다.
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

  const handleSelectOne = (commentId, checked) => {
    setSelectedIds((prev) =>
      checked ? [...prev, commentId] : prev.filter((id) => id !== commentId)
    );
  };

  // 전체 선택은 현재 페이지에 보이는 댓글만 대상으로 한다.
  const handleSelectAll = (checked) => {
    setSelectedIds(checked ? pagedComments.map((comment) => comment.commentId) : []);
  };

  // ── 블라인드 · 삭제 ───────────────────────────────────────────────────
  // 조치 모달에 넘길 대상 목록을 만든다.
  // 삭제하면 목록에서 사라지므로 열 때 한 번 떠서 들고 있는다.
  // 선택한 순서가 아니라 목록에 보이는 순서(최신순)로 번호가 매겨지도록 filteredComments에서 추린다.
  const buildModerationItems = (ids) => {
    const targetIds = new Set(ids);

    return filteredComments
      .filter((comment) => targetIds.has(comment.commentId))
      .map((comment) => ({
        id: comment.commentId,
        user: {
          loginId: comment.author,
          studentId: comment.authorStudentId,
          name: comment.authorName,
        },
        boardName: comment.boardName,
        content: comment.content,
      }));
  };

  const openModeration = (action, ids) => {
    setModerationState({ action, ids, items: buildModerationItems(ids) });
    setModerationOpen(true);
  };

  // 선택 액션은 고른 댓글이 없으면 안내만 하고 끝낸다.
  const openBulkConfirm = (action) => {
    if (selectedIds.length === 0) {
      setAlertState({
        title: `${action === 'blind' ? '블라인드' : '삭제'}할 댓글을 선택해 주세요.`,
        description: '목록에서 댓글을 선택한 뒤 다시 시도해 주세요.',
      });
      return;
    }

    openModeration(action, selectedIds);
  };

  const openRowConfirm = (action, comment) => {
    openModeration(action, [comment.commentId]);
  };

  // 모달이 넘겨주는 { reason, detail }은 마크업 단계라 아직 쓰지 않는다.
  // TODO: API 연동 시 { action, ids, reason, detail }로 서버에 요청을 보내고 응답으로 목록을 갱신할 것
  const handleConfirm = () => {
    if (!moderationState) return;

    const { action, ids } = moderationState;

    setComments((prev) =>
      action === 'delete'
        ? prev.filter((comment) => !ids.includes(comment.commentId))
        : prev.map((comment) =>
            ids.includes(comment.commentId)
              ? { ...comment, status: COMMENT_STATUSES.BLINDED }
              : comment
          )
    );

    setModerationOpen(false);
    // 처리한 댓글만 선택에서 뺀다. 행 단위 액션 때문에 다른 선택이 풀리면 안 된다.
    // (선택 액션일 땐 ids가 곧 selectedIds라 결과가 같다)
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
  };

  // TODO: 신고 관리 페이지가 만들어지면 해당 댓글의 신고 내역으로 이동시킬 것
  const handleMoveToReport = () => {
    setAlertState({
      title: '신고 관리 페이지는 준비 중입니다.',
      description: '페이지가 준비되면 해당 댓글의 신고 내역으로 이동합니다.',
    });
  };

  return (
    <div className={listSectionClass}>
      <h2 className={listTitleClass}>{title}</h2>

      <span className={listSubtitleClass}>목록</span>

      {/* 게시판 필터 · 검색 (왼쪽) / 선택 블라인드 · 선택 삭제 (오른쪽) */}
      <div className="mb-[5px] mt-[5px] flex flex-col gap-3 md:mb-4 md:mt-[10px] md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          {/* 정렬이 아니라 게시판 필터지만, 디자인상 트리거가 같아 SortSelect를 그대로 쓴다.
              (회원 관리 · 게시글 관리에서도 options를 주입해 같은 방식으로 사용한다.) */}
          <SortSelect
            value={boardFilter}
            onValueChange={handleBoardFilterChange}
            options={BOARD_FILTER_OPTIONS}
          />
          <div className="min-w-0 sm:w-[296px]">
            {/* 검색 대상은 댓글 내용 · 글쓴이지만 안내 문구는 시안대로 '검색어 입력'으로 둔다. */}
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
            onClick={() => openBulkConfirm('blind')}
            className={`${actionButtonClass} border-[#212121] text-[#212121]`}
          >
            선택 블라인드
          </Button>
          <Button
            type="button"
            onClick={() => openBulkConfirm('delete')}
            className={`${actionButtonClass} bg-[#212121] text-white`}
          >
            선택 삭제
          </Button>
        </div>
      </div>

      <CommentTable
        comments={pagedComments}
        selectedIds={selectedIds}
        onSelectOne={handleSelectOne}
        onSelectAll={handleSelectAll}
        onBlind={(comment) => openRowConfirm('blind', comment)}
        onDelete={(comment) => openRowConfirm('delete', comment)}
        onMoveToReport={handleMoveToReport}
      />

      <div className="mt-6 mb-16 flex justify-center md:mt-[34px] md:mb-[120px]">
        <PaginationWithEllipsis
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* 블라인드 · 삭제 조치 모달 - 대상 목록을 다시 보여주고 사유를 받는다 */}
      <ModerationModal
        open={moderationOpen}
        actionLabel={moderationState?.action === 'delete' ? '영구 삭제' : '블라인드'}
        targetLabel="댓글"
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
