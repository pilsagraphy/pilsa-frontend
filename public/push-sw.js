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

// ─────────────────────── 오프라인 폴백 ───────────────────────
// fetch 핸들러가 있어야 브라우저가 이 사이트를 "설치 가능"으로 판정한다 (PWA·TWA 요건).
// 캐싱은 최소한으로만 한다 — 페이지 이동 요청만 네트워크 우선, 실패하면 오프라인 안내를 보여준다.
// API 응답은 절대 가로채지 않는다: 토큰 재발급·알림 등이 캐시된 응답을 받으면 인증 상태가 꼬인다.
const OFFLINE_CACHE = 'pilsa-offline-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) => cache.addAll([OFFLINE_URL, '/icons/icon-192.png']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 옛 버전 캐시 정리 (OFFLINE_CACHE 이름을 올리면 자동으로 갈린다)
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== OFFLINE_CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  // 페이지 이동(navigate)만 다룬다. 그 외(API·스크립트·이미지)는 그대로 네트워크로 흘려보낸다.
  if (event.request.mode !== 'navigate') return;

  event.respondWith(
    (async () => {
      try {
        return await fetch(event.request);
      } catch {
        const cache = await caches.open(OFFLINE_CACHE);
        return (await cache.match(OFFLINE_URL)) ?? Response.error();
      }
    })()
  );
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
