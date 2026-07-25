import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SortSelect({ boardType, value, onValueChange, compactSort = false }) {
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

  const options =
    boardType === 'notices'
      ? [
          { value: 'latest', label: '최신순' },
          { value: 'views', label: '조회순' },
        ]
      : [
          { value: 'latest', label: '최신순' },
          { value: 'likes', label: '인기순' },
          { value: 'views', label: '조회순' },
        ];

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-12 w-full min-w-0 shrink-0 text-[15px] leading-[1.6] tracking-[-0.02em] text-[#212121] sm:w-[120px] md:h-[52px] md:w-[135px] md:text-[16px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
