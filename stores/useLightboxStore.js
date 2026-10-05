import { create } from 'zustand';

// 사이트 공용 '크게 보기'(라이트박스).
//
// 일정 달력의 이미지, 활동 사진, 게시글 본문 이미지 — 어디서든 아래 함수 하나로 띄우고 LightboxHost(app/layout)가 그린다.
//
//   openLightbox([{ src, alt, caption?, hashtags? }, ...], 시작 인덱스)
//
// 여러 장이면 좌우 화살표·스와이프로 넘긴다. src 는 그대로 <img> 에 들어가므로 blob 주소도 된다.
// caption/hashtags 는 있을 때만 사진 아래 설명 띠로 그려진다 (활동 사진 — 확대 화면에서도 설명이 보여야 한다는 테스터 제보, 2026-10-05).
const useLightboxStore = create((set) => ({
  lightbox: null, // { images: [{ src, alt, caption, hashtags }], index }

  open: (images, index = 0) => {
    const list = (images ?? [])
      .filter((image) => image?.src)
      .map((image) => ({
        src: image.src,
        alt: image.alt ?? '',
        caption: image.caption ?? '',
        hashtags: image.hashtags ?? [],
      }));
    if (!list.length) return;
    set({ lightbox: { images: list, index: Math.min(Math.max(0, index), list.length - 1) } });
  },
  setIndex: (index) =>
    set((state) =>
      state.lightbox
        ? { lightbox: { ...state.lightbox, index: (index + state.lightbox.images.length) % state.lightbox.images.length } }
        : state
    ),
  close: () => set({ lightbox: null }),
}));

export const openLightbox = (images, index = 0) => useLightboxStore.getState().open(images, index);

export default useLightboxStore;
