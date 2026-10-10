'use client';

import { useRef, useState } from 'react';
import { getErrorMessage } from '@/apis/auth';
import { uploadGalleryPhotos } from '@/apis/gallery';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/lib/toast';

// 활동 사진 올리기 (PM 2026-10-10 밤: 로그인 회원 누구나). 폰 사진은 수 MB 라 긴 변 1600px JPEG 로 줄여서 보내고,
// 갤러리가 줄을 짜는 데 쓰는 가로÷세로도 여기서 재서 같이 보낸다.
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.86;

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

export default function GalleryUploadModal({ open, onClose, onUploaded, maxFiles = 10 }) {
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  const pick = (list) => {
    const arr = Array.from(list ?? []).filter((f) => f.type.startsWith('image/'));
    if (arr.length > maxFiles) toast.error(`한 번에 ${maxFiles}장까지 올릴 수 있어요. 앞의 ${maxFiles}장만 골랐어요.`);
    setFiles(arr.slice(0, maxFiles));
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
      for (const f of files) prepared.push(await shrink(f)); // eslint-disable-line no-await-in-loop
      const saved = await uploadGalleryPhotos(
        prepared.map((p) => p.file),
        prepared.map((p) => Math.round(p.ratio * 1000) / 1000),
        { title: title.trim(), hashtags: hashtags.trim() }
      );
      toast.success(`${saved.length}장을 올렸어요.`);
      setFiles([]);
      setTitle('');
      setHashtags('');
      if (inputRef.current) inputRef.current.value = '';
      onUploaded?.(saved);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, '올리지 못했어요. 잠시 뒤 다시 해 주세요.'));
    } finally {
      setSending(false);
    }
  };

  const inputClass =
    'h-[36px] w-full rounded-[6px] border border-[#dedede] bg-white px-3 text-[13px] text-[#212121] outline-none transition-colors focus:border-[#919191]';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !sending && onClose()}>
      <DialogContent hideCloseButton className="max-w-[420px] gap-3 rounded-[8px] border-[#dedede] p-4">
        <DialogTitle className="text-[16px] font-semibold text-[#212121]">활동 사진 올리기</DialogTitle>
        <DialogDescription className="text-[12px] text-[#919191]">
          이번 학기 구간에 들어가요. 한 번에 {maxFiles}장까지, 큰 사진은 자동으로 줄여서 올려요. 올린 사진은 본인과 운영진이 지울 수 있어요.
        </DialogDescription>
        <input ref={inputRef} type="file" accept="image/*" multiple onChange={(e) => pick(e.target.files)} className="text-[12px]" />
        {files.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {files.map((f) => (
              <span key={`${f.name}-${f.size}`} className="rounded-[4px] bg-[#f5f5f5] px-2 py-[2px] text-[11px] text-[#454545]">
                {f.name}
              </span>
            ))}
          </div>
        )}
        <input type="text" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} placeholder="제목 (필수, 예: 정기모임)" className={inputClass} />
        <input type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="해시태그 (필수, 하나 이상 · 쉼표로 구분: 정기모임, 가을)" className={inputClass} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={sending} className="h-[36px] rounded-[6px] border border-[#dedede] bg-white px-4 text-[13px] text-[#454545]">
            취소
          </button>
          <button type="button" onClick={submit} disabled={sending || !title.trim() || !hashtags.trim() || files.length === 0} className="h-[36px] rounded-[6px] bg-[#212121] px-4 text-[13px] text-white disabled:opacity-50">
            {sending ? '올리는 중…' : `올리기${files.length ? ` (${files.length}장)` : ''}`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
