import { TableCell, TableRow } from "@/components/ui/table";
import CategoryBadge from "./CategoryBadge";
import { Link } from "lucide-react";

// { id: 0, title: "", isImportant: false, category: null, comments: 0, likes: 0, views: 0, date: "2026.01.01" },
export default function PostRow({ post, boardType }) {
  return (
    <TableRow className="h-14 text-[16px] border-b border-[#B9B9B9] leading-[1.6] tracking-[-0.02em] text-[#454545]">
      {/* 번호 */}
      {/* (공지사항) 중요 or 게시글번호 */}
      <TableCell className="text-center">
        {boardType === "notices" && post.isImportant ? (
          <CategoryBadge>중요</CategoryBadge>
        ) : (
          post.id
        )}
      </TableCell>

      {/* 제목 */}
      {/* (공지사항 외) 카테고리명 + 게시글제목 */}
      <TableCell className="text-left min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {boardType !== "notices" && post.category && (
            <CategoryBadge>{post.category}</CategoryBadge>
          )}
          <span className="truncate">{post.title}</span>
          {post.isAttachment && (
            <span className="flex-shrink-0">
              <Link size={16} />
            </span>
          )}
        </div>
      </TableCell>

      {/* 댓글 */}
      {/* (공지사항) 표시 X */}
      {boardType !== "notices" && (
        <TableCell className="text-center">
          {post.comments.toLocaleString()}
        </TableCell>
      )}

      {/* 좋아요, 조회수, 등록일 */}
      <TableCell className="text-center">
        {post.likes.toLocaleString()}
      </TableCell>
      <TableCell className="text-center">
        {post.views.toLocaleString()}
      </TableCell>
      <TableCell className="text-center">{post.date}</TableCell>
    </TableRow>
  );
}
