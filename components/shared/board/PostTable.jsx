import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import PostRow from './PostRow';
import { useMinWidthMd } from '@/lib/useMinWidthMd';
import { cn } from '@/lib/utils';

export default function PostTable({
  posts,
  boardType,
  sortOrder = 'latest',
  loading = false,
  errorMessage = '',
}) {
  const isMdUp = useMinWidthMd();
  const isFreeOrInfo = boardType === 'free' || boardType === 'info';

  const colSpan = isMdUp
    ? boardType === 'notices'
      ? 5
      : 6
    : boardType === 'notices'
      ? 3
      : isFreeOrInfo
        ? 2
        : 4;

  return (
    <div className="overflow-x-auto border-t border-[#212121]">
      <Table className="w-full min-w-0 table-fixed md:min-w-[600px]">
        <TableHeader>
          <TableRow className="h-12 border-b border-[#B9B9B9] text-[13px] leading-[1.6] tracking-[-0.02em] text-[#919191] md:h-14 md:text-[16px]">
            <TableHead
              className={cn(
                'text-center md:w-20',
                isFreeOrInfo ? 'hidden w-14 md:table-cell' : 'w-14'
              )}
            >
              번호
            </TableHead>
            <TableHead className="min-w-0 text-left">제목</TableHead>
            {boardType !== 'notices' && (
              <TableHead className="hidden w-14 text-center md:table-cell md:w-[80px]">댓글</TableHead>
            )}
            <TableHead className="hidden w-[80px] text-center md:table-cell">좋아요</TableHead>
            <TableHead className="hidden w-[80px] text-center md:table-cell">조회수</TableHead>
            <TableHead className="w-[88px] text-center md:w-[100px]">등록일</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            <TableRow className="h-12 text-[14px] leading-[1.6] tracking-[-0.02em] text-[#454545] md:h-14 md:text-[16px]">
              <TableCell
                colSpan={colSpan}
                suppressHydrationWarning
                className="text-center text-muted-foreground"
              >
                불러오는 중입니다.
              </TableCell>
            </TableRow>
          ) : errorMessage ? (
            <TableRow className="h-12 text-[14px] leading-[1.6] tracking-[-0.02em] text-[#454545] md:h-14 md:text-[16px]">
              <TableCell
                colSpan={colSpan}
                suppressHydrationWarning
                className="text-center text-muted-foreground"
              >
                {errorMessage}
              </TableCell>
            </TableRow>
          ) : !posts?.length ? ( // (!posts || posts.length === 0)와 같은 조건. 게시글이 없으면 true, 있으면 false
            <TableRow className="h-12 text-[14px] leading-[1.6] tracking-[-0.02em] text-[#454545] md:h-14 md:text-[16px]">
              <TableCell
                colSpan={colSpan}
                suppressHydrationWarning
                className="text-center text-muted-foreground"
              >
                등록된 게시글이 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            posts.map((post) => (
              <PostRow key={post.postId} post={post} boardType={boardType} sortOrder={sortOrder} />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
