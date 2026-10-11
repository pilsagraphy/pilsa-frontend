'use client';

import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/apis/auth';
import { getAdminGuestbookNotes, hideGuestbookNote, restoreGuestbookNote } from '@/apis/admin/guestbook';
import { listSectionClass, listTitleClass } from '@/components/shared/admin/CommunityListStyles';
import AppLoading from '@/components/common/AppLoading';
import GuestbookNote from '@/components/service/guestbook/GuestbookNote';
import { toast } from '@/lib/toast';

// 메뉴 관리 > 방명록 관리 (PM 2026-10-10) — 글 숨기기/복원(소프트). 작성자가 지운 글(deleted)도 보이되 되돌리진 않는다.
// 방명록 화면에서도 관리자는 수정·지우기(=숨김)·복원이 되므로 여기는 학기별로 한눈에 훑는 용도.
// 스티커는 작성자가 직접 그리므로 관리자가 등록할 것이 없다 (10/10 밤).

const STATE_LABEL = { normal: '보임', hidden: '숨김', deleted: '작성자 삭제' };
const chipClass = (active) =>
  `h-[32px] shrink-0 rounded-full px-3 text-[13px] font-medium tracking-[-0.26px] transition ${
    active ? 'bg-inverse text-inverse-fg' : 'bg-surface-2 text-ink-2 hover:bg-surface-3'
  }`;
const smallBtn =
  'h-[28px] shrink-0 rounded-[4px] border border-line bg-surface px-2 text-[12px] text-ink-2 hover:bg-surface-2 disabled:opacity-30';

export default function GuestbookAdminSection() {
  const [semester, setSemester] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  // 검색 — 입력 중인 글자(keyword)와 실제로 찾은 글자(query)를 나눈다. query 가 있으면 학기와 무관하게 전체에서 찾는다 (PM 2026-10-11)
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async (sem, quiet = false, kw = '') => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      setData(await getAdminGuestbookNotes(kw ? null : sem, kw));
    } catch (err) {
      setError(getErrorMessage(err, '불러오지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(semester, false, query);
  }, [load, semester, query]);

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
      await load(semester, true, query);
    } catch (err) {
      toast.error(getErrorMessage(err, '처리하지 못했습니다.'));
    } finally {
      setBusy(null);
    }
  };

  const notes = data?.notes ?? [];
  const search = () => setQuery(keyword.trim());
  return (
    <section className={listSectionClass}>
      <h1 className={listTitleClass}>방명록 관리</h1>
      {/* 검색 — 작성자 이름·아이디·표시 이름·내용. 찾는 동안은 학기 칩 대신 결과 수를 보여 준다 */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') search();
          }}
          placeholder="작성자 이름 · 아이디 · 표시 이름 · 내용으로 찾기"
          className="h-[36px] min-w-0 flex-1 rounded-[6px] border border-line bg-surface px-3 text-[13px] text-ink outline-none transition-colors focus:border-ink-3"
        />
        <button type="button" onClick={search} className="h-[36px] shrink-0 rounded-[6px] bg-inverse px-4 text-[13px] text-inverse-fg">
          찾기
        </button>
        {query && (
          <button
            type="button"
            onClick={() => {
              setKeyword('');
              setQuery('');
            }}
            className="h-[36px] shrink-0 rounded-[6px] border border-line bg-surface px-3 text-[13px] text-ink-2"
          >
            지우기
          </button>
        )}
      </div>
      {loading ? (
        <AppLoading />
      ) : error ? (
        <p className="py-10 text-center text-[14px] text-ink-3">{error}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {query ? (
            <p className="text-[13px] text-ink-3">
              전체 학기에서 &lsquo;{query}&rsquo; 검색 결과 {notes.length}건
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(data?.semesters ?? []).map((label) => (
                <button key={label} type="button" className={chipClass(label === data.semester)} onClick={() => setSemester(label)}>
                  {label}
                </button>
              ))}
            </div>
          )}
          {notes.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-ink-3">{query ? '검색 결과가 없습니다.' : '이 학기에는 글이 없습니다.'}</p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {notes.map((note) => (
                <li key={note.noteId} className={`flex flex-col gap-2 ${note.state === 'normal' ? '' : 'opacity-60'}`}>
                  <GuestbookNote note={{ ...note, canManage: false, state: 'normal' }} compact />
                  <div className="flex items-center justify-between gap-2 px-1 text-[12px] text-ink-3">
                    <span>
                      #{note.noteId} · {STATE_LABEL[note.state] ?? note.state}
                      {note.userId != null ? ` · ${note.authorName ?? '회원'} (${note.authorLoginId ?? note.userId})` : ' · 비로그인'}
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
