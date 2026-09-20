import { create } from 'zustand';

// 사이트 공용 확인·안내 창.
//
// 브라우저의 window.confirm / alert 대신 쓴다 — 그 창들은 사이트 모양과 동떨어지고, 설치형 앱(TWA)에서는
// 시스템 창처럼 떠서 앱이 멈춘 듯 보였다. 어디서든 아래 두 함수만 부르면 DialogHost(app/layout)가 그린다.
//
//   const ok = await confirmDialog('삭제할까요?');            // true / false
//   await alertDialog('저장했습니다.', '목록에서 확인하세요');  // 닫힐 때 resolve
//
// 한 번에 하나만 뜬다. 뜬 채로 또 부르면 앞의 것을 취소(false)로 닫고 새것을 띄운다.
const useDialogStore = create((set, get) => ({
  dialog: null, // { type: 'confirm' | 'alert', title, description, confirmText, cancelText, resolve }

  open: (dialog) => {
    const current = get().dialog;
    if (current) current.resolve?.(current.type === 'confirm' ? false : undefined);
    set({ dialog });
  },
  close: () => set({ dialog: null }),
}));

export const confirmDialog = (title, options = {}) =>
  new Promise((resolve) => {
    useDialogStore.getState().open({ type: 'confirm', title, ...options, resolve });
  });

export const alertDialog = (title, description) =>
  new Promise((resolve) => {
    useDialogStore.getState().open({ type: 'alert', title, description, resolve });
  });

export default useDialogStore;
