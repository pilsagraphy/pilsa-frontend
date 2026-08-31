'use client';

import React, { useEffect, useState } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import PaginationWithEllipsis from '@/components/shared/PaginationWithEllipsis';
import SortSelect from '@/components/shared/board/SortSelect';
import CategorySelect from '@/components/shared/board/CategorySelect';
import SearchInput from '@/components/shared/board/SearchInput';

import useMyPageBoardStore from '@/stores/useMyPageBoardStore';

// 탭 정의
const TABS = [
  { key: 'posts', label: '내가 쓴 글' },
  { key: 'comments', label: '내가 쓴 댓글' },
  { key: 'likes', label: '좋아요 누른 글' },
];

const PAGE_SIZE = 10;

// 마이페이지 API 는 정렬이 created|viewCount 만 지원한다(인기순 없음). 그래서 2개만 노출.
const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'views', label: '조회순' },
];
const SORT_MAP = { latest: 'created', views: 'viewCount' };

// 작성일 표시용: ISO/문자열 → '2026.07.14'
function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

export default function MyPageBoard() {
  const [activeTab, setActiveTab] = useState('posts');
  const [sortOrder, setSortOrder] = useState('latest');
  const [category, setCategory] = useState('all'); // TODO: 게시판(boardId) 필터는 GET /api/user/boards 연동 후 연결
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // 목록 상태/실행 함수는 스토어에서 가져온다
  const { items, totalPages, isLoading, error, fetchList } = useMyPageBoardStore();

  // '내가 쓴 댓글' 탭은 좋아요·조회수 대신 '내용' 컬럼을 노출 (번호/제목/내용/작성일)
  const isComments = activeTab === 'comments';
  const colSpan = isComments ? 4 : 5;

  // 탭/페이지/정렬/검색이 바뀌면 목록을 다시 부른다. (검색 연타 방지용 300ms 디바운스)
  useEffect(() => {
    const params = { page: currentPage, size: PAGE_SIZE };
    if (searchQuery.trim()) params.keyword = searchQuery.trim();
    if (!isComments) params.sort = SORT_MAP[sortOrder] ?? 'created'; // 댓글 탭은 정렬 없음

    const timer = setTimeout(() => {
      fetchList(activeTab, params);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeTab, currentPage, sortOrder, searchQuery, isComments, fetchList]);

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

      {/* 정렬 · 카테고리 · 검색 */}
      <div className="mt-[12px] flex flex-col gap-2 sm:flex-row sm:items-center sm:pl-[40px]">
        <div className="md:[&_button]:!w-[140px]">
          <SortSelect
            boardType="free"
            options={SORT_OPTIONS}
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
                <TableHead className="hidden w-[300px] pr-[128px] text-center text-[#424242] md:table-cell">
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
            {isLoading ? (
              <TableRow className="h-14 text-[14px] text-[#454545] md:text-[16px]">
                <TableCell colSpan={colSpan} className="text-center text-muted-foreground">
                  불러오는 중...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow className="h-14 text-[14px] text-[#454545] md:text-[16px]">
                <TableCell colSpan={colSpan} className="text-center text-muted-foreground">
                  {error}
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow className="h-14 text-[14px] text-[#454545] md:text-[16px]">
                <TableCell colSpan={colSpan} className="text-center text-muted-foreground">
                  {isComments ? '작성한 댓글이 없습니다.' : '게시글이 없습니다.'}
                </TableCell>
              </TableRow>
            ) : (
              items.map((row, index) => {
                const no = (currentPage - 1) * PAGE_SIZE + index + 1;
                const title = isComments ? row.postTitle : row.title;
                return (
                  <TableRow
                    key={row.postId ?? row.commentId ?? index}
                    className="h-[50px] cursor-pointer border-b border-[#B9B9B9] text-[14px] leading-[1.6] tracking-[-0.02em] text-[#454545] transition hover:bg-[#F6F6F6] md:text-[16px]"
                  >
                    <TableCell className="text-center">{no}</TableCell>
                    <TableCell className="truncate pl-[28px] text-left">{title}</TableCell>
                    {isComments ? (
                      <TableCell className="hidden w-[300px] truncate pr-[128px] text-center text-[#424242] md:table-cell">
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
                    <TableCell className="text-center text-[#424242]">
                      {formatDate(row.created)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 (공용 컴포넌트 사용) */}
      <div className="flex justify-center">
        <PaginationWithEllipsis
          currentPage={currentPage}
          totalPages={totalPages || 1}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
