'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, X } from 'lucide-react';
import { getErrorMessage } from '@/apis/auth';
import { uploadGalleryPhotos } from '@/apis/gallery';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/lib/toast';

// 활동 사진 올리기 (PM 2026-10-10 밤: 로그인 회원 누구나). 폰 사진은 수 MB 라 긴 변 1600px JPEG 로 줄여서 보내고,
// 갤러리가 줄을 짜는 데 쓰는 가로÷세로도 여기서 재서 같이 보낸다.
// 학기는 연도 · 학기 두 드롭다운(2021년부터, 기본 이번 학기). 사진 고르기는 일정 달력의 이미지 첨부와 같은 썸네일 상자.
// 여러 장이면 사진마다 제목·해시태그를 따로 적는다 — 큰 미리보기를 좌우로 넘기며(화살표·쓸기) 입력 (PM 2026-10-12).
// 다음 사진으로 넘어갈 때 비어 있으면 앞 사진의 값을 미리 채워 준다(같은 행사 사진이 대부분이라).
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.86;
const FIRST_YEAR = 2021; // 동아리 창립
const SWIPE_PX = 40;

async function shrink(file) {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return { file, ratio: 1 };
  const ratio = bitmap.width / bitmap.height;
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 1.5 * 1024 * 1024) return { file, ratio };
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
  if (!blob) return { file, ratio };
  const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return { file: new File([blob], name, { type: 'image/jpeg' }), ratio };
}

// '2026-2학기' → { year: 2026, term: 2 }
const parseSemester = (label) => {
  const m = /^(\d{4})-([12])학기$/.exec(label ?? '');
  return m ? { year: Number(m[1]), term: Number(m[2]) } : { year: new Date().getFullYear(), term: 1 };
};

export default function GalleryUploadModal({ open, onClose, onUploaded, maxFiles = 10, currentSemester = '' }) {
  const [items, setItems] = useState([]); // { file, previewUrl, title, hashtags }
  const [cur, setCur] = useState(0);
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);
  const swipeRef = useRef(null);

  const current = parseSemester(currentSemester);
  const [year, setYear] = useState(current.year);
  const [term, setTerm] = useState(current.term);
  useEffect(() => {
    setYear(current.year);
    setTerm(current.term);
  }, [current.year, current.term]);
  const years = [];
  for (let y = Math.max(current.year, new Date().getFullYear()); y >= FIRST_YEAR; y -= 1) years.push(y);

  useEffect(() => () => items.forEach((f) => URL.revokeObjectURL(f.previewUrl)), [items]);

  const addFiles = (list) => {
    const picked = Array.from(list ?? []).filter((f) => f.type.startsWith('image/'));
    if (picked.length === 0) return;
    const room = maxFiles - items.length;
    if (room <= 0) {
      toast.error(`한 번에 ${maxFiles}장까지 올릴 수 있어요.`);
      return;
    }
    if (picked.length > room) toast.error(`한 번에 ${maxFiles}장까지 올릴 수 있어요. 앞의 ${room}장만 골랐어요.`);
    setItems((prev) => {
      const last = prev[prev.length - 1];
      const added = picked.slice(0, room).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        // 같은 행사 사진이 대부분 — 앞 사진 값을 미리 채운다
        title: last?.title ?? '',
        hashtags: last?.hashtags ?? '',
      }));
      return [...prev, ...added];
    });
  };
  const removeAt = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setCur((c) => Math.max(0, Math.min(c, items.length - 2)));
  };
  const patch = (index, field, value) => setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  const go = (next) => setCur(Math.max(0, Math.min(items.length - 1, next)));

  const reset = () => {
    setItems([]);
    setCur(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  const submit = async () => {
    if (items.length === 0) {
      toast.error('사진을 골라 주세요.');
      return;
    }
    const bad = items.findIndex((it) => !it.title.trim() || !it.hashtags.trim());
    if (bad >= 0) {
      setCur(bad);
      toast.error(`${items.length > 1 ? `${bad + 1}번째 사진의 ` : ''}${!items[bad].title.trim() ? '제목' : '해시태그'}을 적어 주세요.`);
      return;
    }
    setSending(true);
    try {
      const prepared = [];
      for (const it of items) prepared.push(await shrink(it.file)); // eslint-disable-line no-await-in-loop
      const saved = await uploadGalleryPhotos(
        prepared.map((p) => p.file),
        prepared.map((p) => Math.round(p.ratio * 1000) / 1000),
        {
          semester: `${year}-${term}학기`,
          titles: items.map((it) => it.title.trim()),
          hashtagsList: items.map((it) => it.hashtags.trim()),
        }
      );
      toast.success(`${saved.length}장을 올렸어요.`);
      reset();
      onUploaded?.(saved);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, '올리지 못했어요. 잠시 뒤 다시 해 주세요.'));
    } finally {
      setSending(false);
    }
  };

  const inputClass =
    'h-[36px] w-full rounded-[6px] border border-line bg-surface px-3 text-[13px] text-ink outline-none transition-colors focus:border-ink-3';
  const canSubmit = !sending && items.length > 0 && items.every((it) => it.title.trim() && it.hashtags.trim());
  const it = items[cur];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !sending && onClose()}>
      <DialogContent hideCloseButton className="max-h-[92dvh] w-[calc(100%-24px)] max-w-[420px] gap-3 overflow-y-auto rounded-[8px] border-line p-4 sm:w-full">
        <DialogTitle className="text-[16px] font-semibold text-ink">활동 사진 올리기</DialogTitle>
        <DialogDescription className="text-[12px] text-ink-3">
          한 번에 {maxFiles}장까지, 큰 사진은 자동으로 줄여서 올려요. 사진마다 제목·해시태그를 적어요.
        </DialogDescription>

        {/* 사진 고르기 — 일정 달력의 이미지 첨부와 같은 모양. 썸네일을 누르면 그 사진의 제목·해시태그로 */}
        <div className="flex flex-wrap gap-[10px] rounded-[6px] border border-line bg-surface p-[10px]">
          {items.map((item, index) => (
            <div key={`${item.file.name}-${item.file.size}-${index}`} className="relative size-[64px]">
              <button type="button" onClick={() => setCur(index)} className={`block size-full overflow-hidden rounded-[6px] ${index === cur ? 'ring-2 ring-ink ring-offset-1' : ''}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.previewUrl} alt={item.file.name} className="size-full object-cover" />
              </button>
              {!(item.title.trim() && item.hashtags.trim()) && (
                <span className="pointer-events-none absolute bottom-[3px] left-[3px] rounded-[3px] bg-alert px-[4px] text-[9px] font-semibold leading-[1.5] text-white">미입력</span>
              )}
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label="사진 빼기"
                className="absolute -right-[6px] -top-[6px] flex size-[20px] items-center justify-center rounded-full border border-white bg-inverse text-inverse-fg shadow-[0_1px_4px_rgba(0,0,0,0.25)]"
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            </div>
          ))}
          {items.length < maxFiles && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex size-[64px] flex-col items-center justify-center gap-[3px] rounded-[6px] border border-dashed border-line-strong text-ink-3 transition-colors hover:border-ink hover:text-ink"
            >
              <ImagePlus size={18} strokeWidth={1.6} aria-hidden />
              <span className="text-[11px] leading-none tracking-[-0.24px]">{items.length ? '추가' : '고르기'}</span>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {/* 사진별 제목·해시태그 — 큰 미리보기를 좌우로 넘기며 입력 */}
        {it && (
          <div className="flex flex-col gap-2 rounded-[6px] border border-line p-[10px]">
            <div
              className="relative aspect-[4/3] w-full overflow-hidden rounded-[6px] bg-surface-2 [touch-action:pan-y]"
              onTouchStart={(e) => {
                swipeRef.current = e.touches[0].clientX;
              }}
              onTouchEnd={(e) => {
                if (swipeRef.current == null) return;
                const dx = e.changedTouches[0].clientX - swipeRef.current;
                swipeRef.current = null;
                if (dx <= -SWIPE_PX) go(cur + 1);
                else if (dx >= SWIPE_PX) go(cur - 1);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.previewUrl} alt="" className="size-full object-contain" />
              {items.length > 1 && (
                <>
                  <button type="button" onClick={() => go(cur - 1)} disabled={cur === 0} aria-label="앞 사진" className="absolute left-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white disabled:opacity-30">
                    <ChevronLeft size={18} />
                  </button>
                  <button type="button" onClick={() => go(cur + 1)} disabled={cur === items.length - 1} aria-label="다음 사진" className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white disabled:opacity-30">
                    <ChevronRight size={18} />
                  </button>
                  <span className="absolute bottom-1 right-2 rounded-[4px] bg-black/55 px-[6px] text-[11px] leading-[1.6] text-white">
                    {cur + 1} / {items.length}
                  </span>
                </>
              )}
            </div>
            <input type="text" value={it.title} maxLength={100} onChange={(e) => patch(cur, 'title', e.target.value)} placeholder="이 사진의 제목 (필수, 예: 정기모임)" className={inputClass} />
            <input type="text" value={it.hashtags} onChange={(e) => patch(cur, 'hashtags', e.target.value)} placeholder="이 사진의 해시태그 (필수, 쉼표로 구분: 정기모임, 가을)" className={inputClass} />
            {items.length > 1 && <p className="text-[11px] text-ink-4">사진을 옆으로 쓸거나 화살표로 넘기며 한 장씩 적어요. 다음 사진에는 앞 사진의 값이 미리 들어가 있어요.</p>}
          </div>
        )}

        {/* 학기 — 연도 · 학기 */}
        <div className="flex items-center gap-2 text-[12px] text-ink-3">
          <span className="shrink-0">학기</span>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputClass} aria-label="연도">
            {years.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
          <select value={term} onChange={(e) => setTerm(Number(e.target.value))} className={inputClass} aria-label="학기">
            <option value={1}>1학기</option>
            <option value={2}>2학기</option>
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={sending} className="h-[36px] rounded-[6px] border border-line bg-surface px-4 text-[13px] text-ink-2">
            취소
          </button>
          <button type="button" onClick={submit} disabled={!canSubmit} className="h-[36px] rounded-[6px] bg-inverse px-4 text-[13px] text-inverse-fg disabled:opacity-50">
            {sending ? '올리는 중…' : `올리기${items.length ? ` (${items.length}장)` : ''}`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
