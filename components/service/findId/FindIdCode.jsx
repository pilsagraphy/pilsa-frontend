'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { verifyFindIdCode, findLoginIdByEmail, getErrorMessage } from '@/apis/auth';

// 인증번호는 숫자 6자리
const isValidCode = (v) => /^\d{6}$/.test(v);

export default function FindIdCode({ email, onNext, onPrev }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  // 언마운트 시 타이머 정리
  useEffect(() => () => clearTimeout(timerRef.current), []);

  // 입력할 때마다 에러 메시지 초기화
  const handleChange = (e) => {
    setCode(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const normalizedCode = code.trim();

    if (!normalizedCode || !isValidCode(normalizedCode)) {
      setError('인증번호를 정확히 입력해주세요.');
      toast.error('입력 오류', {
        description: '인증번호 6자리를 정확히 입력해 주세요.',
      });
      return;
    }

    setLoading(true);
    try {
      await verifyFindIdCode(email, normalizedCode);
      const result = await findLoginIdByEmail(email);

      toast.success('인증이 완료되었습니다.', {
        description: '아이디 확인 화면으로 이동합니다.',
      });

      timerRef.current = setTimeout(() => {
        onNext(result.loginId);
      }, 1000);
    } catch (err) {
      toast.error('인증 실패', {
        description: getErrorMessage(err, '인증번호가 일치하지 않거나 만료되었습니다.'),
      });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 items-end w-full">
      <div className="flex flex-col gap-5 items-start w-full">
        <h1 className="font-semibold text-[24px] tracking-[-0.48px] leading-[1.5]">아이디 찾기</h1>
        <div className="flex flex-col gap-3 w-full">
          <p className="text-[16px] tracking-[-0.32px] leading-[1.6]">
            메일을 발송했어요. 인증번호를 입력해 주세요.
          </p>

          <div className="flex flex-col gap-[6px] w-full">
            <Input
              type="text"
              value={code}
              onChange={handleChange}
              placeholder="인증번호 6자리"
              inputMode="numeric"
              maxLength={6}
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
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="h-[52px] w-full bg-[#212121] hover:bg-[#424242] text-white text-[16px] transition-colors"
      >
        {loading ? '처리 중...' : '인증'}
      </Button>
    </form>
  );
}
