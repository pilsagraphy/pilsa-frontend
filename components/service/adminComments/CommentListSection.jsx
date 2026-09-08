'use client';

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
import useAdminModerationList from '@/hooks/useAdminModerationList';
import useAdminCommentStore from '@/stores/useAdminCommentStore';
// 신고 관리의 탭 값. 문자열을 손으로 적으면 한쪽이 바뀔 때 조용히 어긋난다.
import { REPORT_TARGET_COMMENT } from '@/constants/adminReports';

import CommentTable from './CommentTable';

// 필터 · 검색 · 페이지네이션 · 선택 · 조치는 게시글 관리와 동작이 같아 훅에 모아 뒀다.
// 여기 남는 것은 댓글 표에 무엇을 어떻게 그리느냐뿐이다.
export default function CommentListSection({ title = '댓글 관리' }) {
  const list = useAdminModerationList({
    store: useAdminCommentStore,
    idKey: 'commentId',
    // 조치 모달의 '대상 댓글' 칸에는 댓글 내용을 보여준다
    contentKey: 'content',
    reportTarget: REPORT_TARGET_COMMENT,
  });

  return (
    <div className={listSectionClass}>
      <h2 className={listTitleClass}>{title}</h2>

      <span className={listSubtitleClass}>목록</span>

      {/* 게시판 필터 · 검색 (왼쪽) / 선택 블라인드 · 선택 삭제 (오른쪽)
          폭이 좁아질 때 순서: ① 검색창이 게시판 셀렉트 너비까지 줄고 ② 그 뒤로는 버튼이 줄고
          ③ 그래도 모자라면 버튼 묶음이 아랫줄로 내려간다 (겹치게 두지 않는다). */}
      <div className="mb-[5px] mt-[5px] flex flex-col gap-3 md:mb-4 md:mt-[10px] md:flex-row md:flex-wrap md:items-center md:justify-between">
        {/* min-w-0 을 주면 이 묶음이 0까지 찌그러지고 안의 셀렉트·검색창이 밖으로 넘쳐
            오른쪽 버튼 위에 겹쳐 그려진다. 자식들의 최소 너비가 이 묶음의 하한이 되게 둔다. */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* 정렬이 아니라 게시판 필터지만, 디자인상 트리거가 같아 SortSelect를 그대로 쓴다. */}
          <SortSelect
            value={list.boardFilter}
            onValueChange={list.handleBoardFilterChange}
            options={list.boardFilterOptions}
          />
          {/* 검색창은 게시판 셀렉트(sm 120px · md 135px)보다 좁아지지 않는다.
              그보다 좁아지면 검색어가 두세 글자밖에 안 보여 검색창 구실을 못 한다. */}
          <div className="min-w-0 sm:w-[296px] sm:min-w-[120px] md:min-w-[135px]">
            {/* 검색 대상은 댓글 내용 · 글쓴이지만 안내 문구는 시안대로 '검색어 입력'으로 둔다. */}
            <SearchInput
              value={list.searchQuery}
              onChange={list.handleSearchChange}
              placeholder="검색어 입력"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            disabled={list.isBusy || !list.hasSelection}
            onClick={() => list.openBulkConfirm('blind')}
            className={`${actionButtonClass} border-[#212121] text-[#212121]`}
          >
            선택 블라인드
          </Button>
          <Button
            type="button"
            disabled={list.isBusy || !list.hasSelection}
            onClick={() => list.openBulkConfirm('delete')}
            className={`${actionButtonClass} bg-[#212121] text-white`}
          >
            선택 삭제
          </Button>
        </div>
      </div>

      <CommentTable
        comments={list.items}
        selectedIds={list.selectedIds}
        onSelectOne={list.handleSelectOne}
        onSelectAll={list.handleSelectAll}
        onBlind={(comment) => list.openRowConfirm('blind', comment)}
        onDelete={(comment) => list.openRowConfirm('delete', comment)}
        onMoveToReport={list.handleMoveToReport}
        loading={list.isFirstLoad}
        saving={list.isBusy}
        errorMessage={list.errorMessage}
      />

      <div className="mt-6 mb-16 flex justify-center md:mt-[34px] md:mb-[120px]">
        <PaginationWithEllipsis
          currentPage={list.currentPage}
          totalPages={list.totalPages}
          onPageChange={list.handlePageChange}
        />
      </div>

      {/* 블라인드 · 삭제 조치 모달 - 대상 목록을 다시 보여주고 사유를 받는다 */}
      <ModerationModal
        open={list.moderationOpen}
        actionLabel={list.moderationState?.action === 'delete' ? '영구 삭제' : '블라인드'}
        targetLabel="댓글"
        items={list.moderationState?.items ?? []}
        submitting={list.isSubmitting}
        onClose={list.closeModeration}
        onSubmit={list.handleConfirm}
      />

      {/* 안내 모달 */}
      <AlertModal
        open={Boolean(list.alertState)}
        title={list.alertState?.title ?? ''}
        description={list.alertState?.description ?? ''}
        onClose={list.closeAlert}
      />
    </div>
  );
}
