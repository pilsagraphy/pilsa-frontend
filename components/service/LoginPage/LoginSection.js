'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

export default function LoginSection() {
  const [saveId, setSaveId] = useState(false);
  const [error, setError] = useState(false);

  const handleLogin = () => {
    // TODO: 실제 API 연결 시 여기서 결과에 따라 setError(true/false)
    const loginSuccess = false; // 지금은 실패했다고 가정

    if (!loginSuccess) {
      setError(true);
    } else {
      setError(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-[616px]">
      <div className="rounded-[6px] bg-white p-6">
        <h2 className="text-[24px] font-semibold text-[#454545]">로그인</h2>

        <div className="mt-4 space-y-3">
          <Input
            className="h-[56px] rounded-[6px] border-[#c4c4c4] text-[18px]"
            placeholder="아이디를 입력하세요"
          />
          <Input
            type="password"
            className="h-[56px] rounded-[6px] border-[#c4c4c4] text-[18px]"
            placeholder="비밀번호를 입력하세요"
          />

          {/* 에러 메시지: error === true 일 때만 보임 */}
          {error && (
            <p className="text-[14px] text-[#c75c5c]">아이디 또는 비밀번호가 잘못 되었습니다</p>
          )}

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-[18px] text-[#919191]">
              <Checkbox checked={saveId} onCheckedChange={(v) => setSaveId(Boolean(v))} />
              아이디 저장
            </label>

            <button type="button" className="text-[18px] text-[#c4c4c4] hover:underline">
              /비밀번호를 잊으셨나요?
            </button>
          </div>

          <div className="pt-2 space-y-3">
            <Button
              onClick={handleLogin}
              className="h-[64px] w-full rounded-[6px] bg-[#454545] text-[20px] font-semibold text-white hover:bg-[#454545]/90"
            >
              로그인
            </Button>

            <Button
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
        </div>
      </div>
    </section>
  );
}
