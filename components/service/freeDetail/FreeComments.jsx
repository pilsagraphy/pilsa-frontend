'use client';

import React, { useState } from 'react';
import { createFreeComment, updateFreeComment, deleteFreeComment } from '@/apis/free';
import { getErrorMessage } from '@/apis/auth';
import useAuthStore from '@/stores/useAuthStore';
import ReportModal from '@/components/shared/board/ReportModal';
import ConfirmModal from '@/components/common/ConfirmModal';
import AlertModal from '@/components/common/AlertModal';
import { REPORT_SUCCESS_ALERT } from '@/constants/report';
import { CornerDownRight } from 'lucide-react';

function Divider() {
  return <div className="w-full h-px bg-[#DEDEDE]" />;
}

function formatDate(isoString) {
  if (!isoString) return '';
  if (isoString.includes('/')) return isoString;
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}

// 깊이별 들여쓰기 (Tailwind가 정적으로 인식하도록 클래스를 미리 정의해 둔다)
// 이 배열 길이를 넘어가는 깊이는 마지막 값을 그대로 쓴다 - 모바일 가독성 보호
const INDENT_CLASS_BY_DEPTH = ['md:px-10', 'pl-[16px] md:pl-[40px]', 'pl-[32px] md:pl-[80px]'];
const MAX_INDENT_DEPTH = INDENT_CLASS_BY_DEPTH.length - 1;

// 잘못된 데이터(순환 참조 등)로 무한 재귀에 빠지지 않게 하는 안전장치
const MAX_RENDER_DEPTH = 20;

export default function FreeComments({ postId, comments = [], onChanged }) {
  // 현재 로그인 사용자 (본인 댓글 판별용)
  const currentUserId = useAuthStore((s) => s.user?.userId);

  // 하단 입력창 - 댓글 작성 / 답글 작성 / 댓글 수정에 공용으로 쓴다
  const [commentText, setCommentText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // 수정 중인 댓글 id (null이면 수정 모드 아님)
  const [editingId, setEditingId] = useState(null);
  // 답글 대상 댓글 (null이면 일반 댓글 작성)
  const [replyTo, setReplyTo] = useState(null);
  // 신고 대상 댓글 (null이면 신고 모달 닫힘)
  const [reportTarget, setReportTarget] = useState(null);
  // 확인 모달 { title, onConfirm } (null이면 닫힘)
  const [confirmState, setConfirmState] = useState(null);
  // 안내 모달 { title, description } (null이면 닫힘)
  const [alertState, setAlertState] = useState(null);

  // 대댓글 구조: 직계 자식을 재귀적으로 렌더링해 깊이에 따라 들여쓴다
  const commentById = new Map(comments.map((c) => [c.commentId, c]));
  // 자기 자신을 부모로 가리키는 잘못된 데이터는 제외한다
  const getChildren = (parentId) =>
    comments.filter((c) => c.parentId === parentId && c.commentId !== parentId);

  const rootComments = comments.filter((c) => !c.parentId);

  // 부모가 목록에 없는 답글(부모가 삭제되어 조회되지 않는 경우)도 누락되지 않도록
  // 삭제 자리 표시용 부모를 만들어 뒤에 붙인다
  const missingParentIds = [
    ...new Set(
      comments.filter((c) => c.parentId && !commentById.has(c.parentId)).map((c) => c.parentId)
    ),
  ];

  const displayRoots = [
    ...rootComments,
    ...missingParentIds.map((commentId) => ({ commentId, isDeleted: true })),
  ];

  // 화면에 보이는 순서대로 [댓글, 깊이]를 평탄화한다 (구분선 위치를 정확히 계산하기 위해)
  const flattenThread = (comment, depth, acc) => {
    if (depth > MAX_RENDER_DEPTH) return acc;
    acc.push({ comment, depth });
    getChildren(comment.commentId).forEach((child) => flattenThread(child, depth + 1, acc));
    return acc;
  };

  const visibleComments = displayRoots.reduce((acc, root) => flattenThread(root, 0, acc), []);

  const isOwner = (comment) => currentUserId != null && comment.userId === currentUserId;
  const isDeleted = (comment) => Boolean(comment.isDeleted ?? comment.deleted);

  const resetInput = () => {
    setCommentText('');
    setIsAnonymous(false);
    setEditingId(null);
    setReplyTo(null);
  };

  // 확인 모달에서 '네'를 누른 뒤 실행되는 수정 처리
  const runUpdate = async (commentId, content, anonymous) => {
    try {
      await updateFreeComment(postId, commentId, { content, isAnonymous: anonymous });
      resetInput();
      onChanged?.();
    } catch (error) {
      setAlertState({ title: getErrorMessage(error, '댓글 수정에 실패했습니다.') });
    }
  };

  // 확인 모달에서 '네'를 누른 뒤 실행되는 삭제 처리
  const runDelete = async (commentId) => {
    try {
      await deleteFreeComment(postId, commentId);
      // 지운 댓글을 수정/답글 대상으로 잡고 있었다면 입력창도 비운다
      if (editingId === commentId || replyTo?.commentId === commentId) resetInput();
      onChanged?.();
    } catch (error) {
      setAlertState({ title: getErrorMessage(error, '댓글 삭제에 실패했습니다.') });
    }
  };

  // 하단 입력창 제출 - 수정 모드면 확인 모달, 아니면 댓글/답글 등록
  const handleSubmit = async () => {
    if (!commentText.trim()) return;

    if (editingId) {
      // 모달에서 확인받는 사이 입력값이 바뀔 수 있으므로 지금 값을 붙잡아둔다
      const targetId = editingId;
      const content = commentText.trim();
      const anonymous = isAnonymous;

      setConfirmState({
        title: '댓글 내용을 수정하시겠습니까?',
        onConfirm: () => runUpdate(targetId, content, anonymous),
      });
      return;
    }

    try {
      await createFreeComment(postId, {
        content: commentText.trim(),
        isAnonymous,
        // 답글은 2단계 유지: 답글 대상이 이미 답글이면 그 부모(최상위)에 붙인다
        parentId: replyTo ? (replyTo.parentId ?? replyTo.commentId) : null,
      });
      resetInput();
      onChanged?.();
    } catch (error) {
      setAlertState({ title: getErrorMessage(error, '댓글 등록에 실패했습니다.') });
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
    setIsAnonymous(Boolean(comment.isAnonymous ?? comment.anonymous));
  };

  // 삭제 - 확인 모달 열기
  const handleDelete = (commentId) => {
    setConfirmState({
      title: '댓글을 삭제하시겠습니까?',
      onConfirm: () => runDelete(commentId),
    });
  };

  // 신고 - 모달 열기
  const handleReport = (comment) => {
    setReportTarget(comment);
  };

  // 신고 - 모달에서 사유 선택 후 확인
  // TODO: 백엔드 신고(reports) API 스펙 확정 후 실제 전송 연동
  //  - reason 코드는 constants/report.js의 REPORT_REASONS와 1:1 대응
  //  - ⚠️ 지금은 서버로 전송하지 않고 접수완료 모달만 띄운다 (화면 확인용)
  //  - 연동 후: 성공 → REPORT_SUCCESS_ALERT / 중복(서버 차단) → REPORT_DUPLICATE_ALERT 로 분기
  const handleReportSubmit = () => {
    setReportTarget(null);
    setAlertState(REPORT_SUCCESS_ALERT);
  };

  // 댓글 1개 렌더 (depth 0 = 최상위 댓글, 1 이상 = 답글)
  const renderComment = (comment, depth) => {
    const isReply = depth > 0;
    const indentClass = INDENT_CLASS_BY_DEPTH[Math.min(depth, MAX_INDENT_DEPTH)];
    const deleted = isDeleted(comment);
    const owner = isOwner(comment);
    const replying = replyTo?.commentId === comment.commentId;
    const editing = editingId === comment.commentId;
    const highlighted = replying || editing;
    const displayName = (comment.isAnonymous ?? comment.anonymous) ? '익명' : comment.authorName;

    const actionClassName = (active) =>
      `text-[14px] transition-colors ${
        active ? 'font-medium text-[#212121]' : 'text-[#919191] hover:text-[#212121]'
      }`;

    return (
      <div
        key={comment.commentId}
        className={`flex w-full flex-col gap-3 py-4 md:flex-row md:items-start md:justify-between md:py-5 ${indentClass} ${
          highlighted ? 'bg-[#f5f5f5]' : ''
        }`}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
          {deleted ? (
            <p className="flex items-center gap-1 text-[16px] tracking-[-0.32px] text-[#919191] leading-[26px]">
              {isReply && (
                <CornerDownRight className="h-4 w-4 shrink-0 text-[#b9b9b9]" aria-hidden />
              )}
              삭제된 댓글입니다
            </p>
          ) : (
            <>
              <span className="flex items-center gap-1 text-[16px] tracking-[-0.32px] text-[#454545] leading-[26px]">
                {isReply && (
                  <CornerDownRight className="h-4 w-4 shrink-0 text-[#b9b9b9]" aria-hidden />
                )}
                {displayName}
              </span>
              <p className="text-[16px] tracking-[-0.32px] text-[#454545] leading-[26px] whitespace-pre-line">
                {comment.content}
              </p>
              <span className="text-[14px] tracking-[-0.28px] text-[#919191] leading-[22px]">
                {formatDate(comment.updated)}
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
              <button
                type="button"
                className={actionClassName(false)}
                onClick={() => handleReport(comment)}
              >
                신고
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="flex w-full flex-col gap-8 md:gap-[60px]">
      {/* 간격은 각 댓글 행의 안쪽 여백(py)으로 준다.
          컨테이너에 gap을 주면 하이라이트(회색 배경) 바깥에 빈 공간이 생긴다 */}
      <div className="flex w-full flex-col items-center">
        <div className="w-full py-2 md:px-5 md:py-[10px]">
          <span className="text-[16px] leading-[1.6] tracking-[-0.36px] text-[#454545] md:text-[18px]">
            댓글 {comments.length}개
          </span>
        </div>

        {visibleComments.map(({ comment, depth }, idx) => (
          <React.Fragment key={comment.commentId}>
            {renderComment(comment, depth)}
            {/* 댓글마다 구분선을 넣되, 마지막 댓글 아래에는 넣지 않는다 */}
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
              // 한글 등 IME 조합 중의 Enter는 글자를 확정하는 키이므로 제출하지 않는다
              if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
              handleSubmit();
            }}
          />
          <button
            type="button"
            onClick={handleSubmit}
            className="h-12 w-full shrink-0 rounded-[4px] bg-[#212121] text-[15px] tracking-[-0.32px] text-white md:h-[52px] md:w-[135px] md:text-[16px]"
          >
            {replyTo ? '답글 작성' : '댓글 작성'}
          </button>
        </div>

        {/* 익명 댓글 체크박스 */}
        <div className="flex items-center gap-[20px]">
          <div className="flex items-center gap-[8px]">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-[24px] h-[24px] border border-[#919191] rounded-[2px] cursor-pointer accent-[#212121]"
            />
            <label
              htmlFor="anonymous"
              className="text-[14px] tracking-[-0.28px] text-[#919191] leading-[1.6] cursor-pointer"
            >
              익명
            </label>
          </div>
        </div>
      </div>

      {/* 댓글 신고 모달 */}
      <ReportModal
        open={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        onSubmit={handleReportSubmit}
        targetUser={
          reportTarget
            ? (reportTarget.isAnonymous ?? reportTarget.anonymous)
              ? // 익명 댓글은 익명성을 지키기 위해 작성자 정보를 노출하지 않는다
                // (서버는 target_user_id를 자체적으로 기록함)
                { name: '익명' }
              : {
                  // TODO: 백엔드 댓글 응답에 loginId / studentId가 추가되면 자동으로 채워진다
                  loginId: reportTarget.loginId,
                  studentId: reportTarget.studentId,
                  name: reportTarget.authorName,
                }
            : null
        }
        targetContent={reportTarget ? `자유게시판 / ${reportTarget.content ?? ''}` : ''}
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
