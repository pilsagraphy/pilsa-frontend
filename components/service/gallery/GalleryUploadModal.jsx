'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { getErrorMessage } from '@/apis/auth';
import { uploadGalleryPhotos } from '@/apis/gallery';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/lib/toast';

// 활동 사진 올리기 (PM 2026-10-10 밤: 로그인 회원 누구나). 폰 사진은 수 MB 라 긴 변 1600px JPEG 로 줄여서 보내고,
// 갤러리가 줄을 짜는 데 쓰는 가로÷세로도 여기서 재서 같이 보낸다.
// 학기는 연도 · 학기 두 드롭다운으로 고른다(2021년부터, 기본은 이번 학기) — 지난 학기 사진을 뒤늦게 올릴 때 (PM 2026-10-11).
// 사진 고르기는 일정 달력의 이미지 첨부와 같은 모양 — 테두리 상자 안 썸네일 + 점선 '추가' 칸 (PM 2026-10-11).
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.86;
const FIRST_YEAR = 2021; // 동아리 창립

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
  const [files, setFiles] = useState([]); // { file, previewUrl }
  const [title, setTitle] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  const current = parseSemester(currentSemester);
  const [year, setYear] = useState(current.year);
  const [term, setTerm] = useState(current.term);
  // 이번 학기 값이 늦게 오면(메타 로드) 기본값을 맞춘다
  useEffect(() => {
    setYear(current.year);
    setTerm(current.term);
  }, [current.year, current.term]);
  const years = [];
  for (let y = Math.max(current.year, new Date().getFullYear()); y >= FIRST_YEAR; y -= 1) years.push(y);

  // 미리보기 URL 은 목록이 바뀔 때·닫힐 때 해제한다
  useEffect(() => () => files.forEach((f) => URL.revokeObjectURL(f.previewUrl)), [files]);

  const addFiles = (list) => {
    const picked = Array.from(list ?? []).filter((f) => f.type.startsWith('image/'));
    if (picked.length === 0) return;
    const room = maxFiles - files.length;
    if (room <= 0) {
      toast.error(`한 번에 ${maxFiles}장까지 올릴 수 있어요.`);
      return;
    }
    if (picked.length > room) toast.error(`한 번에 ${maxFiles}장까지 올릴 수 있어요. 앞의 ${room}장만 골랐어요.`);
    setFiles((prev) => [...prev, ...picked.slice(0, room).map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))]);
  };
  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const reset = () => {
    setFiles([]);
    setTitle('');
    setHashtags('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const submit = async () => {
    if (files.length === 0) {
      toast.error('사진을 골라 주세요.');
      return;
    }
    if (!title.trim()) {
      toast.error('제목을 적어 주세요.');
      return;
    }
    if (!hashtags.trim()) {
      toast.error('해시태그를 하나 이상 적어 주세요.');
      return;
    }
    setSending(true);
    try {
      const prepared = [];
      for (const f of files) prepared.push(await shrink(f.file)); // eslint-disable-line no-await-in-loop
      const saved = await uploadGalleryPhotos(
        prepared.map((p) => p.file),
        prepared.map((p) => Math.round(p.ratio * 1000) / 1000),
        { title: title.trim(), hashtags: hashtags.trim(), semester: `${year}-${term}학기` }
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
  const canSubmit = !sending && files.length > 0 && title.trim() && hashtags.trim();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !sending && onClose()}>
      <DialogContent hideCloseButton className="max-w-[420px] gap-3 rounded-[8px] border-line p-4">
        <DialogTitle className="text-[16px] font-semibold text-ink">활동 사진 올리기</DialogTitle>
        <DialogDescription className="text-[12px] text-ink-3">
          한 번에 {maxFiles}장까지, 큰 사진은 자동으로 줄여서 올려요. 올린 사진은 본인이 고치거나 지울 수 있어요.
        </DialogDescription>

        {/* 사진 — 일정 달력의 이미지 첨부와 같은 모양 */}
        <div className="flex flex-wrap gap-[10px] rounded-[6px] border border-line bg-surface p-[10px]">
          {files.map((item, index) => (
            <div key={`${item.file.name}-${item.file.size}-${index}`} className="relative size-[88px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.previewUrl} alt={item.file.name} className="size-full rounded-[6px] object-cover" />
              <button
                type="button"
                onClick={() => removeFile(index)}
                aria-label="사진 빼기"
                title="사진 빼기"
                className="absolute -right-[6px] -top-[6px] flex size-[22px] items-center justify-center rounded-full border border-white bg-inverse text-inverse-fg shadow-[0_1px_4px_rgba(0,0,0,0.25)]"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>
          ))}
          {files.length < maxFiles && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex size-[88px] flex-col items-center justify-center gap-[4px] rounded-[6px] border border-dashed border-line-strong text-ink-3 transition-colors hover:border-ink hover:text-ink"
            >
              <ImagePlus size={20} strokeWidth={1.6} aria-hidden />
              <span className="text-[12px] leading-none tracking-[-0.24px]">{files.length ? '추가' : '사진 고르기'}</span>
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

        <input type="text" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} placeholder="제목 (필수, 예: 정기모임)" className={inputClass} />
        <input type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="해시태그 (필수, 하나 이상 · 쉼표로 구분: 정기모임, 가을)" className={inputClass} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={sending} className="h-[36px] rounded-[6px] border border-line bg-surface px-4 text-[13px] text-ink-2">
            취소
          </button>
          <button type="button" onClick={submit} disabled={!canSubmit} className="h-[36px] rounded-[6px] bg-inverse px-4 text-[13px] text-inverse-fg disabled:opacity-50">
            {sending ? '올리는 중…' : `올리기${files.length ? ` (${files.length}장)` : ''}`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
