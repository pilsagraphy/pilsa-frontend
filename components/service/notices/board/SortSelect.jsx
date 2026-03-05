import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SortSelect({ value, onValueChange }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[135px] h-[52px] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#212121]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="latest">최신순</SelectItem>
          <SelectItem value="likes">인기순</SelectItem>
          <SelectItem value="views">조회순</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
