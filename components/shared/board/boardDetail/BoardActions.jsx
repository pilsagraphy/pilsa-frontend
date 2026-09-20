'use client';

import React, { useEffect, useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toggleBoardPostLike, deleteBoardPost } from '@/apis/board';
import { submitReport } from '@/apis/report';
import { getErrorMessage } from '@/apis/auth';
import useAuthStore from '@/stores/useAuthStore';
import { ROUTES } from '@/constants/routes';
import { useMinWidthMd } from '@/lib/useMinWidthMd';
import ReportModal from '@/components/shared/board/boardList/ReportModal';
import AlertModal from '@/components/common/AlertModal';
import ConfirmModal from '@/components/common/ConfirmModal';
import { REPORT_SUCCESS_ALERT, REPORT_DUPLICATE_ALERT, getReasonId } from '@/constants/report';

// 좋아요 + (권한이 있을 때만) 수정/삭제 버튼
//  - 수정·삭제: 작성자 본인만. 관리자는 남의 글을 고치지 않는다 — 조치(블라인드·삭제)는 관리자 게시글 관리에서
//    (예전엔 관리자에게도 수정을 열어 뒀는데, 관리자가 남의 글을 열면 수정 버튼이 떠서 혼란스러웠다 — 2026-09-20)
export default function BoardActions({
  boardId,
  postId,
  authorId,
  authorName = '',
  postTitle = '',
  boardLabel = '',
  likeCount: initialLikeCount = 0,
  liked: initialLiked = false,
  onDeleted,
  afterLikeOnMobile = null,
}) {
  const router = useRouter();
  const isMdUp = useMinWidthMd();

  const [likeCount, setLikeCount] = useState(
    typeof initialLikeCount === 'number' ? initialLikeCount : 0
  );
  const [liked, setLiked] = useState(Boolean(initialLiked));
  const [likeLoading, setLikeLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 게시글 신고 — 작성자가 아닌 사람에게만 보인다 (폰·PC 공통)
  const [reportOpen, setReportOpen] = useState(false);
  const [reportError, setReportError] = useState('');
  const [alertState, setAlertState] = useState(null);
  // 삭제 확인 — 브라우저 confirm 이 아니라 사이트 모달로 묻는다
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const user = useAuthStore((s) => s.user);

  const currentUserId = Number(user?.userId ?? user?.id ?? user?.user_id);
  const isAuthor = Number.isFinite(currentUserId) && currentUserId === Number(authorId);

  const canEdit = isAuthor;
  const canDelete = isAuthor;

  useEffect(() => {
    setLikeCount(typeof initialLikeCount === 'number' ? initialLikeCount : 0);
    setLiked(Boolean(initialLiked));
  }, [initialLikeCount, initialLiked]);

  const handleLike = async () => {
    if (!postId || likeLoading) return;

    const prevLiked = liked;
    const prevCount = likeCount;

    // 낙관적 업데이트 후 실패 시 롤백 (응답은 메시지만 주므로 카운트는 프론트가 계산)
    setLiked(!prevLiked);
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);
    setLikeLoading(true);

    try {
      await toggleBoardPostLike(boardId, postId);
    } catch (error) {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      alert(getErrorMessage(error, '좋아요 처리에 실패했습니다.'));
    } finally {
      setLikeLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(ROUTES.BOARD_POST_EDIT(boardId, postId));
  };

  const handleDelete = () => {
    if (!postId || deleteLoading) return;
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteConfirmOpen(false);
    try {
      setDeleteLoading(true);
      await deleteBoardPost(boardId, postId);
      onDeleted?.();
    } catch (error) {
      setAlertState({
        title: '삭제하지 못했습니다',
        description: getErrorMessage(error, '게시글 삭제에 실패했습니다.'),
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // 신고 - 모달에서 고른 사유를 서버에 보낸다. 409 는 이미 신고했거나 대상이 삭제된 경우
  const handleReportSubmit = async ({ reason, detail }) => {
    setReportError('');
    try {
      await submitReport({
        targetType: 'post',
        targetId: postId,
        reasonId: getReasonId(reason),
        detail,
      });
      setReportOpen(false);
      setAlertState(REPORT_SUCCESS_ALERT);
    } catch (error) {
      if (error?.response?.status === 409) {
        setReportOpen(false);
        setAlertState(REPORT_DUPLICATE_ALERT);
        return;
      }
      // 모달을 닫지 않고 안에서 알린다 — 닫으면 고른 사유가 날아간다
      setReportError(getErrorMessage(error, '신고 접수에 실패했습니다. 잠시 후 다시 시도해주세요.'));
    }
  };

  // 폰·PC 가 같은 모달을 쓴다. 각 레이아웃 뒤에 한 번만 붙인다
  const modals = (
    <>
      <ReportModal
        open={reportOpen}
        onClose={() => {
          setReportOpen(false);
          setReportError('');
        }}
        onSubmit={handleReportSubmit}
        error={reportError}
        targetLabel="게시글"
        targetUser={authorName ? { name: authorName } : null}
        targetContent={boardLabel ? `${boardLabel} / ${postTitle}` : postTitle}
      />
      <ConfirmModal
        open={deleteConfirmOpen}
        title="게시글을 삭제하시겠습니까?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      <AlertModal
        open={Boolean(alertState)}
        title={alertState?.title ?? ''}
        description={alertState?.description ?? ''}
        mobileBodyMinHeight={alertState?.mobileBodyMinHeight}
        onClose={() => setAlertState(null)}
      />
    </>
  );

  // 모바일(#183): 좋아요 + (작성자) 수정/삭제 · (그 외) 신고하기 를 한 줄로. 데스크톱은 아래 return 그대로.
  if (!isMdUp) {
    return (
      <>
        <div className="flex w-full items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleLike}
            disabled={likeLoading}
            aria-pressed={liked}
            className={`flex h-[40px] w-[100px] items-center justify-center gap-[6px] rounded-[4px] border text-[14px] tracking-[-0.28px] transition-colors disabled:opacity-60 ${
              liked
                ? 'border-[#212121] bg-[#212121] text-white'
                : 'border-[#b9b9b9] bg-white text-[#212121]'
            }`}
          >
            <ThumbsUp width={18} height={18} strokeWidth={1.5} aria-hidden="true" />
            <span>{likeCount}</span>
          </button>

          {canEdit || canDelete ? (
            <div className="flex items-center gap-[4px]">
              {canEdit && (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="h-[40px] w-[100px] rounded-[4px] border border-[#b9b9b9] bg-white text-[14px] tracking-[-0.28px] text-[#212121]"
                >
                  수정하기
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={handleDelete}
                  className="h-[40px] w-[100px] rounded-[4px] bg-[#212121] text-[14px] tracking-[-0.28px] text-white disabled:opacity-60"
                >
                  {deleteLoading ? '삭제 중...' : '삭제하기'}
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="h-[40px] w-[100px] rounded-[4px] border border-[#b9b9b9] bg-white text-[14px] tracking-[-0.28px] text-[#212121]"
            >
              신고하기
            </button>
          )}
        </div>

        {modals}
      </>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-0">
      <div className="flex w-full flex-col gap-[10px] md:w-auto">
        {/* 좋아요 버튼 */}
        <button
          type="button"
          onClick={handleLike}
          disabled={likeLoading}
          aria-pressed={liked}
          className={`flex h-12 w-full items-center justify-center gap-[6px] rounded-[4px] border text-[15px] tracking-[-0.32px] transition-colors disabled:opacity-60 md:h-[52px] md:w-[135px] md:text-[16px] ${
            liked
              ? 'border-[#212121] bg-[#212121] text-white hover:bg-black'
              : 'border-[#b9b9b9] bg-white text-[#212121] hover:bg-[#f5f5f5]'
          }`}
        >
          {/* 색은 버튼의 text 색을 따라간다 (lucide 아이콘 기본 stroke 가 currentColor) */}
          <ThumbsUp width={18} height={18} strokeWidth={1.5} aria-hidden="true" />
          <span>좋아요 {likeCount}</span>
        </button>

        {afterLikeOnMobile != null && <div className="w-full md:hidden">{afterLikeOnMobile}</div>}
      </div>

      {/* 작성자: 수정(흰 테두리) / 삭제(검정) — 폰(#183 피그마)과 같은 규칙. 그 외: 신고 */}
      {canEdit || canDelete ? (
        <div className="flex w-full gap-2 md:w-auto md:gap-5">
          {canEdit && (
            <button
              type="button"
              className="h-12 flex-1 rounded-[4px] border border-[#b9b9b9] bg-white text-[#212121] transition-colors hover:bg-[#f5f5f5] md:h-[52px] md:w-[135px] md:flex-none"
              onClick={handleEdit}
            >
              수정
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              disabled={deleteLoading}
              className="h-12 flex-1 rounded-[4px] bg-[#212121] text-white transition-colors hover:bg-black disabled:opacity-60 md:h-[52px] md:w-[135px] md:flex-none"
              onClick={handleDelete}
            >
              {deleteLoading ? '삭제 중...' : '삭제'}
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="h-12 w-full rounded-[4px] border border-[#b9b9b9] bg-white text-[#212121] transition-colors hover:bg-[#f5f5f5] md:h-[52px] md:w-[135px]"
        >
          신고
        </button>
      )}
      {modals}
    </div>
  );
}
