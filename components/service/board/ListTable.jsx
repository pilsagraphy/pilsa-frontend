import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ListTable({ posts }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-center w-16">번호</TableHead>
          <TableHead className="px-10">제목</TableHead>
          <TableHead className="text-right w-28 pr-5">등록일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(!posts || posts.length === 0) && (
          <TableRow>
            <TableCell
              colSpan={3}
              className="text-center text-muted-foreground h-16"
            >
              등록된 게시글이 없습니다.
            </TableCell>
          </TableRow>
        )}
        {posts &&
          posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell className="text-center">{post.id}</TableCell>
              <TableCell className="px-5">{post.title}</TableCell>
              <TableCell className="text-right">{post.date}</TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
