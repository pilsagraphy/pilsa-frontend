'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '@/apis/auth';
import { deleteGalleryPhoto, getGallery } from '@/apis/gallery';
import AppLoading from '@/components/common/AppLoading';
import ConfirmModal from '@/components/common/ConfirmModal';
import AdminPageLink from '@/components/shared/AdminPageLink';
import SemesterJump, { scrollToSemester, semesterAnchorId, useActiveSemester } from '@/components/shared/SemesterJump';
import { ROUTES } from '@/constants/routes';
import { apiUrl } from '@/lib/apiBase';
import { toast } from '@/lib/toast';
import useAuthStore from '@/stores/useAuthStore';
import GalleryTile from './GalleryTile';
import GalleryUploadModal from './GalleryUploadModal';

// 활동 사진 — 서버(gallery_photos)에서 학기별로 받아 한 페이지에 이어 붙인다 (PM 2026-10-10 밤).
// 로그인 회원은 누구나 올리고, 본인·관리자는 지운다(관리자가 지우면 숨김). 관리자에겐 관리 페이지 버튼.
// 아래로 내리면 지난 학기를 더 불러오고, 드롭다운은 보고 있는 학기를 보여 주며 고르면 그 구간으로 스크롤한다.
//
// 사진을 줄로 묶어, 각 줄이 화면 폭을 정확히 채우게 한다 (정렬 격자 / justified rows).
// 한 줄에 들어갈 사진을 비율의 합으로 정하고 각 사진이 제 비율만큼 폭을 나눠 갖는다 — 줄은 언제나 좌우 끝까지 꽉 찬다.
// 줄마다 장수가 비슷하면 밋밋해서 줄 목표치를 번갈아 준다.
const ROW_TARGETS_MOBILE = [1.5, 2.6, 2.0, 3.2];
const ROW_TARGETS_DESKTOP = [2.6, 4.8, 3.6, 5.6];
const MIN_ROW_ASPECT = 1.35;

function buildRows(photos, targets) {
  const rows = [];
  let current = [];
  let sum = 0;
  let rowIndex = 0;
  const targetFor = (i) => targets[i % targets.length];
  photos.forEach((photo) => {
    current.push(photo);
    sum += photo.ratio;
    if (sum >= targetFor(rowIndex)) {
      rows.push(current);
      current = [];
      sum = 0;
      rowIndex += 1;
    }
  });
  if (current.length) {
    const last = rows[rows.length - 1];
    const leftoverRatio = current.reduce((acc, photo) => acc + photo.ratio, 0);
    if (last && leftoverRatio < MIN_ROW_ASPECT) last.push(...current);
    else rows.push(current);
  }
  return rows;
}

// 서버 사진 → 타일·라이트박스가 쓰는 모양. imageUrl 이 /api/.. 면 API 도메인을 붙인다
const toTile = (p) => ({
  ...p,
  imageSrc: p.imageUrl?.startsWith('/api/') ? apiUrl(p.imageUrl) : p.imageUrl,
  ratio: Number(p.ratio) > 0 ? Number(p.ratio) : 1,
});

function GalleryRows({ rows, activeSrc, onActivate, allPhotos, onDelete }) {
  return rows.map((row, rowIndex) => {
    const aspect = Math.max(
      MIN_ROW_ASPECT,
      row.reduce((sum, photo) => sum + photo.ratio, 0)
    );
    return (
      <div key={rowIndex} className="flex w-full gap-1" style={{ aspectRatio: String(aspect) }}>
        {row.map((photo) => (
          <div key={photo.photoId} className="group relative min-w-0" style={{ flex: `${photo.ratio} 1 0%` }}>
            <GalleryTile
              photo={photo}
              activeSrc={activeSrc}
              onActivate={onActivate}
              gallery={allPhotos}
              index={allPhotos.findIndex((x) => x.photoId === photo.photoId)}
            />
            {photo.canManage && photo.state !== 'hidden' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(photo);
                }}
                aria-label="사진 지우기"
                title={photo.isMine ? '내 사진 지우기' : '숨기기 (관리자)'}
                className="absolute right-1 top-1 z-10 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-black/55 text-[14px] leading-none text-white opacity-80 hover:bg-black/75 md:opacity-0 md:group-hover:opacity-100"
              >
                ×
              </button>
            )}
            {photo.state === 'hidden' && (
              <span className="pointer-events-none absolute left-1 top-1 z-10 rounded-[2px] bg-[#454545] px-1 text-[10px] text-white">숨김</span>
            )}
          </div>
        ))}
      </div>
    );
  });
}

const Gallery = () => {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [activeSrc, setActiveSrc] = useState(null);
  const [meta, setMeta] = useState(null); // { currentSemester, semesters, maxFilesPerUpload }
  const [photosBySemester, setPhotosBySemester] = useState({});
  const [visibleCount, setVisibleCount] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [pendingJump, setPendingJump] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const sentinelRef = useRef(null);

  const fetchSemester = useCallback(async (label) => {
    const res = await getGallery(label);
    setPhotosBySemester((prev) => ({ ...prev, [res.semester]: res.photos.map(toTile) }));
    return res;
  }, []);

  useEffect(() => {
    let alive = true;
    getGallery()
      .then((res) => {
        if (!alive) return;
        setMeta({ currentSemester: res.currentSemester, semesters: res.semesters, maxFilesPerUpload: res.maxFilesPerUpload });
        setPhotosBySemester({ [res.semester]: res.photos.map(toTile) });
      })
      .catch((err) => {
        if (alive) setError(getErrorMessage(err, '활동 사진을 불러오지 못했어요.'));
      });
    return () => {
      alive = false;
    };
  }, []);

  const semesters = meta?.semesters ?? [];
  const visibleSemesters = semesters.slice(0, visibleCount);
  const [activeSemester, setActiveSemester] = useActiveSemester(visibleSemesters);
  // 크게 보기(라이트박스)의 앞·뒤 넘기기 순서 — 펼친 학기의 사진을 위에서부터 이어 붙인 것
  const allPhotos = visibleSemesters.flatMap((label) => photosBySemester[label] ?? []);

  const revealUpTo = useCallback(
    async (count) => {
      const target = Math.min(count, semesters.length);
      setLoadingMore(true);
      try {
        for (let i = visibleCount; i < target; i += 1) {
          const label = semesters[i];
          if (!photosBySemester[label]) await fetchSemester(label); // eslint-disable-line no-await-in-loop
        }
        setVisibleCount(target);
      } catch (err) {
        toast.error(getErrorMessage(err, '지난 학기를 불러오지 못했어요.'));
      } finally {
        setLoadingMore(false);
      }
    },
    [semesters, visibleCount, photosBySemester, fetchSemester]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !meta || loadingMore || visibleCount >= semesters.length) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) revealUpTo(visibleCount + 1);
      },
      { rootMargin: '400px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [meta, loadingMore, visibleCount, semesters.length, revealUpTo]);

  const jump = async (label) => {
    const idx = semesters.indexOf(label);
    if (idx < 0) return;
    setActiveSemester(label);
    if (idx >= visibleCount) await revealUpTo(idx + 1);
    setPendingJump(label);
  };
  useEffect(() => {
    if (!pendingJump) return;
    if (semesters.indexOf(pendingJump) >= visibleCount) return;
    scrollToSemester(pendingJump);
    setPendingJump(null);
  }, [pendingJump, visibleCount, semesters]);

  const refresh = (label) => fetchSemester(label ?? meta?.currentSemester).catch(() => {});

  const confirmDelete = async () => {
    const photo = deleting;
    setDeleting(null);
    try {
      await deleteGalleryPhoto(photo.photoId);
      toast.success(photo.isMine ? '지웠어요.' : '숨겼어요. 활동 사진 관리에서 복원할 수 있어요.');
      refresh(photo.semesterLabel);
    } catch (err) {
      toast.error(getErrorMessage(err, '지우지 못했어요.'));
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-8 bg-white px-4 py-4 sm:px-6 sm:py-7 md:gap-[40px] md:p-10">
      <header className="flex flex-col gap-[8px] border-b-[1.5px] border-[#DEDEDE] pb-6 md:gap-[12px] md:pb-[40px]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-semibold text-[20px] leading-[1.5] tracking-[-0.02em] text-[#212121] md:text-[24px]">활동 사진</h2>
          <div className="flex flex-wrap items-center gap-2">
            <SemesterJump semesters={semesters} value={activeSemester} currentSemester={meta?.currentSemester} onJump={jump} />
            {isLoggedIn && meta && (
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className="h-[34px] shrink-0 rounded-[6px] bg-[#212121] px-3 text-[13px] text-white transition-colors hover:bg-black"
              >
                + 사진 올리기
              </button>
            )}
            <AdminPageLink href={ROUTES.ADMIN_GALLERY} label="사진 관리" />
          </div>
        </div>
        <p className="text-[14px] leading-[1.6] tracking-[-0.02em] text-[#919191] md:text-[16px]">
          우리가 함께한 모든 순간들{isLoggedIn ? ' — 로그인한 회원은 누구나 사진을 올릴 수 있어요' : ''}
        </p>
      </header>

      {!meta && !error && <AppLoading />}
      {error && <p className="py-10 text-center text-[14px] text-[#919191]">{error}</p>}

      {meta &&
        visibleSemesters.map((label) => {
          const photos = photosBySemester[label] ?? [];
          const isCurrent = label === meta.currentSemester;
          const mobileRows = buildRows(photos, ROW_TARGETS_MOBILE);
          const desktopRows = buildRows(photos, ROW_TARGETS_DESKTOP);
          return (
            <section key={label} id={semesterAnchorId(label)} className="flex scroll-mt-[72px] flex-col gap-3">
              <h3 className="flex items-baseline gap-2 text-[16px] font-semibold tracking-[-0.02em] text-[#212121] md:text-[18px]">
                {label}
                {isCurrent && <span className="rounded-full bg-[#212121] px-2 py-[1px] text-[10px] font-medium text-white">이번 학기</span>}
                <span className="text-[12px] font-normal text-[#919191]">{photos.length}장</span>
              </h3>
              {photos.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-[#a3a09a]">
                  {isCurrent ? '아직 올라온 사진이 없어요. 첫 사진을 올려 주세요.' : '이 학기에는 사진이 없어요.'}
                </p>
              ) : (
                <>
                  <div className="flex w-full flex-col gap-1 md:hidden">
                    <GalleryRows rows={mobileRows} activeSrc={activeSrc} onActivate={setActiveSrc} allPhotos={allPhotos} onDelete={setDeleting} />
                  </div>
                  <div className="hidden w-full flex-col gap-1 md:flex">
                    <GalleryRows rows={desktopRows} activeSrc={activeSrc} onActivate={setActiveSrc} allPhotos={allPhotos} onDelete={setDeleting} />
                  </div>
                </>
              )}
            </section>
          );
        })}

      <div ref={sentinelRef} className="h-px" aria-hidden />
      {meta && visibleCount < semesters.length ? (
        <p className="text-center text-[12px] text-[#b9b9b9]">{loadingMore ? '지난 학기를 불러오는 중...' : '아래로 내리면 지난 학기 사진이 더 나와요'}</p>
      ) : (
        meta && semesters.length > 1 && <p className="text-center text-[12px] text-[#b9b9b9]">마지막 학기까지 다 봤어요</p>
      )}

      <GalleryUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        maxFiles={meta?.maxFilesPerUpload ?? 10}
        onUploaded={() => {
          refresh(meta?.currentSemester);
          if (meta?.currentSemester) jump(meta.currentSemester);
        }}
      />
      <ConfirmModal
        open={Boolean(deleting)}
        title={deleting?.isMine ? '내가 올린 사진을 지울까요?' : '이 사진을 숨길까요? (활동 사진 관리에서 복원할 수 있어요)'}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};

export default Gallery;
