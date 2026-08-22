'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { registerFormSchema, loginIdSchema } from '@/schemas/auth';
import { EMAIL_DOMAINS } from '@/constants/email';
import {
  registerUser,
  checkLoginIdDuplicate,
  checkEmailDuplicate,
  getErrorMessage,
} from '@/apis/auth';
import { sendVerifyCode, verifyEmailCode } from '@/apis/mail';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
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

const ALLOWED_ROLES = ['STUDENTS', 'ALUMNI'];
const MEMBER_TYPE_BY_ROLE = { STUDENTS: 'STUDENT', ALUMNI: 'ALUMNI' };
const DEFAULT_VALUES = {
  name: '',
  department: '',
  studentId: '',
  phone: '',
  emailLocal: '',
  emailDomain: '',
  emailCustom: '',
  emailCode: '',
  username: '',
  password: '',
  passwordConfirm: '',
};

function SignupFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRole = searchParams.get('role') || 'STUDENTS';
  const roleParam = ALLOWED_ROLES.includes(rawRole) ? rawRole : 'STUDENTS';
  const memberTypeForApi = MEMBER_TYPE_BY_ROLE[roleParam];

  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isDuplicateChecked, setIsDuplicateChecked] = useState(false);

  const [isCheckingLoginId, setIsCheckingLoginId] = useState(false);
  const [isSendingEmailCode, setIsSendingEmailCode] = useState(false);
  const [isVerifyingEmailCode, setIsVerifyingEmailCode] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [emailExpireTime, setEmailExpireTime] = useState(0);

  const form = useForm({
    resolver: zodResolver(registerFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
  });

  const emailDomain = form.watch('emailDomain');
  const passwordValue = form.watch('password');

  const buildFinalEmail = (values) => {
    const emailLocal = values.emailLocal?.trim();
    const domain =
      values.emailDomain === 'custom' ? values.emailCustom?.trim() : values.emailDomain?.trim();

    if (!emailLocal || !domain) return '';
    return `${emailLocal}@${domain}`;
  };

  useEffect(() => {
    if (!isEmailSent || emailExpireTime <= 0) return;

    const timer = setInterval(() => {
      setEmailExpireTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isEmailSent, emailExpireTime]);

  const formatTime = (seconds) => {
    const min = String(Math.floor(seconds / 60)).padStart(2, '0');
    const sec = String(seconds % 60).padStart(2, '0');
    return `${min}:${sec}`;
  };

  const resetEmailAuth = () => {
    setIsEmailSent(false);
    setIsEmailVerified(false);
    setEmailExpireTime(0);
    form.setValue('emailCode', '');
  };

  const handleDuplicateCheck = async () => {
    const username = form.getValues('username')?.trim();

    const result = loginIdSchema.safeParse(username);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    try {
      setIsCheckingLoginId(true);
      await checkLoginIdDuplicate(username);
      setIsDuplicateChecked(true);
      toast.success('사용 가능한 아이디입니다.');
    } catch (error) {
      setIsDuplicateChecked(false);
      toast.error(getErrorMessage(error, '아이디 중복 확인에 실패했습니다.'));
    } finally {
      setIsCheckingLoginId(false);
    }
  };

  const handleEmailSend = async () => {
    const values = form.getValues();
    const finalEmail = buildFinalEmail(values);

    if (!finalEmail) {
      toast.error('이메일 주소를 완성해주세요.');
      return;
    }

    try {
      setIsSendingEmailCode(true);

      // 1. 이메일 중복 확인
      await checkEmailDuplicate(finalEmail);

      // 2. 인증번호 발송
      const expireTime = await sendVerifyCode(finalEmail);

      setIsEmailSent(true);
      setIsEmailVerified(false);
      setEmailExpireTime(Number(expireTime) || 0);
      form.setValue('emailCode', '');

      toast.success('인증번호가 발송되었습니다.');
    } catch (error) {
      setIsEmailSent(false);
      setIsEmailVerified(false);
      setEmailExpireTime(0);
      toast.error(getErrorMessage(error, '인증번호 발송에 실패했습니다.'));
    } finally {
      setIsSendingEmailCode(false);
    }
  };

  const handleEmailVerify = async () => {
    const values = form.getValues();
    const finalEmail = buildFinalEmail(values);
    const code = values.emailCode?.trim();

    if (!finalEmail) {
      toast.error('이메일 주소를 완성해주세요.');
      return;
    }

    if (!code) {
      toast.error('인증번호를 입력해주세요.');
      return;
    }

    if (emailExpireTime <= 0) {
      toast.error('인증시간이 만료되었습니다. 다시 발송해주세요.');
      return;
    }

    try {
      setIsVerifyingEmailCode(true);
      const verified = await verifyEmailCode(finalEmail, code);

      if (!verified) {
        setIsEmailVerified(false);
        toast.error('인증번호가 올바르지 않거나 만료되었습니다.');
        return;
      }

      setIsEmailVerified(true);
      toast.success('이메일 인증이 완료되었습니다.');
    } catch (error) {
      setIsEmailVerified(false);
      toast.error(getErrorMessage(error, '이메일 인증에 실패했습니다.'));
    } finally {
      setIsVerifyingEmailCode(false);
    }
  };

  const onSubmit = async (data) => {
    if (!isDuplicateChecked) {
      toast.error('아이디 중복 확인을 해주세요.');
      return;
    }

    if (!isEmailVerified) {
      toast.error('이메일 인증을 완료해주세요.');
      return;
    }

    const safe = (value) => String(value ?? '').trim();

    const finalEmail = buildFinalEmail(data);

    const payload = {
      name: safe(data.name),
      phone: safe(data.phone),
      major: safe(data.department),
      studentNo: safe(data.studentId),
      email: safe(finalEmail),
      loginId: safe(data.username),
      password: data.password ?? '',
      memberType: memberTypeForApi,
    };

    try {
      setIsRegistering(true);
      await registerUser(payload);

      toast.success('회원가입이 완료되었습니다.');

      form.reset(DEFAULT_VALUES);
      setIsEmailSent(false);
      setIsEmailVerified(false);
      setIsDuplicateChecked(false);
      setEmailExpireTime(0);

      router.push('/login');
    } catch (error) {
      toast.error(getErrorMessage(error, '회원가입에 실패했습니다.'));
    } finally {
      setIsRegistering(false);
    }
  };

  const checkPasswordRule = (regex) => regex.test(passwordValue || '');

  return (
    <div className="mx-auto w-full max-w-[600px] py-20 font-['Pretendard',sans-serif]">
      <Toaster richColors position="top-center" />

      <div className="mb-8">
        <span className="inline-block rounded-[4px] bg-[#f0f0f0] px-4 py-2 text-[14px] text-[#212121]">
          {roleParam === 'STUDENTS' ? '재학생' : '졸업생'}
        </span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-[20px]">
          <p className="text-[24px] font-semibold text-[#212121]">회원가입</p>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-[12px] space-y-0">
                <FormLabel>성함</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="실명을 입력해주세요" className="h-[52px]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-[12px] space-y-0">
                <FormLabel>학과</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="학과를 입력해주세요" className="h-[52px]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="studentId"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-[12px] space-y-0">
                <FormLabel>학번</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="2023123456"
                    maxLength={10}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      field.onChange(value);
                    }}
                    className="h-[52px] placeholder:text-[#9e9e9e]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-[12px]">
            <Label>이메일</Label>

            <div className="flex items-center gap-[12px]">
              <FormField
                control={form.control}
                name="emailLocal"
                render={({ field }) => (
                  <FormItem className="flex-1 space-y-0">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="이메일 주소"
                        className="h-[52px]"
                        onChange={(e) => {
                          field.onChange(e);
                          resetEmailAuth();
                        }}
                      />
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
                        <Input
                          {...field}
                          placeholder="직접 입력"
                          className="h-[52px]"
                          onChange={(e) => {
                            field.onChange(e);
                            resetEmailAuth();
                          }}
                        />
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
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          resetEmailAuth();
                        }}
                        value={field.value}
                      >
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
                disabled={isSendingEmailCode}
                className="h-[52px] min-w-[120px] bg-[#212121]"
              >
                {isSendingEmailCode ? '발송중...' : isEmailSent ? '재발송' : '인증번호 발송'}
              </Button>
            </div>

            {isEmailSent && (
              <p className="text-[13px] text-[#666]">남은 시간: {formatTime(emailExpireTime)}</p>
            )}

            <div className="flex gap-[12px]">
              <FormField
                control={form.control}
                name="emailCode"
                render={({ field }) => (
                  <FormItem className="flex-1 space-y-0">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="인증번호 입력"
                        className="h-[52px]"
                        disabled={!isEmailSent || isEmailVerified}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                onClick={handleEmailVerify}
                disabled={!isEmailSent || isEmailVerified || isVerifyingEmailCode}
                className="h-[52px] min-w-[100px] bg-[#212121]"
              >
                {isVerifyingEmailCode ? '확인중...' : isEmailVerified ? '인증완료' : '인증확인'}
              </Button>
            </div>
          </div>

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-[12px] space-y-0">
                <FormLabel>전화번호</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="010-0000-0000"
                    maxLength={13}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '');
                      let formatted = v;
                      if (v.length > 3 && v.length <= 7) {
                        formatted = `${v.slice(0, 3)}-${v.slice(3)}`;
                      } else if (v.length > 7) {
                        formatted = `${v.slice(0, 3)}-${v.slice(3, 7)}-${v.slice(7, 11)}`;
                      }
                      field.onChange(formatted);
                    }}
                    className="h-[52px] placeholder:text-[#9e9e9e]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-[12px]">
            <Label>아이디</Label>
            <div className="flex items-start gap-[12px]">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="flex-1 space-y-0">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="아이디를 입력해주세요"
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
                disabled={isCheckingLoginId || isDuplicateChecked}
                className="h-[52px] w-[150px] bg-[#212121]"
              >
                {isCheckingLoginId
                  ? '확인중...'
                  : isDuplicateChecked
                    ? '중복확인 완료'
                    : '중복 확인'}
              </Button>
            </div>
          </div>

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

                <div className="mt-[4px] flex flex-wrap gap-x-[12px] gap-y-[4px]">
                  {[
                    { label: '문자', regex: /[a-zA-Z]/ },
                    { label: '숫자', regex: /\d/ },
                    { label: '특수문자', regex: /[^A-Za-z0-9]/ },
                    { label: '8~20자', regex: /^.{8,20}$/ },
                  ].map((rule) => {
                    const isValid = checkPasswordRule(rule.regex);
                    return (
                      <span
                        key={rule.label}
                        className={`text-[12px] transition-colors ${
                          isValid ? 'text-blue-600 font-medium' : 'text-[#9e9e9e]'
                        }`}
                      >
                        ● {rule.label}
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
              <FormItem className="flex flex-col gap-[12px] space-y-0">
                <FormLabel>비밀번호 확인</FormLabel>
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

          <Button
            type="submit"
            disabled={isRegistering}
            className="mt-4 h-[52px] w-full bg-[#212121] text-white transition-all hover:bg-[#333]"
          >
            {isRegistering ? '가입 중...' : '가입하기'}
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default function SignupForm() {
  return (
    <Suspense
      fallback={<div className="flex h-screen items-center justify-center">로딩 중...</div>}
    >
      <SignupFormInner />
    </Suspense>
  );
}
