import { Badge } from "@/components/ui/badge";

export default function CategoryBadge({ children }) {
  return (
    <Badge className="bg-[#212121] rounded-full px-2 py-0.5 text-[12px] leading-[1.4] tracking-[-0.02em] text-white shrink-0">
      {children}
    </Badge>
  );
}
