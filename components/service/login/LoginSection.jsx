'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import useAuthStore from '@/stores/useAuthStore';
import { ROUTES, BASE_PATH, SANCTION_POLICY_URL } from '@/constants/routes';
import { logout as logoutApi, refreshAccessToken, getErrorMessage } from '@/apis/auth';
import {
  getGoogleLoginUrl,
  completeGoogleLink,
  getGooglePendingLink,
  discardGooglePendingLink,
} from '@/apis/google';
import { disablePushForLogout, restorePushAfterLogin } from '@/lib/push';
import { takeReturnTo, stashReturnTo, RETURN_TO_PARAM } from '@/lib/returnTo';
import { JUST_LOGGED_IN_KEY } from '@/components/service/notification/PushPromptBottomSheet';
import LoginBannedSection from './LoginBannedSection';
import LoginRestrictedSection from './LoginRestrictedSection';
import GoogleLinkDialog from './GoogleLinkDialog';

// 아이디 저장(로컬 스토리지) 키 — 아이디만 채워둘 뿐 세션과는 무관
const SAVED_LOGIN_ID_KEY = 'savedLoginId';

// 로그아웃 안내 토스트 — 로그인 시 닫아야 해서 id 를 고정한다
const LOGOUT_TOAST_ID = 'logout-done';

// 구글 로그인 콜백이 실패했을 때 백엔드가 붙여 보내는 코드
const GOOGLE_ERROR_MESSAGES = {
  GOOGLE_NOT_LINKED:
    '연결된 계정이 없어요. 아이디로 로그인한 뒤 마이페이지에서 구글 계정을 연결해주세요.',
  GOOGLE_LOGIN_FAILED: '구글 로그인에 실패했어요. 잠시 후 다시 시도해주세요.',
  INVALID_STATE: '인증 정보가 만료되었어요. 다시 시도해주세요.',
};

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
  // 구글 동의 화면으로 나가는 중 (버튼 중복 클릭 방지)
  const [googleBusy, setGoogleBusy] = useState(false);
  // [구글로 로그인] 했는데 연결된 회원이 없어 돌아온 상태 — 서버가 그 구글 계정을 10분간 보관 중이다.
  // GET /api/auth/google/pending 응답: { googleEmail, maskedEmail, emailMatched, maskedLoginId }
  // 지금 아이디로 로그인하면 그 구글 계정을 붙인다.
  const [pendingGoogleLink, setPendingGoogleLink] = useState(null);
  // "연결할까요 / 회원가입할까요" 모달 — 구글에서 막 돌아온 순간(?googleLink=1)에만 띄운다
  const [googleDialogOpen, setGoogleDialogOpen] = useState(false);
  const { login, logout, applyAuthResponse } = useAuthStore();
  const logoutHandled = useRef(false);
  const googleHandled = useRef(false);
  const pendingChecked = useRef(false);

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

    // reason=pw: 비밀번호 변경으로 토큰이 무효화돼 넘어온 경우 — 변경 성공을 여기서 알린다
    // (변경 API 성공 응답은 곧바로 화면을 떠나기 때문에 마이페이지에서는 띄울 자리가 없다)
    const isPasswordChanged = searchParams.get('reason') === 'pw';

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
        toast.success(
          isPasswordChanged
            ? '비밀번호가 변경되었습니다. 새 비밀번호로 다시 로그인해주세요.'
            : '로그아웃되었습니다!',
          {
            id: LOGOUT_TOAST_ID,
            duration: Infinity,
            action: {
              label: '홈으로',
              onClick: () => router.push(BASE_PATH),
            },
          }
        );
      }
    };

    runLogout();
  }, [searchParams, logout, router]);

  // 연결 대기 중인 구글 계정이 있는지 서버에 묻는다 (보관 토큰은 HttpOnly 쿠키라 여기서 못 읽는다).
  // 회원가입 화면에 들렀다 돌아오거나 새로 고침해도 안내가 유지되도록 마운트마다 확인한다.
  //  ?googleLink=1     — 구글에서 막 돌아온 것: "연결할까요 / 회원가입할까요" 모달을 띄운다
  //  ?googleLink=login — 회원가입 화면에서 "로그인해서 연결하기" 로 넘어온 것: 이미 정한 사람이라 배너만
  useEffect(() => {
    if (pendingChecked.current) return;
    pendingChecked.current = true;
    const justReturned = searchParams.get('googleLink') === '1';

    getGooglePendingLink()
      .then((info) => {
        if (!info?.pending) {
          if (justReturned) {
            toast.error('구글 계정 연결 정보가 만료되었어요. 구글 로그인을 다시 시도해주세요.');
          }
          return;
        }
        setPendingGoogleLink(info);
        if (justReturned) setGoogleDialogOpen(true);
      })
      .catch(() => {
        // 확인에 실패하면 안내 없이 일반 로그인 화면으로 둔다
      });
  }, [searchParams]);

  // 구글 로그인 콜백 복귀 처리: /login?login=google (실패 시 /login?error=코드)
  //
  // 백엔드는 accessToken 을 쿼리로 넘기지 않는다(히스토리·리퍼러에 남는다).
  // refreshToken 쿠키만 심어 보내므로 여기서 재발급 API 로 accessToken 을 받아 세션을 세운다.
  useEffect(() => {
    if (googleHandled.current) return;

    // 연결된 회원이 없는 구글 계정으로 들어온 경우 — 안내에 필요한 내용은 위 effect 가 서버에 묻는다.
    // 여기서는 쿼리만 정리한다 (matched/hint 는 백엔드가 참고용으로 붙이는 값이라 쓰지 않는다).
    if (searchParams.get('googleLink')) {
      googleHandled.current = true;
      router.replace(ROUTES.LOGIN);
      return;
    }

    const errorCode = searchParams.get('error');
    if (errorCode) {
      googleHandled.current = true;
      // 사용자가 동의 화면에서 직접 취소한 경우는 실패로 알리지 않는다
      if (errorCode !== 'GOOGLE_CANCELLED') {
        toast.error(GOOGLE_ERROR_MESSAGES[errorCode] ?? '구글 로그인에 실패했어요.');
      }
      router.replace(ROUTES.LOGIN);
      return;
    }

    if (searchParams.get('login') !== 'google') return;
    googleHandled.current = true;

    const completeGoogleLogin = async () => {
      try {
        const data = await refreshAccessToken();
        applyAuthResponse(data);

        try {
          sessionStorage.setItem(JUST_LOGGED_IN_KEY, '1');
        } catch {
          // ignore
        }
        restorePushAfterLogin();

        toast.success('구글 계정으로 로그인했어요');
        // 알림 딥링크 등에서 밀려났던 경로가 있으면 그리로 (구글을 거치는 동안 sessionStorage 에 남겨 둔 값)
        router.replace(takeReturnTo(searchParams) ?? ROUTES.STUDENTS_DASHBOARD);
      } catch {
        // 쿠키가 심어지지 않았거나 이미 만료된 경우
        toast.error('로그인 정보를 받지 못했어요. 다시 시도해주세요.');
        router.replace(ROUTES.LOGIN);
      }
    };

    completeGoogleLogin();
  }, [searchParams, applyAuthResponse, router]);

  const handleGoogleLogin = async () => {
    if (googleBusy || loggingOut) return;
    setGoogleBusy(true);
    try {
      const url = await getGoogleLoginUrl();
      if (!url) throw new Error('authorizeUrl 없음');
      // 구글·서버를 거쳐 /login?login=google 로 돌아오면 쿼리가 사라진다 — 돌아갈 경로를 sessionStorage 에 남긴다
      stashReturnTo(searchParams.get(RETURN_TO_PARAM));
      window.location.href = url;
    } catch {
      toast.error('구글 로그인을 시작하지 못했어요. 잠시 후 다시 시도해주세요.');
      setGoogleBusy(false);
    }
  };

  // 모달에서 연결하기로 정함 → 모달만 닫고 대기는 유지한다 (아래 handleLogin 이 로그인 직후 붙인다)
  const acceptGoogleLink = () => setGoogleDialogOpen(false);

  // 모달·배너에서 연결하지 않겠다 → 서버의 대기 정보도 지운다 (다른 아이디로 로그인할 때 붙지 않게)
  const declineGoogleLink = async () => {
    setGoogleDialogOpen(false);
    setPendingGoogleLink(null);
    try {
      await discardGooglePendingLink();
    } catch {
      // 지우지 못해도 10분이면 사라진다. 안내는 이미 내렸으니 조용히 넘어간다
    }
  };

  // 모달에서 가입된 회원이 없을 때 → 회원가입으로. 대기 쿠키가 따라가 가입 폼의 이메일 칸을 채운다
  const goSignupWithGoogle = () => {
    setGoogleDialogOpen(false);
    router.push(ROUTES.SIGNUP);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loggingOut) return;
    // 로그인 후 화면까지 따라다니지 않도록 로그아웃 안내를 닫는다
    toast.dismiss(LOGOUT_TOAST_ID);
    try {
      await login(loginId, password, autoLogin);

      // 구글 계정 연결 대기 중이었으면 지금 로그인한 계정에 붙인다.
      // 실패해도 로그인 자체는 성공이므로 흐름을 막지 않고 마이페이지에서 다시 할 수 있다고만 알린다.
      if (pendingGoogleLink) {
        try {
          const linked = await completeGoogleLink();
          toast.success(
            `구글 계정${linked?.googleEmail ? `(${linked.googleEmail})` : ''}을 연결했어요. 다음부터 구글로 바로 로그인할 수 있어요.`
          );
        } catch (linkErr) {
          toast.error(
            getErrorMessage(linkErr, '구글 계정 연결에 실패했어요. 마이페이지에서 다시 연결할 수 있어요.')
          );
        } finally {
          setPendingGoogleLink(null);
        }
      }

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

      // 알림 딥링크 등에서 밀려났던 경로가 있으면 그리로, 없으면 대시보드
      router.push(takeReturnTo(searchParams) ?? ROUTES.STUDENTS_DASHBOARD);
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
          {/* 구글 계정 연결 — [구글로 로그인] 했는데 연결된 회원이 없어 돌아온 경우.
              막 돌아온 순간엔 모달로 묻고(연결할까요 / 회원가입할까요), 연결하기로 했으면 배너만 남긴다 */}
          <GoogleLinkDialog
            open={googleDialogOpen}
            pending={pendingGoogleLink}
            onAccept={acceptGoogleLink}
            onSignup={goSignupWithGoogle}
            onDecline={declineGoogleLink}
          />
          {pendingGoogleLink && !googleDialogOpen && (
            <div
              role="status"
              className="flex items-start justify-between gap-3 rounded-[6px] border border-[#dedede] bg-[#f8f8f8] px-4 py-3 text-[14px] leading-[1.6] tracking-[-0.28px] text-[#212121] [word-break:keep-all]"
            >
              <p>
                <span className="font-bold">구글 계정 연결 대기 중</span>
                <br />
                <span className="text-[#454545]">
                  {pendingGoogleLink.emailMatched
                    ? `아이디 ${pendingGoogleLink.maskedLoginId} 로 로그인하면 `
                    : '아이디·비밀번호로 로그인하면 '}
                  <span className="font-medium text-[#212121]">{pendingGoogleLink.maskedEmail}</span>{' '}
                  계정이 연결돼요.
                </span>
              </p>
              <button
                type="button"
                onClick={declineGoogleLink}
                className="shrink-0 text-[13px] text-[#919191] underline-offset-2 hover:underline"
              >
                연결 취소
              </button>
            </div>
          )}

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

          {/* 간편로그인 — 구글 계정을 연결한 회원만 사용할 수 있다.
              구글만으로는 가입되지 않는다(학번·전화가 필수라서). 미연결 계정은 콜백에서
              GOOGLE_NOT_LINKED 로 돌아오고 위 useEffect 가 안내 토스트를 띄운다. */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-[#e5e5e5]" />
              <span className="text-[14px] text-[#9e9e9e]">간편로그인</span>
              <span className="h-px flex-1 bg-[#e5e5e5]" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleBusy || loggingOut}
              className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[4px] border border-[#dedede] bg-white text-[16px] font-medium text-[#3c4043] transition hover:bg-[#f8f9fa] disabled:opacity-60"
            >
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              {googleBusy ? '구글로 이동 중…' : '구글로 로그인'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
