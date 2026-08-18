'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import useAuthStore from '@/stores/useAuthStore';
import { ROUTES, BASE_PATH, SANCTION_POLICY_URL } from '@/constants/routes';
import { logout as logoutApi } from '@/apis/auth';
import { disablePushForLogout, restorePushAfterLogin } from '@/lib/push';
import { JUST_LOGGED_IN_KEY } from '@/components/service/notification/PushPromptBottomSheet';
import LoginBannedSection from './LoginBannedSection';
import LoginRestrictedSection from './LoginRestrictedSection';

// 로그아웃 안내 토스트 — 로그인 시 닫아야 해서 id 를 고정한다
const LOGOUT_TOAST_ID = 'logout-done';

export default function LoginSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [autoLogin, setAutoLogin] = useState(false);
  // 제재 계정 안내: { banType: 'temporary'|'permanent', bannedUntil }
  const [banInfo, setBanInfo] = useState(null);
  // 로그아웃 처리(알림 기기 해제 → 로그아웃 API)가 끝날 때까지 재로그인을 막는다.
  // 처리 중에 로그인이 성공하면 뒤늦게 도착한 로그아웃이 방금 받은 세션을 지운다.
  const [loggingOut, setLoggingOut] = useState(false);
  const { login, logout } = useAuthStore();
  const logoutHandled = useRef(false);

  // 로그아웃 플로우: /login?logout=1 접근 시 실행
  useEffect(() => {
    if (searchParams.get('logout') !== '1' || logoutHandled.current) return;
    logoutHandled.current = true;
    setLoggingOut(true);

    const runLogout = async () => {
      try {
        // 이 기기의 알림 수신을 서버에서 해제 — 로그아웃 API보다 먼저 (토큰 필요).
        // 브라우저 구독(unsubscribe)은 유지한다 → 재로그인 시 알림 설정 자동 복구 근거.
        await disablePushForLogout();
        await logoutApi();
      } catch {
        // API 실패해도 클라이언트 상태는 정리
      } finally {
        logout();
        setLoggingOut(false);
        toast.success('로그아웃되었습니다!', {
          id: LOGOUT_TOAST_ID,
          action: {
            label: '홈으로',
            onClick: () => router.push(BASE_PATH),
          },
        });
      }
    };

    runLogout();
  }, [searchParams, logout, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loggingOut) return;
    // 로그인 후 화면까지 따라다니지 않도록 로그아웃 안내를 닫는다
    toast.dismiss(LOGOUT_TOAST_ID);
    try {
      await login(loginId, password, autoLogin);

      // 웹앱(standalone) 첫 로그인 알림 유도 바텀시트 노출 신호
      try {
        sessionStorage.setItem(JUST_LOGGED_IN_KEY, '1');
      } catch {
        // ignore
      }

      // 이 기기에 살아있는 푸시 구독이 있으면 서버에 조용히 재등록 (로그인 흐름을 막지 않음)
      restorePushAfterLogin();

      router.push(ROUTES.STUDENTS_DASHBOARD);
    } catch (err) {
      const data = err.response?.data;

      // 정지/영구차단 계정: 403 + { message, banType, bannedUntil }
      // message는 쓰지 않는다 — 안내 문구는 시안대로 각 Section의 기본 prop을 사용
      if (err.response?.status === 403 && data?.banType) {
        setBanInfo({ banType: data.banType, bannedUntil: data.bannedUntil });
        return;
      }

      const message =
        data?.message ?? (typeof data === 'string' ? data : null) ?? err.message;
      toast.error(message);
    }
  };

  // 제재 계정 안내 화면 (시안: 로그인 제한 페이지)
  if (banInfo?.banType === 'permanent') {
    // 문의 경로 = 이용 제한 정책 문서 (이의 신청 절차 안내)
    return (
      <LoginBannedSection
        onContact={() => window.open(SANCTION_POLICY_URL, '_blank', 'noopener,noreferrer')}
      />
    );
  }
  if (banInfo?.banType === 'temporary') {
    return <LoginRestrictedSection unlockAt={banInfo.bannedUntil} />;
  }

  return (
    <section className="mx-auto w-full max-w-[616px]">
      <div className="rounded-[6px] bg-white p-6">
        <h2 className="text-[24px] font-semibold text-[#454545]">로그인</h2>

        {/* 2. onClick 대신 onSubmit 사용 */}
        <form onSubmit={handleLogin} className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            {/* 자동 로그인 (시안의 체크박스 위치 — 좌측) */}
            <label className="flex cursor-pointer select-none items-center gap-2 text-[14px] tracking-[-0.28px] text-[#c4c4c4] transition-colors hover:text-[#424242]">
              <Checkbox
                checked={autoLogin}
                onCheckedChange={(checked) => setAutoLogin(checked === true)}
                className="border-[#c4c4c4] data-[state=checked]:bg-[#212121] data-[state=checked]:border-[#212121]"
              />
              자동 로그인
            </label>

            <div className="flex items-center text-[14px] tracking-[-0.28px] whitespace-nowrap">
              <button
                type="button"
                className="text-[#c4c4c4] hover:text-[#424242] hover:underline transition-colors"
                onClick={() => router.push(ROUTES.FIND_ID)}
              >
                아이디
              </button>
              <span className="mx-1 text-[#c4c4c4]">/</span>
              <button
                type="button"
                className="text-[#c4c4c4] hover:text-[#424242] hover:underline transition-colors"
                onClick={() => router.push(ROUTES.FIND_PW)}
              >
                비밀번호
              </button>
              <span className="text-[#c4c4c4]">를 잊으셨나요?</span>
            </div>
          </div>

          <Input
            required
            className="h-[56px] rounded-[6px] border-[#c4c4c4] text-[18px]"
            placeholder="아이디를 입력하세요"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
          />
          <Input
            required
            type="password"
            className="h-[56px] rounded-[6px] border-[#c4c4c4] text-[18px]"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="pt-2 space-y-3">
            {/* 3. Button의 onClick은 제거 (onSubmit이 처리함) */}
            <Button
              type="submit"
              disabled={loggingOut}
              className="h-[64px] w-full rounded-[6px] bg-[#454545] text-[20px] font-semibold text-white hover:bg-[#454545]/90 disabled:opacity-60"
            >
              {loggingOut ? '로그아웃 처리 중...' : '로그인'}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-[64px] w-full rounded-[6px] border-[#454545] text-[20px] font-semibold text-[#454545]"
              onClick={() => router.push(ROUTES.SIGNUP)}
            >
              회원가입
            </Button>
          </div>

          {/* 간편로그인 예정 */}
          {/* <div className="pt-8">
            <p className="text-center text-[18px] text-[#919191]">간편로그인</p>
            <div className="mt-4 flex items-center justify-center">
              <button
                type="button"
                className="grid size-[54px] place-items-center rounded-full bg-[#F5DE00]"
              >
                <span className="text-[12px] font-semibold">K</span>
              </button>
            </div>
          </div> */}
        </form>
      </div>
    </section>
  );
}
