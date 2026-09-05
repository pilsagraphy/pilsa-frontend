'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { getComments, createComment, updateComment, deleteComment } from '@/apis/comment';
import { getErrorMessage } from '@/apis/auth';
import useApiRequest from '@/hooks/useApiRequest';
import useCommentAnchor from '@/hooks/useCommentAnchor';
import { getCommentAnchorId } from '@/lib/utils';
import useAuthStore from '@/stores/useAuthStore';
import ReportModal from '@/components/shared/board/boardList/ReportModal';
import ConfirmModal from '@/components/common/ConfirmModal';
import AlertModal from '@/components/common/AlertModal';
import { REPORT_SUCCESS_ALERT } from '@/constants/report';
import { CornerDownRight } from 'lucide-react';
import { formatSlashDateTime } from '@/lib/boardDetail';

function Divider() {
  return <div className="w-full h-px bg-[#DEDEDE]" />;
}

// 깊이별 들여쓰기 (Tailwind가 정적으로 인식하도록 클래스를 미리 정의해 둔다)
// 이 배열 길이를 넘어가는 깊이는 마지막 값을 그대로 쓴다 - 모바일 가독성 보호
const INDENT_CLASS_BY_DEPTH = ['md:px-10', 'pl-[16px] md:pl-[40px]', 'pl-[32px] md:pl-[80px]'];
const MAX_INDENT_DEPTH = INDENT_CLASS_BY_DEPTH.length - 1;

// 잘못된 데이터(순환 참조 등)로 무한 재귀에 빠지지 않게 하는 안전장치
const MAX_RENDER_DEPTH = 20;

// 공통게시판 댓글/대댓글.
// 익명/비밀 허용 여부는 게시판 플래그(board.allowAnonymous / board.allowPrivateComment)로 결정한다.
// 익명·비밀 마스킹(익명 authorName='익명', 비밀 content='비밀댓글입니다.')은 서버가 처리하므로
// 프론트는 받은 값을 그대로 그린다 (다시 마스킹하지 않는다).
export default function BoardComments({ boardId, postId, board, commentCount }) {
  const boardLabel = board?.boardName ?? '';
  const allowAnonymous = Boolean(board?.allowAnonymous);
  const allowPrivateComment = Boolean(board?.allowPrivateComment);

  // 댓글 목록 (화면 지역 데이터)
  const {
    data: comments,
    isLoading: commentsLoading,
    error: commentsError,
    run: runComments,
  } = useApiRequest([]);
  const list = Array.isArray(comments) ? comments : [];

  const refetch = useCallback(
    () => runComments(() => getComments(boardId, postId), { fallbackMessage: '댓글을 불러오지 못했습니다.' }),
    [runComments, boardId, postId]
  );

  useEffect(() => {
    if (boardId && postId) refetch();
  }, [refetch, boardId, postId]);

  // URL 해시(#comment-3)로 지목된 댓글 강조 (관리자 신고 관리 링크용)
  const focusedAnchor = useCommentAnchor(list);

  // 현재 로그인 사용자 (본인 댓글 판별용)
  const currentUserId = useAuthStore((s) => s.user?.userId);

  // 하단 입력창 - 댓글 작성 / 답글 작성 / 댓글 수정에 공용으로 쓴다
  const [commentText, setCommentText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [alertState, setAlertState] = useState(null);
  // 등록/답글 전송 중 잠금 (엔터 연타·버튼 중복 클릭으로 같은 댓글이 두 번 등록되는 것을 막는다)
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 대댓글 구조: parentCommentId 로 트리를 만든다 (무제한 깊이)
  const commentById = new Map(list.map((c) => [c.commentId, c]));
  const getChildren = (parentId) =>
    list.filter((c) => c.parentCommentId === parentId && c.commentId !== parentId);

  // 최상위 댓글과, 부모가 삭제되어 목록에 없는 답글의 '자리표시'를 서버가 준 순서대로 섞는다.
  // 자리표시를 맨 뒤에 몰아 붙이면 오래된 대화가 최신 댓글 아래로 밀려 순서가 뒤집힌다.
  // (삭제된 부모의 원래 깊이는 응답에 없어 복원할 수 없다 — 위치만 맞춘다)
  const displayRoots = [];
  const placeholderIds = new Set();

  list.forEach((comment) => {
    if (!comment.parentCommentId) {
      displayRoots.push(comment);
      return;
    }

    const parentId = comment.parentCommentId;
    if (!commentById.has(parentId) && !placeholderIds.has(parentId)) {
      placeholderIds.add(parentId);
      displayRoots.push({ commentId: parentId, isDeleted: true, isPlaceholder: true });
    }
  });

  const flattenThread = (comment, depth, acc) => {
    if (depth > MAX_RENDER_DEPTH) return acc;
    acc.push({ comment, depth });
    getChildren(comment.commentId).forEach((child) => flattenThread(child, depth + 1, acc));
    return acc;
  };

  const visibleComments = displayRoots.reduce((acc, root) => flattenThread(root, 0, acc), []);

  // 본인 댓글 판별.
  // 서버가 isMine 을 주면 그것을 쓴다 — 익명 댓글은 userId 가 null 로 마스킹돼 비교 자체가 불가능하다.
  // (userId 가 문자열로 내려올 수 있어 숫자로 맞춰 비교한다)
  const isOwner = (comment) => {
    if (typeof comment.isMine === 'boolean') return comment.isMine;
    if (comment.userId == null || currentUserId == null) return false;
    return Number(comment.userId) === Number(currentUserId);
  };

  // 익명 댓글은 본인 여부를 알 수 없으므로(userId=null) 신고 버튼을 감춘다.
  // 그대로 두면 자기가 쓴 익명 댓글을 자기가 신고하는 흐름이 열린다.
  // TODO: 서버가 댓글 목록에 isMine 을 추가하면 익명 댓글도 수정/삭제를 정상 노출할 수 있다.
  const canReport = (comment) =>
    typeof comment.isMine === 'boolean' ? !comment.isMine : !comment.isAnonymous;

  const isDeleted = (comment) => Boolean(comment.isDeleted ?? comment.deleted);

  const resetInput = () => {
    setCommentText('');
    setIsAnonymous(false);
    setIsPrivate(false);
    setEditingId(null);
    setReplyTo(null);
  };

  // 확인 모달에서 '네'를 누른 뒤 실행되는 수정 처리
  const runUpdate = async (commentId, body) => {
    try {
      await updateComment(boardId, postId, commentId, body);
      resetInput();
      refetch();
    } catch (error) {
      setAlertState({ title: getErrorMessage(error, '댓글 수정에 실패했습니다.') });
    }
  };

  // 확인 모달에서 '네'를 누른 뒤 실행되는 삭제 처리
  const runDelete = async (commentId) => {
    try {
      await deleteComment(boardId, postId, commentId);
      if (editingId === commentId || replyTo?.commentId === commentId) resetInput();
      refetch();
    } catch (error) {
      setAlertState({ title: getErrorMessage(error, '댓글 삭제에 실패했습니다.') });
    }
  };

  // 하단 입력창 제출 - 수정 모드면 확인 모달, 아니면 댓글/답글 등록
  const handleSubmit = async () => {
    if (!commentText.trim() || isSubmitting) return;

    if (editingId) {
      const targetId = editingId;
      const body = { content: commentText.trim(), isAnonymous, isPrivate };
      setConfirmState({
        title: '댓글 내용을 수정하시겠습니까?',
        onConfirm: () => runUpdate(targetId, body),
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await createComment(boardId, postId, {
        content: commentText.trim(),
        parentCommentId: replyTo ? replyTo.commentId : null,
        isAnonymous,
        isPrivate,
      });
      resetInput();
      refetch();
    } catch (error) {
      setAlertState({ title: getErrorMessage(error, '댓글 등록에 실패했습니다.') });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 답글 (같은 댓글의 답글 버튼을 다시 누르면 해제)
  const toggleReply = (comment) => {
    if (replyTo?.commentId === comment.commentId) {
      resetInput();
      return;
    }
    setEditingId(null);
    setReplyTo(comment);
    setCommentText('');
    setIsAnonymous(false);
    setIsPrivate(false);
  };

  // 수정 - 하단 입력창에 기존 내용을 불러온다 (같은 댓글의 수정 버튼을 다시 누르면 해제)
  const toggleEdit = (comment) => {
    if (editingId === comment.commentId) {
      resetInput();
      return;
    }
    setReplyTo(null);
    setEditingId(comment.commentId);
    setCommentText(comment.content ?? '');
    setIsAnonymous(Boolean(comment.isAnonymous));
    setIsPrivate(Boolean(comment.isPrivate));
  };

  const handleDelete = (commentId) => {
    setConfirmState({
      title: '댓글을 삭제하시겠습니까?',
      onConfirm: () => runDelete(commentId),
    });
  };

  const handleReport = (comment) => {
    setReportTarget(comment);
  };

  // 신고 - 모달에서 사유 선택 후 확인
  // TODO: 백엔드 신고(reports) API 스펙 확정 후 실제 전송 연동 (지금은 접수완료 모달만)
  const handleReportSubmit = () => {
    setReportTarget(null);
    setAlertState(REPORT_SUCCESS_ALERT);
  };

  // 익명 댓글은 서버가 authorName='익명', userId=null 로 이미 마스킹해 내려준다
  const reportTargetUser = () => {
    if (!reportTarget) return null;
    return {
      loginId: reportTarget.loginId,
      studentId: reportTarget.studentId,
      name: reportTarget.authorName,
    };
  };

  const reportTargetContent = () =>
    reportTarget ? `${boardLabel} / ${reportTarget.content ?? ''}` : '';

  // 댓글 1개 렌더 (depth 0 = 최상위 댓글, 1 이상 = 답글)
  const renderComment = (comment, depth) => {
    // 자리표시(삭제된 부모)는 원래 답글이었으므로 최상위처럼 보이지 않게 화살표를 붙인다
    const isReply = depth > 0 || Boolean(comment.isPlaceholder);
    const indentClass = INDENT_CLASS_BY_DEPTH[Math.min(depth, MAX_INDENT_DEPTH)];
    const deleted = isDeleted(comment);
    const owner = isOwner(comment);
    const replying = replyTo?.commentId === comment.commentId;
    const editing = editingId === comment.commentId;
    const anchorId = getCommentAnchorId(comment.commentId);
    // 해시로 지목된 댓글도 답글·수정 중인 댓글과 같은 회색 배경으로 눈에 띄게 한다
    const highlighted = replying || editing || focusedAnchor === anchorId;

    const actionClassName = (active) =>
      `text-[14px] transition-colors ${
        active ? 'font-medium text-[#212121]' : 'text-[#919191] hover:text-[#212121]'
      }`;

    return (
      <div
        key={comment.commentId}
        // 댓글 하나를 URL로 가리킬 수 있게 앵커를 붙인다 (예: /students/boards/2/posts/12#comment-3)
        id={anchorId}
        className={`flex w-full scroll-mt-[100px] flex-col gap-3 py-4 md:flex-row md:items-start md:justify-between md:py-5 ${indentClass} ${
          highlighted ? 'bg-[#f5f5f5]' : ''
        }`}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
          {deleted ? (
            <p className="flex items-center gap-1 text-[16px] tracking-[-0.32px] text-[#919191] leading-[26px]">
              {isReply && <CornerDownRight className="h-4 w-4 shrink-0 text-[#b9b9b9]" aria-hidden />}
              삭제된 댓글입니다
            </p>
          ) : (
            <>
              <span className="flex items-center gap-1 text-[16px] tracking-[-0.32px] text-[#454545] leading-[26px]">
                {isReply && (
                  <CornerDownRight className="h-4 w-4 shrink-0 text-[#b9b9b9]" aria-hidden />
                )}
                {comment.authorName}
              </span>
              <p className="text-[16px] tracking-[-0.32px] text-[#454545] leading-[26px] whitespace-pre-line">
                {comment.content}
              </p>
              <span className="text-[14px] tracking-[-0.28px] text-[#919191] leading-[22px]">
                {formatSlashDateTime(comment.updated ?? comment.created)}
              </span>
            </>
          )}
        </div>

        {/* 액션: 삭제된 댓글에는 표시하지 않는다 */}
        {!deleted && (
          <div className="flex shrink-0 items-center gap-3 md:ml-5">
            <button
              type="button"
              className={actionClassName(replying)}
              onClick={() => toggleReply(comment)}
            >
              답글
            </button>

            {owner ? (
              <>
                <button
                  type="button"
                  className={actionClassName(editing)}
                  onClick={() => toggleEdit(comment)}
                >
                  수정
                </button>
                <button
                  type="button"
                  className={actionClassName(false)}
                  onClick={() => handleDelete(comment.commentId)}
                >
                  삭제
                </button>
              </>
            ) : (
              canReport(comment) && (
                <button
                  type="button"
                  className={actionClassName(false)}
                  onClick={() => handleReport(comment)}
                >
                  신고
                </button>
              )
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="flex w-full flex-col gap-8 md:gap-[60px]">
      <div className="flex w-full flex-col items-center">
        <div className="w-full py-2 md:px-5 md:py-[10px]">
          <span className="text-[16px] leading-[1.6] tracking-[-0.36px] text-[#454545] md:text-[18px]">
            {/* 목록을 못 받은 동안에는 상세 응답의 commentCount 를 쓴다 (0개로 위장하지 않도록) */}
            댓글 {commentsError || commentsLoading ? (commentCount ?? 0) : list.length}개
          </span>
        </div>

        {commentsLoading && (
          <div className="w-full py-4 text-center text-[14px] text-[#919191]">
            댓글을 불러오는 중입니다.
          </div>
        )}

        {!commentsLoading && commentsError && (
          <div className="flex w-full flex-col items-center gap-2 py-4">
            <span className="text-[14px] text-[#919191]">{commentsError}</span>
            <button
              type="button"
              onClick={refetch}
              className="text-[14px] text-[#919191] underline transition-colors hover:text-[#212121]"
            >
              다시 시도
            </button>
          </div>
        )}

        {visibleComments.map(({ comment, depth }, idx) => (
          <React.Fragment key={comment.commentId}>
            {renderComment(comment, depth)}
            {idx !== visibleComments.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </div>

      {/* 댓글 입력 (댓글 작성 / 답글 작성 / 댓글 수정 공용) */}
      <div className="flex w-full flex-col gap-4 md:gap-5">
        <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:gap-5">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={replyTo ? '답글을 작성하세요.' : '댓글을 작성하세요.'}
            className="h-12 w-full flex-1 rounded-[4px] border border-[#b9b9b9] bg-white px-4 text-[15px] tracking-[-0.32px] text-[#212121] outline-none placeholder:text-[#919191] focus:border-[#919191] md:h-[52px] md:text-[16px]"
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
              handleSubmit();
            }}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !commentText.trim()}
            className="h-12 w-full shrink-0 rounded-[4px] bg-[#212121] text-[15px] tracking-[-0.32px] text-white disabled:opacity-60 md:h-[52px] md:w-[135px] md:text-[16px]"
          >
            {isSubmitting ? '등록 중...' : replyTo ? '답글 작성' : '댓글 작성'}
          </button>
        </div>

        {/* 익명 / 비밀댓글 체크박스 (게시판이 허용할 때만) */}
        {(allowAnonymous || allowPrivateComment) && (
          <div className="flex items-center gap-[20px]">
            {allowAnonymous && (
              <div className="flex items-center gap-[8px]">
                <input
                  type="checkbox"
                  id="comment-anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-[24px] h-[24px] border border-[#919191] rounded-[2px] cursor-pointer accent-[#212121]"
                />
                <label
                  htmlFor="comment-anonymous"
                  className="text-[14px] tracking-[-0.28px] text-[#919191] leading-[1.6] cursor-pointer"
                >
                  익명
                </label>
              </div>
            )}

            {allowPrivateComment && (
              <div className="flex items-center gap-[8px]">
                <input
                  type="checkbox"
                  id="comment-private"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-[24px] h-[24px] border border-[#919191] rounded-[2px] cursor-pointer accent-[#212121]"
                />
                <label
                  htmlFor="comment-private"
                  className="text-[14px] tracking-[-0.28px] text-[#919191] leading-[1.6] cursor-pointer"
                >
                  비밀 댓글
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 댓글 신고 모달 */}
      <ReportModal
        open={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        onSubmit={handleReportSubmit}
        targetUser={reportTargetUser()}
        targetContent={reportTargetContent()}
      />

      {/* 수정 / 삭제 확인 모달 */}
      <ConfirmModal
        open={Boolean(confirmState)}
        title={confirmState?.title ?? ''}
        onConfirm={() => {
          const action = confirmState?.onConfirm;
          setConfirmState(null);
          action?.();
        }}
        onCancel={() => setConfirmState(null)}
      />

      {/* 신고 결과 안내 모달 */}
      <AlertModal
        open={Boolean(alertState)}
        title={alertState?.title ?? ''}
        description={alertState?.description ?? ''}
        onClose={() => setAlertState(null)}
      />
    </section>
  );
}
