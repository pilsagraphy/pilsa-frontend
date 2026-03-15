'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { emailSchema } from '@/schemas/auth';
import { sendPasswordResetVerification, getErrorMessage } from '@/apis/auth';

export default function FindPwEmail({ loginId, onNext, onPrev }) {
  // 입력된 이메일 주소를 관리하는 상태
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  // API 요청 중 버튼 중복 클릭 방지를 위한 로딩 상태
  const [loading, setLoading] = useState(false);
  // 인증 성공 후 페이지 전환 딜레이를 제어하기 위한 타이머 Ref
  const timerRef = useRef(null);

  // 컴포넌트가 사라질 때(unmount) 남아있는 타이머를 제거하여 메모리 누수 방지
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleChange = (e) => {
    setEmail(e.target.value);
    // 사용자가 다시 타이핑하면 에러 초기화
    if (error) setError('');
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault(); // 페이지 새로고침 방지
    if (loading) return; // 이미 처리 중이면 중단

    const normalizedEmail = email.trim();
    const result = emailSchema.safeParse(normalizedEmail);

    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetVerification(loginId, normalizedEmail);

      // 성공 시 사용자에게 알림 표시
      toast.success('인증 메일을 발송했습니다.', {
        description: `${normalizedEmail} 주소로 인증 메일을 보냈습니다.`,
      });

      // 토스트 메시지를 읽을 여유 시간을 준 뒤(1.5초), 다음 단계(인증번호 입력)로 이동
      timerRef.current = setTimeout(() => {
        onNext(normalizedEmail); // 입력한 이메일 정보를 부모 컴포넌트로 전달
      }, 1000);
    } catch (error) {
      // 에러 발생 시(등록되지 않은 이메일 등) 안내 메시지 표시
      toast.error('발송 실패', {
        description: getErrorMessage(error, '등록되지 않은 이메일이거나 서버 오류가 발생했습니다.'),
      });
      setLoading(false); // 다시 입력할 수 있도록 로딩 상태 해제
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 items-end w-full">
      <div className="flex flex-col gap-5 items-start w-full">
        <h1 className="font-semibold text-[24px] tracking-[-0.48px] leading-[1.5]">
          비밀번호 재설정
        </h1>

        <div className="flex flex-col gap-3 w-full">
          <p className="text-[16px] tracking-[-0.32px] leading-[1.6]">
            회원가입 시 등록했던 이메일을 입력해 주세요.
          </p>
          <Input
            type="email"
            value={email}
            onChange={handleChange}
            placeholder="본인 확인 이메일"
            autoComplete="email"
            disabled={loading}
            className={`h-[52px] text-[16px] ${
              error
                ? 'border-[#f44336] text-[#f44336] focus-visible:ring-0 focus-visible:border-[#f44336]'
                : ''
            }`}
          />
          {error && (
            <p className="text-[#f44336] text-[12px] tracking-[-0.24px] leading-[1.4]">{error}</p>
          )}
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
