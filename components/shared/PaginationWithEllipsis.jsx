import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PaginationWithEllipsis() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink aria-label="이전 페이지" href="#" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>

        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>

        <PaginationItem>
          <PaginationLink href="#">2</PaginationLink>
        </PaginationItem>

        <PaginationItem>
          <PaginationLink href="#" isActive>
            3
          </PaginationLink>
        </PaginationItem>

        <PaginationItem>
          <PaginationLink href="#">4</PaginationLink>
        </PaginationItem>

        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>

        <PaginationItem>
          <PaginationLink aria-label="다음 페이지" href="#" size="icon">
            <ChevronRight className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
