'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// 이메일 형식 올바른지 확인
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function FindIdEmail({ onNext }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  // 언마운트 시 타이머 정리 (메모리 누수 방지)
  useEffect(() => () => clearTimeout(timerRef.current), []);

  // 제출 핸들러 - 제출될때 기본 새로고침 막고, 중복실행 방지
  const handleSubmit = async (e) => {
    // 비동기 함수로
    e.preventDefault();
    if (loading) return;

    // 유효성 검사 - 비어있거나 형식 틀리면 알림 띄움
    if (!email.trim() || !isValidEmail(email)) {
      toast.error(!email.trim() ? '이메일을 입력해 주세요.' : '이메일 형식이 올바르지 않습니다.', {
        description: !email.trim()
          ? '회원가입 시 등록한 이메일을 입력해 주세요.'
          : '예: example@email.com',
      });
      return;
    }

    // 성공 토스트 → 다음 화면 이동
    setLoading(true);
    try {
      // 실제 API 호출이 들어갈 자리
      // await api.findId(email);

      toast.success('인증 메일을 발송했습니다.', {
        description: `${email} 주소로 아이디 확인 메일을 보냈습니다.`,
      });

      timerRef.current = setTimeout(() => {
        onNext(email);
      }, 1500); // 알림 읽을 시간 주기 위해 여유시간 추가
    } catch (error) {
      toast.error('발송 실패', {
        description: '등록되지 않은 이메일이거나 서버 오류가 발생했습니다.',
      });
      setLoading(false); // 실패 시에는 다시 입력을 시도할 수 있게 로딩 해제
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 items-end w-full">
      <div className="flex flex-col gap-5 items-start w-full">
        <h1 className="font-semibold text-[24px] tracking-[-0.48px] leading-[1.5]">아이디 찾기</h1>
        <div className="flex flex-col gap-3 w-full">
          <p className="text-[16px] tracking-[-0.32px] leading-[1.6]">
            회원가입 시 등록했던 이메일을 입력해 주세요.
          </p>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="본인 확인 이메일"
            autoComplete="email"
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
        {loading ? '메일 발송 중...' : '다음'}
      </Button>
    </form>
  );
}
