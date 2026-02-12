"use client";

import Searchbox from "./Searchbox";
import ListTable from "./ListTable";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/shared/PaginationWithEllipsis";

export default function BoardSection() {
  const posts = [
    { id: 1, title: "제목제목", date: "2026.01.01" },
    { id: 2, title: "테스트", date: "2026.01.02" },
    { id: 3, title: "테스트 제목", date: "2026.01.03" },
    { id: 4, title: "아아아아아아", date: "2026.01.04" },
    { id: 5, title: "필사그래피", date: "2026.01.05" },
  ];
  //   const posts = [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">목록</h3>
        <Searchbox />
      </div>

      <div>
        <ListTable posts={posts} />
      </div>

      <div className="flex justify-end">
        <Button className="bg-[#DEDEDE] text-black border border-[#BDBDBD] hover:bg-[#cecece]">
          글쓰기
        </Button>
      </div>

      <div className="pt-4">
        <Pagination />
      </div>
    </div>
  );
}
