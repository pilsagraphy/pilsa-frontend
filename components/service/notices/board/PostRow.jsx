"use client"; 

import { TableCell, TableRow } from "@/components/ui/table";
import CategoryBadge from "./CategoryBadge";
import { Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";

// [notices] postId, title, authorName, likeCount, viewCount, hasAttachment, created, pinned
// [free, info] postId, title, authorName, likeCount, viewCount, commentCount, categoryName, hasAttachment, created
export default function PostRow({ post, boardType }) {
  const router = useRouter();

  // 상세 페이지 이동 핸들러 
  const handleRowClick = () => {
    // boardType과 postId를 조합하여 상세 페이지로 이동 (예: /notices/1) 
    router.push(`/${boardType}/${post.postId}`);
  };

  // 날짜 포맷 : YYYY-MM-DD -> YYYY.MM.DD 
  const formattedDate = post.created?.slice(0, 10).replace(/-/g, ".");

  return (
    <TableRow onClick={handleRowClick} className="h-14 text-[16px] border-b border-[#B9B9B9] leading-[1.6] tracking-[-0.02em] text-[#454545]">
      {/* 1. 게시글 번호 (공지사항 중요글은 배지로 표시) */}
      <TableCell className="text-center">
        {boardType === "notices" && post.pinned ? (
          <CategoryBadge>중요</CategoryBadge>
        ) : (
          post.postId
        )}
      </TableCell>

      {/* 2. 제목 (카테고리 + 제목 + 첨부파일 아이콘) */}
      <TableCell className="text-left min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {boardType !== "notices" && post.categoryName != null && (
            <CategoryBadge>{post.categoryName}</CategoryBadge>
          )}
          <span className="truncate">{post.title}</span>
          {post.hasAttachment && (
            <span className="flex-shrink-0 text-[#919191]">
              <Paperclip size={16} />
            </span>
          )}
        </div>
      </TableCell>

      {/* 3. 댓글 (공지사항은 미표시)*/}
      {boardType !== "notices" && (
        <TableCell className="text-center">
          {post.commentCount?.toLocaleString() || 0}
        </TableCell>
      )}

      {/* 4. 좋아요, 조회수, 등록일 */}
      <TableCell className="text-center">
        {post.likeCount?.toLocaleString() || 0}
      </TableCell>
      <TableCell className="text-center">
        {post.viewCount?.toLocaleString() || 0}
      </TableCell>
      <TableCell className="text-center">{formattedDate}</TableCell>
    </TableRow>
  );
}
