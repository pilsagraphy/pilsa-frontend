import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function CategoryBadge({ children, variant = 'default' }) {
  return (
    <Badge
      className={cn(
        'shrink-0 bg-[#212121] tracking-[-0.02em] text-white',
        variant === 'default' && 'rounded-full px-2 py-0.5 text-[12px] leading-[1.4]',
        variant === 'pinned' &&
          'rounded-md px-1.5 py-0.5 text-[11px] leading-[1.35] md:rounded-full md:px-2 md:text-[12px] md:leading-[1.4]'
      )}
    >
      {children}
    </Badge>
  );
}
