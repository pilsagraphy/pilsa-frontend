// notificationRoute.js
// 알림을 눌렀을 때 이동할 앱 내 경로를 만든다

const FALLBACK_ROUTE = '/students';

// { targetType, targetId, boardId, toastId? } → 이동할 경로
export function resolveNotificationUrl({ targetType, targetId, boardId, toastId } = {}) {
  let url = FALLBACK_ROUTE;

  if (targetType === 'post' && targetId != null && boardId != null) {
    url = `/students/boards/${encodeURIComponent(boardId)}/posts/${encodeURIComponent(targetId)}`;
  }

  // ?toastId= 가 붙어 있으면 페이지 진입 후 읽음 API를 호출해 뱃지를 줄인다
  if (toastId != null) {
    url += `${url.includes('?') ? '&' : '?'}toastId=${encodeURIComponent(toastId)}`;
  }

  return url;
}
