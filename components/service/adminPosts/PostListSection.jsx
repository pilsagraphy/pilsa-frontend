'use client';

import { useMemo, useState } from 'react';

import SortSelect from '@/components/shared/board/SortSelect';
import SearchInput from '@/components/shared/board/SearchInput';
import PaginationWithEllipsis from '@/components/shared/PaginationWithEllipsis';
import AlertModal from '@/components/common/AlertModal';
import ConfirmModal from '@/components/common/ConfirmModal';
import { Button } from '@/components/ui/button';
import {
  actionButtonClass,
  listSectionClass,
  listSubtitleClass,
  listTitleClass,
} from '@/components/shared/admin/CommunityListStyles';

import PostTable from './PostTable';
import {
  BOARD_FILTER_ALL,
  BOARD_FILTER_OPTIONS,
  DUMMY_POSTS,
  POST_STATUSES,
} from '@/constants/adminPosts';

const PAGE_SIZE = 10;

export default function PostListSection({ title = '게시글 관리' }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [boardFilter, setBoardFilter] = useState(BOARD_FILTER_ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // 블라인드 · 삭제 결과가 화면에 남아야 해서 목록을 상태로 들고 간다.
  const [posts, setPosts] = useState(DUMMY_POSTS);

  // 블라인드 · 삭제 확인 모달 { action, ids }
  const [confirmState, setConfirmState] = useState(null);
  const [alertState, setAlertState] = useState(null); // { title, description }

  // TODO: API 연동 시 DUMMY_POSTS 대신 서버 응답(목록·totalPages)을 사용하고,
  //       게시판 필터·검색·페이지네이션도 서버에 위임할 것. (BoardSection.jsx 참고)
  const filteredPosts = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    const matched = posts.filter((post) => {
      if (boardFilter !== BOARD_FILTER_ALL && post.boardName !== boardFilter) return false;
      if (!keyword) return true;

      return (
        post.title.toLowerCase().includes(keyword) || post.author.toLowerCase().includes(keyword)
      );
    });

    // postId가 클수록 최근 글 → 최신순(내림차순)으로 보여준다.
    return [...matched].sort((a, b) => b.postId - a.postId);
  }, [posts, boardFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));

  // 삭제로 목록이 줄어 currentPage가 사라진 페이지를 가리키면 빈 목록이 보인다.
  // 렌더 시점에 잘라 마지막 페이지를 보여준다.
  const page = Math.min(currentPage, totalPages);

  const pagedPosts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredPosts.slice(start, start + PAGE_SIZE);
  }, [filteredPosts, page]);

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

  const handleSelectOne = (postId, checked) => {
    setSelectedIds((prev) => (checked ? [...prev, postId] : prev.filter((id) => id !== postId)));
  };

  // 전체 선택은 현재 페이지에 보이는 게시글만 대상으로 한다.
  const handleSelectAll = (checked) => {
    setSelectedIds(checked ? pagedPosts.map((post) => post.postId) : []);
  };

  // ── 블라인드 · 삭제 ───────────────────────────────────────────────────
  // 선택 액션은 고른 게시글이 없으면 안내만 하고 끝낸다.
  const openBulkConfirm = (action) => {
    if (selectedIds.length === 0) {
      setAlertState({
        title: `${action === 'blind' ? '블라인드' : '삭제'}할 게시글을 선택해 주세요.`,
        description: '목록에서 게시글을 선택한 뒤 다시 시도해 주세요.',
      });
      return;
    }

    setConfirmState({ action, ids: selectedIds });
  };

  const openRowConfirm = (action, post) => {
    setConfirmState({ action, ids: [post.postId] });
  };

  // TODO: API 연동 시 서버에 블라인드 · 삭제 요청을 보내고 응답으로 목록을 갱신할 것
  const handleConfirm = () => {
    if (!confirmState) return;

    const { action, ids } = confirmState;

    setPosts((prev) =>
      action === 'delete'
        ? prev.filter((post) => !ids.includes(post.postId))
        : prev.map((post) =>
            ids.includes(post.postId) ? { ...post, status: POST_STATUSES.BLINDED } : post
          )
    );

    setConfirmState(null);
    // 처리한 게시글만 선택에서 뺀다. 행 단위 액션 때문에 다른 선택이 풀리면 안 된다.
    // (선택 액션일 땐 ids가 곧 selectedIds라 결과가 같다)
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
  };

  // TODO: 신고 관리 페이지가 만들어지면 해당 게시글의 신고 내역으로 이동시킬 것
  const handleMoveToReport = () => {
    setAlertState({
      title: '신고 관리 페이지는 준비 중입니다.',
      description: '페이지가 준비되면 해당 게시글의 신고 내역으로 이동합니다.',
    });
  };

  const confirmTitle = confirmState
    ? `게시글 ${confirmState.ids.length}건을 ${
        confirmState.action === 'delete' ? '삭제할까요?' : '블라인드 처리할까요?'
      }`
    : '';

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
            options={BOARD_FILTER_OPTIONS}
          />
          <div className="min-w-0 sm:w-[296px]">
            {/* 검색 대상은 제목 · 글쓴이지만 안내 문구는 시안대로 '검색어 입력'으로 둔다. */}
            <SearchInput value={searchQuery} onChange={handleSearchChange} placeholder="검색어 입력" />
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

      <PostTable
        posts={pagedPosts}
        selectedIds={selectedIds}
        onSelectOne={handleSelectOne}
        onSelectAll={handleSelectAll}
        onBlind={(post) => openRowConfirm('blind', post)}
        onDelete={(post) => openRowConfirm('delete', post)}
        onMoveToReport={handleMoveToReport}
      />

      <div className="mt-6 mb-16 flex justify-center md:mt-[34px] md:mb-[120px]">
        <PaginationWithEllipsis
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* 블라인드 · 삭제 확인 모달 */}
      <ConfirmModal
        open={Boolean(confirmState)}
        title={confirmTitle}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState(null)}
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
