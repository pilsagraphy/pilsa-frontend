'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '@/apis/auth';
import { createHistoryItem, deleteHistoryItem, getAdminHistory, updateHistoryItem, uploadHistoryImage } from '@/apis/admin/about';
import { historyImageSrc } from '@/apis/about';
import { listSectionClass, listTitleClass } from '@/components/shared/admin/CommunityListStyles';
import AppLoading from '@/components/common/AppLoading';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/lib/toast';

// 운영 관리 > 연혁 관리 (PM 2026-10-11) — 연도별 항목(글 · 바로가기 · 영상 · 링크 · 사진)을 고치고 순서를 바꾼다.
// 영상은 서버 public/videos 의 mp4 경로를 적는다(파일 업로드는 용량 때문에 서버 담당). 사진은 여기서 올리면 주소가 들어간다.
const inputClass =
  'h-[34px] w-full min-w-0 rounded-[6px] border border-[#dedede] bg-white px-3 text-[13px] text-[#212121] outline-none transition-colors focus:border-[#919191]';
const textareaClass =
  'min-h-[64px] w-full resize-y rounded-[6px] border border-[#dedede] bg-white px-3 py-2 text-[13px] leading-[1.6] text-[#212121] outline-none transition-colors focus:border-[#919191]';
const smallBtn =
  'h-[30px] shrink-0 rounded-[4px] border border-[#dedede] bg-white px-3 text-[12px] text-[#454545] hover:bg-[#f5f5f5] disabled:opacity-30';
const primaryBtn = 'h-[30px] shrink-0 rounded-[4px] bg-[#212121] px-3 text-[12px] text-white disabled:opacity-30';
const labelClass = 'text-[11px] text-[#919191]';

export default function HistoryAdminSection() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [newYear, setNewYear] = useState(String(new Date().getFullYear()));

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await getAdminHistory());
    } catch (err) {
      setError(getErrorMessage(err, '불러오지 못했습니다.'));
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const years = [...new Set((items ?? []).map((i) => i.year))].sort((a, b) => a - b);

  const add = async () => {
    const year = Number(newYear);
    if (!year || year < 2000 || year > 2100) {
      toast.error('연도를 확인해 주세요.');
      return;
    }
    setBusy(true);
    try {
      await createHistoryItem({ year, text: '새 항목' });
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, '추가하지 못했습니다.'));
    } finally {
      setBusy(false);
    }
  };

  // 같은 해 안에서 이웃과 순서를 맞바꾼다
  const move = async (item, d) => {
    const siblings = items.filter((i) => i.year === item.year);
    const idx = siblings.findIndex((i) => i.itemId === item.itemId);
    const j = idx + d;
    if (j < 0 || j >= siblings.length) return;
    const a = siblings[idx];
    const b = siblings[j];
    setBusy(true);
    try {
      await updateHistoryItem(a.itemId, { ...a, sortOrder: j });
      await updateHistoryItem(b.itemId, { ...b, sortOrder: idx });
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, '순서를 바꾸지 못했습니다.'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const it = confirm;
    setConfirm(null);
    try {
      await deleteHistoryItem(it.itemId);
      toast.success('삭제했습니다.');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, '삭제하지 못했습니다.'));
    }
  };

  return (
    <section className={listSectionClass}>
      <h1 className={listTitleClass}>연혁 관리</h1>
      <p className="mb-5 text-[13px] leading-[1.6] text-[#919191]">
        연혁 페이지의 연도별 항목입니다. 바로가기 주소를 넣으면 글 자체가 링크가 되고, 영상·사진은 글 아래 16:9 상자에 나옵니다.
      </p>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <input type="number" value={newYear} onChange={(e) => setNewYear(e.target.value)} className={`${inputClass} w-[110px]`} />
        <button type="button" onClick={add} disabled={busy} className={primaryBtn}>
          + 이 연도에 항목 추가
        </button>
      </div>
      {error && <p className="py-6 text-center text-[13px] text-[#919191]">{error}</p>}
      {items == null && !error ? (
        <AppLoading />
      ) : (
        <div className="flex flex-col gap-8">
          {years.map((year) => {
            const rows = items.filter((i) => i.year === year);
            return (
              <div key={year} className="flex flex-col gap-3">
                <h2 className="text-[18px] font-semibold text-[#212121]">{year}</h2>
                {rows.map((item, idx) => (
                  <ItemCard
                    key={item.itemId}
                    item={item}
                    first={idx === 0}
                    last={idx === rows.length - 1}
                    busy={busy}
                    onMove={(d) => move(item, d)}
                    onDelete={() => setConfirm(item)}
                    onSaved={load}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
      <ConfirmModal
        open={Boolean(confirm)}
        title={`'${(confirm?.text ?? '').slice(0, 30)}' 항목을 삭제할까요?`}
        onConfirm={remove}
        onCancel={() => setConfirm(null)}
      />
    </section>
  );
}

function ItemCard({ item, first, last, busy, onMove, onDelete, onSaved }) {
  const [form, setForm] = useState(() => toForm(item));
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  useEffect(() => setForm(toForm(item)), [item]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setImage = (i, part) => setForm((f) => ({ ...f, images: f.images.map((im, k) => (k === i ? { ...im, ...part } : im)) }));
  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(item));

  const save = async () => {
    setSaving(true);
    try {
      await updateHistoryItem(item.itemId, {
        year: Number(form.year),
        sortOrder: item.sortOrder,
        text: form.text,
        href: form.href || null,
        video: form.video || null,
        linkHref: form.linkHref || null,
        linkLabel: form.linkLabel || null,
        images: form.images
          .filter((im) => im.src)
          .map((im) => ({ src: im.src, alt: im.alt || null, wide: im.wide || null, zoom: im.zoom ? Number(im.zoom) : null })),
      });
      toast.success('저장했습니다.');
      await onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err, '저장하지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  const upload = async (file) => {
    if (!file) return;
    setSaving(true);
    try {
      const { src } = await uploadHistoryImage(file);
      setForm((f) => ({ ...f, images: [...f.images, { src, alt: '', wide: false, zoom: '' }] }));
      toast.success('사진을 올렸어요. 저장을 눌러야 반영됩니다.');
    } catch (err) {
      toast.error(getErrorMessage(err, '사진을 올리지 못했습니다.'));
    } finally {
      setSaving(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-[10px] border border-[#dedede] bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 text-[11px] text-[#919191]">
          연도
          <input type="number" value={form.year} onChange={(e) => set('year', e.target.value)} className={`${inputClass} w-[90px]`} />
        </label>
        <span className="ml-auto flex gap-1">
          <button type="button" className={smallBtn} disabled={busy || first} onClick={() => onMove(-1)}>
            ↑
          </button>
          <button type="button" className={smallBtn} disabled={busy || last} onClick={() => onMove(1)}>
            ↓
          </button>
          <button type="button" className={`${smallBtn} text-[#b3261e]`} disabled={busy} onClick={onDelete}>
            삭제
          </button>
        </span>
      </div>
      <textarea value={form.text} maxLength={1000} onChange={(e) => set('text', e.target.value)} placeholder="내용 (줄바꿈 가능)" className={textareaClass} />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>글 바로가기 주소 (선택 — 글 자체가 링크)</span>
          <input type="text" value={form.href} onChange={(e) => set('href', e.target.value)} placeholder="https://..." className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>영상 주소 (선택 — 서버 /videos/파일.mp4)</span>
          <input type="text" value={form.video} onChange={(e) => set('video', e.target.value)} placeholder="/videos/example.mp4" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>영상 아래 링크 주소 (선택)</span>
          <input type="text" value={form.linkHref} onChange={(e) => set('linkHref', e.target.value)} placeholder="https://www.youtube.com/@pilsagraphy" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>링크 글자</span>
          <input type="text" value={form.linkLabel} onChange={(e) => set('linkLabel', e.target.value)} placeholder="필사그래피 유튜브에서 보기" className={inputClass} />
        </label>
      </div>

      {/* 사진 */}
      <div className="flex flex-col gap-2 rounded-[6px] border border-dashed border-[#dedede] p-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-[#212121]">사진</span>
          <span className={labelClass}>16:9 상자에 가로로 나란히. 세로 사진이면 「넓게」를 끄고, 작아 보이면 확대 배율을 준다</span>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
          <button type="button" className={`${smallBtn} ml-auto`} disabled={saving} onClick={() => fileRef.current?.click()}>
            + 사진 올리기
          </button>
        </div>
        {form.images.map((im, i) => (
          <div key={`${im.src}-${i}`} className="flex flex-wrap items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={historyImageSrc(im.src)} alt="" className="h-[48px] w-[72px] rounded-[4px] bg-[#f3f3f3] object-cover" />
            <input type="text" value={im.alt ?? ''} onChange={(e) => setImage(i, { alt: e.target.value })} placeholder="설명(alt)" className={`${inputClass} flex-1`} />
            <label className="flex items-center gap-1 text-[12px] text-[#454545]">
              <input type="checkbox" checked={Boolean(im.wide)} onChange={(e) => setImage(i, { wide: e.target.checked })} className="accent-[#212121]" />
              넓게
            </label>
            <input type="number" step="0.1" min="0.5" max="3" value={im.zoom ?? ''} onChange={(e) => setImage(i, { zoom: e.target.value })} placeholder="확대" className={`${inputClass} w-[80px]`} />
            <button type="button" className={smallBtn} onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, k) => k !== i) }))}>
              빼기
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button type="button" className={primaryBtn} disabled={saving || !dirty || !form.text.trim()} onClick={save}>
          {saving ? '저장 중' : '저장'}
        </button>
      </div>
    </div>
  );
}

function toForm(item) {
  return {
    year: String(item.year ?? ''),
    text: item.text ?? '',
    href: item.href ?? '',
    video: item.video ?? '',
    linkHref: item.linkHref ?? '',
    linkLabel: item.linkLabel ?? '',
    images: (item.images ?? []).map((im) => ({ src: im.src, alt: im.alt ?? '', wide: Boolean(im.wide), zoom: im.zoom ?? '' })),
  };
}
