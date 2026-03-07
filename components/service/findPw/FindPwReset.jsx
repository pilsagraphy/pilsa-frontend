'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { z } from 'zod';
import { passwordSchema } from '@/schemas/auth';

const resetPwSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, { message: '비밀번호 확인을 입력해주세요.' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

export default function FindPwReset({ username, onNext }) {
  // 입력 상태 관리
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 개별 에러 메시지 상태 관리
  const [errors, setErrors] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // 로딩 및 타이머 설정
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  // 언마운트 시 타이머 정리
  useEffect(() => () => clearTimeout(timerRef.current), []);

  /**
   * 신규 비밀번호 입력 핸들러
   * 입력 시 실시간으로 해당 필드의 에러 메시지를 초기화함
   */
  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
    if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
  };

  /**
   * 비밀번호 확인 입력 핸들러
   */
  const handleConfirmChange = (e) => {
    setConfirmPassword(e.target.value);
    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
  };

  /**
   * 비밀번호 변경 제출 핸들러
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const result = resetPwSchema.safeParse({
      newPassword,
      confirmPassword,
    });

    if (!result.success) {
      const newErrors = { newPassword: '', confirmPassword: '' };

      // zod의 에러 배열을 순회하며 상태 업데이트
      result.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (!newErrors[path]) {
          newErrors[path] = issue.message;
        }
      });

      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // 실제 API 호출이 들어갈 자리
      // await api.resetPassword({ username, newPassword });

      toast.success('비밀번호가 변경되었습니다.');

      timerRef.current = setTimeout(() => {
        onNext();
      }, 1500);
    } catch (err) {
      toast.error('변경 실패', {
        description: '서버 오류가 발생했습니다.',
      });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 items-end w-full">
      <div className="flex flex-col gap-5 items-start w-full">
        <h1 className="font-semibold text-[24px] text-[#454545] tracking-[-0.48px] leading-[1.5]">
          비밀번호를 재설정해주세요
        </h1>

        <div className="flex flex-col gap-3 w-full">
          {/* 신규 비밀번호 입력 섹션 */}
          <div className="flex flex-col gap-3 w-full">
            <p className="text-[#454545] text-[16px] tracking-[-0.32px] leading-[1.6]">
              신규 비밀번호
            </p>
            <div className="flex flex-col gap-[6px] w-full">
              <Input
                type="password"
                value={newPassword}
                onChange={handleNewPasswordChange}
                placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                disabled={loading}
                // 에러 발생 시 테두리 및 텍스트 색상 변경 (피그마 디자인 반영)
                className={`h-[52px] text-[16px] ${
                  errors.newPassword
                    ? 'border-[#f44336] text-[#f44336] focus-visible:ring-0 focus-visible:border-[#f44336]'
                    : ''
                }`}
              />
              {errors.newPassword && (
                <p className="text-[#f44336] text-[12px] tracking-[-0.24px] leading-[1.4]">
                  {errors.newPassword}
                </p>
              )}
            </div>
          </div>

          {/* 비밀번호 재입력 확인 섹션 */}
          <div className="flex flex-col gap-3 w-full">
            <p className="text-[#454545] text-[16px] tracking-[-0.32px] leading-[1.6]">
              비밀번호 재입력
            </p>
            <div className="flex flex-col gap-[6px] w-full">
              <Input
                type="password"
                value={confirmPassword}
                onChange={handleConfirmChange}
                placeholder="비밀번호 재입력"
                disabled={loading}
                className={`h-[52px] text-[16px] ${
                  errors.confirmPassword
                    ? 'border-[#f44336] text-[#f44336] focus-visible:ring-0 focus-visible:border-[#f44336]'
                    : ''
                }`}
              />
              {errors.confirmPassword && (
                <p className="text-[#f44336] text-[12px] tracking-[-0.24px] leading-[1.4]">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="h-[52px] w-full bg-[#212121] hover:bg-[#424242] text-white text-[16px] transition-colors"
      >
        {loading ? '처리 중...' : '비밀번호 재설정'}
      </Button>
    </form>
  );
}
