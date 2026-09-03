'use client';

import * as React from 'react';
import { getDaysInMonth } from 'date-fns';
import { CalendarDays, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Checkbox } from '@/components/ui/checkbox';
import { DEFAULT_SCHEDULE_CATEGORY } from '@/constants/calendar';

import ScheduleDatePicker from './ScheduleDatePicker';
import ScheduleSelect from './ScheduleSelect';
import { FIELD_CLASS, ScheduleFormRow } from './ScheduleFormField';

// 셀렉트 후보값.
const pad2 = (n) => String(n).padStart(2, '0');
const range = (length, start = 0, step = 1) =>
  Array.from({ length }, (_, i) => pad2(start + i * step));

const MONTH_OPTIONS = range(12, 1);
const HOUR_OPTIONS = range(24);
const MINUTE_OPTIONS = range(12, 0, 5);

// 년은 고른 값을 가운데 두고 앞뒤 5년. 시안처럼 최근 연도가 위로 오게 내림차순으로 둔다.
// 시작 · 종료가 각자 자기 값을 기준으로 만든다. 한쪽 기준으로 목록을 공유하면
// 다른 쪽 값이 목록 밖으로 밀려나 다시 고를 수 없게 된다.
function buildYearOptions(year) {
  return Array.from({ length: 11 }, (_, i) => String(year + 5 - i));
}

// 그 해 그 달의 마지막 날. (2월 28 · 29일, 30일인 달)
function lastDayOf({ year, month }) {
  return getDaysInMonth(new Date(Number(year), Number(month) - 1));
}

// 일 후보는 년 · 월에 따라 달라진다. 늘 31일까지 열어 두면 2월 31일 같은 날짜를 만들 수 있고,
// 그 값으로 Date를 만들면 조용히 다음 달로 넘어간다. (new Date(2026, 1, 31) → 3월 3일)
const dayOptionsOf = (parts) => range(lastDayOf(parts), 1);

// 년 · 월을 바꿔 그 달의 일수가 줄면 고른 일자를 마지막 날로 당긴다.
function clampDay(parts) {
  const last = lastDayOf(parts);
  return Number(parts.day) > last ? { ...parts, day: pad2(last) } : parts;
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

// 등록 · 수정 요청 본문에 시각 필드가 없어 시 · 분과 '종일 해제'는 저장되지 않는다.
// (2026-08-28 `GET /v3/api-docs` 확인 — title/category/description/startDate/endDate 5개뿐)
// 시안의 마크업은 그대로 두되 조작만 막는다. 그냥 열어 두면 관리자가 14:00~16:00을 고르고
// 성공 토스트까지 본 뒤 종일로 저장되는, 화면이 거짓말하는 상태가 된다.
// 서버에 startTime/endTime 이 생기면 이 상수를 true 로 바꾸는 것만으로 되돌아간다.
// (보내는 쪽은 apis/admin/event.js 의 toEventPayload)
const IS_TIME_SUPPORTED = false;

/**
 * 관리자 일정 추가 · 수정 폼.
 *
 * schedule이 없으면 '일정 추가', 있으면 '일정 수정'으로 그린다. 입력 항목은 같다.
 * defaultDate('yyyy-MM-dd')는 추가할 때 시작 · 종료일의 초깃값. 없으면 오늘로 채운다.
 *
 * 확인을 누르면 검증을 통과한 값만 onSubmit으로 올린다. 등록 · 수정 요청과 목록 재조회는
 * 부모(AdminCalendarSection)가 맡고, 그 동안 isSubmitting으로 버튼을 잠근다.
 *
 * categories: '일정 구분' 선택지 이름 배열. GET /api/event/categories 를 부모가 받아 넘긴다.
 *   폼이 열릴 때마다 다시 조회하지 않도록 조회는 AdminCalendarSection에서 한 번만 한다.
 *   categoriesError는 그 조회가 실패했다는 뜻이다. 둘 다 비어 있는 상태가 '조회 중'과 '실패'로
 *   갈리므로, 잠긴 셀렉트에 띄울 문구를 가리는 데만 쓴다.
 *
 * ※ 시각(시 · 분)과 종일 체크박스는 서버에 담을 곳이 없어 IS_TIME_SUPPORTED로 잠가 뒀다.
 *   모든 일정이 종일로 저장되고, 폼에도 그렇게 적힌다. 위 상수 주석 참고.
 */
export default function ScheduleForm({
  schedule = null,
  defaultDate = null,
  categories = [],
  categoriesError = false,
  onCancel,
  onSubmit,
  isSubmitting = false,
}) {
  const isCreate = !schedule;
  const [title, setTitle] = React.useState(schedule?.title ?? '');
  // 선택지는 서버에서 오므로 초깃값을 미리 정할 수 없다. 목록이 도착하면 아래 effect가 채운다.
  const [category, setCategory] = React.useState(schedule?.category ?? '');
  const [content, setContent] = React.useState(schedule?.content ?? '');
  // 시각을 저장할 수 없는 동안에는 종일 고정이다. 체크박스가 disabled라 값도 바뀌지 않는다.
  const [isAllDay, setIsAllDay] = React.useState(
    IS_TIME_SUPPORTED ? !schedule?.startTime : true
  );

  const [start, setStart] = React.useState(() => toDateParts(schedule?.startDate ?? defaultDate));
  const [end, setEnd] = React.useState(() =>
    toDateParts(schedule?.endDate ?? schedule?.startDate ?? defaultDate)
  );
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const datePickerTriggerRef = React.useRef(null);
  const [startTime, setStartTime] = React.useState(() => toTimeParts(schedule?.startTime));
  const [endTime, setEndTime] = React.useState(() => toTimeParts(schedule?.endTime));

  // 선택지가 늦게 도착하면 그때 기본값을 채운다. 이미 값이 있으면(수정이거나 사용자가 골랐으면)
  // 건드리지 않는다. '기타'가 목록에 있으면 그걸 쓰고, 없으면 목록의 첫 번째를 쓴다 —
  // 목록 자체를 하드코딩하지는 않되 '구분 없음'에 가까운 기본값을 유지하기 위함이다.
  React.useEffect(() => {
    if (category || !categories.length) return;

    setCategory(
      categories.includes(DEFAULT_SCHEDULE_CATEGORY) ? DEFAULT_SCHEDULE_CATEGORY : categories[0]
    );
  }, [categories, category]);

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

  // normalize: 값이 바뀐 뒤 한 번 더 손보는 함수. 날짜는 일자 clamp에 쓴다.
  const patch = (setter, normalize) => (key) => (value) =>
    setter((prev) => {
      const next = { ...prev, [key]: value };
      return normalize ? normalize(next) : next;
    });

  const setStartField = patch(setStart, clampDay);
  const setEndField = patch(setEnd, clampDay);
  const setStartTimeField = patch(setStartTime);
  const setEndTimeField = patch(setEndTime);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    // 제목은 서버 400 에 기대지 않고 여기서 막는다. 빈 제목이 통과하면 월별 일정에 글자 없는
    // 카드가 생기고, 삭제 모달도 '　일정을 삭제할까요?'가 된다.
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      toast.error('제목을 입력해 주세요.');
      return;
    }

    const startDate = `${start.year}-${start.month}-${start.day}`;
    const endDate = `${end.year}-${end.month}-${end.day}`;
    const from = `${startTime.hour}:${startTime.minute}`;
    const to = `${endTime.hour}:${endTime.minute}`;

    // 날짜 · 시각 모두 0으로 채운 고정 폭이라 문자열 비교로 앞뒤를 가릴 수 있다.
    // 달력 팝오버는 거꾸로 고르면 앞뒤를 바꿔 주지만, 셀렉트를 직접 돌리면 막을 게 없다.
    if (endDate < startDate) {
      toast.error('날짜를 확인해 주세요.', {
        description: '종료일은 시작일보다 빠를 수 없습니다.',
      });
      return;
    }

    // 시각은 같은 날일 때만 따진다. 날짜가 다르면 19:00 ~ 09:00도 정상이다.
    if (!isAllDay && startDate === endDate && to < from) {
      toast.error('시각을 확인해 주세요.', {
        description: '종료 시각은 시작 시각보다 빠를 수 없습니다.',
      });
      return;
    }

    onSubmit?.({
      ...schedule,
      title: trimmedTitle,
      category,
      content,
      startDate,
      endDate,
      startTime: isAllDay ? null : from,
      endTime: isAllDay ? null : to,
    });
  };

  const renderDateGroup = (parts, setField, prefix) => (
    <div className="flex shrink-0 items-center gap-[12px]">
      <ScheduleSelect
        value={parts.year}
        onChange={setField('year')}
        options={buildYearOptions(Number(parts.year) || new Date().getFullYear())}
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
        options={dayOptionsOf(parts)}
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
        {isCreate ? (
          <Plus aria-hidden="true" strokeWidth={1.6} className="size-5 shrink-0" />
        ) : (
          <Pencil aria-hidden="true" strokeWidth={1.6} className="size-5 shrink-0" />
        )}
        {isCreate ? '일정 추가' : '일정 수정'}
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
            options={categories}
            ariaLabel="일정 구분"
            variant="field"
            // 목록을 못 받으면 고를 게 없다. 서버 시드가 바뀌면 어긋나므로 하드코딩 fallback 은
            // 두지 않는다. 잠긴 셀렉트가 빈 칸으로만 보이면 왜 못 고르는지 알 수 없어 문구를 남긴다.
            // 목록이 도착하면 위 effect가 값을 채우므로 placeholder는 잠긴 동안에만 보인다.
            disabled={!categories.length}
            placeholder={categoriesError ? '불러오지 못했습니다' : '불러오는 중입니다'}
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
                  ref={datePickerTriggerRef}
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
                    triggerRef={datePickerTriggerRef}
                    // 확인을 눌렀을 때만 폼에 반영하고 닫는다.
                    onConfirm={(nextStart, nextEnd) => {
                      setStart(nextStart);
                      setEnd(nextEnd);
                      setIsDatePickerOpen(false);
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

            <label
              className={`flex w-fit items-center gap-[6px] md:ms-[2px] ${
                IS_TIME_SUPPORTED ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
            >
              <Checkbox
                checked={isAllDay}
                onCheckedChange={(next) => setIsAllDay(next === true)}
                disabled={!IS_TIME_SUPPORTED}
                className="size-5 rounded-[2px] border-[#dedede] data-[state=checked]:border-[#212121] data-[state=checked]:bg-[#212121]"
              />
              <span className="text-[12px] leading-[1.6] tracking-[-0.24px] text-black">종일</span>
            </label>

            {!IS_TIME_SUPPORTED && (
              <p className="text-[12px] leading-[1.6] tracking-[-0.24px] text-[#919191] md:ms-[2px]">
                시각은 아직 저장되지 않습니다. 모든 일정이 종일로 등록됩니다.
              </p>
            )}
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
          disabled={isSubmitting}
          className="h-[40px] w-[80px] rounded-[4px] border border-[#b9b9b9] bg-white text-[14px] leading-[1.6] tracking-[-0.28px] text-[#212121] transition-colors hover:bg-[#f6f6f6] disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-[40px] w-[80px] rounded-[4px] bg-[#212121] text-[14px] leading-[1.6] tracking-[-0.28px] text-white transition-colors hover:bg-[#424242] disabled:opacity-50"
        >
          확인
        </button>
      </div>
    </form>
  );
}
