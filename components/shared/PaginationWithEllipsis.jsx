"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const WINDOW_SIZE = 5;

export default function PaginationWithEllipsis({
  currentPage,
  totalPages,
  onPageChange,
}) {
  if (!totalPages || totalPages <= 0) return null;

  // 현재 페이지가 가운데(3번째)에 오도록 5개 윈도우 계산.
  // 양 끝(앞/뒤 2페이지)에서는 5개를 유지하기 위해 clamp 처리한다.
  const startPage = Math.max(
    1,
    Math.min(
      currentPage - Math.floor(WINDOW_SIZE / 2),
      totalPages - WINDOW_SIZE + 1
    )
  );
  const endPage = Math.min(startPage + WINDOW_SIZE - 1, totalPages);

  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  const isPrevDisabled = currentPage <= 1; // 이전 페이지로 이동
  const isFirstJumpDisabled = currentPage <= 2; // 맨 앞 페이지로 이동
  const isNextDisabled = currentPage >= totalPages; // 다음 페이지로 이동
  const isLastJumpDisabled = currentPage >= totalPages - 1; // 맨 뒤 페이지로 이동

  const navClassName = (disabled) =>
    disabled
      ? "pointer-events-none bg-transparent text-[#D9D9D9] hover:bg-transparent"
      : "cursor-pointer bg-transparent text-[#919191] hover:bg-transparent";

  return (
    <Pagination>
      <PaginationContent>
        {/* 맨 앞 페이지로 이동 */}
        <PaginationItem>
          <PaginationLink
            size="icon"
            aria-label="첫 페이지로 이동"
            aria-disabled={isFirstJumpDisabled}
            className={navClassName(isFirstJumpDisabled)}
            onClick={isFirstJumpDisabled ? undefined : () => onPageChange(1)}
          >
            <ChevronsLeft className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>

        {/* 이전 페이지로 이동 */}
        <PaginationItem>
          <PaginationLink
            size="icon"
            aria-label="이전 페이지로 이동"
            aria-disabled={isPrevDisabled}
            className={navClassName(isPrevDisabled)}
            onClick={
              isPrevDisabled ? undefined : () => onPageChange(currentPage - 1)
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>

        {/* 페이지 번호 - 아웃라인 박스 + 색상 변화로 현재 페이지 표시 */}
        {pages.map((page) => {
          const isActive = page === currentPage;
          return (
            <PaginationItem key={page}>
              <PaginationLink
                isActive={isActive}
                className={`cursor-pointer text-[20px] font-medium ${
                  isActive ? "text-[#212121]" : "text-[#919191]"
                }`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        {/* 다음 페이지로 이동 */}
        <PaginationItem>
          <PaginationLink
            size="icon"
            aria-label="다음 페이지로 이동"
            aria-disabled={isNextDisabled}
            className={navClassName(isNextDisabled)}
            onClick={
              isNextDisabled ? undefined : () => onPageChange(currentPage + 1)
            }
          >
            <ChevronRight className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>

        {/* 맨 뒤 페이지로 이동 */}
        <PaginationItem>
          <PaginationLink
            size="icon"
            aria-label="마지막 페이지로 이동"
            aria-disabled={isLastJumpDisabled}
            className={navClassName(isLastJumpDisabled)}
            onClick={
              isLastJumpDisabled ? undefined : () => onPageChange(totalPages)
            }
          >
            <ChevronsRight className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
