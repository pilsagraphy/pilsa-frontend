import { z } from 'zod';

// 개별 필드 스키마 (재사용 가능)
export const nameSchema = z
  .string()
  .min(1, { message: '미입력 항목을 입력해주세요.' }) // 필수 입력 체크
  .min(2, { message: '이름은 2글자 이상 입력해주세요.' })
  .regex(/^[a-zA-Zㄱ-ㅎ가-힣]+$/, { message: '이름은 문자만 입력할 수 있습니다.' });

export const studentIdSchema = z
  .string()
  .min(1, { message: '미입력 항목을 입력해주세요.' })
  .regex(/^\d+$/, { message: '학번은 숫자만 입력할 수 있습니다.' })
  .length(10, { message: '학번 10자리를 정확히 입력해주세요.' }); // 10자리로 통일 예시

export const loginIdSchema = z
  .string()
  .min(1, { message: '미입력 항목을 입력해주세요.' })
  .min(8, { message: '아이디는 최소 8자 이상이어야 합니다.' })
  .regex(/^[a-zA-Z0-9]+$/, { message: '아이디는 영문과 숫자만 입력할 수 있습니다.' });

export const passwordSchema = z
  .string()
  .min(1, { message: '미입력 항목을 입력해주세요.' })
  .min(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  .max(20, { message: '비밀번호는 최대 20자까지 가능합니다.' })
  .regex(/[A-Za-z]/, { message: '문자 포함 여부를 확인해주세요.' })
  .regex(/[0-9]/, { message: '숫자 포함 여부를 확인해주세요.' })
  .regex(/[^A-Za-z0-9]/, { message: '특수문자 포함 여부를 확인해주세요.' });

export const emailCodeSchema = z
  .string()
  .min(1, { message: '미입력 항목을 입력해주세요.' })
  .regex(/^\d{6}$/, { message: '인증번호 6자리를 정확히 입력해주세요.' });

export const emailSchema = z.email({
  message: '올바른 이메일 형식이 아닙니다.',
});

export const phoneSchema = z
  .string()
  .min(1, { message: '미입력 항목을 입력해주세요.' })
  .regex(/^010-\d{4}-\d{4}$/, { message: '010-0000-0000 형식으로 입력해주세요.' });

// 전체 회원가입 폼 스키마
export const registerFormSchema = z
  .object({
    name: nameSchema,
    department: z.string().min(1, { message: '학과를 입력해주세요.' }), // 학과 추가
    studentId: studentIdSchema,
    emailLocal: z.string().min(1, { message: '이메일을 입력해주세요.' }), // 이메일 앞자리
    emailDomain: z.string().min(1, { message: '선택해주세요.' }), // 도메인
    emailCustom: z.string().optional(), // 직접 입력은 선택적
    emailCode: emailCodeSchema,
    phone: phoneSchema,
    username: loginIdSchema,
    password: passwordSchema,
    passwordConfirm: z.string().min(1, { message: '비밀번호 확인을 입력해주세요.' }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirm'],
  });
