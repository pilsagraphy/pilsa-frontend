'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { passwordSchema } from '@/schemas/auth';
import { changePassword } from '@/apis/mypage';
import { getErrorMessage } from '@/apis/auth';

// 검증 규칙은 비밀번호 찾기(FindPwReset)와 동일한 passwordSchema 재사용
const changePwSchema = z
  .object({
    currentPassword: z.string().min(1, { message: '현재 비밀번호를 입력해주세요.' }),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, { message: '비밀번호 확인을 입력해주세요.' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: '현재 비밀번호와 다른 비밀번호를 입력해주세요.',
    path: ['newPassword'],
  });

const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' };

// 비밀번호 재설정 모달
export default function PasswordChangeModal({ open, onOpenChange }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleOpenChange = (next) => {
    if (loading) return;
    if (!next) {
      setForm(EMPTY_FORM);
      setErrors(EMPTY_FORM);
    }
    onOpenChange(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const result = changePwSchema.safeParse(form);
    if (!result.success) {
      const newErrors = { ...EMPTY_FORM };
      result.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (!newErrors[path]) newErrors[path] = issue.message;
      });
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const data = await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success(data?.message ?? '비밀번호가 변경되었습니다.');

      setLoading(false);
      setForm(EMPTY_FORM);
      setErrors(EMPTY_FORM);
      onOpenChange(false);
    } catch (err) {
      // 백엔드 미배포(404) — 계약 확정 전까지 안내만
      if (err.response?.status === 404) {
        toast.info('비밀번호 변경 기능은 준비 중이에요. 조금만 기다려주세요.');
      } else {
        toast.error(getErrorMessage(err, '비밀번호 변경에 실패했습니다.'));
      }
      setLoading(false);
    }
  };

  const fields = [
    { key: 'currentPassword', label: '현재 비밀번호', placeholder: '현재 비밀번호를 입력하세요' },
    { key: 'newPassword', label: '새 비밀번호', placeholder: '새 비밀번호를 입력하세요' },
    {
      key: 'confirmPassword',
      label: '새 비밀번호 확인',
      placeholder: '새 비밀번호를 다시 입력하세요',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[400px] rounded-[12px] p-6" hideCloseButton>
        <DialogHeader className="text-left">
          <DialogTitle className="text-[18px] tracking-[-0.02em] text-black">
            비밀번호 재설정
          </DialogTitle>
          <DialogDescription className="text-[13px] tracking-[-0.02em] text-[#757575]">
            현재 비밀번호 확인 후 새 비밀번호로 변경돼요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-3">
          {fields.map(({ key, label, placeholder }) => (
            <div key={key} className="flex flex-col gap-1">
              <label
                htmlFor={`pw-${key}`}
                className="text-[13px] font-medium tracking-[-0.02em] text-[#454545]"
              >
                {label}
              </label>
              <Input
                id={`pw-${key}`}
                type="password"
                placeholder={placeholder}
                value={form[key]}
                onChange={handleChange(key)}
                autoComplete="new-password"
                spellCheck={false}
                className={`h-[48px] rounded-[6px] text-[15px] ${
                  errors[key] ? 'border-[#D32F2F]' : 'border-[#c4c4c4]'
                }`}
              />
              {errors[key] && (
                <p className="text-[12px] tracking-[-0.02em] text-[#D32F2F]">{errors[key]}</p>
              )}
            </div>
          ))}

          <div className="mt-2 flex flex-col gap-2">
            <Button
              type="submit"
              disabled={loading}
              className="h-[46px] w-full rounded-[6px] bg-[#212121] text-[15px] font-semibold text-white hover:bg-black disabled:opacity-40"
            >
              {loading ? '변경 중...' : '비밀번호 변경'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={loading}
              onClick={() => handleOpenChange(false)}
              className="h-[42px] w-full rounded-[6px] text-[14px] text-[#919191] hover:text-[#454545]"
            >
              취소
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
