'use client';

import React, { useState } from 'react';
import { createInfoComment, updateInfoComment, deleteInfoComment } from '@/apis/info';
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

export default function InfoComments({ postId, comments = [], onChanged }) {
  const [commentText, setCommentText] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingPrivate, setEditingPrivate] = useState(false);

  const handleSubmit = async () => {
    if (!commentText.trim()) return;

    try {
      await createInfoComment(postId, {
        content: commentText.trim(),
        isPrivate,
      });

      setCommentText('');
      setIsPrivate(false);
      onChanged?.();
    } catch (error) {
      alert(getErrorMessage(error, '댓글 등록에 실패했습니다.'));
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment.commentId);
    setEditingText(comment.content ?? '');
    setEditingPrivate(Boolean(comment.isPrivate));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
    setEditingPrivate(false);
  };

  const submitEdit = async (commentId) => {
    if (!editingText.trim()) return;

    try {
      await updateInfoComment(postId, commentId, {
        content: editingText.trim(),
        isPrivate: editingPrivate,
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
      await deleteInfoComment(postId, commentId);
      onChanged?.();
    } catch (error) {
      alert(getErrorMessage(error, '댓글 삭제에 실패했습니다.'));
    }
  };

  return (
    <section className="flex w-full flex-col gap-8 md:gap-[60px]">
      <div className="flex w-full flex-col items-center gap-4 md:gap-[23px]">
        <div className="w-full py-2 md:px-5 md:py-[10px]">
          <span className="text-[16px] leading-[1.6] tracking-[-0.36px] text-[#454545] md:text-[18px]">
            댓글 {comments.length}개
          </span>
        </div>

        {comments.map((comment, idx) => (
          <React.Fragment key={comment.commentId}>
            {idx !== 0 && <Divider />}

            <div className="flex w-full flex-col gap-3 py-3 md:flex-row md:items-start md:justify-between md:px-10 md:py-4">
              <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
                <span className="text-[16px] tracking-[-0.32px] text-[#454545] leading-[1.6]">
                  {comment.authorName}
                </span>

                {editingId === comment.commentId ? (
                  <>
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full min-h-[100px] border border-[#b9b9b9] rounded-[4px] p-[12px] text-[16px] outline-none"
                    />
                    <div className="flex items-center gap-[12px] flex-wrap">
                      <label className="flex items-center gap-[8px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingPrivate}
                          onChange={(e) => setEditingPrivate(e.target.checked)}
                          className="w-[16px] h-[16px] cursor-pointer accent-[#212121]"
                        />
                        <span className="text-[14px] text-[#919191]">비밀 댓글</span>
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
                      {comment.isPrivate ? '비밀 댓글입니다.' : comment.content}
                    </p>
                    <span className="text-[14px] tracking-[-0.28px] text-[#919191] leading-[1.6]">
                      {formatDate(comment.updated)}
                    </span>
                  </>
                )}
              </div>

              {editingId !== comment.commentId && (
                <div className="flex shrink-0 items-center gap-3 md:ml-5">
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

      <div className="flex w-full flex-col gap-4 md:gap-5">
        <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:gap-5">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="댓글을 작성하세요."
            className="h-12 w-full flex-1 rounded-[4px] border border-[#b9b9b9] bg-white px-4 text-[15px] tracking-[-0.32px] text-[#212121] outline-none placeholder:text-[#919191] focus:border-[#919191] md:h-[52px] md:text-[16px]"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button
            type="button"
            onClick={handleSubmit}
            className="h-12 w-full shrink-0 rounded-[4px] bg-[#212121] text-[15px] tracking-[-0.32px] text-white md:h-[52px] md:w-[135px] md:text-[16px]"
          >
            댓글 작성
          </button>
        </div>

        <div className="flex items-center gap-[20px]">
          <div className="flex items-center gap-[8px]">
            <input
              type="checkbox"
              id="info-private"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-[24px] h-[24px] border border-[#919191] rounded-[2px] cursor-pointer accent-[#212121]"
            />
            <label
              htmlFor="info-private"
              className="text-[14px] tracking-[-0.28px] text-[#919191] leading-[1.6] cursor-pointer"
            >
              비밀 댓글
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
