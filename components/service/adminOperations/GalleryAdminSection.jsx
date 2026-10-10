'use client';

import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/apis/auth';
import { getAdminGalleryPhotos, hideGalleryPhoto, restoreGalleryPhoto, updateGalleryPhotoMeta } from '@/apis/admin/gallery';
import { listSectionClass, listTitleClass } from '@/components/shared/admin/CommunityListStyles';
import AppLoading from '@/components/common/AppLoading';
import { apiUrl } from '@/lib/apiBase';
import { toast } from '@/lib/toast';

// 운영 관리 > 활동 사진 관리 (PM 2026-10-10 밤) — 회원이 올린 사진을 학기별로 훑고 숨기기/복원, 제목·해시태그 수정.
// 본인이 지운 사진(deleted)은 목록에 없다. '기존 사진'은 사이트를 만들 때 코드에 있던 사진을 DB 로 옮긴 것(올린 사람 없음).
const STATE_LABEL = { normal: '보임', hidden: '숨김' };
const chipClass = (active) =>
  `h-[32px] shrink-0 rounded-full px-3 text-[13px] font-medium tracking-[-0.26px] transition ${
    active ? 'bg-[#212121] text-white' : 'bg-[#F5F5F5] text-[#454545] hover:bg-[#EDEDED]'
  }`;
const smallBtn =
  'h-[28px] shrink-0 rounded-[4px] border border-[#dedede] bg-white px-2 text-[12px] text-[#454545] hover:bg-[#f5f5f5] disabled:opacity-30';
const inputClass =
  'h-[30px] min-w-0 w-full rounded-[4px] border border-[#dedede] bg-white px-2 text-[12px] text-[#212121] outline-none transition-colors focus:border-[#919191]';
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
          {photos.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[#919191]">이 학기에는 사진이 없습니다.</p>
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
  const uploader = photo.userId == null ? '기존 사진' : photo.uploaderName ?? `회원 ${photo.userId}`;

  return (
    <li className={`flex flex-col gap-2 rounded-[8px] border border-[#ededed] p-2 ${photo.state === 'normal' ? '' : 'opacity-60'}`}>
      <div className="relative w-full overflow-hidden rounded-[6px] bg-[#f3f3f3]" style={{ aspectRatio: String(photo.ratio || 1) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src(photo.imageUrl)} alt={photo.title ?? ''} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <div className="flex items-center justify-between gap-2 text-[11px] text-[#919191]">
        <span className="min-w-0 truncate">
          #{photo.photoId} · {STATE_LABEL[photo.state] ?? photo.state} · {uploader}
        </span>
        <button type="button" className={smallBtn} disabled={busy} onClick={onToggle}>
          {photo.state === 'normal' ? '숨기기' : '복원'}
        </button>
      </div>
      <input type="text" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className={inputClass} />
      <div className="flex gap-1">
        <input type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="해시태그 (쉼표 구분)" className={inputClass} />
        <button type="button" className={smallBtn} disabled={busy || !dirty} onClick={() => onSave(title, hashtags)}>
          저장
        </button>
      </div>
    </li>
  );
}
