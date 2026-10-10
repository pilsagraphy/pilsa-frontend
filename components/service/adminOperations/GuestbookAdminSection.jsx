'use client';

import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/apis/auth';
import { getAdminGuestbookNotes, hideGuestbookNote, restoreGuestbookNote } from '@/apis/admin/guestbook';
import { listSectionClass, listTitleClass } from '@/components/shared/admin/CommunityListStyles';
import AppLoading from '@/components/common/AppLoading';
import GuestbookNote from '@/components/service/guestbook/GuestbookNote';
import { toast } from '@/lib/toast';

// 운영 관리 > 방명록 관리 (PM 2026-10-10) — 글 숨기기/복원(소프트). 작성자가 지운 글(deleted)도 보이되 되돌리진 않는다.
// 방명록 화면에서도 관리자는 수정·지우기(=숨김)·복원이 되므로 여기는 학기별로 한눈에 훑는 용도.
// 스티커는 작성자가 직접 그리므로 관리자가 등록할 것이 없다 (10/10 밤).

const STATE_LABEL = { normal: '보임', hidden: '숨김', deleted: '작성자 삭제' };
const chipClass = (active) =>
  `h-[32px] shrink-0 rounded-full px-3 text-[13px] font-medium tracking-[-0.26px] transition ${
    active ? 'bg-[#212121] text-white' : 'bg-[#F5F5F5] text-[#454545] hover:bg-[#EDEDED]'
  }`;
const smallBtn =
  'h-[28px] shrink-0 rounded-[4px] border border-[#dedede] bg-white px-2 text-[12px] text-[#454545] hover:bg-[#f5f5f5] disabled:opacity-30';

export default function GuestbookAdminSection() {
  const [semester, setSemester] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async (sem, quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      setData(await getAdminGuestbookNotes(sem));
    } catch (err) {
      setError(getErrorMessage(err, '불러오지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(semester);
  }, [load, semester]);

  const toggle = async (note) => {
    setBusy(note.noteId);
    try {
      if (note.state === 'normal') {
        await hideGuestbookNote(note.noteId);
        toast.success('숨겼습니다.');
      } else {
        await restoreGuestbookNote(note.noteId);
        toast.success('복원했습니다.');
      }
      await load(semester, true);
    } catch (err) {
      toast.error(getErrorMessage(err, '처리하지 못했습니다.'));
    } finally {
      setBusy(null);
    }
  };

  const notes = data?.notes ?? [];
  return (
    <section className={listSectionClass}>
      <h1 className={listTitleClass}>방명록 관리</h1>
      {loading ? (
        <AppLoading />
      ) : error ? (
        <p className="py-10 text-center text-[14px] text-[#919191]">{error}</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {(data?.semesters ?? []).map((label) => (
              <button key={label} type="button" className={chipClass(label === data.semester)} onClick={() => setSemester(label)}>
                {label}
              </button>
            ))}
          </div>
          {notes.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[#919191]">이 학기에는 글이 없습니다.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {notes.map((note) => (
                <li key={note.noteId} className={`flex flex-col gap-2 ${note.state === 'normal' ? '' : 'opacity-60'}`}>
                  <GuestbookNote note={{ ...note, canManage: false, state: 'normal' }} compact />
                  <div className="flex items-center justify-between gap-2 px-1 text-[12px] text-[#919191]">
                    <span>
                      #{note.noteId} · {STATE_LABEL[note.state] ?? note.state}
                      {note.userId != null ? ` · 회원 ${note.userId}` : ' · 비로그인'}
                    </span>
                    {note.state !== 'deleted' && (
                      <button type="button" className={smallBtn} disabled={busy === note.noteId} onClick={() => toggle(note)}>
                        {note.state === 'normal' ? '숨기기' : '복원'}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
