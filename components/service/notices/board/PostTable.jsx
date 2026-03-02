import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PostRow from "./PostRow";

export default function PostTable({ posts, boardType }) {
  return (
    <div className="border-t border-[#212121] overflow-x-auto">
      <Table className="table-fixed w-full min-w-[600px]">
        <TableHeader>
          <TableRow className="h-14 border-b border-[#B9B9B9] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#919191]">
            <TableHead className="w-20 text-center">번호</TableHead>
            <TableHead className="w-min-[120px] text-left">제목</TableHead>
            {boardType !== "notices" && (
              <TableHead className="w-[80px] text-center">댓글</TableHead>
            )}
            <TableHead className="w-[80px] text-center">좋아요</TableHead>
            <TableHead className="w-[80px] text-center">조회수</TableHead>
            <TableHead className="w-[100px] text-center">등록일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!posts?.length ? ( // (!posts || posts.length === 0)와 같은 조건. 게시글이 없으면 true, 있으면 false
            <TableRow className="h-14 text-[16px] leading-[1.6] tracking-[-0.02em] text-[#454545]">
              <TableCell
                colSpan={boardType === "notices" ? 5 : 6}
                className="text-center text-muted-foreground"
              >
                등록된 게시글이 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            posts.map((post) => (
              <PostRow key={post.postId} post={post} boardType={boardType} />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
