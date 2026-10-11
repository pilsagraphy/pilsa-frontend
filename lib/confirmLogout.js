import { ROUTES } from '@/constants/routes';
import { confirmDialog } from '@/stores/useDialogStore';

// 로그아웃 버튼 공용 — 한 번 묻고, 확인하면 로그아웃 경로(/login?logout=1)로 보낸다 (PM 2026-10-12 "로그아웃 하시겠습니까? 팝업").
// 실제 정리(알림 기기 해제·세션 삭제)는 그 경로의 LoginSection 이 한다. 확인했으면 true
export async function confirmLogout(router) {
  const ok = await confirmDialog('로그아웃 하시겠습니까?', { confirmText: '로그아웃', cancelText: '취소' });
  if (ok) router.push(`${ROUTES.LOGIN}?logout=1`);
  return ok;
}
