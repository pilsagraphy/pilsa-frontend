'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { findEmailByLoginId, getErrorMessage } from '@/apis/auth';

export default function FindEmailId({ onNext }) {
  const [loginId, setLoginId] = useState('');
  const [loading, setLoading] = useState(false);

  // 제출 핸들러 - 기본 새로고침 막고 중복 실행 방지
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const normalizedId = loginId.trim();
    if (!normalizedId) {
      toast.error('아이디를 입력해 주세요.', {
        description: '회원가입 시 등록한 아이디를 입력해 주세요.',
      });
      return;
    }

    setLoading(true);
    try {
      const data = await findEmailByLoginId(normalizedId);
      onNext(data?.email ?? '');
    } catch (error) {
      // TODO: 백엔드 API 연동 전까지 임시 처리.
      // API 미구현(NOT_IMPLEMENTED) 상태에서도 화면 흐름을 확인할 수 있도록 다음 단계로 진행.
      if (error?.message === 'NOT_IMPLEMENTED') {
        onNext('');
        return;
      }
      toast.error('조회 실패', {
        description: getErrorMessage(
          error,
          '등록되지 않은 아이디이거나 서버 오류가 발생했습니다.'
        ),
      });
      setLoading(false); // 실패 시 다시 시도할 수 있게 로딩 해제
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 items-end w-full">
      <div className="flex flex-col gap-5 items-start w-full">
        <h1 className="font-semibold text-[24px] tracking-[-0.48px] leading-[1.5]">이메일 찾기</h1>
        <div className="flex flex-col gap-3 w-full">
          <p className="text-[16px] tracking-[-0.32px] leading-[1.6]">
            회원가입 시 등록했던 아이디를 입력해 주세요.
          </p>
          <Input
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            placeholder="아이디를 입력하세요."
            autoComplete="username"
            disabled={loading}
            className="h-[52px] text-[16px]"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="h-[52px] w-full bg-[#212121] hover:bg-[#424242] text-white text-[16px] transition-colors"
      >
        {loading ? '조회 중...' : '다음'}
      </Button>
    </form>
  );
}
