'use client';

import { useEffect } from 'react';
import { toast } from '@/lib/toast';

// 계정 연결·캘린더 연동 콜백이 붙여 보내는 쿼리 → 사용자에게 보여줄 안내.
// 백엔드가 처리 후 시작한 화면(returnTo — 마이페이지 또는 설정 페이지)으로 ?google=... | ?calendar=... 를 붙여 302 로 돌려보낸다.
// 설정 페이지(/mypage/settings)에서 시작한 연동이 마이페이지까지 튕겨 나가던 것을 고치면서 두 화면이 같이 쓰게 뺐다 (PM 2026-10-13).
const OAUTH_RESULT_MESSAGES = {
  google: {
    linked: { type: 'success', text: '구글 계정을 연결했어요' },
    // 고른 구글 계정이 이미 다른 회원에게 붙어 있는 경우 — 재시도해도 같은 결과라 안내가 달라야 한다
    already_linked: { type: 'error', text: '이미 다른 회원이 사용 중인 구글 계정이에요' },
    failed: { type: 'error', text: '구글 계정 연결에 실패했어요. 다시 시도해주세요.' },
    cancelled: { type: 'info', text: '구글 계정 연결을 취소했어요' },
  },
  // 네이버·카카오 계정 연결 (2026-10-11) — ?naver=... | ?kakao=...
  naver: {
    linked: { type: 'success', text: '네이버 계정을 연결했어요' },
    already_linked: { type: 'error', text: '이미 다른 회원이 사용 중인 네이버 계정이에요' },
    failed: { type: 'error', text: '네이버 계정 연결에 실패했어요. 다시 시도해주세요.' },
    cancelled: { type: 'info', text: '네이버 계정 연결을 취소했어요' },
  },
  kakao: {
    linked: { type: 'success', text: '카카오 계정을 연결했어요' },
    already_linked: { type: 'error', text: '이미 다른 회원이 사용 중인 카카오 계정이에요' },
    failed: { type: 'error', text: '카카오 계정 연결에 실패했어요. 다시 시도해주세요.' },
    cancelled: { type: 'info', text: '카카오 계정 연결을 취소했어요' },
  },
  calendar: {
    linked: {
      type: 'success',
      text: '구글 캘린더를 연동했어요. 다가오는 일정을 채우는 중이에요 (최대 10분 정도 걸릴 수 있어요)',
    },
    failed: { type: 'error', text: '구글 캘린더 연동에 실패했어요. 다시 시도해주세요.' },
    cancelled: { type: 'info', text: '구글 캘린더 연동을 취소했어요' },
  },
  // 네이버 캘린더 (2026-10-12) — 추가만 되는 서비스
  ncalendar: {
    linked: { type: 'success', text: '네이버 캘린더에 앞으로의 동아리 일정을 넣는 중이에요. 새 일정이 생기면 그때그때 넣어 드려요' },
    failed: { type: 'error', text: '네이버 캘린더 연동에 실패했어요. 다시 시도해주세요.' },
    cancelled: { type: 'info', text: '네이버 캘린더 연동을 취소했어요' },
  },
  // 카카오 톡캘린더 (2026-10-12) — 구글처럼 등록·수정·삭제 반영
  kcalendar: {
    linked: { type: 'success', text: '톡캘린더를 연동했어요. 다가오는 일정을 채우는 중이에요 (최대 10분 정도 걸릴 수 있어요)' },
    failed: { type: 'error', text: '톡캘린더 연동에 실패했어요. 다시 시도해주세요.' },
    cancelled: { type: 'info', text: '톡캘린더 연동을 취소했어요' },
  },
};

/**
 * 마운트 직후 한 번, 콜백 결과 쿼리가 있으면 토스트를 띄우고 그 쿼리를 지운다.
 * useSearchParams 대신 window.location 을 쓴다 — 훅을 쓰면 페이지 전체가 Suspense 경계를 요구하게 된다.
 */
export default function useOAuthResultToast() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    for (const [key, results] of Object.entries(OAUTH_RESULT_MESSAGES)) {
      const message = results[params.get(key)];
      if (!message) continue;

      toast[message.type](message.text);

      // 새로고침할 때마다 같은 토스트가 뜨지 않도록 쿼리를 지운다
      params.delete(key);
      const query = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : ''));
      break;
    }
  }, []);
}
