'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import useAuthStore from '@/stores/useAuthStore';
import { ROUTES, BASE_PATH } from '@/constants/routes';
import { logout as logoutApi } from '@/apis/auth';

// 아이디 저장(로컬 스토리지) 키
const SAVED_LOGIN_ID_KEY = 'savedLoginId';

export default function LoginSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberId, setRememberId] = useState(false);
  const { login, logout } = useAuthStore();
  const logoutHandled = useRef(false);

  // 아이디 저장: 마운트 시 저장된 아이디가 있으면 자동 입력 + 체크박스 활성화
  useEffect(() => {
    const savedLoginId = localStorage.getItem(SAVED_LOGIN_ID_KEY);
    if (savedLoginId) {
      setLoginId(savedLoginId);
      setRememberId(true);
    }
  }, []);

  // 로그아웃 플로우: /login?logout=1 접근 시 실행
  useEffect(() => {
    if (searchParams.get('logout') !== '1' || logoutHandled.current) return;
    logoutHandled.current = true;

    const runLogout = async () => {
      try {
        await logoutApi();
      } catch {
        // API 실패해도 클라이언트 상태는 정리
      } finally {
        logout();
        toast.success('로그아웃되었습니다!', {
          duration: Infinity,
          action: {
            label: '확인',
            onClick: () => router.push(BASE_PATH),
          },
        });
      }
    };

    runLogout();
  }, [searchParams, logout, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(loginId, password);
      // 아이디 저장: 체크 시 저장, 해제 시 삭제
      if (rememberId) {
        localStorage.setItem(SAVED_LOGIN_ID_KEY, loginId);
      } else {
        localStorage.removeItem(SAVED_LOGIN_ID_KEY);
      }
      router.push(ROUTES.STUDENTS_DASHBOARD);
    } catch (err) {
      const message =
        err.response?.data?.message ??
        (typeof err.response?.data === 'string' ? err.response.data : null) ??
        err.message;
      toast.error(message);
    }
  };

  return (
    <section className="mx-auto w-full max-w-[616px]">
      <div className="rounded-[6px] bg-white p-6">
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {/* 제목 + (아이디 저장 / 아이디 찾기·이메일 찾기·비밀번호 재설정) */}
          <div className="flex flex-col gap-3">
            <h2 className="text-[24px] font-semibold tracking-[-0.48px] text-black">
              로그인
            </h2>

            <div className="flex items-center justify-between gap-2">
              {/* 아이디 저장 */}
              <label className="flex cursor-pointer items-center gap-1.5 select-none">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={rememberId}
                  onChange={(e) => setRememberId(e.target.checked)}
                />
                <span
                  aria-hidden
                  className="grid size-6 place-content-center rounded-[2px] border border-[#919191] bg-white text-white transition-colors peer-checked:border-[#212121] peer-checked:bg-[#212121] peer-focus-visible:ring-2 peer-focus-visible:ring-[#212121]/40"
                >
                  {rememberId && <Check className="size-4" strokeWidth={3} />}
                </span>
                <span className="text-[14px] font-bold tracking-[-0.28px] text-black">
                  아이디 저장
                </span>
              </label>

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
              className="h-[52px] w-full rounded-[4px] bg-[#212121] text-[16px] text-white hover:bg-[#212121]/90"
            >
              로그인
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
