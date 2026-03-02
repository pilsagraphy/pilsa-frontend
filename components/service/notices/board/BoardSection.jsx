"use client";

import SortSelect from "./SortSelect";
import SearchInput from "./SearchInput";
import PostTable from "./PostTable";
import WriteButton from "./WriteButton";
import Pagination from "@/components/shared/PaginationWithEllipsis";

import { useState, useMemo } from "react";

// @param {'notices' | 'free' | 'info'} props.boardType - 게시판 타입
export default function BoardSection({ title, boardType, postsData }) {
  const [currentPage, setCurrentPage] = useState(1);

  const POSTS_PER_PAGE = 10; // 한 페이지 게시글 수 조절. 이 값을 어디서 관리하는지 확인하기 (백엔드 or 프론트) 

  const allPosts = postsData.notices;

  // 데이터 정렬 로직 
  // 백엔드 팀에 데이터가 어떻게 전송되어 오는지 확인한 후에 코드 수정하기 
  const sortedPosts = useMemo(() => {
    return [...allPosts].sort((a, b) => {
      // 1순위: pinned (true가 false보다 앞으로)
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }
      // 2순위: created 날짜 (최신순)
      return new Date(b.created).getTime() - new Date(a.created).getTime();
    });
  }, [allPosts]);

  const totalPages = Math.ceil(sortedPosts.length / POSTS_PER_PAGE);

  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    const end = start + POSTS_PER_PAGE;
    return sortedPosts.slice(start, end);
  }, [currentPage, sortedPosts]);

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
          {boardType !== "notices" && <SortSelect />}
          <SearchInput />
        </div>
      </div>

      {/* 글 목록 */}
      <PostTable posts={paginatedPosts} boardType={boardType} />

      {/* 글쓰기 버튼 */}
      <div className="flex justify-end mt-[34px] mb-[120px]">
        <WriteButton />
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
