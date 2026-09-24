import { create } from 'zustand';

// 사이트 공용 '크게 보기'(라이트박스).
//
// 일정 달력의 이미지, 활동 사진, 게시글 본문 이미지 — 어디서든 아래 함수 하나로 띄우고 LightboxHost(app/layout)가 그린다.
//
//   openLightbox([{ src, alt }, ...], 시작 인덱스)
//
// 여러 장이면 좌우 화살표·스와이프로 넘긴다. src 는 그대로 <img> 에 들어가므로 blob 주소도 된다.
const useLightboxStore = create((set) => ({
  lightbox: null, // { images: [{ src, alt }], index }

  open: (images, index = 0) => {
    const list = (images ?? []).filter((image) => image?.src);
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
