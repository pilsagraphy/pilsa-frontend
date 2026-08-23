'use client';

import * as React from 'react';
import { CalendarDays, Pencil } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { DEFAULT_SCHEDULE_CATEGORY, SCHEDULE_CATEGORY_OPTIONS } from '@/constants/calendar';

import ScheduleDatePicker from './ScheduleDatePicker';
import ScheduleSelect from './ScheduleSelect';
import { FIELD_CLASS, ScheduleFormRow } from './ScheduleFormField';

// 셀렉트 후보값. 년은 올해를 가운데 두고 앞뒤 5년까지만 고른다.
const pad2 = (n) => String(n).padStart(2, '0');
const range = (length, start = 0, step = 1) =>
  Array.from({ length }, (_, i) => pad2(start + i * step));

const MONTH_OPTIONS = range(12, 1);
const DAY_OPTIONS = range(31, 1);
const HOUR_OPTIONS = range(24);
const MINUTE_OPTIONS = range(12, 0, 5);

// 시안처럼 최근 연도가 위로 오게 내림차순으로 둔다.
function buildYearOptions(year) {
  return Array.from({ length: 11 }, (_, i) => String(year + 5 - i));
}

// 'yyyy-MM-dd' → { year, month, day }. 값이 없으면 오늘로 채운다.
function toDateParts(value) {
  const fallback = new Date();
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''));

  if (!matched) {
    return {
      year: String(fallback.getFullYear()),
      month: pad2(fallback.getMonth() + 1),
      day: pad2(fallback.getDate()),
    };
  }

  return { year: matched[1], month: matched[2], day: matched[3] };
}

// 'HH:mm' → { hour, minute }. 값이 없으면 00:00.
function toTimeParts(value) {
  const matched = /^(\d{1,2}):(\d{2})/.exec(String(value ?? ''));
  if (!matched) return { hour: '00', minute: '00' };

  return { hour: pad2(Number(matched[1])), minute: matched[2] };
}

/**
 * 관리자 일정 수정 폼.
 *
 * TODO: API 연동 시 확인을 누르면 수정 요청을 보내고 목록을 다시 불러올 것.
 *       지금은 마크업 단계라 입력값을 그대로 onSubmit으로 넘기기만 한다.
 */
export default function ScheduleForm({ schedule, onCancel, onSubmit }) {
  const [title, setTitle] = React.useState(schedule?.title ?? '');
  const [category, setCategory] = React.useState(schedule?.category ?? DEFAULT_SCHEDULE_CATEGORY);
  const [content, setContent] = React.useState(schedule?.content ?? '');
  const [isAllDay, setIsAllDay] = React.useState(!schedule?.startTime);

  const [start, setStart] = React.useState(() => toDateParts(schedule?.startDate));
  const [end, setEnd] = React.useState(() => toDateParts(schedule?.endDate ?? schedule?.startDate));
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [startTime, setStartTime] = React.useState(() => toTimeParts(schedule?.startTime));
  const [endTime, setEndTime] = React.useState(() => toTimeParts(schedule?.endTime));

  // 세부 사항은 칸 안에서 스크롤하지 않고 내용만큼 늘어난다. (페이지 전체가 길어진다)
  const contentRef = React.useRef(null);

  React.useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    // box-sizing: border-box라 scrollHeight(테두리 제외)만 넣으면 테두리 두께만큼 마지막 줄이 잘린다.
    const { borderTopWidth, borderBottomWidth } = getComputedStyle(el);
    const border = parseFloat(borderTopWidth) + parseFloat(borderBottomWidth);

    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + border}px`;
  }, [content]);

  const yearOptions = React.useMemo(
    () => buildYearOptions(Number(start.year) || new Date().getFullYear()),
    [start.year]
  );

  const patch = (setter) => (key) => (value) => setter((prev) => ({ ...prev, [key]: value }));
  const setStartField = patch(setStart);
  const setEndField = patch(setEnd);
  const setStartTimeField = patch(setStartTime);
  const setEndTimeField = patch(setEndTime);

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit?.({
      ...schedule,
      title,
      category,
      content,
      startDate: `${start.year}-${start.month}-${start.day}`,
      endDate: `${end.year}-${end.month}-${end.day}`,
      startTime: isAllDay ? null : `${startTime.hour}:${startTime.minute}`,
      endTime: isAllDay ? null : `${endTime.hour}:${endTime.minute}`,
    });
  };

  const renderDateGroup = (parts, setField, prefix) => (
    <div className="flex shrink-0 items-center gap-[12px]">
      <ScheduleSelect
        value={parts.year}
        onChange={setField('year')}
        options={yearOptions}
        width={85}
        ariaLabel={`${prefix} 년`}
      />
      <ScheduleSelect
        value={parts.month}
        onChange={setField('month')}
        options={MONTH_OPTIONS}
        width={66}
        ariaLabel={`${prefix} 월`}
      />
      <ScheduleSelect
        value={parts.day}
        onChange={setField('day')}
        options={DAY_OPTIONS}
        width={64}
        ariaLabel={`${prefix} 일`}
      />
    </div>
  );

  const renderTimeGroup = (parts, setField, prefix) => (
    <div className="flex shrink-0 items-center gap-[8px]">
      <ScheduleSelect
        value={parts.hour}
        onChange={setField('hour')}
        options={HOUR_OPTIONS}
        width={66}
        ariaLabel={`${prefix} 시`}
        disabled={isAllDay}
      />
      <ScheduleSelect
        value={parts.minute}
        onChange={setField('minute')}
        options={MINUTE_OPTIONS}
        width={64}
        ariaLabel={`${prefix} 분`}
        disabled={isAllDay}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="w-full border-t border-[#DEDEDE] pt-6 md:pt-[30px]">
      <h3 className="flex items-center gap-[16px] text-[16px] font-bold leading-[1.6] tracking-[-0.32px] text-[#454545]">
        <Pencil aria-hidden="true" strokeWidth={1.6} className="size-5 shrink-0" />
        일정 수정
      </h3>

      <div className="mt-6 flex flex-col gap-[26px] md:mt-[34px]">
        <ScheduleFormRow label="제목" htmlFor="schedule-title">
          <input
            id="schedule-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="제목을 입력하세요"
            className={FIELD_CLASS}
          />
        </ScheduleFormRow>

        <ScheduleFormRow label="일정 구분">
          <ScheduleSelect
            value={category}
            onChange={setCategory}
            options={SCHEDULE_CATEGORY_OPTIONS}
            ariaLabel="일정 구분"
            variant="field"
            className="w-full md:max-w-[318px]"
          />
        </ScheduleFormRow>

        <ScheduleFormRow label="날짜 / 시간">
          <div className="flex flex-col gap-[12px]">
            {/* 시작일 ~ 종료일 + 달력에서 고르기 */}
            <div className="flex flex-wrap items-center gap-[12px] md:gap-[20px]">
              {renderDateGroup(start, setStartField, '시작')}
              <span className="w-[26px] text-center text-[16px] leading-[1.6] tracking-[-0.32px] text-[#919191]">
                ~
              </span>
              {renderDateGroup(end, setEndField, '종료')}

              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen((prev) => !prev)}
                  aria-label="달력에서 날짜 고르기"
                  aria-haspopup="dialog"
                  aria-expanded={isDatePickerOpen}
                  className="flex size-[40px] items-center justify-center rounded-[6px] border border-[#dedede] bg-white text-[#454545] transition-colors hover:bg-[#f6f6f6]"
                >
                  <CalendarDays aria-hidden="true" strokeWidth={1.6} className="size-6" />
                </button>

                {isDatePickerOpen && (
                  <ScheduleDatePicker
                    start={start}
                    end={end}
                    onSelectRange={(nextStart, nextEnd) => {
                      setStart(nextStart);
                      setEnd(nextEnd);
                    }}
                    onClose={() => setIsDatePickerOpen(false)}
                  />
                )}
              </div>
            </div>

            {/* 시작 시각 ~ 종료 시각 */}
            <div className="flex flex-wrap items-center gap-[8px]">
              {renderTimeGroup(startTime, setStartTimeField, '시작')}
              <span className="w-[13px] text-center text-[16px] leading-[1.6] tracking-[-0.32px] text-[#dedede]">
                ~
              </span>
              {renderTimeGroup(endTime, setEndTimeField, '종료')}
            </div>

            <label className="flex w-fit cursor-pointer items-center gap-[6px] md:ms-[2px]">
              <Checkbox
                checked={isAllDay}
                onCheckedChange={(next) => setIsAllDay(next === true)}
                className="size-5 rounded-[2px] border-[#dedede] data-[state=checked]:border-[#212121] data-[state=checked]:bg-[#212121]"
              />
              <span className="text-[12px] leading-[1.6] tracking-[-0.24px] text-black">종일</span>
            </label>
          </div>
        </ScheduleFormRow>

        <ScheduleFormRow label="세부 사항" htmlFor="schedule-content">
          <textarea
            ref={contentRef}
            id="schedule-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={1}
            placeholder="내용을 입력하세요"
            className="min-h-[118px] w-full resize-none overflow-hidden rounded-[6px] border border-[#dedede] bg-white px-[15px] py-[8px] text-[14px] leading-[1.6] tracking-[-0.28px] text-[#212121] outline-none transition-colors placeholder:text-[#212121] focus:border-[#919191]"
          />
        </ScheduleFormRow>
      </div>

      <div className="mt-[22px] flex items-center justify-center gap-[12px] md:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="h-[40px] w-[80px] rounded-[4px] border border-[#b9b9b9] bg-white text-[14px] leading-[1.6] tracking-[-0.28px] text-[#212121] transition-colors hover:bg-[#f6f6f6]"
        >
          취소
        </button>
        <button
          type="submit"
          className="h-[40px] w-[80px] rounded-[4px] bg-[#212121] text-[14px] leading-[1.6] tracking-[-0.28px] text-white transition-colors hover:bg-[#424242]"
        >
          확인
        </button>
      </div>
    </form>
  );
}
