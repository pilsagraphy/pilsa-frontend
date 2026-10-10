'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { GALLERY_PHOTOS, GALLERY_SECTIONS } from '@/constants/gallery';
import SemesterJump, { scrollToSemester, semesterAnchorId } from '@/components/shared/SemesterJump';
import GalleryTile from './GalleryTile';

// 활동 사진 — 학기별로 묶어 한 페이지에 이어 붙인다 (PM 2026-10-10 밤). 탭이 아니라 아래로 내리면 지난 학기가 더 나오고,
// 위 드롭다운에서 학기를 고르면 그 구간으로 스크롤한다. 사진 목록은 constants/gallery.js 의 구역(semester·title·photos).
//
// 사진을 줄로 묶어, 각 줄이 화면 폭을 정확히 채우게 한다 (정렬 격자 / justified rows).
// 칸 수를 고정한 격자는 사진마다 차지하는 칸이 달라 줄 끝에 빈 칸이 남는다 — 오른쪽 선이 들쭉날쭉해졌다.
// 여기서는 반대로, 한 줄에 들어갈 사진을 비율의 합으로 정하고 각 사진이 제 비율만큼 폭을 나눠 갖는다.
// flex-grow 가 남는 폭을 비율대로 배분하므로 **줄은 언제나 좌우 끝까지 꽉 찬다.**
// 줄마다 장수가 비슷하면 밋밋해서 줄 목표치를 번갈아 준다 — 좁은 줄(사진이 적고 커진다)과 넓은 줄이 번갈아 오며 리듬이 생긴다.
const ROW_TARGETS_MOBILE = [1.5, 2.6, 2.0, 3.2];
const ROW_TARGETS_DESKTOP = [2.6, 4.8, 3.6, 5.6];

// 한 줄이 이보다 높아지면(폭 대비) 사진이 화면을 다 먹는다. 마지막 줄이 혼자 커지는 것도 이걸로 막는다.
const MIN_ROW_ASPECT = 1.35;

// 처음에 펼쳐 두는 학기 수. 그 아래는 스크롤이 닿을 때 하나씩 더 편다
const INITIAL_SEMESTERS = 1;

// 사진을 줄로 나눈다. 목표치를 순서대로 돌려 쓰되, 남은 사진이 적으면 마지막 줄에 몰아 담는다.
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

  // 남은 사진은 마지막 줄에 붙인다. 혼자 한 줄로 두면 그 사진만 거대해진다.
  if (current.length) {
    const last = rows[rows.length - 1];
    const leftoverRatio = current.reduce((acc, photo) => acc + photo.ratio, 0);
    if (last && leftoverRatio < MIN_ROW_ASPECT) last.push(...current);
    else rows.push(current);
  }

  return rows;
}

const indexOfPhoto = (photo) => GALLERY_PHOTOS.findIndex((p) => p.imageSrc === photo.imageSrc);

function GalleryRows({ rows, activeSrc, onActivate }) {
  return rows.map((row, rowIndex) => {
    // 줄 전체의 가로:세로. 폭은 100% 이므로 높이가 여기서 정해진다.
    // 너무 낮으면(=사진이 크면) 상한을 씌운다 — 그래도 폭은 비율대로 나뉘어 좌우는 꽉 찬다.
    const aspect = Math.max(
      MIN_ROW_ASPECT,
      row.reduce((sum, photo) => sum + photo.ratio, 0)
    );

    return (
      <div key={rowIndex} className="flex w-full gap-1" style={{ aspectRatio: String(aspect) }}>
        {row.map((photo) => (
          <div
            key={photo.imageSrc}
            className="relative min-w-0"
            // 제 비율만큼 폭을 나눠 갖는다 (basis 0 이라 폭은 전적으로 비율이 정한다)
            style={{ flex: `${photo.ratio} 1 0%` }}
          >
            <GalleryTile photo={photo} activeSrc={activeSrc} onActivate={onActivate} gallery={GALLERY_PHOTOS} index={indexOfPhoto(photo)} />
          </div>
        ))}
      </div>
    );
  });
}

// 학기 → 그 학기의 사진(구역 순서대로). 학기는 라벨 내림차순(최근 먼저)
function groupBySemester() {
  const map = new Map();
  GALLERY_SECTIONS.forEach((section) => {
    if (!map.has(section.semester)) map.set(section.semester, []);
    map.get(section.semester).push(...section.photos.map((p) => ({ ...p, sectionTitle: section.title })));
  });
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([semester, photos]) => ({ semester, photos }));
}

const Gallery = () => {
  // 모바일 탭 캡션: 한 번에 한 타일만 활성 (새 이미지 탭 시 이전 것 풀림)
  const [activeSrc, setActiveSrc] = useState(null);
  const groups = useMemo(groupBySemester, []);
  const semesters = groups.map((g) => g.semester);
  const [visibleCount, setVisibleCount] = useState(Math.min(INITIAL_SEMESTERS, groups.length));
  const [pendingJump, setPendingJump] = useState(null);
  const sentinelRef = useRef(null);

  // 바닥 감시 — 닿으면 다음 학기를 편다
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || visibleCount >= groups.length) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setVisibleCount((n) => Math.min(n + 1, groups.length));
      },
      { rootMargin: '400px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visibleCount, groups.length]);

  // 드롭다운 — 아직 안 편 학기면 거기까지 편 뒤에 스크롤한다
  const jump = (label) => {
    const idx = semesters.indexOf(label);
    if (idx < 0) return;
    if (idx >= visibleCount) setVisibleCount(idx + 1);
    setPendingJump(label);
  };
  useEffect(() => {
    if (!pendingJump) return;
    if (semesters.indexOf(pendingJump) >= visibleCount) return;
    scrollToSemester(pendingJump);
    setPendingJump(null);
  }, [pendingJump, visibleCount, semesters]);

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-8 bg-white px-4 py-4 sm:px-6 sm:py-7 md:gap-[40px] md:p-10">
      <header className="flex flex-col gap-[8px] border-b-[1.5px] border-[#DEDEDE] pb-6 md:gap-[12px] md:pb-[40px]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-semibold text-[20px] leading-[1.5] tracking-[-0.02em] text-[#212121] md:text-[24px]">활동 사진</h2>
          <SemesterJump semesters={semesters} onJump={jump} />
        </div>
        <p className="text-[14px] leading-[1.6] tracking-[-0.02em] text-[#919191] md:text-[16px]">우리가 함께한 모든 순간들</p>
      </header>

      {groups.slice(0, visibleCount).map(({ semester, photos }) => {
        // 줄 묶음은 화면 폭에 따라 달라야 한다(폰에서 4장이 한 줄에 들어가면 손톱만 해진다).
        // 두 벌을 미리 만들어 두고 CSS 로 하나만 보여 준다 — 화면 폭을 JS 로 재면 첫 그림이 한 번 튄다.
        const mobileRows = buildRows(photos, ROW_TARGETS_MOBILE);
        const desktopRows = buildRows(photos, ROW_TARGETS_DESKTOP);
        return (
          <section key={semester} id={semesterAnchorId(semester)} className="flex scroll-mt-[72px] flex-col gap-3">
            <h3 className="flex items-baseline gap-2 text-[16px] font-semibold tracking-[-0.02em] text-[#212121] md:text-[18px]">
              {semester}
              <span className="text-[12px] font-normal text-[#919191]">{photos.length}장</span>
            </h3>
            <div className="flex w-full flex-col gap-1 md:hidden">
              <GalleryRows rows={mobileRows} activeSrc={activeSrc} onActivate={setActiveSrc} />
            </div>
            <div className="hidden w-full flex-col gap-1 md:flex">
              <GalleryRows rows={desktopRows} activeSrc={activeSrc} onActivate={setActiveSrc} />
            </div>
          </section>
        );
      })}

      {/* 바닥 — 더 펼 학기가 있으면 스크롤이 닿을 때 편다 */}
      <div ref={sentinelRef} className="h-px" aria-hidden />
      {visibleCount < groups.length ? (
        <p className="text-center text-[12px] text-[#b9b9b9]">아래로 내리면 지난 학기 사진이 더 나와요</p>
      ) : (
        groups.length > 1 && <p className="text-center text-[12px] text-[#b9b9b9]">마지막 학기까지 다 봤어요</p>
      )}
    </div>
  );
};

export default Gallery;
