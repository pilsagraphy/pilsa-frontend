'use client';

import { useEffect, useState } from 'react';

import ReasonDialog from '@/components/common/ReasonDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatMemberLabel } from '@/lib/utils';

// 정지 종료일 드롭다운에 채울 연도 (올해부터 3년치). 종료일은 미래여야 하므로 과거는 넣지 않는다.
const today = new Date();
const CURRENT_YEAR = today.getFullYear();
const CURRENT_MONTH = today.getMonth() + 1;
const CURRENT_DAY = today.getDate();
const YEARS = Array.from({ length: 4 }, (_, i) => CURRENT_YEAR + i);

// 선택한 연도가 올해면 이번 달부터, 그 이후 연도면 1월부터 고를 수 있다 (과거 달 차단)
const monthsForYear = (year) => {
  const start = Number(year) === CURRENT_YEAR ? CURRENT_MONTH : 1;
  return Array.from({ length: 12 - start + 1 }, (_, i) => start + i);
};

// 선택한 연·월의 마지막 날 (일 드롭다운 상한). 둘 중 하나라도 안 고르면 최대 31일까지 연다.
const daysInMonth = (year, month) =>
  year && month ? new Date(Number(year), Number(month), 0).getDate() : 31;

// 선택한 연·월이 이번 달이면 오늘부터, 아니면 1일부터 고를 수 있다 (과거 날짜 차단)
const firstSelectableDay = (year, month) =>
  Number(year) === CURRENT_YEAR && Number(month) === CURRENT_MONTH ? CURRENT_DAY : 1;

const pad2 = (value) => String(value).padStart(2, '0');

// 정지 종료일 드롭다운 공통 스타일 (디자인 시안: 높이 52 · 회색 테두리 · placeholder #9e9e9e)
const dateTriggerClass =
  'h-[52px] rounded-[4px] border-[#b9b9b9] px-[16px] text-[16px] tracking-[-0.32px] text-[#454545] shadow-none data-[placeholder]:text-[#9e9e9e]';

/**
 * 관리자 - 선택한 회원을 정지할 때 뜨는 모달
 *
 * 대상 회원 · 정지 종료일(년/월/일) · 사유를 받는다.
 * 사유 선택 · 취소/확인은 신고 · 조치 모달과 같아서 ReasonDialog가 담당하고,
 * 대상 회원 · 기간(종료일)만 children으로 얹는다.
 * 종료일은 { endDate: 'YYYY-MM-DD' } 형태로 onSubmit에 함께 실어 보내고,
 * 실제 처리(API 호출 · 목록 갱신)는 부모가 담당한다.
 */
export default function MemberSuspendModal({
  open,
  // { memberId, loginId, name, studentNo | studentNumber }
  member = null,
  // 정지 처리 실패 메시지 (있으면 모달 안에 노출)
  error,
  onClose,
  onSubmit,
}) {
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  // 열릴 때마다 종료일 입력값 초기화 (사유는 ReasonDialog가 자체적으로 초기화한다)
  useEffect(() => {
    if (!open) return;
    setYear('');
    setMonth('');
    setDay('');
  }, [open]);

  const months = monthsForYear(year);
  const minDay = firstSelectableDay(year, month);
  const maxDay = daysInMonth(year, month);
  const days = Array.from({ length: Math.max(0, maxDay - minDay + 1) }, (_, i) => minDay + i);

  // 연·월을 바꿔 이미 고른 날이 더는 고를 수 없는 날이 되면(그 달에 없는 날 · 지나간 날) 일 선택을 비운다
  const clampDay = (nextYear, nextMonth) => {
    if (!day) return;
    const nextMin = firstSelectableDay(nextYear, nextMonth);
    const nextMax = daysInMonth(nextYear, nextMonth);
    if (Number(day) < nextMin || Number(day) > nextMax) setDay('');
  };

  const handleYearChange = (next) => {
    setYear(next);
    // 이미 고른 달이 새 연도에서 지나간 달이 되면(예: 올해로 바꿨는데 이미 지난 달을 골라둔 경우) 달·일을 비운다
    if (month && !monthsForYear(next).includes(Number(month))) {
      setMonth('');
      setDay('');
      return;
    }
    clampDay(next, month);
  };

  const handleMonthChange = (next) => {
    setMonth(next);
    clampDay(year, next);
  };

  // 세 값이 모두 채워졌을 때만 종료일이 완성된다
  const endDate = year && month && day ? `${year}-${pad2(month)}-${pad2(day)}` : '';

  // ReasonDialog가 넘겨주는 { reason, detail }에 종료일을 얹어 부모로 올린다
  const handleSubmit = ({ reason, detail }) => {
    onSubmit?.({ endDate, reason, detail });
  };

  const targetUserText = formatMemberLabel({
    loginId: member?.loginId,
    studentId: member?.studentNo ?? member?.studentNumber,
    name: member?.name,
  });

  return (
    <ReasonDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      // 사유가 채워져도 종료일이 없으면 확인을 막는다
      disabled={!endDate}
      error={error}
      contentClassName="w-[432px] max-w-[92vw]"
      title={
        <>
          정말 이 회원을 <span className="font-extrabold">정지</span> 하시겠습니까?
        </>
      }
      // 디자인에는 없지만 스크린리더 안내와 Radix 경고 방지를 위해 넣는다
      description="해당 회원의 정지 종료일과 사유를 고릅니다."
    >
      {/* 대상 회원 */}
      {targetUserText && (
        <div className="flex flex-col gap-[4px]">
          <span className="text-[12px] leading-[1.4] tracking-[-0.24px] text-[#919191]">
            대상 회원
          </span>
          <span className="break-all text-[14px] leading-[1.6] tracking-[-0.28px] text-[#454545]">
            {targetUserText}
          </span>
        </div>
      )}

      {/* 기간(정지 종료일) — 년 / 월 / 일 + 까지 */}
      <div className="flex flex-col gap-[4px]">
        <span className="text-[12px] leading-[1.4] tracking-[-0.24px] text-[#919191]">기간</span>
        <div className="flex flex-wrap items-center gap-[8px]">
          <Select value={year} onValueChange={handleYearChange}>
            <SelectTrigger className={`w-[117px] ${dateTriggerClass}`} aria-label="정지 종료 연도">
              <SelectValue placeholder="년" />
            </SelectTrigger>
            <SelectContent className="max-h-[min(240px,var(--radix-select-content-available-height))]">
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}년
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={month} onValueChange={handleMonthChange}>
            <SelectTrigger className={`w-[106px] ${dateTriggerClass}`} aria-label="정지 종료 월">
              <SelectValue placeholder="월" />
            </SelectTrigger>
            <SelectContent className="max-h-[min(240px,var(--radix-select-content-available-height))]">
              {months.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {pad2(m)}월
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={day} onValueChange={setDay}>
            <SelectTrigger className={`w-[106px] ${dateTriggerClass}`} aria-label="정지 종료 일">
              <SelectValue placeholder="일" />
            </SelectTrigger>
            <SelectContent className="max-h-[min(240px,var(--radix-select-content-available-height))]">
              {days.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {pad2(d)}일
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-[16px] tracking-[-0.32px] text-[#b9b9b9]">까지</span>
        </div>
      </div>
    </ReasonDialog>
  );
}
