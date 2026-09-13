'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ROUTES } from '@/constants/routes';
import { findEmailByStudentNo, getErrorMessage } from '@/apis/auth';

// 학번은 숫자 10자리
const isValidStudentId = (v) => /^\d{10}$/.test(v);


export default function FindEmailVerify({ onNext }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

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
      // POST /api/auth/email/find — 학번+이름이 모두 일치할 때만 마스킹된 이메일을 준다
      const result = await findEmailByStudentNo(normalizedId, normalizedName);
      onNext(result.email); // 성공: 결과 화면으로 이동 (loading 유지)
    } catch (err) {
      if (err?.response?.status === 404) {
        // 일치하는 회원 없음 — 학번·이름 중 하나라도 다르면 여기로 온다
        toast.error('존재하지 않는 회원입니다.', {
          description: '학번과 이름을 다시 확인해 주세요. 가입하지 않으셨다면 회원가입을 해주세요.',
          action: {
            label: '회원가입',
            onClick: () => router.push(ROUTES.SIGNUP),
          },
        });
      } else {
        // 네트워크·서버 오류는 '회원 없음'과 구분해 알린다 (예전 mock 은 전부 회원 없음으로 뭉뚱그렸다)
        toast.error(getErrorMessage(err, '이메일을 조회하지 못했어요. 잠시 후 다시 시도해주세요.'));
      }
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
