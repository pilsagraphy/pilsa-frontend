'use client';

import React, { useMemo, useState } from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination';
import SortSelect from '@/components/shared/board/SortSelect';
import CategorySelect from '@/components/shared/board/CategorySelect';
import SearchInput from '@/components/shared/board/SearchInput';

// 탭 정의
const TABS = [
  { key: 'posts', label: '내가 쓴 글' },
  { key: 'comments', label: '내가 쓴 댓글' },
  { key: 'likes', label: '좋아요 누른 글' },
];

// TODO: API 연결 (탭별 목록 조회)
const MOCK_ROWS = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  no: i + 1,
  title: '제목입니다',
  content: '내용',
  likeCount: 0,
  viewCount: 0,
  createdAt: '2026.07.14',
}));

export default function MyPageBoard() {
  const [activeTab, setActiveTab] = useState('posts');
  const [sortOrder, setSortOrder] = useState('latest');
  const [category, setCategory] = useState(''); // 기본값 미선택 → 플레이스홀더 '카테고리' 노출
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // 마크업 단계: 목업 데이터 그대로 노출
  const rows = useMemo(() => MOCK_ROWS, []);
  // '내가 쓴 댓글' 탭은 좋아요·조회수 대신 '내용' 컬럼을 노출
  const isComments = activeTab === 'comments';
  const totalPages = 5;
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex w-full flex-col gap-[30px]">
      {/* 탭 */}
      <div className="relative flex w-[calc(100%+15px)] items-end gap-[24px] border-b border-[#BDBDBD]">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setCurrentPage(1);
              }}
              className={`relative -mb-px pb-[8px] text-[16px] leading-[1.6] tracking-[-0.02em] transition-colors ${
                isActive ? 'font-bold text-[#212121]' : 'font-normal text-[#212121] hover:text-black'
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute -bottom-px left-0 h-[2px] w-full bg-[#212121]" />
              )}
            </button>
          );
        })}
      </div>

      {/* 정렬 · 카테고리 · 검색 — 라인 왼쪽 시작을 아래 표 번호↔제목 경계(≈64px)에 맞추고, 검색창이 오른쪽 경계까지 채움 */}
      <div className="mt-[12px] flex flex-col gap-2 sm:flex-row sm:items-center sm:pl-[40px]">
        {/* 정렬·카테고리: 트리거 폭 135px → 138px (검색창은 flex-1이라 그만큼 자동 축소) */}
        <div className="md:[&_button]:!w-[140px]">
          <SortSelect
            boardType="free"
            value={sortOrder}
            onValueChange={(v) => {
              setSortOrder(v);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="md:[&_button]:!w-[140px]">
          <CategorySelect
            boardType="free"
            value={category}
            onValueChange={(v) => {
              setCategory(v);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="min-w-0 sm:flex-1 [&>*]:!max-w-none [&_svg]:!size-[17px]">
          <SearchInput
            value={searchQuery}
            onChange={(v) => {
              setSearchQuery(v);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* 목록 테이블 (마지막 행 아래 줄까지 표시) */}
      <div className="overflow-x-auto border-b border-[#B9B9B9]">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow className="h-12 border-b border-[#B9B9B9] text-[14px] leading-[1.6] tracking-[-0.02em] text-[#424242] md:text-[16px]">
              <TableHead className="w-[64px] text-center text-[#424242]">번호</TableHead>
              <TableHead className="min-w-0 pl-[48px] text-left text-[#424242]">제목</TableHead>
              {isComments ? (
                <TableHead className="hidden min-w-0 w-[300px] pr-[128px] text-center text-[#424242] md:table-cell">
                  내용
                </TableHead>
              ) : (
                <>
                  <TableHead className="hidden w-[72px] text-center text-[#424242] md:table-cell">
                    좋아요
                  </TableHead>
                  <TableHead className="hidden w-[72px] text-center text-[#424242] md:table-cell">
                    조회수
                  </TableHead>
                </>
              )}
              <TableHead className="w-[92px] text-center text-[#424242]">작성일</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="h-14 text-[14px] text-[#454545] md:text-[16px]">
                <TableCell colSpan={isComments ? 4 : 5} className="text-center text-muted-foreground">
                  게시글이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="h-[50px] cursor-pointer border-b border-[#B9B9B9] text-[14px] leading-[1.6] tracking-[-0.02em] text-[#454545] transition hover:bg-[#F6F6F6] md:text-[16px]"
                >
                  <TableCell className="text-center">{row.no}</TableCell>
                  <TableCell className="truncate pl-[28px] text-left">{row.title}</TableCell>
                  {isComments ? (
                    <TableCell className="hidden truncate w-[300px] pr-[128px] text-center text-[#424242] md:table-cell">
                      {row.content}
                    </TableCell>
                  ) : (
                    <>
                      <TableCell className="hidden text-center text-[#424242] md:table-cell">
                        {row.likeCount}
                      </TableCell>
                      <TableCell className="hidden text-center text-[#424242] md:table-cell">
                        {row.viewCount}
                      </TableCell>
                    </>
                  )}
                  <TableCell className="text-center text-[#424242]">{row.createdAt}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 ( ‹ 1 2 3 4 5 › ) */}
      <div className="flex justify-center">
        <Pagination>
          <PaginationContent className="items-center gap-[4px]">
            {/* 이전 */}
            <PaginationItem>
              <PaginationLink
                size="icon"
                aria-label="이전 페이지"
                aria-disabled={currentPage <= 1}
                className={`bg-transparent hover:bg-transparent ${
                  currentPage <= 1
                    ? 'pointer-events-none text-[#D9D9D9]'
                    : 'cursor-pointer text-[#919191]'
                }`}
                onClick={currentPage <= 1 ? undefined : () => setCurrentPage(currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </PaginationLink>
            </PaginationItem>

            {/* 페이지 번호 */}
            {pageNumbers.map((page) => {
              const isActive = page === currentPage;
              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    aria-current={isActive ? 'page' : undefined}
                    className={`cursor-pointer border-0 bg-transparent text-[16px] hover:bg-transparent ${
                      isActive ? 'font-bold text-[#212121]' : 'font-normal text-[#919191]'
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            {/* 다음 */}
            <PaginationItem>
              <PaginationLink
                size="icon"
                aria-label="다음 페이지"
                aria-disabled={currentPage >= totalPages}
                className={`bg-transparent hover:bg-transparent ${
                  currentPage >= totalPages
                    ? 'pointer-events-none text-[#D9D9D9]'
                    : 'cursor-pointer text-[#919191]'
                }`}
                onClick={
                  currentPage >= totalPages ? undefined : () => setCurrentPage(currentPage + 1)
                }
              >
                <ChevronRight className="h-4 w-4" />
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
