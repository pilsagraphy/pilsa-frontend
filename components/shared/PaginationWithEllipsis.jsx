"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PaginationWithGroup({
  currentPage,
  totalPages,
  onPageChange,
}) {
  if (!totalPages || totalPages <= 0) return null;

  const groupSize = 3;

  const currentGroup = Math.floor((currentPage - 1) / groupSize);
  const startPage = currentGroup * groupSize + 1;
  const endPage = Math.min(startPage + groupSize - 1, totalPages);

  const hasPrevGroup = startPage > 1;
  const hasNextGroup = endPage < totalPages;

  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  return (
    <Pagination>
      <PaginationContent>
        {/* 이전 그룹 버튼 */}
        {hasPrevGroup && (
          <PaginationItem>
            <PaginationLink
              size="icon"
              onClick={() => onPageChange(startPage - groupSize)}
            >
              <ChevronLeft className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>
        )}

        {/* 페이지 번호 */}
        {pages.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              isActive={page === currentPage}
              onClick={() => onPageChange(page)}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}

        {/* 다음 그룹 버튼 */}
        {hasNextGroup && (
          <PaginationItem>
            <PaginationLink
              size="icon"
              onClick={() => onPageChange(startPage + groupSize)}
            >
              <ChevronRight className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}