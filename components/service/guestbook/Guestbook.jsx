'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '@/apis/auth';
import { deleteGuestbookNote, getGuestbook, restoreGuestbookNote } from '@/apis/guestbook';
import AppLoading from '@/components/common/AppLoading';
import ConfirmModal from '@/components/common/ConfirmModal';
import AdminPageLink from '@/components/shared/AdminPageLink';
import SemesterJump, { scrollToSemester, semesterAnchorId, useActiveSemester } from '@/components/shared/SemesterJump';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { ROUTES } from '@/constants/routes';
import { toast } from '@/lib/toast';
import useAuthStore from '@/stores/useAuthStore';
import GuestbookComposer from './GuestbookComposer';
import GuestbookNote from './GuestbookNote';
import { BOARD_THEMES } from './guestbookStyle';

// 방명록 (PM 2026-10-10) — 학기별로 묶은 손글씨 메모판을 한 페이지에 이어 붙인다 (밤: 탭 대신 무한 스크롤 + 학기 드롭다운).
// 처음엔 이번 학기만 보이고, 아래로 내리면 지난 학기를 하나씩 더 불러온다. 드롭다운은 보고 있는 학기를 보여 주고 고르면 그 구간으로.
// 학기 구분은 서버가 글을 남긴 시점의 학기(정책의 학기 시작 월)로 매긴다. 쓰기 칸은 이번 학기 구간 맨 위에만.
// 로그인한 본인과 관리자는 글을 고치거나 지울 수 있고, 관리자가 지운 글은 숨김이라 그 자리에서 복원할 수 있다. 관리자에겐 관리 페이지 버튼.
// boardTheme: 메모판 바탕 — 크림/회색/흰색 중 무엇이 나은지 보려는 임시 비교용
export default function Guestbook({ boardTheme = 'cream' }) {
  const [meta, setMeta] = useState(null); // { currentSemester, semesters, maxLength, maxDrawings, drawingMaxKb }
  const [notesBySemester, setNotesBySemester] = useState({});
  const [visibleCount, setVisibleCount] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [editing, setEditing] = useState(null);
  const [pendingJump, setPendingJump] = useState(null);
  const sentinelRef = useRef(null);
  const theme = BOARD_THEMES[boardTheme] ?? BOARD_THEMES.cream;

  const fetchSemester = useCallback(async (label) => {
    const res = await getGuestbook(label);
    setNotesBySemester((prev) => ({ ...prev, [res.semester]: res.notes }));
    return res;
  }, []);

  // 첫 로드 — 이번 학기 + 학기 목록
  useEffect(() => {
    let alive = true;
    getGuestbook()
      .then((res) => {
        if (!alive) return;
        setMeta({
          currentSemester: res.currentSemester,
          semesters: res.semesters,
          maxLength: res.maxLength,
          maxDrawings: res.maxDrawings,
          drawingMaxKb: res.drawingMaxKb,
        });
        setNotesBySemester({ [res.semester]: res.notes });
      })
      .catch((err) => {
        if (alive) setError(getErrorMessage(err, '방명록을 불러오지 못했어요.'));
      });
    return () => {
      alive = false;
    };
  }, []);

  const semesters = meta?.semesters ?? [];
  const visibleSemesters = semesters.slice(0, visibleCount);
  const [activeSemester, setActiveSemester] = useActiveSemester(visibleSemesters);

  // 공개 화면이라 첫 조회가 로그인 복원(자동 로그인)보다 먼저 나갈 수 있다 → 그때는 내 글이어도 canManage 가 false 로 온다.
  // 로그인 상태가 바뀌면 이미 받은 학기를 다시 받아 수정·지우기 버튼을 맞춘다 (PM 10/10 밤 "내 글인데 수정이 안 보여")
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const loadedLabelsRef = useRef([]);
  loadedLabelsRef.current = Object.keys(notesBySemester);
  useEffect(() => {
    if (!meta) return;
    loadedLabelsRef.current.forEach((label) => fetchSemester(label).catch(() => {}));
    // meta 가 생긴 뒤 isLoggedIn 이 바뀔 때만 — 첫 로드와 겹치지 않게 meta 는 의존성에서 뺀다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // n 번째 학기까지 전부 불러온 뒤 그만큼 편다 (바닥 감시·드롭다운 공용)
  const revealUpTo = useCallback(
    async (count) => {
      const target = Math.min(count, semesters.length);
      setLoadingMore(true);
      try {
        for (let i = visibleCount; i < target; i += 1) {
          const label = semesters[i];
          if (!notesBySemester[label]) await fetchSemester(label); // eslint-disable-line no-await-in-loop
        }
        setVisibleCount(target);
      } catch (err) {
        toast.error(getErrorMessage(err, '지난 학기를 불러오지 못했어요.'));
      } finally {
        setLoadingMore(false);
      }
    },
    [semesters, visibleCount, notesBySemester, fetchSemester]
  );

  // 바닥 감시 — 닿으면 다음 학기를 불러온다
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !meta || loadingMore || visibleCount >= semesters.length) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) revealUpTo(visibleCount + 1);
      },
      { rootMargin: '400px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [meta, loadingMore, visibleCount, semesters.length, revealUpTo]);

  // 드롭다운 — 그 학기까지 불러온 뒤 스크롤
  const jump = async (label) => {
    const idx = semesters.indexOf(label);
    if (idx < 0) return;
    setActiveSemester(label);
    if (idx >= visibleCount) await revealUpTo(idx + 1);
    setPendingJump(label);
  };
  useEffect(() => {
    if (!pendingJump) return;
    if (semesters.indexOf(pendingJump) >= visibleCount) return;
    scrollToSemester(pendingJump);
    setPendingJump(null);
  }, [pendingJump, visibleCount, semesters]);

  // 고치고 지운 뒤에는 그 학기만 다시 받는다
  const refresh = (label) => fetchSemester(label ?? meta?.currentSemester).catch(() => {});

  const confirmDelete = async () => {
    const note = deleting;
    setDeleting(null);
    try {
      await deleteGuestbookNote(note.noteId);
      toast.success(note.isMine ? '지웠어요.' : '숨겼어요. 필요하면 복원할 수 있어요.');
      refresh(note.semesterLabel);
    } catch (err) {
      toast.error(getErrorMessage(err, '지우지 못했어요.'));
    }
  };

  const restore = async (note) => {
    try {
      await restoreGuestbookNote(note.noteId);
      toast.success('복원했어요.');
      refresh(note.semesterLabel);
    } catch (err) {
      toast.error(getErrorMessage(err, '복원하지 못했어요.'));
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-8 bg-white px-4 py-4 sm:px-6 sm:py-7 md:gap-[40px] md:p-10">
      <header className="flex flex-col gap-[8px] border-b-[1.5px] border-[#DEDEDE] pb-6 md:gap-[12px] md:pb-[40px]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-['Pretendard',sans-serif] text-[24px] font-semibold leading-[1.5] tracking-[-0.02em] text-[#212121]">
            방명록
            {boardTheme !== 'cream' && <span className="ml-2 text-[13px] font-normal text-[#919191]">바탕 테스트 · {boardTheme}</span>}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <SemesterJump semesters={semesters} value={activeSemester} onJump={jump} />
            <AdminPageLink href={ROUTES.ADMIN_GUESTBOOK} label="방명록 관리" />
          </div>
        </div>
        <p className="font-['Pretendard',sans-serif] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#919191]">
          다녀간 흔적을 한 줄 남겨 주세요
        </p>
      </header>

      {/* 메모판 — 점 격자 종이. 학기 구간이 위에서 아래로 이어진다 */}
      <section
        className="flex flex-col gap-10 rounded-[8px] border px-4 py-6 md:px-8 md:py-8"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.bg,
          backgroundImage: `radial-gradient(${theme.dot} 1px, transparent 1px)`,
          backgroundSize: '18px 18px',
        }}
      >
        {!meta && !error && <AppLoading />}
        {error && <p className="py-10 text-center text-[14px] text-[#919191]">{error}</p>}

        {meta &&
          visibleSemesters.map((label) => {
            const isCurrent = label === meta.currentSemester;
            const notes = notesBySemester[label] ?? [];
            return (
              <div key={label} id={semesterAnchorId(label)} className="flex scroll-mt-[72px] flex-col gap-5">
                <h3 className="flex items-baseline gap-2 text-[15px] font-semibold tracking-[-0.02em] text-[#454545]">
                  {label}
                  {isCurrent && <span className="rounded-full bg-[#212121] px-2 py-[1px] text-[10px] font-medium text-white">이번 학기</span>}
                  <span className="text-[12px] font-normal text-[#a3a09a]">{notes.length}장</span>
                </h3>

                {/* 쓰기 칸은 이번 학기에서만 — 지난 학기에 새 글을 끼워 넣을 수는 없다 */}
                {isCurrent && (
                  <GuestbookComposer
                    maxLength={meta.maxLength}
                    maxDrawings={meta.maxDrawings}
                    drawingMaxKb={meta.drawingMaxKb}
                    onDone={() => refresh(label)}
                  />
                )}

                {notes.length === 0 ? (
                  <p className="py-6 text-center text-[14px] text-[#a3a09a]">
                    {isCurrent ? '아직 비어 있어요. 첫 장을 남겨 주세요.' : '이 학기에는 남은 글이 없어요.'}
                  </p>
                ) : (
                  <Masonry notes={notes} onEdit={setEditing} onDelete={setDeleting} onRestore={restore} />
                )}
              </div>
            );
          })}

        {/* 바닥 — 더 불러올 학기가 있으면 스크롤이 닿을 때 불러온다 */}
        <div ref={sentinelRef} className="h-px" aria-hidden />
        {meta && visibleCount < semesters.length ? (
          <p className="text-center text-[12px] text-[#b9b9b9]">{loadingMore ? '지난 학기를 불러오는 중…' : '아래로 내리면 지난 학기가 더 나와요'}</p>
        ) : (
          meta && semesters.length > 1 && <p className="text-center text-[12px] text-[#b9b9b9]">마지막 학기까지 다 봤어요</p>
        )}
      </section>

      <ConfirmModal
        open={Boolean(deleting)}
        title={deleting?.isMine ? '내가 남긴 글을 지울까요?' : '이 글을 숨길까요? (복원할 수 있어요)'}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />

      {/* 고치기 — 쓰기 칸을 그대로 모달에 (종이 폭은 카드와 같은 320px) */}
      <Dialog open={Boolean(editing)} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent hideCloseButton className="max-h-[90dvh] max-w-[560px] overflow-y-auto rounded-[8px] border-[#dedede] p-4 md:p-5">
          <DialogTitle className="text-[16px] font-semibold text-[#212121]">방명록 고치기</DialogTitle>
          <DialogDescription className="sr-only">내용·글씨체·잉크·종이·스티커를 고친다</DialogDescription>
          {editing && meta && (
            <GuestbookComposer
              mode="edit"
              initial={editing}
              maxLength={meta.maxLength}
              maxDrawings={meta.maxDrawings}
              drawingMaxKb={meta.drawingMaxKb}
              onDone={() => {
                const label = editing.semesterLabel;
                setEditing(null);
                refresh(label);
              }}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 세로 칸 n 개에 글을 차례로 나눠 담는 벽돌 배치 (CSS columns 는 카드 위 테이프 조각이 칸 경계에서 잘렸다).
// 카드는 320px 로 그려 칸 폭에 맞춰 줄어드니 칸을 너무 잘게 나누면 글씨가 작아진다 — PC 3칸, 태블릿 2칸, 폰 1칸 (PM 10/10 밤 "글꼴이 작아졌다")
function useColumnCount() {
  const [count, setCount] = useState(1);
  useEffect(() => {
    const lg = window.matchMedia('(min-width: 1024px)');
    const md = window.matchMedia('(min-width: 768px)');
    const sm = window.matchMedia('(min-width: 640px)');
    const update = () => setCount(lg.matches ? 3 : md.matches ? 2 : sm.matches ? 2 : 1);
    update();
    [lg, md, sm].forEach((m) => m.addEventListener('change', update));
    return () => [lg, md, sm].forEach((m) => m.removeEventListener('change', update));
  }, []);
  return count;
}

function Masonry({ notes, onEdit, onDelete, onRestore }) {
  const count = useColumnCount();
  const columns = Array.from({ length: count }, () => []);
  notes.forEach((note, i) => columns[i % count].push(note));
  return (
    <div className="flex items-start gap-4 pt-3">
      {columns.map((col, ci) => (
        <div key={ci} className="flex min-w-0 flex-1 flex-col gap-7">
          {col.map((note) => (
            <GuestbookNote key={note.noteId} note={note} onEdit={onEdit} onDelete={onDelete} onRestore={onRestore} />
          ))}
        </div>
      ))}
    </div>
  );
}
