import { confirmDialog } from '@/stores/useDialogStore';

// 비밀번호 없는 소셜 가입 회원은 간편로그인 연결을 하나라도 끊으려면 먼저 비밀번호를 만들어야 한다 (PM 2026-10-16 —
// "다른 연동을 하라고 하는 게 아니라 무조건 비밀번호"). 서버도 같은 조건을 409 로 막는다.
// 막아야 하면 안내 팝업을 띄우고 [비밀번호 만들기]를 누르면 onCreatePassword 를 부른다. 해제를 진행해도 되면 true
export async function requirePasswordBeforeUnlink(socialOnly, label, onCreatePassword) {
  if (!socialOnly) return true;
  const go = await confirmDialog(`비밀번호를 먼저 만들어 주세요\n비밀번호 없이 간편로그인으로 가입한 계정이라, ${label} 연결을 해제하려면 비밀번호가 있어야 해요.`, {
    confirmText: '비밀번호 만들기',
    cancelText: '닫기',
  });
  if (go) onCreatePassword?.();
  return false;
}
