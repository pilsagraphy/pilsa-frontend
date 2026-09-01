'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import BoardWriteForm from './BoardWriteForm';
import useBoard from '@/hooks/useBoard';
import useBoardWriteStore from '@/stores/useBoardWriteStore';
import useDraftStore from '@/stores/useDraftStore';
import { createBoardPost } from '@/apis/board';
import { uploadFile } from '@/apis/file';
import { getErrorMessage } from '@/apis/auth';
import { ROUTES } from '@/constants/routes';
import { AUTO_SAVE_INTERVAL_MS, buildDraftBody, draftSignature, isDraftEmpty } from '@/lib/draft';

const MESSAGE_CLASS = 'px-4 py-12 text-center text-sm text-[#919191] md:py-20 md:text-base';

// 자동저장 안내 문구에 쓰는 'HH:mm'
const formatClock = (date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

// 공통게시판 글쓰기.
// 게시판 정책(플래그)에 따라 카테고리·첨부·익명 입력 노출 여부가 달라진다.
export default function BoardWrite({ boardId }) {
  const router = useRouter();
  const { board, boards, error: boardError } = useBoard(boardId);

  const {
    title,
    content,
    categoryId,
    isAnonymous,
    files,
    draftId,
    draftAttachments,
    resetForm,
    setDraftId,
    promoteFilesToDraft,
  } = useBoardWriteStore();

  const saveDraft = useDraftStore((s) => s.saveDraft);
  const fetchDrafts = useDraftStore((s) => s.fetchDrafts);

  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  // 자동저장 상태 (화면 아래 작은 안내문에만 쓴다)
  const [autoSavedAt, setAutoSavedAt] = useState('');
  const [autoSaveError, setAutoSaveError] = useState('');

  // 마지막으로 저장한 내용의 지문. 고친 것이 없으면 자동저장이 요청을 건너뛴다.
  const lastSavedRef = useRef('');
  // 자동저장이 수동 저장·발행과 겹치지 않게 하는 잠금
  const busyRef = useRef(false);
  // 돌고 있는 자동저장. 수동 저장·발행은 이것이 끝난 뒤에 시작한다
  const autoSaveTaskRef = useRef(null);

  // 페이지 진입 시 폼 초기화
  useEffect(() => {
    resetForm();
  }, [resetForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }
    // 카테고리는 선택 사항이다 — 고르지 않으면 categoryId 없이 보낸다.

    try {
      setSubmitting(true);

      // 자동저장이 끝난 뒤에 발행한다 — 발행이 지운 초안에 뒤늦게 덮어쓰기가 가는 것을 막는다
      if (autoSaveTaskRef.current) await autoSaveTaskRef.current;
      busyRef.current = true;

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      if (board?.categoryMode && categoryId) formData.append('categoryId', String(categoryId));
      if (board?.allowAnonymous) formData.append('isAnonymous', String(Boolean(isAnonymous)));
      if (board?.allowAttachment) {
        // 임시저장을 거친 첨부는 이미 서버에 올라가 있다 → id 로 연결한다
        draftAttachments.forEach((file) => {
          formData.append('attachmentIds', String(file.attachmentId));
        });

        // 저장을 거치지 않고 바로 발행하는 파일은 이 요청에 함께 올린다
        if (Array.isArray(files)) {
          files.forEach((file) => {
            if (file) formData.append('files', file);
          });
        }
      }

      // 초안을 발행하는 경우 — 서버가 발행과 같은 트랜잭션에서 그 초안을 지운다
      if (draftId) formData.append('draftId', String(draftId));

      await createBoardPost(boardId, formData);

      alert('작성이 완료되었습니다.');
      resetForm();
      router.push(ROUTES.BOARD(boardId));
    } catch (error) {
      alert(getErrorMessage(error, '게시글 작성에 실패했습니다.'));
    } finally {
      setSubmitting(false);
      busyRef.current = false;
    }
  };

  // '글 저장하기' — 임시저장.
  // 이어쓰는 중(draftId 있음)이면 그 슬롯을 덮어쓰고, 아니면 새 슬롯을 만든다.
  const handleSaveDraft = async () => {
    // 서버는 제목·내용이 둘 다 비면 400 을 준다. 요청을 보내기 전에 걸러낸다.
    if (isDraftEmpty(title, content)) {
      alert('제목이나 내용 중 하나는 입력해주세요.');
      return;
    }

    try {
      setSavingDraft(true);

      // 자동저장이 돌고 있으면 끝날 때까지 기다린다.
      // 겹치면 뒤늦게 도착한 자동저장이 '유지할 첨부 전체'를 옛 목록으로 보내
      // 이번에 올린 파일을 서버가 지워버린다.
      if (autoSaveTaskRef.current) await autoSaveTaskRef.current;
      busyRef.current = true;

      // 임시저장은 JSON 이라 File 을 실을 수 없다 → 아직 안 올린 첨부를 먼저 올려 id 를 얻는다.
      // 본문에 삽입한 이미지는 이미 올라가 있고, 마크다운에 남은 주소를 서버가 훑어 함께 보존한다.
      //
      // 앞에서부터 순서대로 올리고, 하나라도 실패하면 거기서 멈춘다.
      // 성공한 것은 실패해도 첨부 목록으로 옮겨야 한다 — 안 옮기면 다시 저장할 때
      // 같은 파일이 또 올라가 첨부가 중복된다.
      const uploaded = [];
      let uploadError = null;

      if (board?.allowAttachment && Array.isArray(files)) {
        for (const file of files) {
          if (!file) continue;
          try {
            // eslint-disable-next-line no-await-in-loop
            const result = await uploadFile(boardId, file, 'attachment');
            uploaded.push({
              attachmentId: result.attachmentId,
              originName: result.originName,
              fileUrl: result.url,
              fileSize: result.fileSize,
            });
          } catch (error) {
            uploadError = getErrorMessage(
              error,
              `첨부파일 '${file.name}' 을 올리지 못했습니다.`
            );
            break;
          }
        }
      }

      promoteFilesToDraft(uploaded, uploaded.length);

      if (uploadError) {
        alert(uploadError);
        return;
      }

      // 방금 promoteFilesToDraft 로 옮겼으니 스토어에서 다시 읽는다
      // (렌더 시점의 draftAttachments 는 옮기기 전 값이라 그대로 쓰면 헷갈린다).
      // attachmentIds 는 '이번 저장이 유지할 첨부 전체'다 — 빠진 것은 서버가 파일까지 지운다.
      const body = buildDraftBody({
        title,
        content,
        categoryId: board?.categoryMode ? categoryId : '',
        isAnonymous: board?.allowAnonymous ? isAnonymous : false,
        attachmentIds: useBoardWriteStore
          .getState()
          .draftAttachments.map((file) => file.attachmentId),
      });

      const savedId = await saveDraft(boardId, draftId, body);

      const message = useDraftStore.getState().error;
      if (message) {
        alert(message);
        return;
      }

      if (savedId) setDraftId(savedId);

      // 방금 저장한 내용을 기억해 둔다 — 자동저장이 같은 내용을 또 보내지 않게
      lastSavedRef.current = draftSignature(body);
      setAutoSaveError('');

      // 개수는 저장 응답에 없다 → 목록을 다시 받아 쓴다 (추측하지 않는다)
      await fetchDrafts(boardId);

      alert('임시저장되었습니다.');
    } catch (error) {
      alert(getErrorMessage(error, '임시저장에 실패했습니다.'));
    } finally {
      setSavingDraft(false);
      busyRef.current = false;
    }
  };

  // 자동저장.
  // 이미 초안이 된 글(draftId 있음)만 지킨다 — 자동저장이 새 슬롯을 만드는 일은 없다.
  // 글쓰기 화면을 여닫을 때마다 draftId 가 비므로, 그때마다 초안이 하나씩 쌓이면
  // 보관 상한(5개)이 사용자 모르게 차버린다. 첫 저장은 반드시 '글 저장하기'로 한다.
  //
  // 폼 값은 인자로 받지 않고 스토어에서 그때그때 읽는다.
  // 값을 의존성에 넣으면 글자를 칠 때마다 타이머가 새로 걸려 자동저장이 영원히 안 걸린다.
  //
  // 자동저장은 파일을 올리지 않는다. 고르기만 한 파일이 타이머에 걸려 조용히 업로드되면
  // 곤란하고, 이미 올라간 첨부(draftAttachments)만 유지하면 서버 쪽 첨부는 그대로 남는다.
  const currentDraftBody = useCallback(() => {
    const form = useBoardWriteStore.getState();
    return buildDraftBody({
      title: form.title,
      content: form.content,
      categoryId: board?.categoryMode ? form.categoryId : '',
      isAnonymous: board?.allowAnonymous ? form.isAnonymous : false,
      attachmentIds: form.draftAttachments.map((file) => file.attachmentId),
    });
  }, [board]);

  const runAutoSave = useCallback(() => {
    // 수동 저장·발행 중이면 건너뛴다 (같은 슬롯에 요청이 겹치지 않게)
    if (busyRef.current) return;

    const activeDraftId = useBoardWriteStore.getState().draftId;
    if (!activeDraftId) return;

    const body = currentDraftBody();
    if (isDraftEmpty(body.title, body.content)) return;

    // 고친 것이 없으면 보내지 않는다
    const signature = draftSignature(body);
    if (signature === lastSavedRef.current) return;

    busyRef.current = true;

    // 수동 저장이 기다릴 수 있도록 진행 중인 작업을 남겨둔다
    const task = (async () => {
      try {
        const savedId = await saveDraft(boardId, activeDraftId, body);
        const message = useDraftStore.getState().error;

        // 자동저장은 조용히 돈다 — 실패해도 alert 로 작업을 끊지 않고 안내문만 바꾼다
        if (message || !savedId) {
          setAutoSaveError(message ?? '자동 저장에 실패했습니다.');
          return;
        }

        lastSavedRef.current = signature;
        setAutoSaveError('');
        setAutoSavedAt(formatClock(new Date()));
      } finally {
        busyRef.current = false;
        autoSaveTaskRef.current = null;
      }
    })();

    autoSaveTaskRef.current = task;
  }, [boardId, currentDraftBody, saveDraft]);

  // 폼 값은 렌더마다 바뀌지만 아래 기준선 초기화는 'draftId 가 바뀔 때'만 해야 한다.
  // currentDraftBody 를 의존성에 넣으면 board 참조가 갱신될 때도 다시 돌면서
  // 아직 저장되지 않은 내용을 '저장된 것'으로 기록해 자동저장이 그 변경분을 건너뛴다.
  const currentDraftBodyRef = useRef(currentDraftBody);
  currentDraftBodyRef.current = currentDraftBody;

  useEffect(() => {
    if (!draftId) return;

    // 초안을 막 불러왔다면 화면 내용이 서버와 같다 →
    // 첫 타이머가 같은 내용을 그대로 다시 보내지 않도록 지문을 맞춰 둔다.
    lastSavedRef.current = draftSignature(currentDraftBodyRef.current());
    setAutoSaveError('');
    setAutoSavedAt('');
  }, [draftId]);

  useEffect(() => {
    // 초안이 되기 전에는 타이머를 아예 걸지 않는다
    if (!draftId) return undefined;

    const timer = setInterval(runAutoSave, AUTO_SAVE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [draftId, runAutoSave]);

  const handleCancel = () => {
    if (window.confirm('작성을 취소하시겠습니까? 작성 중인 내용은 저장되지 않습니다.')) {
      resetForm();
      router.back();
    }
  };

  // 게시판 정책(플래그)이 확정되기 전에는 폼을 그리지 않는다.
  // 플래그가 없는 상태로 제출하면 카테고리·익명·첨부가 조용히 빠진 채 저장된다.
  if (boardError) {
    return <div className={MESSAGE_CLASS}>{boardError}</div>;
  }

  if (!boards) {
    return <div className={MESSAGE_CLASS}>불러오는 중입니다.</div>;
  }

  if (!board) {
    return <div className={MESSAGE_CLASS}>존재하지 않는 게시판입니다.</div>;
  }

  // 목록의 글쓰기 버튼은 canWrite 로 감춰지지만, URL 로 직접 들어올 수 있다.
  if (!board.canWrite) {
    return <div className={MESSAGE_CLASS}>이 게시판에 글을 등록할 권한이 없습니다.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-[1000px] flex-col gap-[20px] p-8">
      <div className="flex w-full flex-col gap-[36px]">
        <h1 className="text-[24px] leading-[1.5] tracking-[-0.48px] font-bold text-black">
          {board?.boardName ?? ''} 글쓰기
        </h1>

        <BoardWriteForm
          boardId={boardId}
          board={board}
          enableDraft
          busy={submitting || savingDraft}
        />
      </div>

      {/* 자동저장 안내. 이미 초안이 된 글만 자동으로 지키므로, 저장하기 전에는 아무것도 띄우지 않는다.
          조용히 도는 동작이라 성공·실패를 알려줄 자리가 필요해서 둔 한 줄이다.
          문구가 생길 때 요소까지 새로 생기면 읽어주지 않는 보조기기가 있어, 자리는 늘 두고 내용만 바꾼다. */}
      <p
        role="status"
        aria-live="polite"
        className={`min-h-[22px] text-[14px] tracking-[-0.28px] ${
          autoSaveError ? 'text-[#e5484d]' : 'text-[#919191]'
        }`}
      >
        {draftId ? autoSaveError || (autoSavedAt && `${autoSavedAt} 자동 저장됨`) : ''}
      </p>

      <div className="mt-4 flex w-full flex-col gap-[12px]">
        <button
          type="submit"
          disabled={submitting || savingDraft}
          className="flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[4px] bg-[#212121] text-[16px] tracking-[-0.32px] text-white transition-colors hover:bg-black disabled:opacity-60"
        >
          {submitting ? '작성 중...' : '글 작성하기'}
        </button>

        {/* 임시저장. submit 이 아니라 button 이다 — 폼 검증(required)에 걸리면 안 된다.
            제목만 쓰고 저장하는 경우가 정상이기 때문이다. */}
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={submitting || savingDraft}
          className="flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[4px] bg-[#919191] text-[16px] tracking-[-0.32px] text-white transition-colors hover:bg-[#666666] disabled:opacity-60"
        >
          {savingDraft ? '저장 중...' : '글 저장하기'}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          className="flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[4px] border border-[#b9b9b9] bg-white text-[16px] tracking-[-0.32px] text-[#212121] transition-colors hover:bg-gray-50"
        >
          취소
        </button>
      </div>
    </form>
  );
}
