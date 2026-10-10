'use client';

import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/apis/auth';
import { deleteGuestbookNote, getGuestbook } from '@/apis/guestbook';
import AppLoading from '@/components/common/AppLoading';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/lib/toast';
import GuestbookComposer from './GuestbookComposer';
import GuestbookNote from './GuestbookNote';

// 방명록 (PM 2026-10-10) — 학기별로 모아 보는 손글씨 메모판. 무채색 · 잉크 · 문구류 느낌.
// 학기 구분은 서버가 글을 남긴 시점의 학기(정책의 학기 시작 월)로 매긴다. 이번 학기 탭은 글이 없어도 보인다.
export default function Guestbook() {
  const [semester, setSemester] = useState(null); // null = 이번 학기
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

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
      toast.success('지웠어요.');
      load(semester, true);
    } catch (err) {
      toast.error(getErrorMessage(err, '지우지 못했어요.'));
    }
  };

  const notes = data?.notes ?? [];
  const viewingCurrent = !data || data.semester === data.currentSemester;

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-8 bg-white px-4 py-4 sm:px-6 sm:py-7 md:gap-[40px] md:p-10">
      <header className="flex flex-col gap-[8px] border-b-[1.5px] border-[#DEDEDE] pb-6 md:gap-[12px] md:pb-[40px]">
        <h2 className="font-['Pretendard',sans-serif] text-[24px] font-semibold leading-[1.5] tracking-[-0.02em] text-[#212121]">
          방명록
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
        className="flex flex-col gap-6 rounded-[8px] border border-[#e6e3db] px-4 py-6 md:px-8 md:py-8"
        style={{
          backgroundColor: '#f6f4ee',
          backgroundImage: 'radial-gradient(#d6d3c9 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      >
        {/* 쓰기 칸은 이번 학기에서만 — 지난 학기에 새 글을 끼워 넣을 수는 없다 */}
        {data && viewingCurrent && (
          <GuestbookComposer
            stickers={data.stickers}
            maxLength={data.maxLength}
            maxStickers={data.maxStickers}
            onPosted={() => load(semester, true)}
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
          <Masonry notes={notes} onDelete={setDeleting} />
        )}
      </section>

      <ConfirmModal
        open={Boolean(deleting)}
        title="내가 남긴 글을 지울까요?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
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

function Masonry({ notes, onDelete }) {
  const count = useColumnCount();
  const columns = Array.from({ length: count }, () => []);
  notes.forEach((note, i) => columns[i % count].push(note));
  return (
    <div className="flex items-start gap-4 pt-3">
      {columns.map((col, ci) => (
        <div key={ci} className="flex min-w-0 flex-1 flex-col gap-6">
          {col.map((note) => (
            <GuestbookNote key={note.noteId} note={note} onDelete={onDelete} />
          ))}
        </div>
      ))}
    </div>
  );
}
