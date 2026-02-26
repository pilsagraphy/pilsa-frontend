"use client";

import SortSelect from "./SortSelect";
import SearchInput from "./SearchInput";
import PostTable from "./PostTable";
import WriteButton from "./WriteButton";
import Pagination from "@/components/shared/PaginationWithEllipsis";

// @param {'notices' | 'free' | 'info'} props.boardType - 게시판 타입
export default function BoardSection({ title, boardType, posts }) {
  // ----- [TO-DO] 게시글 정렬 로직 추가하기 ----- //

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col bg-white p-8">
      {/* 게시판 이름 */}
      <h2 className="font-['Pretendard',sans-serif] font-semibold text-[24px] leading-[1.5] tracking-[-0.02em] text-[#212121]">
        {title}
      </h2>

      {/* '목록', 정렬, 검색 */}
      <div className="flex justify-between items-end mt-[10px] mb-4">
        <span className="text-[18px] leading-[1.6] tracking-[-0.02em] text-[#212121]">
          목록
        </span>
        <div className="flex gap-2">
          <SortSelect />
          <SearchInput />
        </div>
      </div>

      {/* 글 목록 */}
      <PostTable posts={posts} boardType={boardType} />

      {/* 글쓰기 버튼 */}
      <div className="flex justify-end mt-[34px] mb-[120px]">
        <WriteButton />
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center">
        <Pagination />
      </div>
    </div>
  );
}
