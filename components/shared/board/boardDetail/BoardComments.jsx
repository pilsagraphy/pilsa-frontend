'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { getComments, createComment, updateComment, deleteComment, getCommentState } from '@/apis/comment';
import { getErrorMessage } from '@/apis/auth';
import useApiRequest from '@/hooks/useApiRequest';
import useCommentAnchor from '@/hooks/useCommentAnchor';
import { getCommentAnchorId } from '@/lib/utils';
import useAuthStore from '@/stores/useAuthStore';
import ReportModal from '@/components/shared/board/boardList/ReportModal';
import ConfirmModal from '@/components/common/ConfirmModal';
import AlertModal from '@/components/common/AlertModal';
import { REPORT_SUCCESS_ALERT, REPORT_DUPLICATE_ALERT, getReasonId } from '@/constants/report';
import { submitReport } from '@/apis/report';
import { CornerDownRight, ArrowBigRight, Lock } from 'lucide-react';
import { useMinWidthMd } from '@/lib/useMinWidthMd';
import { formatSlashDateTime } from '@/lib/boardDetail';
import PaginationWithEllipsis from '@/components/shared/PaginationWithEllipsis';

function Divider() {
  return <div className="w-full h-px bg-[#DEDEDE]" />;
}

// 답글은 한 단계만 있다(PM 결정). 최상위 댓글 아래에 답글들이 순서대로 쌓이고, 답글에는 [답글] 버튼이 없다.
// 서버는 부모 id 를 무제한 깊이로 받아 주지만(예전 데이터에 답글의 답글이 남아 있다), 화면은 그것들도
// 같은 묶음의 답글로 편다 — 어느 최상위 댓글 아래 대화인지만 보이면 된다.
// 들여쓰기는 globals.css 의 .commentRow 가 --comment-depth 로 계산한다 (0 = 최상위, 1 = 답글).
const MAX_INDENT_DEPTH = 1;

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
 * - 등록은 Enter (채팅처럼). 줄바꿈은 Shift+Enter. Ctrl/Cmd+Enter 도 등록이다. 인라인 입력창은 Esc 로 닫는다.
 *   한글 조합 중(isComposing)의 Enter 는 조합 확정이라 무시한다 — 안 그러면 마지막 글자가 잘린 채 나간다.
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

  // 폰(#183 피그마): 입력칸 40px + 오른쪽 화살표 버튼 55px 한 줄, 체크박스 18px, 안내문 '내용을 입력하세요.'
  // PC 는 예전 그대로(넓은 입력칸, 아래 줄에 체크박스와 글자 버튼). 마크업은 한 벌이고 클래스로 가른다.
  const isMdUp = useMinWidthMd();
  const placeholder = isMdUp ? labels.placeholder : '내용을 입력하세요.';
  const checkboxClass =
    'h-[18px] w-[18px] cursor-pointer rounded-[2px] border border-[#919191] accent-[#212121] lg:h-[24px] lg:w-[24px]';
  const checkboxLabelClass = 'cursor-pointer text-[14px] leading-[1.6] tracking-[-0.28px] text-[#919191]';

  return (
    <div className="flex w-full flex-col gap-2 lg:gap-4">
      {/* 폰: 입력칸과 화살표 버튼이 한 줄. PC: 입력칸만 한 줄 (버튼은 아래 줄) */}
      <div className="flex w-full items-end gap-1 lg:block">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={1}
          className={`min-h-[40px] w-full flex-1 resize-none rounded-[4px] border bg-white px-4 py-[10px] text-[16px] leading-[1.25] tracking-[-0.32px] text-[#212121] outline-none placeholder:text-[#919191] focus:border-[#212121] lg:border-[#b9b9b9] lg:py-3 lg:leading-[1.6] lg:focus:border-[#919191] ${
            inline ? 'border-[#212121] lg:min-h-[72px]' : 'border-[#919191] lg:min-h-[112px]'
          }`}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === 'Escape' && onCancel) {
              e.preventDefault();
              onCancel();
              return;
            }
            // Enter = 등록, Shift+Enter = 줄바꿈 (Ctrl/Cmd+Enter 도 등록)
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          aria-label={labels.submit}
          className="flex h-[40px] w-[55px] shrink-0 items-center justify-center rounded-[4px] bg-[#212121] text-white disabled:opacity-60 lg:hidden"
        >
          <ArrowBigRight width={24} height={24} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>

      {/* 아래 줄: 왼쪽 익명/비밀댓글 체크박스(게시판이 허용할 때만), 오른쪽 취소·등록.
          폰에서는 등록이 위 화살표라 여기엔 취소만 남는다 */}
      {(allowAnonymous || allowPrivateComment || onCancel || isMdUp) && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-[20px]">
            {allowAnonymous && (
              <div className="flex items-center gap-[8px]">
                <input
                  type="checkbox"
                  id={`${uid}-anonymous`}
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className={checkboxClass}
                />
                <label htmlFor={`${uid}-anonymous`} className={checkboxLabelClass}>
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
                  className={checkboxClass}
                />
                <label htmlFor={`${uid}-private`} className={checkboxLabelClass}>
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
                className="h-9 rounded-[4px] px-3 text-[14px] tracking-[-0.28px] text-[#919191] transition-colors hover:text-[#212121] lg:h-[52px] lg:px-4 lg:text-[16px]"
              >
                취소
              </button>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className={`hidden h-[52px] shrink-0 rounded-[4px] bg-[#212121] text-[16px] tracking-[-0.32px] text-white disabled:opacity-60 lg:block ${
                inline ? 'px-5' : 'w-[135px]'
              }`}
            >
              {submitting ? '등록 중...' : labels.submit}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


// 공통게시판 댓글/대댓글.
// 익명/비밀 허용 여부는 게시판 플래그(board.allowAnonymous / board.allowPrivateComment)로 결정한다.
// 익명·비밀 마스킹(익명 authorName='익명', 비밀 content='비밀댓글입니다.')은 서버가 처리하므로
// 프론트는 받은 값을 그대로 그린다 (다시 마스킹하지 않는다).
// 한 페이지에 보이는 댓글 줄 수 (댓글·답글 합쳐서)
const COMMENTS_PER_PAGE = 20;

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

  // 댓글이 많으면 20줄씩 끊는다 — 부모·답글 구분 없이 화면에 그려지는 순서대로 (PM, 2026-09-21)
  const [commentPage, setCommentPage] = useState(1);
  // 새 댓글은 맨 뒤에 붙으므로, 쓰고 나면 마지막 페이지로 간다 (목록이 새로 온 뒤에)
  const goLastPageRef = useRef(false);

  // 링크가 가리키는 댓글이 목록에 없으면(지워졌거나 가려졌거나) 왜 없는지 알려 준다.
  // 알림을 눌렀는데 아무 일도 안 일어나면 어리둥절하다 (2026-09-20 PM)
  const [missingNotice, setMissingNotice] = useState('');
  useEffect(() => {
    if (commentsLoading || commentsError) return;
    const anchor = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
    if (!anchor.startsWith('comment-')) return;
    const commentId = Number(anchor.slice('comment-'.length));
    if (!Number.isFinite(commentId)) return;
    if (list.some((c) => Number(c.commentId) === commentId)) {
      setMissingNotice('');
      return;
    }
    let alive = true;
    getCommentState(boardId, commentId)
      .then((state) => {
        if (!alive) return;
        if (state === 'deleted') setMissingNotice('링크의 댓글은 삭제되어 더 볼 수 없어요.');
        else if (state === 'blind') setMissingNotice('링크의 댓글은 운영진이 블라인드 처리해 볼 수 없어요.');
        else setMissingNotice('');
      })
      .catch(() => alive && setMissingNotice('링크의 댓글을 찾을 수 없어요.'));
    return () => {
      alive = false;
    };
  }, [list, commentsLoading, commentsError, boardId]);

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

  // 답글 묶음: 각 댓글이 어느 최상위 댓글 아래 대화인지 찾는다.
  // 부모를 거슬러 올라가 부모가 없는(최상위) 댓글, 또는 부모가 목록에 없는(삭제된) 댓글에서 멈춘다.
  const commentById = new Map(list.map((c) => [c.commentId, c]));
  const topOf = (comment) => {
    let current = comment;
    const seen = new Set(); // 잘못된 데이터(순환 참조)로 무한히 돌지 않게
    while (
      current.parentCommentId &&
      commentById.has(current.parentCommentId) &&
      !seen.has(current.commentId)
    ) {
      seen.add(current.commentId);
      current = commentById.get(current.parentCommentId);
    }
    return current;
  };
  // 묶음 키: 최상위 댓글이면 그 id, 부모가 삭제돼 목록에 없으면 그 (없는) 부모 id 의 자리표시
  const groupKeyOf = (comment) => {
    const top = topOf(comment);
    return top.parentCommentId ? `placeholder:${top.parentCommentId}` : `comment:${top.commentId}`;
  };

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

  // 묶음별 답글. 답글의 답글도 같은 묶음에 들어가 한 줄로 쌓이므로, 서버 순서를 믿지 않고
  // 작성 시각순으로 다시 세운다 — 중간 댓글에 단 답글이 그 댓글 바로 뒤가 아니라 제 시간 자리에 놓인다.
  // 시각이 같으면 id 순 (같은 초에 달린 답글끼리 순서가 흔들리지 않게).
  const repliesByGroup = new Map();
  list.forEach((comment) => {
    if (!comment.parentCommentId) return;
    const key = groupKeyOf(comment);
    if (!repliesByGroup.has(key)) repliesByGroup.set(key, []);
    repliesByGroup.get(key).push(comment);
  });
  const byCreated = (a, b) =>
    String(a.created ?? '').localeCompare(String(b.created ?? '')) ||
    Number(a.commentId) - Number(b.commentId);
  repliesByGroup.forEach((replies) => replies.sort(byCreated));

  // 화면에 그리는 순서(댓글 → 그 답글들 → 다음 댓글 …)로 전부 펼친 뒤, 부모·답글 구분 없이 20줄씩 끊는다.
  // 답글 묶음이 페이지 경계에 걸리면 다음 페이지로 이어진다 (PM: 개수 기준이 단순한 게 낫다, 2026-09-21)
  const allComments = displayRoots.flatMap((root) => {
    const key = root.isPlaceholder ? `placeholder:${root.commentId}` : `comment:${root.commentId}`;
    const replies = repliesByGroup.get(key) ?? [];
    return [{ comment: root, depth: 0 }, ...replies.map((reply) => ({ comment: reply, depth: 1 }))];
  });

  const totalCommentPages = Math.max(1, Math.ceil(allComments.length / COMMENTS_PER_PAGE));
  const safePage = Math.min(Math.max(1, commentPage), totalCommentPages);
  const pageSlice = allComments.slice((safePage - 1) * COMMENTS_PER_PAGE, safePage * COMMENTS_PER_PAGE);
  // 페이지가 답글로 시작하면(묶음이 경계에서 끊김) 어느 댓글의 답글인지 알 수 있게 부모를 맨 위에 한 번 더 보여 준다.
  // 부모는 앞 페이지에도 있으므로 양쪽에 다 나온다 (PM, 2026-09-21)
  const visibleComments = (() => {
    const first = pageSlice[0];
    if (!first || first.depth === 0) return pageSlice;
    // findLastIndex 는 구형 폰 브라우저에 없어 직접 거슬러 올라간다
    let parentIndex = -1;
    for (let i = (safePage - 1) * COMMENTS_PER_PAGE - 1; i >= 0; i -= 1) {
      if (allComments[i].depth === 0) {
        parentIndex = i;
        break;
      }
    }
    if (parentIndex < 0) return pageSlice;
    return [{ ...allComments[parentIndex], isContext: true }, ...pageSlice];
  })();

  // 페이지를 옮기면 그 페이지의 첫 댓글이 보이게 위로 올린다 (처음 그릴 때는 건드리지 않는다)
  const listTopRef = useRef(null);
  const lastScrolledPageRef = useRef(null);
  useEffect(() => {
    if (lastScrolledPageRef.current == null) {
      lastScrolledPageRef.current = safePage;
      return;
    }
    if (lastScrolledPageRef.current === safePage) return;
    lastScrolledPageRef.current = safePage;
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [safePage]);

  // 링크(#comment-3)가 가리키는 댓글이 다른 페이지에 있으면 그 페이지로 옮긴다 — 처음 한 번만
  const hashPageHandledRef = useRef(false);
  useEffect(() => {
    if (hashPageHandledRef.current || list.length === 0) return;
    const anchor = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
    if (!anchor.startsWith('comment-')) return;
    const commentId = Number(anchor.slice('comment-'.length));
    const index = allComments.findIndex(({ comment }) => Number(comment.commentId) === commentId);
    if (index < 0) return;
    hashPageHandledRef.current = true;
    setCommentPage(Math.floor(index / COMMENTS_PER_PAGE) + 1);
  });

  useEffect(() => {
    if (!goLastPageRef.current) return;
    goLastPageRef.current = false;
    setCommentPage(totalCommentPages);
  }, [list, totalCommentPages]);

  // URL 해시(#comment-3)로 지목된 댓글 강조 (관리자 신고 관리 링크용).
  // 지금 페이지에 그려진 댓글을 넘긴다 — 페이지가 바뀌어 대상이 나타나면 그때 스크롤한다
  const focusedAnchor = useCommentAnchor(visibleComments);

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
      else {
        setNewComposerKey((k) => k + 1);
        goLastPageRef.current = true;
      }
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

  // 신고 - 모달에서 고른 사유를 서버에 보낸다. 409 는 이미 신고했거나 대상이 삭제된 경우
  const [reportError, setReportError] = useState('');
  const handleReportSubmit = async ({ reason, detail }) => {
    if (!reportTarget) return;
    setReportError('');
    try {
      await submitReport({
        targetType: 'comment',
        targetId: reportTarget.commentId,
        reasonId: getReasonId(reason),
        detail,
      });
      setReportTarget(null);
      setAlertState(REPORT_SUCCESS_ALERT);
    } catch (error) {
      if (error?.response?.status === 409) {
        setReportTarget(null);
        setAlertState(REPORT_DUPLICATE_ALERT);
        return;
      }
      setReportError(getErrorMessage(error, '신고 접수에 실패했습니다. 잠시 후 다시 시도해주세요.'));
    }
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
  // isContext: 앞 페이지에서 이어진 답글 묶음의 부모를 다시 보여 주는 줄 — 흐리게, 안내 문구를 붙인다
  const renderComment = (comment, depth, { isContext = false } = {}) => {
    if (isContext) {
      return (
        <div className="w-full opacity-60">
          <p className="px-2 pt-2 text-[12px] leading-[1.6] tracking-[-0.24px] text-[#919191] lg:px-5">
            앞 페이지에서 이어지는 답글의 원 댓글
          </p>
          {renderComment(comment, depth)}
        </div>
      );
    }
    // 자리표시(삭제된 부모)는 원래 답글이었으므로 최상위처럼 보이지 않게 화살표를 붙인다
    const isReply = depth > 0 || Boolean(comment.isPlaceholder);
    const indentDepth = Math.min(depth, MAX_INDENT_DEPTH);
    const deleted = isDeleted(comment);
    const owner = isOwner(comment);
    const replying = replyToId === comment.commentId;
    const editing = editingId === comment.commentId;
    const anchorId = getCommentAnchorId(comment.commentId);
    // 해시로 지목된 댓글도 답글·수정 중인 댓글과 같은 회색 배경으로 눈에 띄게 한다
    const highlighted = replying || editing || focusedAnchor === anchorId;

    const actionClassName = (active) =>
      `text-[12px] lg:text-[14px] transition-colors ${
        active ? 'font-medium text-[#212121]' : 'text-[#919191] hover:text-[#212121]'
      }`;

    // 답글/수정/삭제·신고. 폰에서는 이름 줄 오른쪽에, PC 에서는 오른쪽 열에 — 같은 버튼을 자리만 달리 그린다
    const actionButtons = (
      <>
        {/* 답글은 어느 댓글에나 단다. 부모 id 는 그 댓글 자신이라 알림이 그 사람에게 가고,
            화면에서는 어차피 같은 묶음(최상위 댓글 아래) 한 줄에 시간순으로 놓인다 */}
        <button type="button" className={actionClassName(replying)} onClick={() => toggleReply(comment)}>
          답글
        </button>
        {owner ? (
          <>
            <button type="button" className={actionClassName(editing)} onClick={() => toggleEdit(comment)}>
              수정
            </button>
            <button type="button" className={actionClassName(false)} onClick={() => handleDelete(comment.commentId)}>
              삭제
            </button>
          </>
        ) : (
          canReport(comment) && (
            <button type="button" className={actionClassName(false)} onClick={() => handleReport(comment)}>
              신고
            </button>
          )
        )}
      </>
    );

    // 답글 표시. 폰(#183 피그마)은 꺾쇠(└) 모양의 좌·하 테두리 상자, PC 는 화살표 아이콘
    const replyMark = isReply && (
      <>
        <span className="h-3 w-3 shrink-0 border-b border-l border-[#B9B9B9] lg:hidden" aria-hidden />
        <CornerDownRight className="hidden h-4 w-4 shrink-0 text-[#b9b9b9] lg:block" aria-hidden />
      </>
    );

    return (
      <div
        key={comment.commentId}
        // 댓글 하나를 URL로 가리킬 수 있게 앵커를 붙인다 (예: /students/boards/2/posts/12#comment-3)
        id={anchorId}
        className={`commentRow flex w-full scroll-mt-[100px] flex-col gap-[6px] lg:gap-3 ${
          highlighted ? 'bg-[#F6F6F6]' : ''
        }`}
        style={{ '--comment-depth': indentDepth }}
      >
        <div className="flex w-full flex-col gap-[6px] lg:flex-row lg:items-start lg:justify-between lg:gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-[4px] lg:gap-[7px]">
            {deleted ? (
              <p className="flex items-center gap-[16px] text-[16px] leading-[19px] tracking-[-0.32px] text-[#919191] lg:gap-1 lg:leading-[26px]">
                {replyMark}
                삭제된 댓글입니다
              </p>
            ) : (
              <>
                {/* 이름 줄. 폰에서는 오른쪽에 액션이 같이 선다 */}
                <div className="flex items-start justify-between gap-4 lg:block">
                  <span
                    className={`flex min-w-0 items-center gap-[6px] text-[16px] leading-[19px] tracking-[-0.32px] lg:leading-[26px] ${
                      owner ? 'font-semibold text-[#212121]' : 'text-[#454545]'
                    }`}
                  >
                    {replyMark}
                    <span className="truncate">{comment.authorName}</span>
                    {/* 내 댓글 표식 — 긴 스레드에서 내가 쓴 것을 바로 찾게. 익명 댓글도 서버 isMine 으로 판별된다 */}
                    {owner && (
                      <span className="shrink-0 rounded-[3px] bg-[#212121] px-1.5 py-[1px] text-[11px] font-medium leading-[16px] tracking-[-0.2px] text-white">
                        내 댓글
                      </span>
                    )}
                    {/* 비밀 댓글 표식 — 글쓴이와 운영진만 본다는 뜻 */}
                    {comment.isPrivate && (
                      <Lock
                        size={13}
                        strokeWidth={1.8}
                        aria-label="비밀 댓글"
                        className="shrink-0 text-[#757575]"
                      />
                    )}
                  </span>
                  <div className="flex shrink-0 items-center gap-[10px] px-[4px] py-[2px] lg:hidden">
                    {actionButtons}
                  </div>
                </div>

                {/* 본문·날짜. 폰의 답글은 꺾쇠 폭만큼(30px) 들여 쓴다 — PC 는 줄 전체가 깊이만큼 들어가 있다 */}
                <div className={`flex flex-col gap-[4px] ${isReply ? 'pl-[30px] lg:pl-0' : ''}`}>
                  {editing ? (
                    // 수정: 본문 자리에 기존 내용이 채워진 입력창
                    <div className="pt-1 lg:pr-4">
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
                      <p className="select-text whitespace-pre-line text-[16px] leading-[19px] tracking-[-0.32px] text-[#454545] lg:leading-[26px]">
                        {comment.content}
                      </p>
                      <span className="text-[12px] leading-[14px] tracking-[-0.28px] text-[#919191] lg:text-[14px] lg:leading-[22px]">
                        {formatSlashDateTime(comment.updated ?? comment.created)}
                      </span>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* PC 액션 열. 삭제된 댓글에는 표시하지 않는다 */}
          {!deleted && (
            <div className="hidden shrink-0 items-center gap-3 lg:ml-5 lg:flex">{actionButtons}</div>
          )}
        </div>

        {/* 답글: 그 댓글 바로 아래, 답글 들여쓰기 위치에 입력창 */}
        {replying && (
          <div
            className="commentReplyComposer flex w-full items-start gap-2 lg:pr-4"
            style={{ '--comment-depth': Math.min(depth + 1, MAX_INDENT_DEPTH) }}
          >
            <CornerDownRight className="mt-3 hidden h-4 w-4 shrink-0 text-[#b9b9b9] lg:mt-4 lg:block" aria-hidden />
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
    <section className="flex w-full flex-col gap-8 lg:gap-[60px]">
      <div className="flex w-full flex-col items-center">
        <div className="w-full py-2 lg:px-5 lg:py-[10px]">
          <span className="text-[18px] leading-[1.6] tracking-[-0.36px] text-[#454545]">
            {/* 목록을 못 받은 동안에는 상세 응답의 commentCount 를 쓴다 (0개로 위장하지 않도록) */}
            댓글 {commentsError || commentsLoading ? (commentCount ?? 0) : list.length}개
          </span>
        </div>

        {missingNotice && (
          <p className="mb-3 w-full rounded-[6px] bg-[#F5F5F5] px-4 py-3 text-[14px] leading-[1.6] tracking-[-0.28px] text-[#454545] lg:mx-5 lg:w-auto lg:self-stretch">
            {missingNotice}
          </p>
        )}

        {/* 새 댓글 입력 — 목록 위에 둔다. 아래에 두면 댓글이 많을수록 입력창까지 한참 내려가야 했다.
            답글·수정은 각 댓글 아래 인라인으로 뜬다 */}
        <div className="w-full pb-6 lg:px-5 lg:pb-8">
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

        {/* 페이지 이동 때 여기로 스크롤한다 (헤더 아래 조금 띄운다) */}
        <div ref={listTopRef} className="h-0 w-full scroll-mt-4" aria-hidden />

        {visibleComments.map(({ comment, depth, isContext }, idx) => (
          <React.Fragment key={isContext ? `context-${comment.commentId}` : comment.commentId}>
            {renderComment(comment, depth, { isContext })}
            {idx !== visibleComments.length - 1 && <Divider />}
          </React.Fragment>
        ))}

        {totalCommentPages > 1 && (
          <div className="flex w-full justify-center pt-6">
            <PaginationWithEllipsis
              currentPage={safePage}
              totalPages={totalCommentPages}
              onPageChange={(page) => {
                setCommentPage(page);
                closeInline();
              }}
            />
          </div>
        )}
      </div>

      {/* 댓글 신고 모달 */}
      <ReportModal
        open={Boolean(reportTarget)}
        onClose={() => {
          setReportTarget(null);
          setReportError('');
        }}
        onSubmit={handleReportSubmit}
        error={reportError}
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
        mobileBodyMinHeight={alertState?.mobileBodyMinHeight}
        onClose={() => setAlertState(null)}
      />
    </section>
  );
}
