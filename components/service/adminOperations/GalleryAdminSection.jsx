'use client';

import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/apis/auth';
import { getAdminGalleryPhotos, hideGalleryPhoto, restoreGalleryPhoto } from '@/apis/admin/gallery';
import { listSectionClass, listTitleClass } from '@/components/shared/admin/CommunityListStyles';
import AppLoading from '@/components/common/AppLoading';
import { apiUrl } from '@/lib/apiBase';
import { toast } from '@/lib/toast';

// 운영 관리 > 활동 사진 관리 (PM 2026-10-10 밤) — 회원이 올린 사진을 학기별로 훑고 숨기기/복원. 본인이 지운 사진(deleted)은 목록에 없다.
const STATE_LABEL = { normal: '보임', hidden: '숨김' };
const chipClass = (active) =>
  `h-[32px] shrink-0 rounded-full px-3 text-[13px] font-medium tracking-[-0.26px] transition ${
    active ? 'bg-[#212121] text-white' : 'bg-[#F5F5F5] text-[#454545] hover:bg-[#EDEDED]'
  }`;
const smallBtn =
  'h-[28px] shrink-0 rounded-[4px] border border-[#dedede] bg-white px-2 text-[12px] text-[#454545] hover:bg-[#f5f5f5] disabled:opacity-30';
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
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {photos.map((p) => (
                <li key={p.photoId} className={`flex flex-col gap-1 ${p.state === 'normal' ? '' : 'opacity-60'}`}>
                  <div className="relative w-full overflow-hidden rounded-[6px] bg-[#f3f3f3]" style={{ aspectRatio: String(p.ratio || 1) }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src(p.imageUrl)} alt={p.title ?? ''} loading="lazy" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[#919191]">
                    <span className="min-w-0 truncate">
                      #{p.photoId} · {STATE_LABEL[p.state] ?? p.state} · {p.uploaderName ?? (p.userId == null ? '시드' : `회원 ${p.userId}`)}
                      {p.title ? ` · ${p.title}` : ''}
                    </span>
                    <button type="button" className={smallBtn} disabled={busy === p.photoId} onClick={() => toggle(p)}>
                      {p.state === 'normal' ? '숨기기' : '복원'}
                    </button>
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
