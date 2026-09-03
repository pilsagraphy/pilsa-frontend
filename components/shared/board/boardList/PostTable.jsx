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
  boardId,
  board,
  // 목록 상태(페이지·검색어 등)를 글 주소에 함께 실어 보낸다 → 목록으로 정확히 되돌아온다
  listQuery = '',
  loading = false,
  errorMessage = '',
}) {
  const isMdUp = useMinWidthMd();

  const allowComment = Boolean(board?.allowComment);
  const categoryMode = Boolean(board?.categoryMode);

  // md 이상: 번호 · 제목 · (댓글) · 좋아요 · 조회수 · 등록일
  // md 미만: (카테고리 게시판은 번호 숨김) 제목 · 등록일
  const colSpan = isMdUp ? 5 + (allowComment ? 1 : 0) : categoryMode ? 2 : 3;

  return (
    <div className="overflow-x-auto border-t border-[#212121]">
      <Table className="w-full min-w-0 table-fixed md:min-w-[600px]">
        <TableHeader>
          <TableRow className="h-12 border-b border-[#B9B9B9] text-[13px] leading-[1.6] tracking-[-0.02em] text-[#919191] md:h-14 md:text-[16px]">
            <TableHead
              className={cn(
                'text-center md:w-20',
                categoryMode ? 'hidden w-14 md:table-cell' : 'w-14'
              )}
            >
              번호
            </TableHead>
            <TableHead className="min-w-0 text-left">제목</TableHead>
            {allowComment && (
              <TableHead className="hidden w-14 text-center md:table-cell md:w-[80px]">
                댓글
              </TableHead>
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
          ) : !posts?.length ? (
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
              <PostRow
                key={post.postId}
                post={post}
                boardId={boardId}
                board={board}
                listQuery={listQuery}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
