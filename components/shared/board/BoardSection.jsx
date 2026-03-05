"use client";

import SortSelect from "./SortSelect";
import CategorySelect from "./CategorySelect";
import SearchInput from "./SearchInput";
import PostTable from "./PostTable";
import WriteButton from "./WriteButton";
import PaginationWithEllipsis from "@/components/shared/PaginationWithEllipsis";

import { useState, useMemo, useEffect } from "react";

// @param {'notices' | 'free' | 'info'} props.boardType - 게시판 타입
export default function BoardSection({ title, boardType, postsData }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("latest"); // 정렬 상태
  const [searchQuery, setSearchQuery] = useState(""); // 검색 상태
  const [category, setCategory] = useState(""); // 카테고리 상태

  const POSTS_PER_PAGE = 10; // 백엔드에서 관리하는 정보로, API 개발 시 수정/삭제될 예정. 현재는 페이지네이션 테스트를 위해서 남겨둠
  const allPosts = postsData.posts || [];

  // 1. 검색(제목, 작성자) 및 카테고리 필터링
  const filteredPosts = useMemo(() => {
    let filtered = allPosts;

    // 카테고리 필터링
    if (boardType !== "notices" && category && category !== "all") {
      filtered = filtered.filter((post) => post.categoryName === category);
    }

    // 검색어 필터링
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(lower) ||
          post.authorName?.toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [allPosts, searchQuery, category, boardType]);

  // 2. 정렬 로직 (pinned 우선 + 정렬 조건)
  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      // 공지사항 게시판일 경우만 pinned 체크
      if (boardType === "notices") {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      }

      if (sortOrder === "likes") return b.likeCount - a.likeCount;
      if (sortOrder === "views") return b.viewCount - a.viewCount;
      return new Date(b.created).getTime() - new Date(a.created).getTime();
    });
  }, [filteredPosts, sortOrder, boardType]);

  // 3. 페이지네이션 로직
  const totalPages = Math.ceil(sortedPosts.length / POSTS_PER_PAGE);
  // const totalPages = postsData.totalPages;

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
      <div className="flex justify-between items-end mt-[10px] mb-4 gap-10">
        <span className="text-[18px] leading-[1.6] tracking-[-0.02em] text-[#212121] shrink-0">
          목록
        </span>
        <div className="flex gap-2">
          <SortSelect value={sortOrder} onValueChange={setSortOrder} />
          {/* 카테고리 선택 : 자유게와 정보게에서만 나타남 */}
          {boardType !== "notices" && (
            <CategorySelect
              boardType={boardType}
              value={category}
              onValueChange={(val) => {
                setCategory(val);
                setCurrentPage(1); // 카테고리 변경 시 1페이지로 리셋
              }}
            />
          )}
          <SearchInput value={searchQuery} onChange={setSearchQuery} />
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
        <PaginationWithEllipsis
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
