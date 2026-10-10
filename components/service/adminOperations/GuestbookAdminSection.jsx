'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '@/apis/auth';
import {
  createGuestbookSticker,
  deleteGuestbookSticker,
  getAdminGuestbookNotes,
  getGuestbookStickers,
  hideGuestbookNote,
  restoreGuestbookNote,
  updateGuestbookSticker,
} from '@/apis/admin/guestbook';
import { listSectionClass, listTitleClass } from '@/components/shared/admin/CommunityListStyles';
import ConfirmModal from '@/components/common/ConfirmModal';
import AppLoading from '@/components/common/AppLoading';
import GuestbookNote from '@/components/service/guestbook/GuestbookNote';
import { apiUrl } from '@/lib/apiBase';
import { toast } from '@/lib/toast';

// 운영 관리 > 방명록 관리 (PM 2026-10-10) — 글은 숨기기/복원(소프트), 스티커는 등록·이름·순서·삭제.
// 방명록은 로그인 없이 남길 수 있으므로 이상한 글은 여기서 숨긴다. 작성자가 지운 글(deleted)도 보이되 되돌리진 않는다.

const STATE_LABEL = { normal: '보임', hidden: '숨김', deleted: '작성자 삭제' };
const chipClass = (active) =>
  `h-[32px] shrink-0 rounded-full px-3 text-[13px] font-medium tracking-[-0.26px] transition ${
    active ? 'bg-[#212121] text-white' : 'bg-[#F5F5F5] text-[#454545] hover:bg-[#EDEDED]'
  }`;
const smallBtn =
  'h-[28px] shrink-0 rounded-[4px] border border-[#dedede] bg-white px-2 text-[12px] text-[#454545] hover:bg-[#f5f5f5] disabled:opacity-30';
const inputClass =
  'h-[36px] min-w-0 rounded-[6px] border border-[#dedede] bg-white px-3 text-[13px] text-[#212121] outline-none transition-colors focus:border-[#919191]';

export default function GuestbookAdminSection() {
  const [tab, setTab] = useState('notes');
  return (
    <section className={listSectionClass}>
      <h1 className={listTitleClass}>방명록 관리</h1>
      <div className="mb-5 flex gap-2">
        <button type="button" className={chipClass(tab === 'notes')} onClick={() => setTab('notes')}>
          글
        </button>
        <button type="button" className={chipClass(tab === 'stickers')} onClick={() => setTab('stickers')}>
          스티커
        </button>
      </div>
      {tab === 'notes' ? <NotesPanel /> : <StickersPanel />}
    </section>
  );
}

function NotesPanel() {
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

  if (loading) return <AppLoading />;
  if (error) return <p className="py-10 text-center text-[14px] text-[#919191]">{error}</p>;
  const notes = data?.notes ?? [];
  return (
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
              <GuestbookNote note={{ ...note, isMine: false }} compact />
              <div className="flex items-center justify-between gap-2 px-1 text-[12px] text-[#919191]">
                <span>
                  #{note.noteId} · {STATE_LABEL[note.state] ?? note.state}
                  {note.isMember && note.userId != null && ` · 회원 ${note.userId}`}
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
  );
}

function StickersPanel() {
  const [stickers, setStickers] = useState(null);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setStickers(await getGuestbookStickers());
    } catch (err) {
      setError(getErrorMessage(err, '불러오지 못했습니다.'));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!file || !name.trim()) {
      toast.error('이미지와 이름을 넣어 주세요.');
      return;
    }
    setSaving(true);
    try {
      await createGuestbookSticker(file, name.trim());
      toast.success('스티커를 등록했습니다.');
      setName('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, '등록하지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  // 순서는 이웃과 sortOrder 를 맞바꿔 저장한다 (두 번 호출)
  const move = async (i, d) => {
    const j = i + d;
    if (j < 0 || j >= stickers.length) return;
    const a = stickers[i];
    const b = stickers[j];
    setSaving(true);
    try {
      await updateGuestbookSticker(a.stickerId, { name: a.name, sortOrder: j });
      await updateGuestbookSticker(b.stickerId, { name: b.name, sortOrder: i });
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, '순서를 바꾸지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  const rename = async (s, next) => {
    const v = next.trim();
    if (!v || v === s.name) return;
    try {
      await updateGuestbookSticker(s.stickerId, { name: v, sortOrder: s.sortOrder });
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, '이름을 바꾸지 못했습니다.'));
    }
  };

  const remove = async () => {
    const s = confirm;
    setConfirm(null);
    try {
      await deleteGuestbookSticker(s.stickerId);
      toast.success('삭제했습니다. 이미 붙은 글에는 그대로 보입니다.');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, '삭제하지 못했습니다.'));
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 rounded-[10px] border border-[#dedede] bg-white p-4">
        <p className="text-[13px] font-medium text-[#212121]">새 스티커</p>
        <p className="text-[12px] text-[#919191]">배경이 투명한 PNG 를 권장합니다. 방명록 카드 모서리에 46px 크기로 붙습니다.</p>
        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-[12px]" />
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름 (예: 만년필)" className={`${inputClass} w-[180px]`} />
          <button
            type="button"
            onClick={create}
            disabled={saving}
            className="h-[36px] rounded-[6px] bg-[#212121] px-4 text-[13px] text-white disabled:opacity-30"
          >
            등록
          </button>
        </div>
      </div>

      {error && <p className="text-[13px] text-[#919191]">{error}</p>}
      {stickers == null ? (
        <AppLoading />
      ) : stickers.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-[#919191]">등록된 스티커가 없습니다.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[#ededed] rounded-[10px] border border-[#dedede] bg-white">
          {stickers.map((s, i) => (
            <li key={s.stickerId} className="flex items-center gap-3 px-4 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={apiUrl(s.imageUrl)} alt={s.name} className="h-[40px] w-[40px] object-contain" />
              <input
                type="text"
                defaultValue={s.name}
                onBlur={(e) => rename(s, e.target.value)}
                className={`${inputClass} flex-1 md:max-w-[240px]`}
              />
              <span className="ml-auto flex items-center gap-1">
                <button type="button" className={smallBtn} disabled={saving || i === 0} onClick={() => move(i, -1)}>
                  ↑
                </button>
                <button type="button" className={smallBtn} disabled={saving || i === stickers.length - 1} onClick={() => move(i, 1)}>
                  ↓
                </button>
                <button type="button" className={smallBtn} onClick={() => setConfirm(s)}>
                  삭제
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={Boolean(confirm)}
        title={`'${confirm?.name ?? ''}' 스티커를 서랍에서 뺄까요?`}
        onConfirm={remove}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
