'use client';

import * as React from 'react';
import { Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Checkbox } from '@/components/ui/checkbox';
import { DEFAULT_SCHEDULE_CATEGORY } from '@/constants/calendar';

import DateField from '@/components/shared/DateField';
import ScheduleSelect from './ScheduleSelect';
import { FIELD_CLASS, ScheduleFormRow } from './ScheduleFormField';

// 셀렉트 후보값.
const pad2 = (n) => String(n).padStart(2, '0');
const range = (length, start = 0, step = 1) =>
  Array.from({ length }, (_, i) => pad2(start + i * step));

const HOUR_OPTIONS = range(24);
const MINUTE_OPTIONS = range(12, 0, 5);

const partsToInput = ({ year, month, day }) => `${year}-${month}-${day}`;

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

// 서버가 startTime/endTime('HH:mm')을 받고 내려준다 (2026-09-20).
// 비워 보내면 종일 일정으로 저장되고, 조회 응답도 종일이면 null 을 준다.
const IS_TIME_SUPPORTED = true;

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
 * ※ 종일 체크를 풀면 시 · 분을 고를 수 있고, 그 시각이 구글 캘린더·ICS 구독에도 그대로 반영된다.
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
        {/* 제목과 일정 구분을 한 줄에 — 폰에서는 아래로 내려온다 */}
        <ScheduleFormRow label="제목" htmlFor="schedule-title">
          <div className="flex flex-col gap-[8px] sm:flex-row sm:items-center">
            <input
              id="schedule-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="제목을 입력하세요"
              className={`${FIELD_CLASS} sm:min-w-0 sm:flex-1`}
            />
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
              className="w-full sm:w-[180px] sm:shrink-0"
            />
          </div>
        </ScheduleFormRow>

        <ScheduleFormRow label="날짜 / 시간">
          <div className="flex flex-col gap-[12px]">
            {/* 시작 · 종료를 한 줄에 — 각각 날짜 칸(달력) 옆에 그날의 시각. 폰에서는 종료가 아래로 내려온다.
                예전엔 년·월·일 셀렉트 여섯 개 + 달력 버튼 + 시각 셀렉트 네 개가 따로 놀았다 (PM, 2026-09-20) */}
            <div className="flex flex-col gap-[12px] lg:flex-row lg:items-center lg:gap-[20px]">
            {[
              { label: '시작', parts: start, setParts: setStart, time: startTime, setTime: setStartTimeField, min: null },
              { label: '종료', parts: end, setParts: setEnd, time: endTime, setTime: setEndTimeField, min: partsToInput(start) },
            ].map((row) => (
              <div key={row.label} className="flex flex-wrap items-center gap-[8px]">
                <span className="w-[32px] shrink-0 text-[13px] leading-[1.6] tracking-[-0.26px] text-[#919191]">
                  {row.label}
                </span>
                <div className="w-[160px] shrink-0 [&_button]:h-[40px] [&_button]:text-[14px]">
                  <DateField
                    value={partsToInput(row.parts)}
                    min={row.min}
                    ariaLabel={`${row.label}일`}
                    onChange={(v) => {
                      const next = toDateParts(v);
                      row.setParts(next);
                      // 시작일이 종료일을 넘으면 종료일도 같은 날로 당긴다
                      if (row.label === '시작' && partsToInput(end) < v) setEnd(next);
                    }}
                  />
                </div>
                {renderTimeGroup(row.time, row.setTime, row.label)}
                {/* 종일은 종료 시각 옆에 — 시각을 쓸지 말지는 그 자리에서 정한다 (폰에서도 같은 줄) */}
                {row.label === '종료' && (
                  <label
                    className={`ml-[4px] flex shrink-0 items-center gap-[6px] ${
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
                )}
              </div>
            ))}
            </div>

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

      {/* 폰: 취소 왼쪽 끝 · 확인 오른쪽 끝. PC: 둘 다 오른쪽에 나란히 (PM, 2026-09-20) */}
      <div className="mt-[22px] flex items-center justify-between gap-[12px] md:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-[44px] w-[calc(50%-6px)] max-w-[180px] rounded-[4px] border border-[#b9b9b9] md:w-[140px] bg-white text-[14px] leading-[1.6] tracking-[-0.28px] text-[#212121] transition-colors hover:bg-[#f6f6f6] disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-[44px] w-[calc(50%-6px)] max-w-[180px] rounded-[4px] bg-[#212121] md:w-[140px] text-[14px] leading-[1.6] tracking-[-0.28px] text-white transition-colors hover:bg-[#424242] disabled:opacity-50"
        >
          확인
        </button>
      </div>
    </form>
  );
}
