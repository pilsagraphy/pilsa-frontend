'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import useAuthStore from '@/stores/useAuthStore';
import { ROUTES, BASE_PATH } from '@/constants/routes';
import { logout as logoutApi } from '@/apis/auth';

export default function LoginSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const { login, logout } = useAuthStore();
  const logoutHandled = useRef(false);

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
        <h2 className="text-[24px] font-semibold text-[#454545]">로그인</h2>

        {/* 2. onClick 대신 onSubmit 사용 */}
        <form onSubmit={handleLogin} className="mt-4 space-y-3">
          <div className="flex items-center justify-end">
            {/* justify-between에서 end로 (체크박스 없을 때 대비) */}
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
              className="h-[64px] w-full rounded-[6px] bg-[#454545] text-[20px] font-semibold text-white hover:bg-[#454545]/90"
            >
              로그인
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
