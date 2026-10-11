'use client';

import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/apis/auth';
import { getAdminGalleryPhotos, hideGalleryPhoto, restoreGalleryPhoto, updateGalleryPhotoMeta } from '@/apis/admin/gallery';
import { listSectionClass, listTitleClass } from '@/components/shared/admin/CommunityListStyles';
import AppLoading from '@/components/common/AppLoading';
import { apiUrl } from '@/lib/apiBase';
import { toast } from '@/lib/toast';

// 메뉴 관리 > 활동 사진 관리 (PM 2026-10-10 밤) — 회원이 올린 사진을 학기별로 훑고 숨기기/복원, 제목·해시태그 수정(둘 다 필수).
// 본인이 지운 사진(deleted)은 목록에 없다. 올린 사람이 없는 사진(사이트를 만들 때 코드에 있던 것)은 따로 표시하지 않는다 (PM 10/11).
const STATE_LABEL = { normal: '보임', hidden: '숨김' };
const chipClass = (active) =>
  `h-[32px] shrink-0 rounded-full px-3 text-[13px] font-medium tracking-[-0.26px] transition ${
    active ? 'bg-inverse text-inverse-fg' : 'bg-surface-2 text-ink-2 hover:bg-surface-3'
  }`;
const smallBtn =
  'h-[28px] shrink-0 rounded-[4px] border border-line bg-surface px-2 text-[12px] text-ink-2 hover:bg-surface-2 disabled:opacity-30';
const inputClass =
  'h-[30px] min-w-0 w-full rounded-[4px] border border-line bg-surface px-2 text-[12px] text-ink outline-none transition-colors focus:border-ink-3';
const src = (url) => (url?.startsWith('/api/') ? apiUrl(url) : url);

export default function GalleryAdminSection() {
  const [semester, setSemester] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async (sem, quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      setData(await getAdminGalleryPhotos(sem));
    } catch (err) {
      setError(getErrorMessage(err, '불러오지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(semester);
  }, [load, semester]);

  const toggle = async (photo) => {
    setBusy(photo.photoId);
    try {
      if (photo.state === 'normal') {
        await hideGalleryPhoto(photo.photoId);
        toast.success('숨겼습니다.');
      } else {
        await restoreGalleryPhoto(photo.photoId);
        toast.success('복원했습니다.');
      }
      await load(semester, true);
    } catch (err) {
      toast.error(getErrorMessage(err, '처리하지 못했습니다.'));
    } finally {
      setBusy(null);
    }
  };

  const saveMeta = async (photo, title, hashtags) => {
    setBusy(photo.photoId);
    try {
      await updateGalleryPhotoMeta(photo.photoId, { title, hashtags });
      toast.success('저장했습니다.');
      await load(semester, true);
    } catch (err) {
      toast.error(getErrorMessage(err, '저장하지 못했습니다.'));
    } finally {
      setBusy(null);
    }
  };

  const photos = data?.photos ?? [];
  return (
    <section className={listSectionClass}>
      <h1 className={listTitleClass}>활동 사진 관리</h1>
      {loading ? (
        <AppLoading />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <p className="text-[14px] text-ink-3">{error}</p>
          <button type="button" className={smallBtn} onClick={() => load(semester)}>
            다시 불러오기
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {(data?.semesters ?? []).map((label) => (
              <button key={label} type="button" className={chipClass(label === data.semester)} onClick={() => setSemester(label)}>
                {label}
              </button>
            ))}
          </div>
          {photos.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-ink-3">이 학기에는 사진이 없습니다.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {photos.map((p) => (
                <PhotoCard key={p.photoId} photo={p} busy={busy === p.photoId} onToggle={() => toggle(p)} onSave={(t, h) => saveMeta(p, t, h)} />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

// 사진 한 장 — 제목·해시태그를 바로 고쳐 저장한다
function PhotoCard({ photo, busy, onToggle, onSave }) {
  const [title, setTitle] = useState(photo.title ?? '');
  const [hashtags, setHashtags] = useState((photo.hashtags ?? []).join(', '));
  useEffect(() => {
    setTitle(photo.title ?? '');
    setHashtags((photo.hashtags ?? []).join(', '));
  }, [photo.title, photo.hashtags]);
  const dirty = title !== (photo.title ?? '') || hashtags !== (photo.hashtags ?? []).join(', ');
  // 올린 사람이 없는 사진(코드에 있던 것)은 따로 표시하지 않는다 (PM 10/11)
  const uploader = photo.userId == null ? '' : photo.uploaderName ?? `회원 ${photo.userId}`;
  const canSave = dirty && title.trim() && hashtags.trim();

  return (
    <li className={`flex flex-col gap-2 rounded-[8px] border border-line p-2 ${photo.state === 'normal' ? '' : 'opacity-60'}`}>
      <div className="relative w-full overflow-hidden rounded-[6px] bg-surface-2" style={{ aspectRatio: String(photo.ratio || 1) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src(photo.imageUrl)} alt={photo.title ?? ''} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <div className="flex items-center justify-between gap-2 text-[11px] text-ink-3">
        <span className="min-w-0 truncate">
          #{photo.photoId} · {STATE_LABEL[photo.state] ?? photo.state}
          {uploader ? ` · ${uploader}` : ''}
        </span>
        <button type="button" className={smallBtn} disabled={busy} onClick={onToggle}>
          {photo.state === 'normal' ? '숨기기' : '복원'}
        </button>
      </div>
      <input type="text" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} placeholder="제목 (필수)" className={inputClass} />
      <div className="flex gap-1">
        <input type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="해시태그 (필수, 쉼표 구분)" className={inputClass} />
        <button type="button" className={smallBtn} disabled={busy || !canSave} onClick={() => onSave(title, hashtags)}>
          저장
        </button>
      </div>
    </li>
  );
}
