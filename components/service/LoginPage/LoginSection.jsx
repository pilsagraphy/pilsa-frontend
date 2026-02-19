'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function LoginSection() {
  // 1. onSubmit으로 로직 통합
  const handleLogin = (e) => {
    e.preventDefault(); // 폼 제출 시 페이지 새로고침 방지

    // [팀장 가이드] 실제 로그인 로직 주석 처리 예시
    // const email = e.target.email.value;
    // const password = e.target.password.value;

    // 토스트 알림 호출
    toast.error('로그인 정보를 찾을 수 없습니다.', {
      description: '아이디와 비밀번호를 다시 확인해주세요.',
    });
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
              >
                아이디
              </button>
              <span className="mx-1 text-[#c4c4c4]">/</span>
              <button
                type="button"
                className="text-[#c4c4c4] hover:text-[#424242] hover:underline transition-colors"
              >
                비밀번호
              </button>
              <span className="text-[#c4c4c4]">를 잊으셨나요?</span>
            </div>
          </div>

          <Input
            required // HTML5 기본 유효성 검사 추가
            className="h-[56px] rounded-[6px] border-[#c4c4c4] text-[18px]"
            placeholder="아이디를 입력하세요"
          />
          <Input
            required
            type="password"
            className="h-[56px] rounded-[6px] border-[#c4c4c4] text-[18px]"
            placeholder="비밀번호를 입력하세요"
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
            >
              회원가입
            </Button>
          </div>

          <div className="pt-8">
            <p className="text-center text-[18px] text-[#919191]">간편로그인</p>
            <div className="mt-4 flex items-center justify-center">
              <button
                type="button"
                className="grid size-[54px] place-items-center rounded-full bg-[#F5DE00]"
              >
                <span className="text-[12px] font-semibold">K</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
