'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ROUTES } from '@/constants/routes';

// 학번은 숫자 10자리
const isValidStudentId = (v) => /^\d{10}$/.test(v);

// ── 임시 mock (실제 API 연동 전까지 백엔드 응답을 흉내) ─────────────
// 등록된 테스트 계정이면 이메일을 반환하고, 그 외에는 '회원 없음' 에러를 던진다.
// API가 준비되면 이 함수를 apis/의 실제 호출(예: findEmailByStudent)로 교체하면 된다.
const MOCK_ACCOUNT = { studentId: '2026000000', name: '홍길동', email: 'ki****@naver.com' };

const mockFindEmail = (studentId, name) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (studentId === MOCK_ACCOUNT.studentId && name === MOCK_ACCOUNT.name) {
        resolve({ email: MOCK_ACCOUNT.email });
      } else {
        // 실제 API에서는 404 등으로 내려올 부분
        const err = new Error('MEMBER_NOT_FOUND');
        err.code = 'MEMBER_NOT_FOUND';
        reject(err);
      }
    }, 500);
  });
// ────────────────────────────────────────────────────────────────

export default function FindEmailVerify({ onNext }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  // 언마운트 시 타이머 정리 (메모리 누수 방지)
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const normalizedId = studentId.trim();
    const normalizedName = name.trim();

    if (!normalizedId || !normalizedName) {
      toast.error('입력 오류', {
        description: '학번과 이름을 모두 입력해 주세요.',
      });
      return;
    }

    if (!isValidStudentId(normalizedId)) {
      toast.error('유효한 학번을 입력해 주세요.', {
        description: '학번은 숫자 10자리로 입력해 주세요.',
      });
      return;
    }

    setLoading(true);
    try {
      // TODO: 실제 API 연동 시 mockFindEmail → apis/의 실제 호출로 교체
      const result = await mockFindEmail(normalizedId, normalizedName);
      onNext(result.email); // 성공: 결과 화면으로 이동 (loading 유지)
    } catch (err) {
      // 존재하지 않는 회원인 경우
      // (실제 API 연동 시엔 err.response?.status === 404 등으로 '회원 없음'과
      //  네트워크/서버 오류를 구분해 처리하면 된다)
      toast.error('존재하지 않는 회원입니다.', {
        description: '회원가입을 해주세요.',
        action: {
          label: '회원가입',
          onClick: () => router.push(ROUTES.SIGNUP),
        },
      });
      setLoading(false); // 실패 시 다시 입력 시도할 수 있게 로딩 해제
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 items-end w-full">
      <div className="flex flex-col gap-[7px] items-start w-full">
        {/* 제목 + 안내 문구 */}
        <div className="flex flex-col gap-[6px] w-full">
          <h1 className="font-semibold text-[24px] text-black tracking-[-0.48px] leading-[1.5]">
            이메일 찾기
          </h1>
          <p className="text-[#b9b9b9] text-[16px] tracking-[-0.32px] leading-[1.6]">
            가입 시 등록한 학번과 이름을 입력해주세요.
          </p>
        </div>

        {/* 입력 필드 (학번 / 이름) */}
        <div className="flex flex-col gap-[6px] items-start w-full">
          <label
            htmlFor="findEmail-studentId"
            className="text-[#212121] text-[16px] tracking-[-0.32px] leading-[1.6]"
          >
            학번
          </label>
          <Input
            id="findEmail-studentId"
            type="text"
            inputMode="numeric"
            maxLength={10}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="2026000000"
            disabled={loading}
            className="h-[52px] text-[16px]"
          />

          <label
            htmlFor="findEmail-name"
            className="text-[#212121] text-[16px] tracking-[-0.32px] leading-[1.6]"
          >
            이름
          </label>
          <Input
            id="findEmail-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
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
        {loading ? '처리 중...' : '인증'}
      </Button>
    </form>
  );
}
