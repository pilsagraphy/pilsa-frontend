'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
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

// 입력창이 내용에 맞춰 자라는 상한 — 이 이상은 안에서 스크롤
const COMPOSER_MAX_HEIGHT = 320;

const COMPOSER_TEXT = {
  new: { placeholder: '댓글을 작성하세요.', submit: '댓글 작성' },
  reply: { placeholder: '답글을 작성하세요.', submit: '답글 작성' },
  edit: { placeholder: '댓글을 수정하세요.', submit: '수정 완료' },
};

/**
 * 댓글 입력창 (새 댓글 / 답글 / 수정 공용).
 *
 * - 내용에 맞춰 높이가 자동으로 늘어난다. 예전엔 3줄 고정이라 조금만 길어져도 안에서 스크롤돼 타이핑이 불편했다.
 * - 답글·수정은 그 댓글 바로 아래에 인라인으로 뜬다(autoFocus). 예전엔 맨 아래 입력창 하나를 답글 모드로 바꿔 써서
 *   답글 한 번에 화면 끝까지 내려가야 했다.
 * - 줄바꿈은 Enter, 등록은 버튼 또는 Ctrl/Cmd+Enter, 인라인 입력창은 Esc 로 닫는다.
 *
 * 값은 내부 상태로 갖고, 등록이 끝나면 부모가 key 를 바꾸거나(새 댓글) 입력창을 떼어(답글·수정) 비운다.
 */
function CommentComposer({
  mode,
  initial,
  allowAnonymous,
  allowPrivateComment,
  submitting,
  autoFocus = false,
  onSubmit,
  onCancel,
}) {
  const [text, setText] = useState(initial?.content ?? '');
  const [isAnonymous, setIsAnonymous] = useState(Boolean(initial?.isAnonymous));
  const [isPrivate, setIsPrivate] = useState(Boolean(initial?.isPrivate));
  const textareaRef = useRef(null);
  const uid = useId(); // 인라인 입력창이 여러 개 떠도 체크박스 id 가 겹치지 않게

  // 자동 높이 — 매 입력마다 실제 내용 높이로 맞춘다 (상한까지)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, COMPOSER_MAX_HEIGHT);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > COMPOSER_MAX_HEIGHT ? 'auto' : 'hidden';
  }, [text]);

  // 인라인 입력창은 뜨자마자 포커스 + 화면 가운데로 — 모바일에서 키보드가 올라와도 입력창이 보이게
  useEffect(() => {
    if (!autoFocus) return;
    const el = textareaRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    // 수정 모드는 커서를 끝으로
    const end = el.value.length;
    el.setSelectionRange(end, end);
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [autoFocus]);

  const canSubmit = Boolean(text.trim()) && !submitting;
  const submit = () => {
    if (!canSubmit) return;
    onSubmit({ content: text.trim(), isAnonymous, isPrivate });
  };

  const labels = COMPOSER_TEXT[mode] ?? COMPOSER_TEXT.new;
  const inline = mode !== 'new';

  return (
    <div className="flex w-full flex-col gap-3 md:gap-4">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={labels.placeholder}
        rows={inline ? 2 : 3}
        className={`w-full resize-none rounded-[4px] border border-[#b9b9b9] bg-white px-4 py-3 text-[15px] leading-[1.6] tracking-[-0.32px] text-[#212121] outline-none placeholder:text-[#919191] focus:border-[#919191] md:text-[16px] ${
          inline ? 'min-h-[72px]' : 'min-h-[96px] md:min-h-[112px]'
        }`}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return;
          if (e.key === 'Escape' && onCancel) {
            e.preventDefault();
            onCancel();
            return;
          }
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            submit();
          }
        }}
      />

      {/* 아래 줄: 왼쪽 익명/비밀댓글 체크박스(게시판이 허용할 때만), 오른쪽 취소·등록 버튼 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-[20px]">
          {allowAnonymous && (
            <div className="flex items-center gap-[8px]">
              <input
                type="checkbox"
                id={`${uid}-anonymous`}
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-[24px] h-[24px] border border-[#919191] rounded-[2px] cursor-pointer accent-[#212121]"
              />
              <label
                htmlFor={`${uid}-anonymous`}
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
                id={`${uid}-private`}
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-[24px] h-[24px] border border-[#919191] rounded-[2px] cursor-pointer accent-[#212121]"
              />
              <label
                htmlFor={`${uid}-private`}
                className="text-[14px] tracking-[-0.28px] text-[#919191] leading-[1.6] cursor-pointer"
              >
                비밀 댓글
              </label>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="h-11 rounded-[4px] px-4 text-[15px] tracking-[-0.32px] text-[#919191] transition-colors hover:text-[#212121] md:h-[52px] md:text-[16px]"
            >
              취소
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className={`h-11 shrink-0 rounded-[4px] bg-[#212121] text-[15px] tracking-[-0.32px] text-white disabled:opacity-60 md:h-[52px] md:text-[16px] ${
              inline ? 'px-5' : 'w-[120px] md:w-[135px]'
            }`}
          >
            {submitting ? '등록 중...' : labels.submit}
          </button>
        </div>
      </div>
    </div>
  );
}

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

  // 어느 댓글에 답글/수정 입력창이 열려 있는지 (동시에 하나만)
  const [editingId, setEditingId] = useState(null);
  const [replyToId, setReplyToId] = useState(null);
  // 새 댓글 입력창은 등록이 끝나면 key 를 바꿔 비운다
  const [newComposerKey, setNewComposerKey] = useState(0);
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

  const closeInline = () => {
    setEditingId(null);
    setReplyToId(null);
  };

  // 확인 모달에서 '네'를 누른 뒤 실행되는 수정 처리
  const runUpdate = async (commentId, body) => {
    try {
      await updateComment(boardId, postId, commentId, body);
      closeInline();
      refetch();
    } catch (error) {
      setAlertState({ title: getErrorMessage(error, '댓글 수정에 실패했습니다.') });
    }
  };

  // 확인 모달에서 '네'를 누른 뒤 실행되는 삭제 처리
  const runDelete = async (commentId) => {
    try {
      await deleteComment(boardId, postId, commentId);
      if (editingId === commentId || replyToId === commentId) closeInline();
      refetch();
    } catch (error) {
      setAlertState({ title: getErrorMessage(error, '댓글 삭제에 실패했습니다.') });
    }
  };

  // 새 댓글(parentCommentId=null) / 답글(parentCommentId=부모) 등록
  const submitCreate = async ({ content, isAnonymous, isPrivate }, parentCommentId) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await createComment(boardId, postId, { content, parentCommentId, isAnonymous, isPrivate });
      if (parentCommentId) closeInline();
      else setNewComposerKey((k) => k + 1);
      refetch();
    } catch (error) {
      setAlertState({ title: getErrorMessage(error, '댓글 등록에 실패했습니다.') });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 수정은 확인 모달을 거친다
  const submitEdit = (commentId, body) => {
    setConfirmState({
      title: '댓글 내용을 수정하시겠습니까?',
      onConfirm: () => runUpdate(commentId, body),
    });
  };

  // 답글 — 그 댓글 바로 아래에 입력창을 연다 (같은 댓글의 답글 버튼을 다시 누르면 닫힘)
  const toggleReply = (comment) => {
    if (replyToId === comment.commentId) {
      closeInline();
      return;
    }
    setEditingId(null);
    setReplyToId(comment.commentId);
  };

  // 수정 — 댓글 본문 자리에 기존 내용이 채워진 입력창을 연다 (같은 댓글의 수정 버튼을 다시 누르면 닫힘)
  const toggleEdit = (comment) => {
    if (editingId === comment.commentId) {
      closeInline();
      return;
    }
    setReplyToId(null);
    setEditingId(comment.commentId);
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
    const replying = replyToId === comment.commentId;
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
        className={`flex w-full scroll-mt-[100px] flex-col gap-3 py-4 md:py-5 ${indentClass} ${
          highlighted ? 'bg-[#f5f5f5]' : ''
        }`}
      >
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
            {deleted ? (
              <p className="flex items-center gap-1 text-[16px] tracking-[-0.32px] text-[#919191] leading-[26px]">
                {isReply && <CornerDownRight className="h-4 w-4 shrink-0 text-[#b9b9b9]" aria-hidden />}
                삭제된 댓글입니다
              </p>
            ) : (
              <>
                <span
                  className={`flex items-center gap-1 text-[16px] tracking-[-0.32px] leading-[26px] ${
                    owner ? 'font-semibold text-[#212121]' : 'text-[#454545]'
                  }`}
                >
                  {isReply && (
                    <CornerDownRight className="h-4 w-4 shrink-0 text-[#b9b9b9]" aria-hidden />
                  )}
                  {comment.authorName}
                  {/* 내 댓글 표식 — 긴 스레드에서 내가 쓴 것을 바로 찾게. 익명 댓글도 서버 isMine 으로 판별된다 */}
                  {owner && (
                    <span className="ml-1 rounded-[3px] bg-[#212121] px-1.5 py-[1px] text-[11px] font-medium leading-[16px] tracking-[-0.2px] text-white">
                      내 댓글
                    </span>
                  )}
                </span>

                {editing ? (
                  // 수정: 본문 자리에 기존 내용이 채워진 입력창
                  <div className="pt-1 md:pr-4">
                    <CommentComposer
                      mode="edit"
                      initial={comment}
                      allowAnonymous={allowAnonymous}
                      allowPrivateComment={allowPrivateComment}
                      submitting={false}
                      autoFocus
                      onSubmit={(body) => submitEdit(comment.commentId, body)}
                      onCancel={closeInline}
                    />
                  </div>
                ) : (
                  <>
                    <p className="select-text text-[16px] tracking-[-0.32px] text-[#454545] leading-[26px] whitespace-pre-line">
                      {comment.content}
                    </p>
                    <span className="text-[14px] tracking-[-0.28px] text-[#919191] leading-[22px]">
                      {formatSlashDateTime(comment.updated ?? comment.created)}
                    </span>
                  </>
                )}
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

        {/* 답글: 그 댓글 바로 아래, 답글 들여쓰기 위치에 입력창 */}
        {replying && (
          <div className="flex w-full items-start gap-2 pl-[16px] md:pl-[40px] md:pr-4">
            <CornerDownRight className="mt-4 h-4 w-4 shrink-0 text-[#b9b9b9]" aria-hidden />
            <CommentComposer
              mode="reply"
              allowAnonymous={allowAnonymous}
              allowPrivateComment={allowPrivateComment}
              submitting={isSubmitting}
              autoFocus
              onSubmit={(body) => submitCreate(body, comment.commentId)}
              onCancel={closeInline}
            />
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

        {/* 새 댓글 입력 — 목록 위에 둔다. 아래에 두면 댓글이 많을수록 입력창까지 한참 내려가야 했다.
            답글·수정은 각 댓글 아래 인라인으로 뜬다 */}
        <div className="w-full pb-6 md:px-5 md:pb-8">
          <CommentComposer
            key={newComposerKey}
            mode="new"
            allowAnonymous={allowAnonymous}
            allowPrivateComment={allowPrivateComment}
            submitting={isSubmitting}
            onSubmit={(body) => submitCreate(body, null)}
          />
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
