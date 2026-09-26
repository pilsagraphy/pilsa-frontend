'use client';

import { useEffect } from 'react';
import useAuthStore from '@/stores/useAuthStore';
import { recordAppLaunch } from '@/apis/appLaunch';

// 설치형 앱(TWA)으로 열린 세션인지 알아내 로그인 뒤 하루 한 번 서버에 알린다 — 운영 관리 > 모니터링 '앱 접속 점검'.
//
// 앱인지 판단하는 근거 (하나라도 맞으면 앱):
//   1. 시작 URL 의 ?launch=app — TWA 는 켤 때마다 이 주소로 시작한다 (twa-manifest startUrl)
//   2. document.referrer 가 android-app://kr.co.pilsa.pilsagraphy — TWA 가 첫 요청에 붙이는 출처
//   3. display-mode: standalone — 홈 화면에 설치한 창(안드로이드·아이폰 PWA)
// 게이트(/)에서 첫 마운트되고 곧 /about/intro 로 이동해 query 가 사라지므로, 판단 결과를 sessionStorage 에 남겨 둔다.
// 세션 안에서 로그인이 확인되면(자동 로그인 포함) 그날 처음 한 번만 보낸다 (localStorage 에 보낸 날짜).
// 브라우저 탭으로 들어온 경우는 아무것도 하지 않는다 — 브라우저 접속은 앱 접속으로 세지 않는다.

const SESSION_KEY = 'pilsa:appSession';
const SENT_KEY = 'pilsa:appLaunchSent';
const ANDROID_APP_REFERRER = 'android-app://kr.co.pilsa.pilsagraphy';

const todayKey = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const detectAppSession = () => {
  try {
    if (sessionStorage.getItem(SESSION_KEY) === '1') return true;
    const byQuery = new URLSearchParams(window.location.search).get('launch') === 'app';
    const byReferrer = (document.referrer || '').startsWith(ANDROID_APP_REFERRER);
    const byDisplay =
      window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const isApp = byQuery || byReferrer || byDisplay;
    if (isApp) sessionStorage.setItem(SESSION_KEY, '1');
    return isApp;
  } catch {
    return false;
  }
};

export default function AppLaunchBeacon() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  // 첫 마운트에서 판단해 세션에 남긴다 (게이트에서 query 가 있는 동안)
  useEffect(() => {
    detectAppSession();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (!detectAppSession()) return;
    const today = todayKey();
    try {
      if (localStorage.getItem(SENT_KEY) === today) return;
    } catch {
      // 저장소를 못 쓰면 매번 보내도 서버가 하루 1행으로 접는다
    }
    recordAppLaunch()
      .then(() => {
        try {
          localStorage.setItem(SENT_KEY, today);
        } catch {
          // 무시
        }
      })
      .catch(() => {
        // 통계 신호라 실패해도 화면에 알리지 않는다. 다음 마운트 때 다시 시도
      });
  }, [isLoggedIn]);

  return null;
}
