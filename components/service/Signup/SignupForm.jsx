'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { registerFormSchema, loginIdSchema } from '@/schemas/auth';
import { EMAIL_DOMAINS } from '@/constants/email';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SignupForm() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'student';

  // 인증 관련 상태
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isDuplicateChecked, setIsDuplicateChecked] = useState(false);

  const form = useForm({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: '',
      department: '',
      studentId: '',
      emailLocal: '',
      emailDomain: '',
      emailCustom: '',
      emailCode: '',
      username: '',
      password: '',
      passwordConfirm: '',
    },
    mode: 'onChange', // 실시간 피드백을 위해 설정
  });

  const emailDomain = form.watch('emailDomain');
  const passwordValue = form.watch('password');

  // 아이디 중복 확인 (스키마 활용)
  const handleDuplicateCheck = async () => {
    const username = form.getValues('username');

    // 1. Zod 개별 스키마로 먼저 검증 (불필요한 API 요청 방지)
    const result = loginIdSchema.safeParse(username);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    // 2. 실무에서는 여기서 axios.post('/api/check-id', ...) 호출
    console.log('API 중복 확인 호출:', username);
    setIsDuplicateChecked(true);
    toast.success('사용 가능한 아이디입니다.');
  };

  const handleEmailSend = () => {
    const emailLocal = form.getValues('emailLocal');
    if (!emailLocal) return toast.error('이메일 주소를 입력해주세요.');

    setIsEmailSent(true);
    toast.success('인증번호가 발송되었습니다.');
  };

  const handleEmailVerify = () => {
    const code = form.getValues('emailCode');
    if (!code) return toast.error('인증번호를 입력해주세요.');

    setIsEmailVerified(true);
    toast.success('이메일 인증이 완료되었습니다.');
  };

  // 최종 제출
  const onSubmit = (data) => {
    // 비즈니스 로직 상 필수 체크
    if (!isEmailVerified) return toast.error('이메일 인증이 필요합니다.');
    if (!isDuplicateChecked) return toast.error('아이디 중복 확인을 해주세요.');

    const finalEmail =
      data.emailDomain === 'custom'
        ? `${data.emailLocal}@${data.emailCustom}`
        : `${data.emailLocal}@${data.emailDomain}`;

    const submitData = {
      ...data,
      email: finalEmail,
      role,
    };

    console.log('✅ 가입 데이터 전송:', submitData);
    toast.success('회원가입이 완료되었습니다!');
  };

  // 비밀번호 실시간 체크 UI용 헬퍼 (비즈니스 로직은 Zod가 담당하므로 UI 전용)
  const checkPasswordRule = (regex) => regex.test(passwordValue || '');

  return (
    <div className="mx-auto w-full max-w-[600px] py-20 font-['Pretendard',sans-serif]">
      <Toaster richColors position="top-center" />

      <div className="mb-8">
        <span className="inline-block rounded-[4px] bg-[#f0f0f0] px-4 py-2 text-[14px] text-[#212121]">
          {role === 'student' ? '재학생' : '졸업생'}
        </span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-[20px]">
          <p className="text-[24px] font-semibold text-[#212121]">회원가입</p>

          {/* 실명 / 학과 / 학번 (반복되는 구조는 생략, 학번 onChange만 유지) */}
          <FormField
            control={form.control}
            name="studentId"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-[12px] space-y-0">
                <FormLabel>학번</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="20231234"
                    maxLength={8}
                    onChange={(e) => field.onChange(e.target.value.replace(/[^0-9]/g, ''))}
                    className="h-[52px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 이메일 섹션 (가독성을 위해 묶음) */}
          <div className="flex flex-col gap-[12px]">
            <FormLabel>이메일</FormLabel>
            <div className="flex items-center gap-[12px]">
              <FormField
                control={form.control}
                name="emailLocal"
                render={({ field }) => (
                  <FormItem className="flex-1 space-y-0">
                    <FormControl>
                      <Input {...field} placeholder="이메일 주소" className="h-[52px]" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <span className="text-[#919191]">@</span>
              {emailDomain === 'custom' ? (
                <FormField
                  control={form.control}
                  name="emailCustom"
                  render={({ field }) => (
                    <FormItem className="flex-1 space-y-0">
                      <FormControl>
                        <Input {...field} placeholder="직접 입력" className="h-[52px]" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="emailDomain"
                  render={({ field }) => (
                    <FormItem className="flex-1 space-y-0">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-[52px]">
                            <SelectValue placeholder="선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EMAIL_DOMAINS.map((d) => (
                            <SelectItem key={d.value} value={d.value}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              )}
              <Button
                type="button"
                onClick={handleEmailSend}
                disabled={isEmailSent}
                className="h-[52px] bg-[#212121]"
              >
                {isEmailSent ? '발송완료' : '인증번호 발송'}
              </Button>
            </div>
            {/* 인증번호 입력 */}
            <div className="flex gap-[12px]">
              <FormField
                control={form.control}
                name="emailCode"
                render={({ field }) => (
                  <FormItem className="flex-1 space-y-0">
                    <FormControl>
                      <Input {...field} placeholder="인증번호 입력" className="h-[52px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                onClick={handleEmailVerify}
                disabled={isEmailVerified}
                className="h-[52px] bg-[#212121]"
              >
                {isEmailVerified ? '인증완료' : '인증확인'}
              </Button>
            </div>
          </div>

          {/* 아이디 중복확인 */}
          <div className="flex flex-col gap-[12px]">
            <FormLabel>아이디</FormLabel>
            <div className="flex items-start gap-[12px]">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="flex-1 space-y-0">
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setIsDuplicateChecked(false);
                        }}
                        className="h-[52px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                onClick={handleDuplicateCheck}
                disabled={isDuplicateChecked}
                className="h-[52px] w-[150px] bg-[#212121]"
              >
                {isDuplicateChecked ? '중복확인 완료' : '중복 확인'}
              </Button>
            </div>
          </div>

          {/* 비밀번호 섹션 */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-[12px] space-y-0">
                <FormLabel>비밀번호</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="문자, 숫자, 특수문자 포함 8~20자"
                    className="h-[52px]"
                  />
                </FormControl>
                {/* 실시간 UI 피드백 */}
                <div className="flex gap-[10px] mt-[4px]">
                  {['문자', '숫자', '특수문자', '8~20자'].map((label, i) => {
                    const regexes = [/[a-zA-Z]/, /\d/, /[^A-Za-z0-9]/, /^.{8,20}$/];
                    const isValid = checkPasswordRule(regexes[i]);
                    return (
                      <span
                        key={label}
                        className={`text-[12px] ${isValid ? 'text-blue-500' : 'text-[#9e9e9e]'}`}
                      >
                        ● {label}
                      </span>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passwordConfirm"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="비밀번호 확인"
                    className="h-[52px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="h-[52px] w-full bg-[#212121] text-white mt-4">
            가입하기
          </Button>
        </form>
      </Form>
    </div>
  );
}
