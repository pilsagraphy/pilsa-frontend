import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SortSelect({ boardType, value, onValueChange }) {
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
      <SelectTrigger className="w-[135px] h-[52px] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#212121]">
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
