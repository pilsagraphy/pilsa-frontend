'use client';

import React, { useEffect, useState } from 'react';

import useBoardWriteStore from '@/stores/useBoardWriteStore';
import useDraftStore from '@/stores/useDraftStore';
import DraftLoadModal from './DraftLoadModal';

// '저장 | N' 버튼 — N 은 지금 보관 중인 임시저장 개수(응답에 count 가 없어 목록 길이로 센다).
// 누르면 불러오기 모달이 열린다. 저장은 아래 '글 저장하기' 가 하고 이 버튼은 불러오기 전용이다.
export default function DraftLoadButton({ boardId, disabled = false }) {
  const [open, setOpen] = useState(false);

  const drafts = useDraftStore((s) => s.data);
  const isLoading = useDraftStore((s) => s.isLoading);
  const error = useDraftStore((s) => s.error);
  const fetchDrafts = useDraftStore((s) => s.fetchDrafts);
  const loadDraft = useDraftStore((s) => s.loadDraft);

  const title = useBoardWriteStore((s) => s.title);
  const content = useBoardWriteStore((s) => s.content);
  const files = useBoardWriteStore((s) => s.files);
  const setForm = useBoardWriteStore((s) => s.setForm);

  // 버튼에 개수를 띄워야 하므로 화면에 들어올 때 목록을 받아둔다.
  // (저장한 뒤에는 BoardWrite 가 다시 불러 개수를 갱신한다)
  useEffect(() => {
    if (boardId) fetchDrafts(boardId);
  }, [boardId, fetchDrafts]);

  // 모달을 열 때 한 번 더 받는다.
  // 자동저장은 목록을 다시 받지 않으므로(30초마다 요청이 두 배가 된다) 미리보기·저장 시각이
  // 뒤처져 있을 수 있다. 목록을 실제로 보는 순간에 맞춰 받는 편이 요청도 적고 값도 정확하다.
  const handleOpen = () => {
    setOpen(true);
    if (boardId) fetchDrafts(boardId);
  };

  const handleSelect = async (draftId) => {
    // 이어쓰기는 지금 폼을 그 초안으로 갈아끼운다 —
    // 쓰던 내용이 있으면 그대로 사라지므로 한 번 묻는다.
    // 골라만 둔 첨부(아직 서버에 올리지 않은 File)도 함께 사라지므로 같이 센다.
    const hasDraftInProgress = Boolean(title.trim() || content.trim() || files.length > 0);
    if (
      hasDraftInProgress &&
      !window.confirm('불러오면 지금 작성 중인 내용이 사라집니다. 계속하시겠습니까?')
    ) {
      return;
    }

    const detail = await loadDraft(boardId, draftId);
    if (!detail) {
      alert(useDraftStore.getState().error ?? '임시저장한 글을 불러오지 못했습니다.');
      return;
    }

    // 넘기지 않은 필드는 setForm 이 초기값으로 되돌린다 (이전에 고른 파일 등이 남지 않는다)
    setForm({
      title: detail.title ?? '',
      content: detail.content ?? '',
      // 서버는 숫자, select 는 문자열만 다룬다
      categoryId: detail.categoryId != null ? String(detail.categoryId) : '',
      isAnonymous: Boolean(detail.isAnonymous),
      // 다음 저장·발행이 이 초안을 이어쓰도록 id 를 들고 있는다
      draftId: detail.draftId,
      // 초안에 딸린 첨부는 이미 서버에 올라가 있다 → id 로만 다룬다
      draftAttachments: Array.isArray(detail.attachments) ? detail.attachments : [],
    });

    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        aria-label={`임시저장한 글 ${drafts.length}개 불러오기`}
        className="flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[4px] bg-[#212121] px-[16px] transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
      >
        {/* 시안은 '저장'·'|'·개수 사이를 gap 이 아니라 공백의 자간(6.4px)으로 벌린다.
            폭이 135px 로 고정이라 글자 간격까지 시안 값을 그대로 쓴다. */}
        <span className="whitespace-nowrap text-center text-[16px] leading-[1.6] font-medium tracking-[-0.32px] text-white">
          <span>저장</span>
          <span className="tracking-[6.4px]">{' '}</span>
          <span>|</span>
          <span className="tracking-[6.4px]">{' '}</span>
          <span>{drafts.length}</span>
        </span>
      </button>

      <DraftLoadModal
        open={open}
        drafts={drafts}
        loading={isLoading}
        error={error ?? ''}
        onCancel={() => setOpen(false)}
        onSelect={handleSelect}
      />
    </>
  );
}
