'use client'; // 이 컴포넌트는 클라이언트에서 실행돼 (useState, useForm 같은 훅 쓰려면 필수)

// Next.js에서 URL 쿼리 파라미터(?role=student) 읽는 훅
import { useSearchParams } from 'next/navigation';

// react-hook-form: 폼 상태관리, 유효성 검사를 쉽게 해주는 라이브러리
// useForm: 폼 전체를 관리하는 훅
import { useForm } from 'react-hook-form';

// 상단에 useState 추가 - 아이디 중복확인용도
import { useState } from 'react';

// shadcn의 Form 관련 컴포넌트들
// Form: 전체 폼 감싸는 컨테이너
// FormControl: input 같은 실제 입력 요소 감싸는 컨테이너
// FormField: 하나의 필드(라벨+인풋+에러메시지) 단위로 묶어주는 컴포넌트
// FormItem: FormField 안에서 레이아웃 잡아주는 컴포넌트
// FormLabel: 필드 라벨 (htmlFor 자동 연결됨)
// FormMessage: 에러 메시지 표시해주는 컴포넌트
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// shadcn의 Input 컴포넌트 (기본 input 태그에 스타일 입혀진 것)
import { Input } from '@/components/ui/input';

// shadcn의 Button 컴포넌트
import { Button } from '@/components/ui/button';

// 이메일 shadcn의 toast 컴포넌트
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// shadcn의 Select 관련 컴포넌트들
// Select: 전체 셀렉트 감싸는 컨테이너
// SelectContent: 드롭다운 열렸을 때 나오는 목록 컨테이너
// SelectItem: 드롭다운 목록의 각 항목
// SelectTrigger: 드롭다운 열고 닫는 버튼 (클릭하는 부분)
// SelectValue: 현재 선택된 값 표시
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// 이메일 도메인 드롭다운 옵션 목록
// 컴포넌트 밖에 선언한 이유: 렌더링될 때마다 새로 만들어지지 않게 하기 위해
const EMAIL_DOMAINS = [
  { label: 'gmail.com', value: 'gmail.com' },
  { label: 'naver.com', value: 'naver.com' },
  { label: 'daum.net', value: 'daum.net' },
  { label: 'nate.com', value: 'nate.com' },
  { label: 'kakao.com', value: 'kakao.com' },
  { label: 'hanmail.net', value: 'hanmail.net' },
  { label: 'khu.ac.kr', value: 'khu.ac.kr' },
  { label: '직접 입력하기', value: 'custom' },
];

export default function signup() {
  // URL에서 ?role=student 또는 ?role=graduate 읽어오기
  const searchParams = useSearchParams();
  const role = searchParams.get('role'); // 'student' 또는 'graduate'

  // useForm으로 폼 전체 관리
  // defaultValues: 각 필드의 초기값 설정
  const form = useForm({
    defaultValues: {
      name: '',
      department: '',
      studentId: '',
      emailLocal: '', // 이메일 @ 앞부분
      emailDomain: '', // 이메일 @ 뒷부분 (드롭다운)
      emailCustom: '', // 직접 입력 시 사용
      emailCode: '',
      username: '',
      password: '',
      passwordConfirm: '',
    },
  });

  // emailDomain 필드값을 실시간으로 감시
  // '직접 입력하기' 선택 시 Input으로 전환하기 위해 필요
  const emailDomain = form.watch('emailDomain');

  // 이메일 인증창 추가
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const handleEmailSend = () => {
    const emailLocal = form.getValues('emailLocal');
    if (!emailLocal) {
      toast.error('이메일 주소를 입력해주세요.');
      return;
    }
    console.log('인증번호 발송:', emailLocal);
    setIsEmailSent(true);
    toast.success('인증번호가 발송되었습니다.');
  };

  // 이메일 인증 버튼 핸들러 (마크업 단계라 console.log만)
  const handleEmailVerify = () => {
    const code = form.getValues('emailCode');
    if (!code) {
      toast.error('인증번호를 입력해주세요.');
      return;
    }
    setIsEmailVerified(true);
    toast.success('이메일 인증이 완료되었습니다.');
  };

  // 아이디 중복 확인 상태 추가
  const [isDuplicateChecked, setIsDuplicateChecked] = useState(false);

  // 중복 확인 버튼 핸들러 (마크업 단계라 console.log만)
  const handleDuplicateCheck = () => {
    const username = form.getValues('username');
    // 1. 빈 값 체크
    if (!username) {
      toast.error('아이디를 입력해주세요.');
      return;
    }
    // 2. 영문/숫자 정규식 체크
    const idRegex = /^[a-zA-Z0-9]+$/;
    if (!idRegex.test(username)) {
      toast.error('아이디는 영문과 숫자만 사용할 수 있습니다.');
      return;
    }
    // 3. 길이 체크
    if (username.length < 8) {
      toast.error('아이디는 8글자 이상 입력해주세요.');
      return;
    }
    console.log('중복 확인:', username);
    setIsDuplicateChecked(true);
    toast.success('사용 가능한 아이디입니다.');
  };

  // 비밀번호 규칙
  const passwordValue = form.watch('password');
  // 규칙별로 통과 여부를 체크하는 간단한 로직
  const hasLetter = /[a-zA-Z]/.test(passwordValue || '');
  const hasNumber = /\d/.test(passwordValue || '');
  const hasSpecial = /[@$!%*?&]/.test(passwordValue || '');
  const hasValidLength = passwordValue?.length >= 8 && passwordValue?.length <= 20;

  // 가입하기 버튼 클릭 시 실행 (유효성 검사 통과 후 실행됨)
  const onSubmit = (data) => {
    const finalEmail =
      data.emailDomain === 'custom'
        ? `${data.emailLocal}@${data.emailCustom}`
        : `${data.emailLocal}@${data.emailDomain}`;

    // 서버로 보낼 데이터 정리
    const submitData = {
      ...data,
      email: finalEmail,
      role: role, // URL에서 읽어온 role 값 포함
    };

    console.log('최종 가입 데이터:', submitData);
    toast.success('회원가입 신청이 완료되었습니다!');
  };

  return (
    <div className="mx-auto w-full max-w-[600px] py-20 font-['Pretendard',sans-serif]">
      <Toaster richColors position="top-center" />
      {/* role 뱃지: URL의 role 값에 따라 재학생/졸업생 표시 */}
      <div className="mb-8">
        <span className="inline-block rounded-[4px] bg-[#f0f0f0] px-4 py-2 text-[14px] text-[#212121] tracking-[-0.28px]">
          {role === 'student' ? '재학생' : '졸업생'}
        </span>
      </div>

      {/* Form: shadcn Form 컴포넌트, react-hook-form의 form 객체를 전달 */}
      <Form {...form}>
        {/* form.handleSubmit: 유효성 검사 후 onSubmit 실행 */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-[20px]">
          <p className="text-[24px] font-semibold leading-[1.5] tracking-[-0.48px] text-[#212121]">
            회원가입
          </p>

          {/* ===== 본인 실명 ===== */}
          {/* FormField: control로 form과 연결, name으로 어떤 필드인지 지정 */}
          <FormField
            control={form.control}
            name="name"
            rules={{
              required: '미입력 항목을 입력해주세요.',
              minLength: {
                value: 2,
                message: '이름은 2글자 이상 입력해주세요.',
              },
            }} // 유효성 검사 규칙
            render={(
              { field } // field: input에 연결할 props (value, onChange 등) 자동 제공
            ) => (
              <FormItem className="flex flex-col gap-[12px] space-y-0">
                <FormLabel className="text-[16px] font-normal leading-[1.6] tracking-[-0.32px] text-[#212121]">
                  본인 실명
                </FormLabel>
                <FormControl>
                  {/* {...field}: value, onChange, onBlur 등을 Input에 자동으로 연결 */}
                  <Input
                    {...field}
                    className="h-[52px] rounded-[4px] border-[#dedede] px-[16px] text-[16px] tracking-[-0.32px] focus-visible:ring-0 focus-visible:border-[#212121]"
                  />
                </FormControl>
                {/* FormMessage: rules에서 설정한 에러 메시지 자동으로 표시 */}
                <FormMessage className="text-[12px] leading-[1.4] tracking-[-0.24px] text-[#f44336]" />
              </FormItem>
            )}
          />

          {/* ===== 학과 ===== */}
          <FormField
            control={form.control}
            name="department"
            rules={{ required: '미입력 항목을 입력해주세요.' }}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-[12px] space-y-0">
                <FormLabel className="text-[16px] font-normal leading-[1.6] tracking-[-0.32px] text-[#212121]">
                  학과
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="(예: 컴퓨터공학과)"
                    className="h-[52px] rounded-[4px] border-[#dedede] px-[16px] text-[16px] placeholder:text-[#9e9e9e] tracking-[-0.32px] focus-visible:ring-0 focus-visible:border-[#212121]"
                  />
                </FormControl>
                <FormMessage className="text-[12px] leading-[1.4] tracking-[-0.24px] text-[#f44336]" />
              </FormItem>
            )}
          />

          {/* ===== 학번 ===== */}
          <FormField
            control={form.control}
            name="studentId"
            rules={{
              required: '미입력 항목을 입력해주세요.',
              minLength: {
                value: 8,
                message: '학번 8자리를 정확히 입력해주세요.',
              },
              maxLength: {
                value: 8,
                message: '학번 8자리를 정확히 입력해주세요.',
              },
            }}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-[12px] space-y-0">
                <FormLabel className="text-[16px] font-normal leading-[1.6] tracking-[-0.32px] text-[#212121]">
                  학번
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="(예: 20231234)"
                    maxLength={8}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      field.onChange(value);
                    }}
                    className="h-[52px] rounded-[4px] border-[#dedede] px-[16px] text-[16px] placeholder:text-[#9e9e9e] tracking-[-0.32px] focus-visible:ring-0 focus-visible:border-[#212121]"
                  />
                </FormControl>
                <FormMessage className="text-[12px] leading-[1.4] tracking-[-0.24px] text-[#f44336]" />
              </FormItem>
            )}
          />

          {/* ===== 이메일 ===== */}
          {/* 이메일은 구조가 복잡해서 FormField 두 개를 나란히 배치 */}
          <div className="flex flex-col gap-[16px]">
            <p className="text-[16px] font-normal leading-[1.6] tracking-[-0.32px] text-[#212121]">
              이메일 (본인 인증 시 필요합니다.)
            </p>
            <div className="flex items-center gap-[12px]">
              {/* 이메일 @ 앞부분 입력 */}
              <FormField
                control={form.control}
                name="emailLocal"
                rules={{ required: '미입력 항목을 입력해주세요.' }}
                render={({ field }) => (
                  <FormItem className="flex-1 space-y-0">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="이메일 주소"
                        className="h-[52px] rounded-[4px] border-[#dedede] px-[16px] text-[16px] placeholder:text-[#9e9e9e] tracking-[-0.32px] focus-visible:ring-0 focus-visible:border-[#212121]"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <span className="text-[16px] text-[#919191]">@</span>

              {/* 직접 입력 선택 시 Input으로, 아니면 Select 드롭다운으로 전환 */}
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
                          className="h-[52px] rounded-[4px] border-[#dedede] px-[16px] text-[16px] placeholder:text-[#9e9e9e] tracking-[-0.32px] focus-visible:ring-0 focus-visible:border-[#212121]"
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
                      {/* Select: onValueChange로 선택값 변경, value로 현재값 표시 */}
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-[52px] rounded-[4px] border-[#dedede] px-[16px] text-[16px] text-[#9e9e9e] tracking-[-0.32px] focus:ring-0">
                            <SelectValue placeholder="gmail.com" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* EMAIL_DOMAINS 배열을 map으로 반복 렌더링 */}
                          {EMAIL_DOMAINS.map((domain) => (
                            <SelectItem key={domain.value} value={domain.value}>
                              {domain.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              )}

              {/* 인증번호 발송 버튼 */}
              <Button
                type="button"
                onClick={handleEmailSend}
                disabled={isEmailSent}
                className={`h-[52px] shrink-0 rounded-[4px] px-[16px] text-[16px] font-normal tracking-[-0.32px] text-white transition-colors ${
                  isEmailSent
                    ? 'bg-[#9e9e9e] cursor-not-allowed'
                    : 'bg-[#212121] hover:bg-[#212121]/90'
                }`}
              >
                {isEmailSent ? '발송완료' : '인증번호 발송'}
              </Button>
            </div>

            {/* 인증번호 입력칸 + 인증확인 버튼 */}
            <div className="flex items-start gap-[12px]">
              <FormField
                control={form.control}
                name="emailCode"
                rules={{ required: '인증번호를 입력해주세요.' }}
                render={({ field }) => (
                  <FormItem className="flex-1 space-y-0">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="인증번호 입력"
                        className="h-[52px] rounded-[4px] border-[#dedede] px-[16px] text-[16px] placeholder:text-[#9e9e9e] tracking-[-0.32px] focus-visible:ring-0 focus-visible:border-[#212121]"
                      />
                    </FormControl>
                    <FormMessage className="pt-[12px] text-[12px] leading-[1.4] tracking-[-0.24px] text-[#f44336]" />
                  </FormItem>
                )}
              />

              {/* 인증확인 버튼 */}
              <Button
                type="button"
                onClick={handleEmailVerify}
                disabled={isEmailVerified}
                className={`h-[52px] shrink-0 rounded-[4px] px-[16px] text-[16px] font-normal tracking-[-0.32px] text-white transition-colors ${
                  isEmailVerified
                    ? 'bg-[#9e9e9e] cursor-not-allowed'
                    : 'bg-[#212121] hover:bg-[#212121]/90'
                }`}
              >
                {isEmailVerified ? '인증완료' : '인증확인'}
              </Button>
            </div>
          </div>

          {/* ===== 아이디 ===== */}
          {/* 아이디는 옆에 중복확인 버튼이 있어서 따로 레이아웃 처리 */}
          <div className="flex flex-col gap-[12px]">
            <p className="text-[16px] font-normal leading-[1.6] tracking-[-0.32px] text-[#212121]">
              아이디
            </p>
            <div className="flex items-start gap-[12px]">
              <FormField
                control={form.control}
                name="username"
                rules={{
                  required: '미입력 항목을 입력해주세요.',
                  minLength: {
                    value: 8,
                    message: '아이디는 8글자 이상 입력해주세요.',
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9]+$/,
                    message: '아이디는 영문과 숫자만 사용할 수 있습니다.',
                  },
                }}
                render={({ field }) => (
                  <FormItem className="flex-1 space-y-0">
                    <FormControl>
                      <Input
                        {...field}
                        // 아이디 중복확인 후 수정하면 다시 중복확인 하도록
                        onChange={(e) => {
                          // const value = e.target.value.replace(/[^a-zA-Z0-9]/g, ''); // 영문 , 숫자 외의 입력 막음 < 할지말지고민
                          field.onChange(e); // react-hook-form 기본 onChange 유지
                          setIsDuplicateChecked(false); // 입력값 바뀌면 리셋
                        }}
                        className="h-[52px] rounded-[4px] border-[#dedede] px-[16px] text-[16px] tracking-[-0.32px] focus-visible:ring-0 focus-visible:border-[#212121]"
                      />
                    </FormControl>
                    {/* 에러메시지가 있을 때 아래로 밀리지 않게 mt로 간격 조정 */}
                    <FormMessage className=" pt-[12px] text-[12px] leading-[1.4] tracking-[-0.24px] text-[#f44336]" />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                onClick={handleDuplicateCheck}
                disabled={isDuplicateChecked}
                className={`h-[52px] w-[150px] shrink-0 rounded-[4px] text-[16px] font-normal tracking-[-0.32px] text-white transition-colors ${
                  isDuplicateChecked
                    ? 'bg-[#9e9e9e] cursor-not-allowed'
                    : 'bg-[#212121] hover:bg-[#212121]/90'
                }`}
              >
                {isDuplicateChecked ? '중복확인 완료' : '중복 확인'}
              </Button>
            </div>
          </div>

          {/* ===== 비밀번호 ===== */}
          <FormField
            control={form.control}
            name="password"
            rules={{
              required: '미입력 항목을 입력해주세요.',
              pattern: {
                value: /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/,
                message: '문자, 숫자, 특수문자를 포함하여 8~20자로 입력해주세요.',
              },
            }}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-[12px] space-y-0">
                <FormLabel className="text-[16px] font-normal leading-[1.6] tracking-[-0.32px] text-[#212121]">
                  비밀번호
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="비밀번호 입력 (문자, 숫자, 특수문자 포함 8~20자)"
                    className="h-[52px] rounded-[4px] border-[#dedede] px-[16px] text-[16px] placeholder:text-[#9e9e9e] tracking-[-0.32px] focus-visible:ring-0 focus-visible:border-[#212121]"
                  />
                </FormControl>

                <div className="flex gap-[10px] mt-[4px]">
                  <span className={`text-[12px] ${hasLetter ? 'text-blue-500' : 'text-[#9e9e9e]'}`}>
                    ● 문자
                  </span>
                  <span className={`text-[12px] ${hasNumber ? 'text-blue-500' : 'text-[#9e9e9e]'}`}>
                    ● 숫자
                  </span>
                  <span
                    className={`text-[12px] ${hasSpecial ? 'text-blue-500' : 'text-[#9e9e9e]'}`}
                  >
                    ● 특수문자
                  </span>
                  <span
                    className={`text-[12px] ${hasValidLength ? 'text-blue-500' : 'text-[#9e9e9e]'}`}
                  >
                    ● 8~20자
                  </span>
                </div>

                <FormMessage className="text-[12px] leading-[1.4] tracking-[-0.24px] text-[#f44336]" />
              </FormItem>
            )}
          />

          {/* ===== 비밀번호 확인 ===== */}
          <FormField
            control={form.control}
            name="passwordConfirm"
            rules={{
              required: '미입력 항목을 입력해주세요.',
              // validate: 커스텀 유효성 검사
              // form.getValues('password')로 비밀번호 필드값 가져와서 비교
              validate: (value) =>
                value === form.getValues('password') || '비밀번호가 일치하지 않습니다.',
            }}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-[12px] space-y-0">
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="비밀번호 확인"
                    className="h-[52px] rounded-[4px] border-[#dedede] px-[16px] text-[16px] placeholder:text-[#9e9e9e] tracking-[-0.32px] focus-visible:ring-0 focus-visible:border-[#212121]"
                  />
                </FormControl>
                <FormMessage className="text-[12px] leading-[1.4] tracking-[-0.24px] text-[#f44336]" />
              </FormItem>
            )}
          />

          {/* ===== 가입하기 버튼 ===== */}
          {/* type="submit": 클릭 시 form.handleSubmit 실행 → 유효성 검사 → onSubmit */}
          <Button
            type="submit"
            className="h-[52px] w-full rounded-[4px] bg-[#212121] text-[16px] font-normal tracking-[-0.32px] text-white hover:bg-[#212121]/90"
          >
            가입하기
          </Button>
        </form>
      </Form>
    </div>
  );
}
