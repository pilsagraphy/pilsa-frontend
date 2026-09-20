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
import AppLoading from '@/components/common/AppLoading';
import { AUTO_SAVE_INTERVAL_MS, buildDraftBody, draftSignature, isDraftEmpty } from '@/lib/draft';
import { createDraft } from '@/apis/draft';
import { alertDialog, confirmDialog } from '@/stores/useDialogStore';

const MESSAGE_CLASS = 'px-4 py-12 text-center text-sm text-[#919191] lg:py-20 lg:text-base';

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
  // 자동저장이 도는 중인지 (버튼 잠금용 — busyRef 는 ref라 리렌더를 못 일으킨다)
  const [autoSaving, setAutoSaving] = useState(false);

  // 저장 상태 (화면 아래 작은 안내문에만 쓴다).
  // savedNotice 는 완성된 문장이다 — 수동 저장과 자동저장을 구분해 적어야 해서
  // 시각만 들고 있지 않는다 ('14:30 저장됨' / '14:30 자동 저장됨').
  const [savedNotice, setSavedNotice] = useState('');
  const [autoSaveError, setAutoSaveError] = useState('');

  // 마지막으로 저장한 내용의 지문. 고친 것이 없으면 자동저장이 요청을 건너뛴다.
  const lastSavedRef = useRef('');
  // 자동저장이 수동 저장·발행과 겹치지 않게 하는 잠금
  const busyRef = useRef(false);
  // handleSaveDraft 중복 실행 방지 — savingDraft state 는 리렌더 후에야 disabled 에 반영되므로,
  // 그 전에 두 번째 클릭이 들어오면 state 만으로는 막지 못한다. ref 는 즉시 반영된다.
  const savingDraftRef = useRef(false);
  // 돌고 있는 자동저장. 수동 저장·발행은 이것이 끝난 뒤에 시작한다
  const autoSaveTaskRef = useRef(null);
  // 이번 화면에서 직접 저장해 받은 draftId.
  // 아래 '기준선 초기화' effect 는 이 번호를 건너뛴다 — 저장한 쪽이 이미 정확한 지문을 넣어뒀다.
  const selfSavedIdRef = useRef(null);

  // 페이지 진입 시 폼 초기화
  useEffect(() => {
    resetForm();
  }, [resetForm]);

  // 임시저장 요청 본문을 '지금 화면 값'으로 만든다.
  // 폼 값을 인자나 클로저로 받지 않고 스토어에서 그때그때 읽는다 —
  // 첨부 선업로드(최대 60초)나 자동저장 대기를 기다린 뒤에 만들어지므로
  // 클로저 값을 쓰면 사용자가 그사이 고친 내용이 빠진 채 저장된다.
  const currentDraftBody = useCallback(() => {
    const form = useBoardWriteStore.getState();
    return buildDraftBody({
      title: form.title,
      content: form.content,
      categoryId: form.categoryId || '',
      isAnonymous: board?.allowAnonymous ? form.isAnonymous : false,
      attachmentIds: form.draftAttachments.map((file) => file.attachmentId),
    });
  }, [board]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alertDialog('제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      alertDialog('내용을 입력해주세요.');
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
      if (categoryId) formData.append('categoryId', String(categoryId));
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

      await alertDialog('작성이 완료되었습니다.');
      resetForm();
      router.push(ROUTES.BOARD(boardId));
    } catch (error) {
      alertDialog(getErrorMessage(error, '게시글 작성에 실패했습니다.'));
    } finally {
      setSubmitting(false);
      busyRef.current = false;
    }
  };

  // '글 저장하기' — 임시저장.
  // 이어쓰는 중(draftId 있음)이면 그 슬롯을 덮어쓰고, 아니면 새 슬롯을 만든다.
  const handleSaveDraft = async () => {
    // 더블클릭 등으로 버튼이 실제로 disabled 되기 전에 두 번째 호출이 들어오면
    // 첨부가 중복 업로드되거나 초안 슬롯이 두 개 소비된다 — ref 로 즉시 막는다.
    if (savingDraftRef.current) return;

    // 서버는 제목·내용이 둘 다 비면 400 을 준다. 요청을 보내기 전에 걸러낸다.
    if (isDraftEmpty(title, content)) {
      alertDialog('제목이나 내용 중 하나는 입력해주세요.');
      return;
    }

    savingDraftRef.current = true;
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
      //
      // 목록은 이 루프가 돌고 있는 동안에도 바뀔 수 있다(업로드가 수십 초 걸린다).
      // 그래서 '몇 개'가 아니라 '어느 File 을' 올렸는지를 들고 있다가 그것만 덜어낸다.
      const uploaded = [];
      const consumedFiles = [];
      let uploadError = null;

      if (board?.allowAttachment && Array.isArray(files)) {
        for (const file of files) {
          if (!file) continue;

          // 업로드 도중 사용자가 '제거'한 파일은 올리지 않는다
          // (이 루프는 버튼을 누른 시점의 목록을 돌기 때문에 스토어를 다시 확인해야 한다)
          if (!useBoardWriteStore.getState().files.includes(file)) continue;

          try {
            // eslint-disable-next-line no-await-in-loop
            const result = await uploadFile(boardId, file, 'attachment');
            uploaded.push({
              attachmentId: result.attachmentId,
              originName: result.originName,
              fileUrl: result.url,
              fileSize: result.fileSize,
            });
            consumedFiles.push(file);
          } catch (error) {
            uploadError = getErrorMessage(error, `첨부파일 '${file.name}' 을 올리지 못했습니다.`);
            break;
          }
        }
      }

      promoteFilesToDraft(uploaded, consumedFiles);

      if (uploadError) {
        alertDialog(uploadError);
        return;
      }

      // 요청 본문은 지금 화면 값으로 만든다 — 위 업로드를 기다리는 동안 사용자가 고쳤을 수 있다.
      // (방금 promoteFilesToDraft 로 옮긴 첨부도 스토어에서 함께 읽힌다)
      // attachmentIds 는 '이번 저장이 유지할 첨부 전체'다 — 빠진 것은 서버가 파일까지 지운다.
      const body = currentDraftBody();

      const savedId = await saveDraft(boardId, draftId, body);

      // 실패 판정은 오류 문장과 draftId 를 함께 본다.
      // savedId 가 없으면 이어쓸 슬롯을 잡을 수 없어 다음 저장이 또 새 슬롯을 만든다 →
      // 보관 상한(5개)이 사용자 모르게 차버리므로 성공으로 처리하지 않는다.
      const message = useDraftStore.getState().actionError;
      if (message || !savedId) {
        alertDialog(message ?? '임시저장 결과를 확인하지 못했습니다. 목록에서 확인해 주세요.');
        return;
      }

      setDraftId(savedId);
      selfSavedIdRef.current = savedId;

      // 방금 저장한 내용을 기억해 둔다 — 자동저장이 같은 내용을 또 보내지 않게
      lastSavedRef.current = draftSignature(body);
      setAutoSaveError('');
      setSavedNotice(`${formatClock(new Date())} 저장됨`);

      // 개수는 저장 응답에 없다 → 목록을 다시 받아 쓴다 (추측하지 않는다)
      await fetchDrafts(boardId);
      alertDialog('임시저장되었습니다.');
    } catch (error) {
      alertDialog(getErrorMessage(error, '임시저장에 실패했습니다.'));
    } finally {
      setSavingDraft(false);
      busyRef.current = false;
      savingDraftRef.current = false;
    }
  };

  // 자동저장.
  // 이미 초안이 된 글(draftId 있음)만 지킨다 — 자동저장이 새 슬롯을 만드는 일은 없다.
  // 글쓰기 화면을 여닫을 때마다 draftId 가 비므로, 그때마다 초안이 하나씩 쌓이면
  // 보관 상한(5개)이 사용자 모르게 차버린다. 첫 저장은 반드시 '글 저장하기'로 한다.
  //
  // 폼 값을 의존성에 넣지 않는다(currentDraftBody 가 스토어에서 읽는다).
  // 값을 의존성에 넣으면 글자를 칠 때마다 타이머가 새로 걸려 자동저장이 영원히 안 걸린다.
  //
  // 자동저장은 파일을 올리지 않는다. 고르기만 한 파일이 타이머에 걸려 조용히 업로드되면
  // 곤란하고, 이미 올라간 첨부(draftAttachments)만 유지하면 서버 쪽 첨부는 그대로 남는다.
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
    // 자동저장이 도는 동안 초안 불러오기·삭제·첨부 제거 버튼을 잠근다 —
    // 그대로 두면 응답이 오기 전에 화면이 다른 초안으로 바뀌어, 뒤늦게 도착한
    // 이번 저장 결과가 이미 전환된 화면의 저장 상태를 엉뚱하게 덮어쓴다.
    setAutoSaving(true);

    // 수동 저장이 기다릴 수 있도록 진행 중인 작업을 남겨둔다
    const task = (async () => {
      try {
        const savedId = await saveDraft(boardId, activeDraftId, body);
        const message = useDraftStore.getState().actionError;

        // 자동저장은 조용히 돈다 — 실패해도 alert 로 작업을 끊지 않고 안내문만 바꾼다
        if (message || !savedId) {
          setAutoSaveError(message ?? '자동 저장에 실패했습니다.');
          return;
        }

        lastSavedRef.current = signature;
        setAutoSaveError('');
        setSavedNotice(`${formatClock(new Date())} 자동 저장됨`);
      } finally {
        busyRef.current = false;
        autoSaveTaskRef.current = null;
        setAutoSaving(false);
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

    // 내가 방금 저장해서 받은 번호라면 손대지 않는다.
    // 여기서 '지금 화면 값'으로 덮으면, 저장 요청이 오가는 동안 사용자가 이어 쓴 내용이
    // '이미 저장된 것'으로 기록돼 자동저장이 그 부분을 영원히 건너뛴다.
    // 저장한 쪽(handleSaveDraft)이 실제로 보낸 본문의 지문을 이미 넣어뒀다.
    if (draftId === selfSavedIdRef.current) return;

    // 초안을 막 불러왔다면 화면 내용이 서버와 같다 →
    // 첫 타이머가 같은 내용을 그대로 다시 보내지 않도록 지문을 맞춰 둔다.
    lastSavedRef.current = draftSignature(currentDraftBodyRef.current());
    setAutoSaveError('');
    setSavedNotice('');
  }, [draftId]);

  useEffect(() => {
    // 초안이 되기 전에는 타이머를 아예 걸지 않는다
    if (!draftId) return undefined;

    const timer = setInterval(runAutoSave, AUTO_SAVE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [draftId, runAutoSave]);

  // 탭을 닫거나 새로고침할 때, 아직 서버에 없는 변경이 있으면 브라우저 확인창을 띄운다.
  // 자동저장 주기가 30초라 그사이 편집분은 어디에도 남아 있지 않다.
  //
  // 앱 안에서의 화면 이동(취소 버튼·사이드바)은 브라우저 이벤트가 아니라 여기서 잡히지 않는다.
  // '취소'는 이미 자체 확인창을 띄우므로, 남는 구멍은 사이드바 등으로 그냥 옮겨가는 경우다.
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      const form = useBoardWriteStore.getState();

      // 고르기만 하고 아직 올리지 않은 파일이 있으면 무조건 남아 있는 것이다
      // (자동저장은 파일을 올리지 않는다)
      const hasPendingFiles = Array.isArray(form.files) && form.files.length > 0;

      // 아무것도 쓰지 않은 화면은 지킬 것이 없다
      const isEmpty = isDraftEmpty(form.title, form.content) && !hasPendingFiles;

      // 아직 초안이 아니면(한 번도 저장하지 않았으면) 쓴 내용 전부가 미저장이다.
      // 초안이면 마지막 저장 지문과 달라졌는지로 판단한다.
      const isDirty =
        hasPendingFiles ||
        !form.draftId ||
        draftSignature(currentDraftBodyRef.current()) !== lastSavedRef.current;

      if (isEmpty || !isDirty) return;

      event.preventDefault();
      // 일부 브라우저는 returnValue 가 설정돼야 확인창을 띄운다 (문구는 브라우저가 정한다)
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleCancel = async () => {
    if (await confirmDialog('작성을 취소하시겠습니까?', { cancelText: '계속 쓰기', confirmText: '취소하기' })) {
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
    return <AppLoading />;
  }

  if (!board) {
    return <div className={MESSAGE_CLASS}>존재하지 않는 게시판입니다.</div>;
  }

  // 목록의 글쓰기 버튼은 canWrite 로 감춰지지만, URL 로 직접 들어올 수 있다.
  if (!board.canWrite) {
    return <div className={MESSAGE_CLASS}>이 게시판에 글을 등록할 권한이 없습니다.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-[1000px] flex-col gap-[20px] px-4 py-4 sm:px-6 sm:py-7 lg:p-8">
      <div className="flex w-full flex-col gap-6 lg:gap-[36px]">
        <h1 className="text-[24px] leading-[1.5] tracking-[-0.48px] font-bold text-black">
          {board?.boardName ?? ''} 글쓰기
        </h1>

        <BoardWriteForm
          boardId={boardId}
          board={board}
          enableDraft
          busy={submitting || savingDraft || autoSaving}
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
        {draftId ? autoSaveError || savedNotice : ''}
      </p>

      {/* 작성 · 임시저장 · 취소를 한 줄에. 임시저장은 예전에 모바일에만 있어서 PC 에서는 초안을 만들 길이
          아예 없었다(2026-09-20). 세 버튼 모두 폰·PC 공통이다 */}
      <div className="mt-4 flex w-full flex-row gap-2 lg:gap-[12px]">
        <button
          type="submit"
          disabled={submitting || savingDraft || autoSaving}
          className="flex h-[44px] flex-1 cursor-pointer items-center justify-center rounded-[4px] bg-[#212121] px-2 text-[14px] tracking-[-0.28px] text-white transition-colors hover:bg-black disabled:opacity-60 lg:h-[52px] lg:text-[16px] lg:tracking-[-0.32px]"
        >
          {submitting ? '처리 중...' : '글 작성하기'}
        </button>

        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={submitting || savingDraft || autoSaving}
          className="flex h-[44px] flex-1 cursor-pointer items-center justify-center rounded-[4px] bg-[#919191] px-2 text-[14px] tracking-[-0.28px] text-white transition-colors hover:bg-[#7d7d7d] disabled:opacity-60 lg:h-[52px] lg:text-[16px] lg:tracking-[-0.32px]"
        >
          {savingDraft ? '저장 중...' : '임시저장'}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          disabled={submitting || savingDraft || autoSaving}
          className="flex h-[44px] flex-1 cursor-pointer items-center justify-center rounded-[4px] border border-[#b9b9b9] bg-white px-2 text-[14px] tracking-[-0.28px] text-[#212121] transition-colors hover:bg-gray-50 disabled:opacity-60 lg:h-[52px] lg:text-[16px] lg:tracking-[-0.32px]"
        >
          취소
        </button>
      </div>
    </form>
  );
}
