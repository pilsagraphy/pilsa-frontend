'use client';

import React, { useState } from 'react';
import { createFreeComment, updateFreeComment, deleteFreeComment } from '@/apis/free';
import { getErrorMessage } from '@/apis/auth';

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

export default function FreeComments({ postId, comments = [], onChanged }) {
  const [commentText, setCommentText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingAnonymous, setEditingAnonymous] = useState(false);

  const handleSubmit = async () => {
    if (!commentText.trim()) return;

    try {
      await createFreeComment(postId, {
        content: commentText.trim(),
        isAnonymous,
      });

      setCommentText('');
      setIsAnonymous(false);
      onChanged?.();
    } catch (error) {
      alert(getErrorMessage(error, '댓글 등록에 실패했습니다.'));
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment.commentId);
    setEditingText(comment.content ?? '');
    setEditingAnonymous(Boolean(comment.isAnonymous ?? comment.anonymous));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
    setEditingAnonymous(false);
  };

  const submitEdit = async (commentId) => {
    if (!editingText.trim()) return;

    try {
      await updateFreeComment(postId, commentId, {
        content: editingText.trim(),
        isAnonymous: editingAnonymous,
      });

      cancelEdit();
      onChanged?.();
    } catch (error) {
      alert(getErrorMessage(error, '댓글 수정에 실패했습니다.'));
    }
  };

  const handleDelete = async (commentId) => {
    const ok = window.confirm('댓글을 삭제하시겠습니까?');
    if (!ok) return;

    try {
      await deleteFreeComment(postId, commentId);
      onChanged?.();
    } catch (error) {
      alert(getErrorMessage(error, '댓글 삭제에 실패했습니다.'));
    }
  };

  // 현재 백엔드 스펙에는 대댓글(parentId) 등록/조회 구조가 없음
  // 나중에 대댓글 기능 추가 시 아래 로직 복구해서 사용
  // const rootComments = comments.filter((c) => !c.parentId);
  // const getReplies = (parentId) => comments.filter((c) => c.parentId === parentId);

  return (
    <section className="flex flex-col gap-[60px] w-full">
      <div className="flex flex-col gap-[23px] items-center w-full">
        <div className="w-full px-[20px] py-[10px]">
          <span className="text-[18px] tracking-[-0.36px] text-[#454545] leading-[1.6]">
            댓글 {comments.length}개
          </span>
        </div>

        {comments.map((comment, idx) => (
          <React.Fragment key={comment.commentId}>
            {idx !== 0 && <Divider />}

            <div className="flex items-start justify-between px-[40px] py-[16px] w-full">
              <div className="flex flex-col gap-[7px] flex-1">
                <span className="text-[16px] tracking-[-0.32px] text-[#454545] leading-[1.6]">
                  {(comment.isAnonymous ?? comment.anonymous) ? '익명' : comment.authorName}
                </span>

                {editingId === comment.commentId ? (
                  <>
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full min-h-[100px] border border-[#b9b9b9] rounded-[4px] p-[12px] text-[16px] outline-none"
                    />
                    <div className="flex items-center gap-[12px]">
                      <label className="flex items-center gap-[8px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingAnonymous}
                          onChange={(e) => setEditingAnonymous(e.target.checked)}
                          className="w-[16px] h-[16px] cursor-pointer accent-[#212121]"
                        />
                        <span className="text-[14px] text-[#919191]">익명</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => submitEdit(comment.commentId)}
                        className="px-3 py-2 bg-[#212121] text-white rounded-[4px] text-[14px]"
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-2 border border-[#b9b9b9] rounded-[4px] text-[14px]"
                      >
                        취소
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[16px] tracking-[-0.32px] text-[#454545] leading-[1.6] whitespace-pre-line">
                      {comment.content}
                    </p>
                    <span className="text-[14px] tracking-[-0.28px] text-[#919191] leading-[1.6]">
                      {formatDate(comment.updated)}
                    </span>
                  </>
                )}
              </div>

              {editingId !== comment.commentId && (
                <div className="flex items-center gap-[12px] ml-[20px]">
                  {/* 나중에 대댓글 기능 추가 시 사용
                  <button
                    type="button"
                    className="text-[14px] text-[#919191] hover:text-[#212121]"
                    onClick={() => console.log('대댓글 작성', comment.commentId)}
                  >
                    답글
                  </button>
                  */}
                  <button
                    type="button"
                    className="text-[14px] text-[#919191] hover:text-[#212121]"
                    onClick={() => startEdit(comment)}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className="text-[14px] text-[#919191] hover:text-[#212121]"
                    onClick={() => handleDelete(comment.commentId)}
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          </React.Fragment>
        ))}

        {comments.length > 0 && <Divider />}
      </div>

      {/* 댓글 입력 */}
      <div className="flex flex-col gap-[20px] w-full">
        <div className="flex items-center gap-[20px] w-full">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="댓글을 작성하세요."
            className="flex-1 h-[52px] bg-white border border-[#b9b9b9] rounded-[4px] px-[16px] text-[16px] tracking-[-0.32px] text-[#212121] placeholder:text-[#919191] outline-none focus:border-[#919191]"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button
            type="button"
            onClick={handleSubmit}
            className="h-[52px] w-[135px] bg-[#212121] text-white rounded-[4px] text-[16px] tracking-[-0.32px] shrink-0"
          >
            댓글 작성
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
    </section>
  );
}
