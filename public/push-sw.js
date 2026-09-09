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
    caches.open(OFFLINE_CACHE).then((cache) => cache.addAll([OFFLINE_URL, '/icons/icon-192.png', '/icons/badge-96.png']))
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

      // 앱을 보고 있어도 OS 알림을 띄운다 — 예전에는 인앱 토스트로만 알려서, 다른 화면을 보고 있으면
      // 알림이 왔는지도 몰랐고 토스트가 사라지면 확인할 방법이 없었다.
      // 열려 있는 창에는 배지·알림함을 갱신하라고만 알린다(토스트는 띄우지 않는다 — OS 알림과 중복).
      if (focused) {
        focused.postMessage({ type: 'push-received', ...data });
      }

      // 받은 푸시는 반드시 알림으로 표시 (userVisibleOnly 계약)
      await self.registration.showNotification(data.title || '필사그래피', {
        body: data.body || '',
        // icon 은 알림 본문 옆 큰 아이콘, badge 는 안드로이드 상태바의 작은 단색 아이콘(알파만 쓰고 색은 시스템이 입힌다).
        // badge 가 없으면 크롬 기본 아이콘이 상태바에 뜬다.
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-96.png',
        data,
      });
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  // 상대 경로를 절대 URL 로 — TWA(안드로이드 앱)로 넘어갈 때는 절대 URL 이어야 앱이 그 화면을 연다
  const url = new URL(resolveNotificationUrl(data), self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

      // 이미 열린 창이 있으면 그 창을 게시글로 이동시킨다.
      // focus() 와 navigate() 는 환경(특히 TWA)에 따라 각각 거부될 수 있어 따로 감싼다 —
      // 예전엔 focus() 가 던지면 navigate 까지 못 가서 앱은 뜨는데 첫 화면에 머물렀다.
      for (const client of windows) {
        try {
          if ('navigate' in client) {
            const moved = await client.navigate(url);
            if (moved) {
              try {
                await moved.focus();
              } catch {
                // 포커스 실패는 무시 — 이동은 이미 됐다
              }
              return;
            }
          }
        } catch {
          // 이 창으로는 이동 불가 → 다음 창 또는 새 창
        }
      }
      await self.clients.openWindow(url);
    })()
  );
});

// 크롬은 푸시 구독을 주기적으로 갱신한다(만료·키 회전). 이 이벤트를 처리하지 않으면
// 브라우저 구독은 조용히 새 endpoint 로 바뀌고, 서버는 옛 endpoint 로 보내다 410 을 받아 그 행을 지운다.
// 그러면 앱에서는 "이 기기에서 알림 받기"가 꺼진 것처럼 보인다 (실제 사고: deviceId 4·5·6 연속 정리).
// 여기서는 같은 VAPID 키로 다시 구독만 해 둔다 — 서버 등록은 인증이 필요해 서비스 워커가 못 하므로,
// 앱을 다음에 열 때 lib/push.js 의 getPushToggleState 가 새 endpoint 를 서버에 등록한다.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const key = event.oldSubscription?.options?.applicationServerKey;
      if (!key) return;
      try {
        await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      } catch {
        // 재구독 실패 시에는 사용자가 토글을 다시 켜야 한다
      }
    })()
  );
});
