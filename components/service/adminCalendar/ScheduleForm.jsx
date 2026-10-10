'use client';

import * as React from 'react';
import { ImagePlus, Pencil, Plus, X } from 'lucide-react';
import { toast } from '@/lib/toast';

import { Checkbox } from '@/components/ui/checkbox';
import { DEFAULT_SCHEDULE_CATEGORY } from '@/constants/calendar';

import DateField from '@/components/shared/DateField';
import BoardRichEditor from '@/components/shared/board/boardWrite/BoardRichEditor';
import BoardWriteToolbar from '@/components/shared/board/boardWrite/BoardWriteToolbar';
import { apiUrl } from '@/lib/apiBase';
import ScheduleSelect from './ScheduleSelect';
import { FIELD_CLASS, ScheduleFormRow } from './ScheduleFormField';
import { createEventTemplate, deleteEventTemplate, getEventTemplates, updateEventTemplate } from '@/apis/admin/event';
import { getErrorMessage } from '@/apis/auth';

// 셀렉트 후보값.
const pad2 = (n) => String(n).padStart(2, '0');

// ── 반복 일정 (등록 전용, PM 요청 10/10) ─────────────────────────────────────────
// 반복 규칙은 서버에 저장하지 않는다. 폼이 시작일들을 계산해 올리면 부모가 일정을 하나씩 만든다 (개별 수정·삭제 가능).
// 구글 캘린더처럼: 매일 / 매주 / 격주 / 매월 / 매년 / 사용자 지정(N일·N주·N개월·N년마다), 주 단위는 요일 선택,
// 월 단위는 '같은 날짜' 또는 '같은 주의 같은 요일'(둘째 주 화요일), 종료는 날짜까지 또는 N회.
const REPEAT_OPTIONS = [
  { value: 'none', label: '반복 안 함' },
  { value: 'daily', label: '매일' },
  { value: 'weekly', label: '매주' },
  { value: 'biweekly', label: '격주' },
  { value: 'monthly', label: '매월' },
  { value: 'yearly', label: '매년' },
  { value: 'custom', label: '사용자 지정…' },
];
const UNIT_OPTIONS = [
  { value: 'day', label: '일' },
  { value: 'week', label: '주' },
  { value: 'month', label: '개월' },
  { value: 'year', label: '년' },
];
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const ORDINAL_LABELS = ['첫째', '둘째', '셋째', '넷째', '다섯째'];
const MAX_OCCURRENCES = 100; // 한 번에 만드는 상한 — 실수로 몇 년치를 만들지 않게

const toLocalDate = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const toYmd = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const addDaysLocal = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
// 일요일 시작 주의 첫날 — 주 단위 간격 판정에 쓴다
const weekStart = (date) => addDaysLocal(date, -date.getDay());
// 그 달의 N번째 요일 (n 1~5). 없으면 null (다섯째 수요일이 없는 달)
const nthWeekdayOfMonth = (year, month, weekday, n) => {
  const first = new Date(year, month, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  const date = new Date(year, month, 1 + offset + (n - 1) * 7);
  return date.getMonth() === month ? date : null;
};

// 프리셋 → { unit, interval }. custom 은 폼의 값을 그대로 쓴다
const resolveRule = (repeat, custom) => {
  switch (repeat) {
    case 'daily':
      return { unit: 'day', interval: 1 };
    case 'weekly':
      return { unit: 'week', interval: 1 };
    case 'biweekly':
      return { unit: 'week', interval: 2 };
    case 'monthly':
      return { unit: 'month', interval: 1 };
    case 'yearly':
      return { unit: 'year', interval: 1 };
    default:
      return { unit: custom.unit, interval: Math.max(1, Number(custom.interval) || 1) };
  }
};

// 시작일 · 규칙 · 종료 조건 → 시작일 목록('yyyy-MM-dd'). 상한(MAX_OCCURRENCES)을 넘으면 그 앞까지만 돌려준다 (호출자가 길이로 안다)
//   days      : 주 단위일 때 요일 집합
//   monthMode : 월 단위일 때 'date'(같은 날짜) | 'weekday'(같은 주의 같은 요일)
//   end       : { mode: 'until', until: 'yyyy-MM-dd' } | { mode: 'count', count }
function buildOccurrences({ startDate, unit, interval, days, monthMode, end }) {
  const start = toLocalDate(startDate);
  const limit = end.mode === 'count' ? Math.max(1, Number(end.count) || 1) : MAX_OCCURRENCES + 1;
  const until = end.mode === 'until' && end.until ? toLocalDate(end.until) : null;
  const out = [];
  const accept = (date) => {
    if (until && date > until) return false;
    out.push(toYmd(date));
    return out.length < limit && out.length <= MAX_OCCURRENCES;
  };

  if (unit === 'day') {
    for (let date = start; ; date = addDaysLocal(date, interval)) {
      if (!accept(date)) break;
    }
    return out;
  }
  if (unit === 'week') {
    const startWeek = weekStart(start);
    // 시작 주부터 interval 주마다, 그 주의 고른 요일들. 시작일 이전 요일은 건너뛴다
    for (let w = 0; ; w += interval) {
      const base = addDaysLocal(startWeek, w * 7);
      let stop = false;
      for (let d = 0; d < 7; d += 1) {
        if (!days.has(d)) continue;
        const date = addDaysLocal(base, d);
        if (date < start) continue;
        if (!accept(date)) {
          stop = true;
          break;
        }
      }
      if (stop) break;
      if (until && base > until) break;
      if (w > 52 * 10 * interval) break; // 안전장치
    }
    return out;
  }
  if (unit === 'month') {
    const weekday = start.getDay();
    const ordinal = Math.ceil(start.getDate() / 7); // 1~5
    for (let k = 0; ; k += interval) {
      const year = start.getFullYear();
      const month = start.getMonth() + k;
      const date =
        monthMode === 'weekday'
          ? nthWeekdayOfMonth(year, month, weekday, ordinal)
          : new Date(year, month, start.getDate());
      if (k > 12 * 20) break;
      if (!date) continue; // 그 달엔 다섯째 X요일이 없다
      if (monthMode !== 'weekday' && date.getDate() !== start.getDate()) continue; // 31일이 없는 달
      if (until && date > until) break;
      if (!accept(date)) break;
    }
    return out;
  }
  // year
  for (let k = 0; ; k += interval) {
    const date = new Date(start.getFullYear() + k, start.getMonth(), start.getDate());
    if (k > 50) break;
    if (date.getDate() !== start.getDate()) continue; // 2월 29일
    if (!accept(date)) break;
  }
  return out;
}

// 기본 종료일 — 시작일로부터 3개월 뒤 (학기 단위에 가깝다). 관리자가 바꾼다
const defaultUntil = (startDate) => {
  const start = toLocalDate(startDate);
  return toYmd(new Date(start.getFullYear(), start.getMonth() + 3, start.getDate()));
};

// 반복 요약 문구 — "2주마다 화·목, 2026-12-31까지"
function describeRule({ unit, interval, days, monthMode, end, start }) {
  const unitLabel = UNIT_OPTIONS.find((u) => u.value === unit)?.label ?? unit;
  let text = interval === 1 ? { day: '매일', week: '매주', month: '매월', year: '매년' }[unit] : `${interval}${unitLabel}마다`;
  if (unit === 'week') text += ` ${[...days].sort().map((d) => WEEKDAY_LABELS[d]).join('·') || '(요일 없음)'}`;
  if (unit === 'month') {
    text +=
      monthMode === 'weekday'
        ? ` ${ORDINAL_LABELS[Math.ceil(start.getDate() / 7) - 1]} ${WEEKDAY_LABELS[start.getDay()]}요일`
        : ` ${start.getDate()}일`;
  }
  text += end.mode === 'count' ? `, ${end.count}회` : `, ${end.until}까지`;
  return text;
}
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

  // 이미지(첨부). 기존 것은 X 로 삭제 표시(토글), 새 파일은 확인을 누를 때 부모가 올린다 (PM, 2026-09-21)
  const existingImages = schedule?.images ?? [];
  const [removedImageIds, setRemovedImageIds] = React.useState([]);
  const [newFiles, setNewFiles] = React.useState([]); // [{ file, previewUrl }]
  const imageInputRef = React.useRef(null);
  const MAX_IMAGES = 10;

  const toggleRemoveImage = (imageId) =>
    setRemovedImageIds((prev) => (prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId]));

  const addFiles = (fileList) => {
    const picked = Array.from(fileList ?? []).filter((file) => file.type.startsWith('image/'));
    if (!picked.length) return;
    const remaining = MAX_IMAGES - (existingImages.length - removedImageIds.length) - newFiles.length;
    if (picked.length > remaining) {
      toast.error(`이미지는 일정 하나에 ${MAX_IMAGES}장까지 붙일 수 있어요.`);
    }
    const accepted = picked.slice(0, Math.max(0, remaining));
    setNewFiles((prev) => [...prev, ...accepted.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))]);
  };

  const removeNewFile = (index) =>
    setNewFiles((prev) => {
      URL.revokeObjectURL(prev[index]?.previewUrl);
      return prev.filter((_, i) => i !== index);
    });

  // 미리보기 blob URL 은 폼이 닫힐 때 회수한다
  const newFilesRef = React.useRef(newFiles);
  newFilesRef.current = newFiles;
  React.useEffect(() => () => newFilesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl)), []);

  // 선택지가 늦게 도착하면 그때 기본값을 채운다. 이미 값이 있으면(수정이거나 사용자가 골랐으면)
  // 건드리지 않는다. '기타'가 목록에 있으면 그걸 쓰고, 없으면 목록의 첫 번째를 쓴다 —
  // 목록 자체를 하드코딩하지는 않되 '구분 없음'에 가까운 기본값을 유지하기 위함이다.
  React.useEffect(() => {
    if (category || !categories.length) return;

    setCategory(
      categories.includes(DEFAULT_SCHEDULE_CATEGORY) ? DEFAULT_SCHEDULE_CATEGORY : categories[0]
    );
  }, [categories, category]);

  // 세부 사항은 게시글과 같은 편집기(툴바 서식 · 마크다운 저장). 이미지는 위 이미지 칸이 맡으므로 본문 삽입은 끈다 (PM, 2026-09-21)
  const [contentEditor, setContentEditor] = React.useState(null);
  // 회원 전원 알림 — 등록은 기본 켬, 수정은 기본 끔 (고칠 때마다 전원에게 가면 안 된다). 관리자가 정한다 (PM, 2026-09-21)
  const [notify, setNotify] = React.useState(isCreate);

  // 반복 (등록 전용). 요일은 시작일의 요일로 시작한다
  const [repeat, setRepeat] = React.useState('none');
  const [custom, setCustom] = React.useState({ interval: 1, unit: 'week' });
  const [repeatDays, setRepeatDays] = React.useState(() => new Set([toLocalDate(partsToInput(start)).getDay()]));
  const [monthMode, setMonthMode] = React.useState('date'); // 'date' | 'weekday'
  const [repeatEnd, setRepeatEnd] = React.useState(() => ({ mode: 'until', until: defaultUntil(partsToInput(start)), count: 10 }));
  const toggleRepeatDay = (day) =>
    setRepeatDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  const rule = React.useMemo(() => resolveRule(repeat, custom), [repeat, custom]);
  const occurrences = React.useMemo(() => {
    if (!isCreate || repeat === 'none') return null;
    const startDate = partsToInput(start);
    if (repeatEnd.mode === 'until' && (!repeatEnd.until || repeatEnd.until < startDate)) return [];
    if (rule.unit === 'week' && repeatDays.size === 0) return [];
    return buildOccurrences({ startDate, ...rule, days: repeatDays, monthMode, end: repeatEnd });
  }, [isCreate, repeat, rule, repeatDays, monthMode, repeatEnd, start]);

  // 템플릿 (등록 전용, 박수민 요청 10/10) — 정기모임·제작스터디처럼 반복되는 내용을 저장해 두고 불러온다 (event_templates).
  // 제목·구분·세부 사항·시각만 담고 날짜는 담지 않는다. 등록·수정·삭제는 이 폼에서 바로 한다
  const [templates, setTemplates] = React.useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState('');
  const [templateBusy, setTemplateBusy] = React.useState(false);
  const reloadTemplates = React.useCallback(() => {
    getEventTemplates()
      .then((rows) => setTemplates(Array.isArray(rows) ? rows : []))
      .catch(() => {
        /* 템플릿은 보조 기능 — 못 받아도 폼은 그대로 쓴다 */
      });
  }, []);
  React.useEffect(() => {
    if (isCreate) reloadTemplates();
  }, [isCreate, reloadTemplates]);

  const applyTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    const picked = templates.find((item) => String(item.templateId) === String(templateId));
    if (!picked) return;
    setTitle(picked.title ?? '');
    if (picked.category && categories.includes(picked.category)) setCategory(picked.category);
    const html = picked.description ?? '';
    setContent(html);
    contentEditor?.commands?.setContent(html, true);
    const allDay = !picked.startTime;
    setIsAllDay(allDay);
    if (!allDay) {
      setStartTime(toTimeParts(picked.startTime));
      setEndTime(toTimeParts(picked.endTime ?? picked.startTime));
    }
  };

  // 지금 폼의 내용(제목·구분·세부 사항·시각)을 템플릿으로 — 이름은 prompt 대신 제목을 기본값으로 묻는다
  const currentAsTemplate = () => ({
    title: title.trim(),
    category,
    description: content,
    startTime: isAllDay ? null : `${startTime.hour}:${startTime.minute}`,
    endTime: isAllDay ? null : `${endTime.hour}:${endTime.minute}`,
  });
  const saveAsTemplate = async () => {
    if (templateBusy) return;
    if (!title.trim()) {
      toast.error('템플릿으로 저장하려면 제목부터 입력해 주세요.');
      return;
    }
    // eslint-disable-next-line no-alert
    const name = window.prompt('템플릿 이름', title.trim());
    if (name === null) return;
    if (!name.trim()) {
      toast.error('템플릿 이름을 입력해 주세요.');
      return;
    }
    setTemplateBusy(true);
    try {
      const created = await createEventTemplate({ name: name.trim(), ...currentAsTemplate() });
      toast.success(`템플릿 '${created?.name ?? name.trim()}' 을 저장했습니다.`);
      reloadTemplates();
      if (created?.templateId) setSelectedTemplateId(String(created.templateId));
    } catch (error) {
      toast.error(getErrorMessage(error, '템플릿을 저장하지 못했습니다.'));
    } finally {
      setTemplateBusy(false);
    }
  };
  const overwriteTemplate = async () => {
    const picked = templates.find((item) => String(item.templateId) === String(selectedTemplateId));
    if (!picked || templateBusy) return;
    setTemplateBusy(true);
    try {
      await updateEventTemplate(picked.templateId, { name: picked.name, ...currentAsTemplate() });
      toast.success(`템플릿 '${picked.name}' 을 지금 내용으로 바꿨습니다.`);
      reloadTemplates();
    } catch (error) {
      toast.error(getErrorMessage(error, '템플릿을 수정하지 못했습니다.'));
    } finally {
      setTemplateBusy(false);
    }
  };
  const removeTemplate = async () => {
    const picked = templates.find((item) => String(item.templateId) === String(selectedTemplateId));
    if (!picked || templateBusy) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm(`템플릿 '${picked.name}' 을 삭제할까요?`)) return;
    setTemplateBusy(true);
    try {
      await deleteEventTemplate(picked.templateId);
      toast.success('템플릿을 삭제했습니다.');
      setSelectedTemplateId('');
      reloadTemplates();
    } catch (error) {
      toast.error(getErrorMessage(error, '템플릿을 삭제하지 못했습니다.'));
    } finally {
      setTemplateBusy(false);
    }
  };

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

    // 반복: 종료일·요일·개수를 확인하고 시작일 목록을 함께 올린다
    let repeatDates;
    if (occurrences) {
      if (!occurrences.length) {
        toast.error('반복 설정을 확인해 주세요.', { description: '종료일이 시작일보다 빠르거나, 고른 요일에 해당하는 날이 없습니다.' });
        return;
      }
      if (occurrences.length > MAX_OCCURRENCES) {
        toast.error(`반복 일정은 한 번에 ${MAX_OCCURRENCES}개까지 만들 수 있어요.`, { description: '종료일을 앞당겨 주세요.' });
        return;
      }
      repeatDates = occurrences;
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
      // 이미지는 일정이 저장된 뒤 부모가 처리한다 (등록은 eventId 가 생긴 다음에야 올릴 수 있다)
      newImages: newFiles.map((item) => item.file),
      deleteImageIds: removedImageIds,
      notify,
      repeatDates,
    });
  };

  // 종일 체크 — PC 는 종료 시각 옆, 폰은 '날짜 / 시간' 라벨 줄 오른쪽에 같은 요소를 둔다
  const allDayCheckbox = (
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
        {/* 템플릿 — 고르면 제목·구분·세부 사항·시각이 채워진다. 지금 내용을 새 템플릿으로 저장하거나, 고른 템플릿을 덮어쓰기·삭제 (등록 전용) */}
        {isCreate && (
          <ScheduleFormRow label="템플릿" htmlFor="schedule-template">
            <div className="flex flex-wrap items-center gap-[8px]">
              <select
                id="schedule-template"
                value={selectedTemplateId}
                onChange={(event) => applyTemplate(event.target.value)}
                className={`${FIELD_CLASS} w-full sm:w-[260px]`}
              >
                <option value="">{templates.length ? '템플릿 선택…' : '저장된 템플릿이 없어요'}</option>
                {templates.map((item) => (
                  <option key={item.templateId} value={item.templateId}>
                    {item.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={saveAsTemplate}
                disabled={templateBusy}
                className="h-[40px] rounded-[4px] border border-[#b9b9b9] bg-white px-[12px] text-[13px] text-[#212121] hover:bg-[#f6f6f6] disabled:opacity-50"
              >
                지금 내용을 템플릿으로 저장
              </button>
              {selectedTemplateId && (
                <>
                  <button
                    type="button"
                    onClick={overwriteTemplate}
                    disabled={templateBusy}
                    className="h-[40px] rounded-[4px] border border-[#b9b9b9] bg-white px-[12px] text-[13px] text-[#212121] hover:bg-[#f6f6f6] disabled:opacity-50"
                  >
                    템플릿 덮어쓰기
                  </button>
                  <button
                    type="button"
                    onClick={removeTemplate}
                    disabled={templateBusy}
                    className="h-[40px] rounded-[4px] border border-[#b9b9b9] bg-white px-[12px] text-[13px] text-[#ae0000] hover:bg-[#f6f6f6] disabled:opacity-50"
                  >
                    템플릿 삭제
                  </button>
                </>
              )}
            </div>
          </ScheduleFormRow>
        )}

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

        {/* 폰: 라벨 줄을 아래 '시작' 줄의 폭(라벨 32 + 날짜 160 + 시 66 + 분 64 + 간격 24 = 346px)에 맞춰
            '종일' 체크의 오른쪽 끝이 시각 칸 오른쪽 끝과 같은 선에 오게 한다 (PM, 2026-09-24) */}
        <ScheduleFormRow label="날짜 / 시간" labelExtra={allDayCheckbox} labelRowClassName="max-w-[346px]">
          <div className="flex flex-col gap-[12px]">
            {/* 시작 · 종료를 한 줄에 — 각각 날짜 칸(달력) 옆에 그날의 시각. 폰에서는 종료가 아래로 내려온다.
                예전엔 년·월·일 셀렉트 여섯 개 + 달력 버튼 + 시각 셀렉트 네 개가 따로 놀았다 (PM, 2026-09-20) */}
            {/* 시작·종료 묶음은 안에서 줄을 바꾸지 않는다 — 폭이 모자라면 종료 묶음이 통째로 다음 줄로 내려간다.
                안에서 바뀌면 '시작 날짜' 아래에 시각만 덜렁 남아 어느 줄 것인지 헷갈렸다 (1100px 안팎 화면) */}
            <div className="flex flex-wrap items-center gap-x-[24px] gap-y-[12px]">
            {[
              { label: '시작', parts: start, setParts: setStart, time: startTime, setTime: setStartTimeField, min: null },
              { label: '종료', parts: end, setParts: setEnd, time: endTime, setTime: setEndTimeField, min: partsToInput(start) },
            ].map((row) => (
              <div key={row.label} className="flex flex-wrap items-center gap-[8px] sm:flex-nowrap">
                <span className="w-[32px] shrink-0 text-[13px] leading-[1.6] tracking-[-0.26px] text-[#919191]">
                  {row.label}
                </span>
                {/* 높이 지정은 DateField 의 트리거 버튼(자식 div 바로 아래)에만 — [&_button] 처럼 자손 전체로 걸면
                    그 안에 뜨는 날짜 선택 달력의 날짜 버튼까지 40px 로 늘어나 달력이 커진다 (2026-10-05) */}
                <div className="w-[160px] shrink-0 [&>div>button]:h-[40px] [&>div>button]:text-[14px]">
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
                {/* 종일 — PC 는 종료 시각 옆. 폰은 '날짜 / 시간' 라벨 줄 오른쪽(labelExtra)에 두고 여기서는 숨긴다 (PM, 2026-09-21) */}
                {row.label === '종료' && <div className="hidden md:block">{allDayCheckbox}</div>}
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

        {/* 반복 (등록 전용) — 프리셋 또는 사용자 지정(N일·주·개월·년마다) · 요일 · 월 기준 · 종료(날짜/횟수). 만들어질 개수를 미리 보여 준다 */}
        {isCreate && (
          <ScheduleFormRow label="반복" htmlFor="schedule-repeat">
            <div className="flex flex-col gap-[10px]">
              <div className="flex flex-wrap items-center gap-[8px]">
                <select
                  id="schedule-repeat"
                  value={repeat}
                  onChange={(event) => setRepeat(event.target.value)}
                  className={`${FIELD_CLASS} w-[150px]`}
                >
                  {REPEAT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {repeat === 'custom' && (
                  <div className="flex items-center gap-[6px] text-[13px] text-[#454545]">
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={custom.interval}
                      onChange={(event) => setCustom((prev) => ({ ...prev, interval: event.target.value }))}
                      aria-label="반복 간격"
                      className={`${FIELD_CLASS} w-[72px] text-center`}
                    />
                    <select
                      value={custom.unit}
                      onChange={(event) => setCustom((prev) => ({ ...prev, unit: event.target.value }))}
                      aria-label="반복 단위"
                      className={`${FIELD_CLASS} w-[90px]`}
                    >
                      {UNIT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <span>마다</span>
                  </div>
                )}
              </div>

              {repeat !== 'none' && rule.unit === 'week' && (
                <div className="flex items-center gap-[4px]" role="group" aria-label="반복 요일">
                  {WEEKDAY_LABELS.map((label, day) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleRepeatDay(day)}
                      aria-pressed={repeatDays.has(day)}
                      className={`size-[32px] rounded-full text-[13px] transition-colors ${
                        repeatDays.has(day)
                          ? 'bg-[#212121] text-white'
                          : 'border border-[#dedede] text-[#454545] hover:bg-[#f6f6f6]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {repeat !== 'none' && rule.unit === 'month' && (
                <div className="flex flex-wrap items-center gap-[12px] text-[13px] text-[#454545]">
                  {[
                    { value: 'date', label: `매월 ${toLocalDate(partsToInput(start)).getDate()}일` },
                    {
                      value: 'weekday',
                      label: `매월 ${ORDINAL_LABELS[Math.ceil(toLocalDate(partsToInput(start)).getDate() / 7) - 1]} ${
                        WEEKDAY_LABELS[toLocalDate(partsToInput(start)).getDay()]
                      }요일`,
                    },
                  ].map((option) => (
                    <label key={option.value} className="flex cursor-pointer items-center gap-[6px]">
                      <input
                        type="radio"
                        name="schedule-month-mode"
                        value={option.value}
                        checked={monthMode === option.value}
                        onChange={() => setMonthMode(option.value)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              )}

              {repeat !== 'none' && (
                <div className="flex flex-wrap items-center gap-x-[12px] gap-y-[8px] text-[13px] text-[#454545]">
                  <span className="w-[32px] shrink-0 text-[13px] leading-[1.6] tracking-[-0.26px] text-[#919191]">종료</span>
                  <label className="flex cursor-pointer items-center gap-[6px]">
                    <input
                      type="radio"
                      name="schedule-repeat-end"
                      checked={repeatEnd.mode === 'until'}
                      onChange={() => setRepeatEnd((prev) => ({ ...prev, mode: 'until' }))}
                    />
                    날짜까지
                  </label>
                  <div
                    className={`w-[160px] shrink-0 [&>div>button]:h-[40px] [&>div>button]:text-[14px] ${
                      repeatEnd.mode === 'until' ? '' : 'pointer-events-none opacity-40'
                    }`}
                  >
                    <DateField
                      value={repeatEnd.until}
                      min={partsToInput(start)}
                      ariaLabel="반복 종료일"
                      onChange={(value) => setRepeatEnd((prev) => ({ ...prev, mode: 'until', until: value }))}
                    />
                  </div>
                  <label className="flex cursor-pointer items-center gap-[6px]">
                    <input
                      type="radio"
                      name="schedule-repeat-end"
                      checked={repeatEnd.mode === 'count'}
                      onChange={() => setRepeatEnd((prev) => ({ ...prev, mode: 'count' }))}
                    />
                    횟수
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={MAX_OCCURRENCES}
                    value={repeatEnd.count}
                    disabled={repeatEnd.mode !== 'count'}
                    onChange={(event) => setRepeatEnd((prev) => ({ ...prev, count: event.target.value }))}
                    aria-label="반복 횟수"
                    className={`${FIELD_CLASS} w-[72px] text-center disabled:opacity-40`}
                  />
                  <span>회</span>
                </div>
              )}

              {repeat !== 'none' && (
                <p className="text-[12px] leading-[1.6] tracking-[-0.24px] text-[#919191]">
                  {occurrences?.length
                    ? `${describeRule({ ...rule, days: repeatDays, monthMode, end: repeatEnd, start: toLocalDate(partsToInput(start)) })} — ${
                        occurrences.length > MAX_OCCURRENCES ? `${MAX_OCCURRENCES}개 초과` : `${occurrences.length}개`
                      } 일정이 만들어져요 (알림은 첫 일정만)`
                    : '해당하는 날이 없어요 — 종료 조건이나 요일을 확인해 주세요'}
                </p>
              )}
            </div>
          </ScheduleFormRow>
        )}

        <ScheduleFormRow label="세부 사항">
          <div className="flex w-full flex-col gap-[8px]">
            <div className="flex h-[42px] w-full items-center rounded-[6px] border border-[#dedede] bg-white focus-within:border-[#919191]">
              <BoardWriteToolbar editor={contentEditor} allowAttachment={false} />
            </div>
            <div className="flex min-h-[160px] w-full items-stretch rounded-[6px] border border-[#dedede] bg-white focus-within:border-[#919191]">
              <BoardRichEditor
                boardId={null}
                value={content}
                onChange={setContent}
                allowUpload={false}
                onEditorReady={setContentEditor}
                placeholder="내용을 입력하세요"
              />
            </div>
          </div>
        </ScheduleFormRow>

        <ScheduleFormRow label="이미지">
          {/* 다른 칸과 같은 테두리 상자 안에 썸네일 격자 + 맨 끝의 점선 '추가' 칸 (PM: 더 예쁘게, 2026-09-21) */}
          <div className="flex flex-col gap-[6px]">
            <div className="flex flex-wrap gap-[10px] rounded-[6px] border border-[#dedede] bg-white p-[10px]">
              {existingImages.map((image) => {
                const removed = removedImageIds.includes(image.imageId);
                return (
                  <div key={`exist-${image.imageId}`} className="relative size-[88px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={apiUrl(image.url)}
                      alt={image.fileName ?? ''}
                      className={`size-full rounded-[6px] object-cover ${removed ? 'opacity-30 grayscale' : ''}`}
                    />
                    {removed && (
                      <span className="pointer-events-none absolute inset-x-0 bottom-[6px] text-center text-[11px] font-medium text-[#E53935]">
                        삭제 예정
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleRemoveImage(image.imageId)}
                      aria-label={removed ? '삭제 취소' : '이미지 삭제'}
                      title={removed ? '삭제 취소' : '이미지 삭제'}
                      className="absolute -right-[6px] -top-[6px] flex size-[22px] items-center justify-center rounded-full border border-white bg-[#212121] text-white shadow-[0_1px_4px_rgba(0,0,0,0.25)]"
                    >
                      {removed ? <Plus size={12} strokeWidth={2.5} /> : <X size={12} strokeWidth={2.5} />}
                    </button>
                  </div>
                );
              })}
              {newFiles.map((item, index) => (
                <div key={`new-${index}-${item.file.name}`} className="relative size-[88px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.previewUrl} alt={item.file.name} className="size-full rounded-[6px] object-cover" />
                  <span className="pointer-events-none absolute left-[6px] top-[6px] rounded-[4px] bg-[#212121]/80 px-[5px] py-[1px] text-[10px] font-medium text-white">
                    새 사진
                  </span>
                  <button
                    type="button"
                    onClick={() => removeNewFile(index)}
                    aria-label="이미지 빼기"
                    title="이미지 빼기"
                    className="absolute -right-[6px] -top-[6px] flex size-[22px] items-center justify-center rounded-full border border-white bg-[#212121] text-white shadow-[0_1px_4px_rgba(0,0,0,0.25)]"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </div>
              ))}

              {/* 추가 칸 — 사진 칸과 같은 크기의 점선 상자 */}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex size-[88px] flex-col items-center justify-center gap-[4px] rounded-[6px] border border-dashed border-[#b9b9b9] text-[#919191] transition-colors hover:border-[#212121] hover:text-[#212121]"
              >
                <ImagePlus size={20} strokeWidth={1.6} aria-hidden />
                <span className="text-[12px] leading-none tracking-[-0.24px]">추가</span>
              </button>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = '';
                }}
              />
            </div>
            <p className="text-[12px] leading-[1.6] tracking-[-0.24px] text-[#919191]">
              jpg · png · gif · webp, 최대 {MAX_IMAGES}장. 세부 사항 아래에 표시됩니다.
            </p>
          </div>
        </ScheduleFormRow>
      </div>

      {/* 아래 줄: 왼쪽에 회원 알림 체크(입력 칸 시작선에 맞춤) · 오른쪽에 취소·확인. 폰은 체크가 위로 올라간다 (PM, 2026-09-21) */}
      <div className="mt-[22px] flex flex-col gap-[14px] md:flex-row md:items-center md:justify-between">
        <label className="flex w-fit cursor-pointer items-center gap-[8px] md:ms-[92px]">
          <Checkbox
            checked={notify}
            onCheckedChange={(next) => setNotify(next === true)}
            className="size-5 rounded-[2px] border-[#dedede] data-[state=checked]:border-[#212121] data-[state=checked]:bg-[#212121]"
          />
          <span className="text-[14px] leading-[1.6] tracking-[-0.28px] text-[#212121]">
            {isCreate ? '회원 전원에게 알림 보내기' : '(수정) 알림 보내기'}
          </span>
        </label>

      {/* 폰: 취소 왼쪽 끝 · 확인 오른쪽 끝. PC: 둘 다 오른쪽에 나란히 (PM, 2026-09-20) */}
      <div className="flex items-center justify-between gap-[12px] md:justify-end">
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
      </div>
    </form>
  );
}
