'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function LoginSection() {
  const [saveId, setSaveId] = useState(false);
  const [error, setError] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    toast.error('로그인 정보를 찾을 수 없습니다.', {
      description: '다시 시도해주세요.',
    });
  };

  return (
    <section className="mx-auto w-full max-w-[616px]">
      <div className="rounded-[6px] bg-white p-6">
        <h2 className="text-[24px] font-semibold text-[#454545]">로그인</h2>

        <form className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            {/* <label className="flex items-center gap-[6px] text-[14px] text-black tracking-[-0.28px]">
              <Checkbox
                className="h-6 w-6 rounded-[2px]"
                checked={saveId}
                onCheckedChange={(v) => setSaveId(Boolean(v))}
              />
              아이디 저장
            </label> */}

            <div className="flex items-center text-[14px] tracking-[-0.28px]  whitespace-nowrap">
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
            className="h-[56px] rounded-[6px] border-[#c4c4c4] text-[18px]"
            placeholder="아이디를 입력하세요"
          />
          <Input
            type="password"
            className="h-[56px] rounded-[6px] border-[#c4c4c4] text-[18px]"
            placeholder="비밀번호를 입력하세요"
          />

          <div className="pt-2 space-y-3">
            <Button
              type="submit"
              onClick={handleLogin}
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
              <button className="grid size-[54px] place-items-center rounded-full bg-[#F5DE00]">
                <span className="text-[12px] font-semibold">K</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
