import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// 공통게시판 정렬. 새 API 는 created(최신)·viewCount(조회수)만 지원한다.
// options 를 넘기면 기본 선택지 대신 해당 목록을 사용한다 (예: 관리자·마이페이지 재사용).
const DEFAULT_OPTIONS = [
  { value: 'created', label: '최신순' },
  { value: 'viewCount', label: '조회순' },
];

export default function SortSelect({ value, onValueChange, compactSort = false, options }) {
  if (compactSort) {
    return (
      <div
        className="flex h-12 w-full min-w-0 shrink-0 items-center rounded-md border border-input bg-white px-3 text-[15px] leading-[1.6] tracking-[-0.02em] text-[#212121] sm:w-[120px] md:h-[52px] md:w-[135px] md:text-[16px]"
        aria-label="정렬: 최신순"
      >
        최신순
      </div>
    );
  }

  const list = options ?? DEFAULT_OPTIONS;

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-12 w-full min-w-0 shrink-0 text-[15px] leading-[1.6] tracking-[-0.02em] text-[#212121] sm:w-[120px] md:h-[52px] md:w-[135px] md:text-[16px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {list.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
