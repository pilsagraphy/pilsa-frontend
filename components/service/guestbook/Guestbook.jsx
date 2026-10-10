'use client';

import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/apis/auth';
import { deleteGuestbookNote, getGuestbook, restoreGuestbookNote } from '@/apis/guestbook';
import AppLoading from '@/components/common/AppLoading';
import ConfirmModal from '@/components/common/ConfirmModal';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/lib/toast';
import GuestbookComposer from './GuestbookComposer';
import GuestbookNote from './GuestbookNote';
import { BOARD_THEMES } from './guestbookStyle';

// 방명록 (PM 2026-10-10) — 학기별로 모아 보는 손글씨 메모판. 잉크 · 문구류 느낌.
// 학기 구분은 서버가 글을 남긴 시점의 학기(정책의 학기 시작 월)로 매긴다. 이번 학기 탭은 글이 없어도 보인다.
// 로그인한 본인과 관리자는 글을 고치거나 지울 수 있고, 관리자가 지운 글은 숨김이라 그 자리에서 복원할 수 있다.
// boardTheme: 메모판 바탕 — 크림/회색/흰색 중 무엇이 나은지 보려는 임시 비교용 (PM 10/10 밤)
export default function Guestbook({ boardTheme = 'cream' }) {
  const [semester, setSemester] = useState(null); // null = 이번 학기
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [editing, setEditing] = useState(null);
  const theme = BOARD_THEMES[boardTheme] ?? BOARD_THEMES.cream;

  const load = useCallback(async (sem, quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const res = await getGuestbook(sem);
      setData(res);
    } catch (err) {
      setError(getErrorMessage(err, '방명록을 불러오지 못했어요.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(semester);
  }, [load, semester]);

  const confirmDelete = async () => {
    const note = deleting;
    setDeleting(null);
    try {
      await deleteGuestbookNote(note.noteId);
      toast.success(note.isMine ? '지웠어요.' : '숨겼어요. 필요하면 복원할 수 있어요.');
      load(semester, true);
    } catch (err) {
      toast.error(getErrorMessage(err, '지우지 못했어요.'));
    }
  };

  const restore = async (note) => {
    try {
      await restoreGuestbookNote(note.noteId);
      toast.success('복원했어요.');
      load(semester, true);
    } catch (err) {
      toast.error(getErrorMessage(err, '복원하지 못했어요.'));
    }
  };

  const notes = data?.notes ?? [];
  const viewingCurrent = !data || data.semester === data.currentSemester;

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-8 bg-white px-4 py-4 sm:px-6 sm:py-7 md:gap-[40px] md:p-10">
      <header className="flex flex-col gap-[8px] border-b-[1.5px] border-[#DEDEDE] pb-6 md:gap-[12px] md:pb-[40px]">
        <h2 className="font-['Pretendard',sans-serif] text-[24px] font-semibold leading-[1.5] tracking-[-0.02em] text-[#212121]">
          방명록
          {boardTheme !== 'cream' && <span className="ml-2 text-[13px] font-normal text-[#919191]">바탕 테스트 · {boardTheme}</span>}
        </h2>
        <p className="font-['Pretendard',sans-serif] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#919191]">
          다녀간 흔적을 한 줄 남겨 주세요
        </p>
      </header>

      {/* 학기 탭 */}
      {data && (
        <div className="-mt-2 flex flex-wrap gap-2 md:-mt-5" role="tablist">
          {data.semesters.map((label) => {
            const active = label === data.semester;
            return (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSemester(label === data.currentSemester ? null : label)}
                className={`rounded-full px-3 py-1 text-[13px] font-medium tracking-[-0.26px] transition ${
                  active ? 'bg-[#212121] text-white' : 'bg-[#F5F5F5] text-[#454545] hover:bg-[#EDEDED]'
                }`}
              >
                {label}
                {label === data.currentSemester && <span className="ml-1 text-[11px] opacity-70">이번 학기</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* 메모판 — 점 격자 종이 */}
      <section
        className="flex flex-col gap-6 rounded-[8px] border px-4 py-6 md:px-8 md:py-8"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.bg,
          backgroundImage: `radial-gradient(${theme.dot} 1px, transparent 1px)`,
          backgroundSize: '18px 18px',
        }}
      >
        {/* 쓰기 칸은 이번 학기에서만 — 지난 학기에 새 글을 끼워 넣을 수는 없다 */}
        {data && viewingCurrent && (
          <GuestbookComposer
            maxLength={data.maxLength}
            maxDrawings={data.maxDrawings}
            drawingMaxKb={data.drawingMaxKb}
            onDone={() => load(semester, true)}
          />
        )}

        {loading ? (
          <AppLoading />
        ) : error ? (
          <p className="py-10 text-center text-[14px] text-[#919191]">{error}</p>
        ) : notes.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-[#a3a09a]">
            {viewingCurrent ? '아직 비어 있어요. 첫 장을 남겨 주세요.' : '이 학기에는 남은 글이 없어요.'}
          </p>
        ) : (
          <Masonry notes={notes} onEdit={setEditing} onDelete={setDeleting} onRestore={restore} />
        )}
      </section>

      <ConfirmModal
        open={Boolean(deleting)}
        title={deleting?.isMine ? '내가 남긴 글을 지울까요?' : '이 글을 숨길까요? (복원할 수 있어요)'}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />

      {/* 고치기 — 쓰기 칸을 그대로 모달에 */}
      <Dialog open={Boolean(editing)} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent hideCloseButton className="max-h-[90dvh] max-w-[560px] overflow-y-auto rounded-[8px] border-[#dedede] p-4 md:p-5">
          <DialogTitle className="text-[16px] font-semibold text-[#212121]">방명록 고치기</DialogTitle>
          <DialogDescription className="sr-only">내용·글씨체·잉크·종이·스티커를 고친다</DialogDescription>
          {editing && data && (
            <GuestbookComposer
              mode="edit"
              initial={editing}
              maxLength={data.maxLength}
              maxDrawings={data.maxDrawings}
              drawingMaxKb={data.drawingMaxKb}
              onDone={() => {
                setEditing(null);
                load(semester, true);
              }}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 세로 칸 n 개에 글을 차례로 나눠 담는 벽돌 배치. CSS columns 를 썼더니 카드 위로 삐져나온 테이프 조각이
// 칸 경계에서 잘려 엉뚱한 자리에 남았다(10/10 밤 제보) — 칸을 직접 나누면 카드가 통째로 한 칸에 들어간다
function useColumnCount() {
  const [count, setCount] = useState(2);
  useEffect(() => {
    const lg = window.matchMedia('(min-width: 1024px)');
    const md = window.matchMedia('(min-width: 768px)');
    const update = () => setCount(lg.matches ? 4 : md.matches ? 3 : 2);
    update();
    lg.addEventListener('change', update);
    md.addEventListener('change', update);
    return () => {
      lg.removeEventListener('change', update);
      md.removeEventListener('change', update);
    };
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
