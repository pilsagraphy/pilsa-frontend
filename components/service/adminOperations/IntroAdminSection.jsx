'use client';

import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/apis/auth';
import { createIntroSection, deleteIntroSection, getAdminIntro, updateIntroSection } from '@/apis/admin/about';
import { listSectionClass, listTitleClass } from '@/components/shared/admin/CommunityListStyles';
import AppLoading from '@/components/common/AppLoading';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/lib/toast';

// 운영 관리 > 동아리 소개 관리 (PM 2026-10-11) — 소개 페이지의 문단(제목 + 본문)을 고치고 순서를 바꾼다. 조직도는 '조직도 편집'에서.
const inputClass =
  'h-[36px] w-full rounded-[6px] border border-[#dedede] bg-white px-3 text-[13px] text-[#212121] outline-none transition-colors focus:border-[#919191]';
const textareaClass =
  'min-h-[160px] w-full resize-y rounded-[6px] border border-[#dedede] bg-white px-3 py-2 text-[13px] leading-[1.7] text-[#212121] outline-none transition-colors focus:border-[#919191]';
const smallBtn =
  'h-[30px] shrink-0 rounded-[4px] border border-[#dedede] bg-white px-3 text-[12px] text-[#454545] hover:bg-[#f5f5f5] disabled:opacity-30';
const primaryBtn = 'h-[30px] shrink-0 rounded-[4px] bg-[#212121] px-3 text-[12px] text-white disabled:opacity-30';

export default function IntroAdminSection() {
  const [sections, setSections] = useState(null);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setSections(await getAdminIntro());
    } catch (err) {
      setError(getErrorMessage(err, '불러오지 못했습니다.'));
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    setBusy(true);
    try {
      await createIntroSection({ title: '새 문단', content: '내용을 적어 주세요.', sortOrder: sections?.length ?? 0 });
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, '추가하지 못했습니다.'));
    } finally {
      setBusy(false);
    }
  };

  // 순서는 이웃과 sortOrder 를 맞바꿔 저장한다
  const move = async (i, d) => {
    const j = i + d;
    if (j < 0 || j >= sections.length) return;
    const a = sections[i];
    const b = sections[j];
    setBusy(true);
    try {
      await updateIntroSection(a.sectionId, { title: a.title, content: a.content, sortOrder: j });
      await updateIntroSection(b.sectionId, { title: b.title, content: b.content, sortOrder: i });
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, '순서를 바꾸지 못했습니다.'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const s = confirm;
    setConfirm(null);
    try {
      await deleteIntroSection(s.sectionId);
      toast.success('삭제했습니다.');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, '삭제하지 못했습니다.'));
    }
  };

  return (
    <section className={listSectionClass}>
      <h1 className={listTitleClass}>동아리 소개 관리</h1>
      <p className="mb-5 text-[13px] leading-[1.6] text-[#919191]">소개 페이지의 문단입니다. 본문은 줄바꿈이 그대로 보입니다. 조직도는 「조직도 편집」에서 고칩니다.</p>
      {error && <p className="py-6 text-center text-[13px] text-[#919191]">{error}</p>}
      {sections == null && !error ? (
        <AppLoading />
      ) : (
        <div className="flex flex-col gap-4">
          {sections?.map((s, i) => (
            <SectionCard
              key={s.sectionId}
              section={s}
              index={i}
              total={sections.length}
              busy={busy}
              onMove={(d) => move(i, d)}
              onDelete={() => setConfirm(s)}
              onSaved={load}
            />
          ))}
          <button type="button" onClick={add} disabled={busy} className={`${primaryBtn} self-start`}>
            + 문단 추가
          </button>
        </div>
      )}
      <ConfirmModal open={Boolean(confirm)} title={`'${confirm?.title ?? ''}' 문단을 삭제할까요?`} onConfirm={remove} onCancel={() => setConfirm(null)} />
    </section>
  );
}

function SectionCard({ section, index, total, busy, onMove, onDelete, onSaved }) {
  const [title, setTitle] = useState(section.title);
  const [content, setContent] = useState(section.content);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setTitle(section.title);
    setContent(section.content);
  }, [section.title, section.content]);
  const dirty = title !== section.title || content !== section.content;

  const save = async () => {
    setSaving(true);
    try {
      await updateIntroSection(section.sectionId, { title, content, sortOrder: section.sortOrder ?? index });
      toast.success('저장했습니다.');
      await onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err, '저장하지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-[10px] border border-[#dedede] bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-[#919191]">{index + 1}번째</span>
        <span className="ml-auto flex gap-1">
          <button type="button" className={smallBtn} disabled={busy || index === 0} onClick={() => onMove(-1)}>
            ↑
          </button>
          <button type="button" className={smallBtn} disabled={busy || index === total - 1} onClick={() => onMove(1)}>
            ↓
          </button>
          <button type="button" className={`${smallBtn} text-[#b3261e]`} disabled={busy} onClick={onDelete}>
            삭제
          </button>
        </span>
      </div>
      <input type="text" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className={inputClass} />
      <textarea value={content} maxLength={5000} onChange={(e) => setContent(e.target.value)} placeholder="본문" className={textareaClass} />
      <div className="flex justify-end">
        <button type="button" className={primaryBtn} disabled={saving || !dirty || !title.trim() || !content.trim()} onClick={save}>
          {saving ? '저장 중' : '저장'}
        </button>
      </div>
    </div>
  );
}
