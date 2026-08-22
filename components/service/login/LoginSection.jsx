'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check } from 'lucide-react';
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

// 아이디 저장(로컬 스토리지) 키 — 아이디만 채워둘 뿐 세션과는 무관
const SAVED_LOGIN_ID_KEY = 'savedLoginId';

// 로그아웃 안내 토스트 — 로그인 시 닫아야 해서 id 를 고정한다
const LOGOUT_TOAST_ID = 'logout-done';

// 시안의 체크박스 — 아이디 저장 / 자동 로그인이 같은 모양을 공유한다
function LoginCheckbox({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5 select-none">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden
        className="grid size-6 place-content-center rounded-[2px] border border-[#919191] bg-white text-white transition-colors peer-checked:border-[#212121] peer-checked:bg-[#212121] peer-focus-visible:ring-2 peer-focus-visible:ring-[#212121]/40"
      >
        {checked && <Check className="size-4" strokeWidth={3} />}
      </span>
      <span className="text-[14px] font-bold tracking-[-0.28px] text-black">{label}</span>
    </label>
  );
}

export default function LoginSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  // 아이디 저장(입력값 프리필)과 자동 로그인(세션 복원)은 서로 독립된 옵션이다
  const [rememberId, setRememberId] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  // 제재 계정 안내: { banType: 'temporary'|'permanent', bannedUntil }
  const [banInfo, setBanInfo] = useState(null);
  // 로그아웃 처리(알림 기기 해제 → 로그아웃 API)가 끝날 때까지 재로그인을 막는다.
  // 처리 중에 로그인이 성공하면 뒤늦게 도착한 로그아웃이 방금 받은 세션을 지운다.
  const [loggingOut, setLoggingOut] = useState(false);
  const { login, logout } = useAuthStore();
  const logoutHandled = useRef(false);

  // 아이디 저장: 마운트 시 저장된 아이디가 있으면 자동 입력 + 체크박스 활성화
  useEffect(() => {
    try {
      const savedLoginId = localStorage.getItem(SAVED_LOGIN_ID_KEY);
      if (savedLoginId) {
        setLoginId(savedLoginId);
        setRememberId(true);
      }
    } catch {
      // localStorage 접근 불가 환경(시크릿 모드 등) — 프리필만 건너뛴다
    }
  }, []);

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
          duration: Infinity,
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

      // 아이디 저장: 체크 시 저장, 해제 시 삭제
      try {
        if (rememberId) {
          localStorage.setItem(SAVED_LOGIN_ID_KEY, loginId);
        } else {
          localStorage.removeItem(SAVED_LOGIN_ID_KEY);
        }
      } catch {
        // localStorage 접근 불가 환경에서도 로그인 자체는 성공 처리
      }

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

      const message = data?.message ?? (typeof data === 'string' ? data : null) ?? err.message;
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
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {/* 제목 + (아이디 저장·자동 로그인 / 아이디 찾기·이메일 찾기·비밀번호 재설정) */}
          <div className="flex flex-col gap-3">
            <h2 className="text-[24px] font-semibold tracking-[-0.48px] text-black">로그인</h2>

            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              {/* 아이디 저장 / 자동 로그인 */}
              <div className="flex items-center gap-4">
                <LoginCheckbox label="아이디 저장" checked={rememberId} onChange={setRememberId} />
                <LoginCheckbox label="자동 로그인" checked={autoLogin} onChange={setAutoLogin} />
              </div>

              {/* 아이디 찾기 / 이메일 찾기 / 비밀번호 재설정 */}
              <div className="flex items-center gap-1.5 text-[14px] font-bold tracking-[-0.28px] text-black whitespace-nowrap">
                <button
                  type="button"
                  className="transition-colors hover:underline"
                  onClick={() => router.push(ROUTES.FIND_ID)}
                >
                  아이디 찾기
                </button>
                <span className="h-[9px] w-px bg-[#e5e5e5]" aria-hidden />
                <button
                  type="button"
                  className="transition-colors hover:underline"
                  onClick={() => router.push(ROUTES.FIND_EMAIL)}
                >
                  이메일 찾기
                </button>
                <span className="h-[9px] w-px bg-[#e5e5e5]" aria-hidden />
                <button
                  type="button"
                  className="transition-colors hover:underline"
                  onClick={() => router.push(ROUTES.FIND_PW)}
                >
                  비밀번호 재설정
                </button>
              </div>
            </div>
          </div>

          {/* 입력 필드 */}
          <div className="flex flex-col gap-3">
            <Input
              required
              className="h-[52px] rounded-[4px] border-[#dedede] text-[16px] placeholder:text-[#9e9e9e]"
              placeholder="아이디를 입력하세요."
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
            />
            <Input
              required
              type="password"
              className="h-[52px] rounded-[4px] border-[#dedede] text-[16px] placeholder:text-[#9e9e9e]"
              placeholder="비밀번호를 입력하세요."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* 버튼 */}
          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              disabled={loggingOut}
              className="h-[52px] w-full rounded-[4px] bg-[#212121] text-[16px] text-white hover:bg-[#212121]/90 disabled:opacity-60"
            >
              {loggingOut ? '로그아웃 처리 중...' : '로그인'}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-[52px] w-full rounded-[4px] border-[#b9b9b9] text-[16px] text-[#212121]"
              onClick={() => router.push(ROUTES.SIGNUP)}
            >
              회원가입
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
