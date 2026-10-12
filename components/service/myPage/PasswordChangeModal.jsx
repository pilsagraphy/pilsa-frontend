'use client';

import { useState } from 'react';
import { toast } from '@/lib/toast';
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
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

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

// 비밀번호 만들기(소셜 전용 계정) — 현재 비밀번호가 없으니 그 칸·검사만 뺀다 (PM 2026-10-13)
const createPwSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, { message: '비밀번호 확인을 입력해주세요.' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' };

// 비밀번호 재설정 모달. createMode: 비밀번호 없는 소셜 가입 회원의 '비밀번호 만들기' (같은 API, 현재 비밀번호 없이)
export default function PasswordChangeModal({ open, onOpenChange, createMode = false }) {
  const router = useRouter();
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

    const result = (createMode ? createPwSchema : changePwSchema).safeParse(form);
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
      await changePassword({
        currentPassword: createMode ? undefined : form.currentPassword,
        newPassword: form.newPassword,
      });

      // ★성공 시 기존 토큰이 전부 무효화된다(본인 세션 포함).
      //   로그아웃 플로우(/login?logout=1)로 SPA 이동한다 — 인증 상태를 정리하고
      //   로그인 화면에서 안내 토스트를 띄운다. (전체 리로드가 아니라 토스트가 사라지지 않는다)
      //   reason=pw: 로그인 화면 토스트를 '로그아웃' 대신 '비밀번호 변경' 안내로 바꾼다
      //   이동 전에 모달을 닫아둔다 — 전환이 늦거나 실패해도 '변경 중...' 상태로 갇히지 않게
      setLoading(false);
      setForm(EMPTY_FORM);
      setErrors(EMPTY_FORM);
      onOpenChange(false);
      router.replace(`${ROUTES.LOGIN}?logout=1&reason=${createMode ? 'pw-created' : 'pw'}`);
    } catch (err) {
      toast.error(getErrorMessage(err, createMode ? '비밀번호를 만들지 못했어요' : '비밀번호를 바꾸지 못했어요'));
      setLoading(false);
    }
  };

  const fields = [
    ...(createMode ? [] : [{ key: 'currentPassword', label: '현재 비밀번호', placeholder: '현재 비밀번호를 입력하세요' }]),
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
          <DialogTitle className="text-[18px] tracking-[-0.02em] text-ink">
            {createMode ? '비밀번호 만들기' : '비밀번호 재설정'}
          </DialogTitle>
          <DialogDescription className="text-[13px] tracking-[-0.02em] text-ink-3">
            {createMode
              ? '만들고 나면 아이디로도 로그인할 수 있어요. 만든 뒤 다시 로그인해주세요.'
              : '현재 비밀번호 확인 후 새 비밀번호로 변경돼요.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-3">
          {fields.map(({ key, label, placeholder }) => (
            <div key={key} className="flex flex-col gap-1">
              <label
                htmlFor={`pw-${key}`}
                className="text-[13px] font-medium tracking-[-0.02em] text-ink-2"
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
                  errors[key] ? 'border-danger' : 'border-line-strong'
                }`}
              />
              {errors[key] && (
                <p className="text-[12px] tracking-[-0.02em] text-danger">{errors[key]}</p>
              )}
            </div>
          ))}

          <div className="mt-2 flex flex-col gap-2">
            <Button
              type="submit"
              disabled={loading}
              className="h-[46px] w-full rounded-[6px] bg-inverse text-[15px] font-semibold text-inverse-fg hover:bg-inverse-hover disabled:opacity-40"
            >
              {loading ? (createMode ? '만드는 중...' : '변경 중...') : createMode ? '비밀번호 만들기' : '비밀번호 변경'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={loading}
              onClick={() => handleOpenChange(false)}
              className="h-[42px] w-full rounded-[6px] text-[14px] text-ink-3 hover:text-ink-2"
            >
              취소
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
