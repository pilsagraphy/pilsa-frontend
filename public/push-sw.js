/* eslint-disable no-restricted-globals */
// 알림(푸시) 전용 서비스 워커 — 수신·클릭 처리
//
// 서버 페이로드: { title, body, toastId, targetType, targetId, boardId }
// - 앱을 보고 있는 창이 있으면 → postMessage 로 넘겨 앱 안에서 토스트로 띄운다
// - 없으면 → OS 알림으로 띄운다

// 백엔드 경로(/api/user/boards/{boardId}/posts/{postId})를 미러링한다.
// lib/notificationRoute.js 와 같은 규칙 — 서비스 워커는 앱 모듈을 import할 수 없어 여기 둔다.
function resolveNotificationUrl(data) {
  let url = '/students';
  if (data && data.targetType === 'post' && data.targetId != null && data.boardId != null) {
    url =
      '/students/boards/' +
      encodeURIComponent(data.boardId) +
      '/posts/' +
      encodeURIComponent(data.targetId);
  }
  if (data && data.toastId != null) {
    url += (url.includes('?') ? '&' : '?') + 'toastId=' + encodeURIComponent(data.toastId);
  }
  return url;
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: '필사그래피', body: event.data ? event.data.text() : '' };
  }

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const focused = windows.find((w) => w.focused);

      if (focused) {
        // 앱 보는 중 → 인앱 토스트 (NotificationBell.jsx 의 message 리스너가 수신)
        focused.postMessage({ type: 'toast', ...data });
        return;
      }

      // 받은 푸시는 반드시 알림으로 표시 (userVisibleOnly 계약)
      await self.registration.showNotification(data.title || '필사그래피', {
        body: data.body || '',
        icon: '/images/brandCI/logo.png',
        data,
      });
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const url = resolveNotificationUrl(data);

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      // 이미 열린 창이 있으면 그 창을 포커스하고 이동
      for (const client of windows) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            await client.navigate(url);
          }
          return;
        }
      }
      await self.clients.openWindow(url);
    })()
  );
});
