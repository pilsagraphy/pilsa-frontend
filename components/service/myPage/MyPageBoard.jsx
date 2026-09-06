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
import SortSelect from '@/components/shared/board/boardList/SortSelect';
import BoardSelect, { BOARD_FILTER_ALL } from '@/components/shared/board/boardList/BoardSelect';
import SearchInput from '@/components/shared/board/boardList/SearchInput';

import { getBoards } from '@/apis/board';
import { formatDotDate } from '@/lib/utils';
import useMyPageBoardStore from '@/stores/useMyPageBoardStore';

// 탭 정의
const TABS = [
  { key: 'posts', label: '내가 쓴 글' },
  { key: 'comments', label: '내가 쓴 댓글' },
  { key: 'likes', label: '좋아요 누른 글' },
];

const PAGE_SIZE = 10;

export default function MyPageBoard() {
  const [activeTab, setActiveTab] = useState('posts');
  // 마이페이지 API 도 공통게시판과 같은 created|viewCount 만 지원한다(인기순 없음)
  // → SortSelect 기본 선택지를 그대로 쓰고, 값도 API 파라미터 그대로 들고 있는다
  const [sortOrder, setSortOrder] = useState('created');
  const [boardFilter, setBoardFilter] = useState(BOARD_FILTER_ALL); // 게시판 필터(boardId 문자열)
  const [searchQuery, setSearchQuery] = useState('');
  const [keyword, setKeyword] = useState(''); // 디바운스가 끝난 실제 검색어
  const [currentPage, setCurrentPage] = useState(1);

  // 게시판 목록은 DB 로 정의되므로 하드코딩하지 않고 받아온다. 실패하면 '전체 게시판'만 남는다.
  const [boards, setBoards] = useState([]);

  // 목록 상태/실행 함수는 스토어에서 가져온다
  const { items, totalPages, isLoading, error, fetchList } = useMyPageBoardStore();

  // '내가 쓴 댓글' 탭은 좋아요·조회수 대신 '내용' 컬럼을 노출 (번호/제목/내용/작성일)
  const isComments = activeTab === 'comments';
  const colSpan = isComments ? 4 : 5;

  // 게시판 필터 선택지 — 진입 시 한 번만. 목록 조회와 독립이라 실패해도 목록은 그대로 뜬다.
  useEffect(() => {
    let alive = true;
    getBoards()
      .then((data) => {
        if (alive) setBoards(data);
      })
      .catch(() => {
        if (alive) setBoards([]); // 못 받아오면 필터 없이 '전체 게시판'으로만 동작
      });
    return () => {
      alive = false;
    };
  }, []);

  // 검색어만 디바운스(연타 방지). 탭·정렬·페이지 전환은 즉시 반영해야 빈 행이 안 보인다.
  useEffect(() => {
    const timer = setTimeout(() => setKeyword(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 탭/페이지/정렬/게시판/검색어가 바뀌면 목록을 즉시 다시 부른다.
  useEffect(() => {
    const params = { page: currentPage, size: PAGE_SIZE };
    if (keyword) params.keyword = keyword;
    if (boardFilter !== BOARD_FILTER_ALL) params.boardId = boardFilter;
    if (!isComments) params.sort = sortOrder; // 댓글 탭은 정렬 없음(서버가 최신순 고정)
    fetchList(activeTab, params);
  }, [activeTab, currentPage, sortOrder, boardFilter, keyword, isComments, fetchList]);

  // 마이페이지를 떠날 때 목록을 비워, 다음 사용자에게 이전 목록이 스쳐 보이지 않게 한다.
  useEffect(() => {
    return () => useMyPageBoardStore.getState().reset();
  }, []);

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
                isActive
                  ? 'font-bold text-[#212121]'
                  : 'font-normal text-[#212121] hover:text-black'
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

      {/* 정렬 · 게시판 · 검색 — 라인 왼쪽 시작을 아래 표 번호↔제목 경계(≈64px)에 맞추고, 검색창이 오른쪽 경계까지 채움 */}
      <div className="mt-[12px] flex flex-col gap-2 sm:flex-row sm:items-center sm:pl-[40px]">
        {/* 정렬·게시판: 트리거 폭 135px → 138px (검색창은 flex-1이라 그만큼 자동 축소) */}
        {/* 댓글 탭은 서버가 최신순 고정이라 고를 수 있게 두면 안 된다 → compactSort(읽기 전용 '최신순') */}
        <div className="md:[&>div]:!w-[140px] md:[&_button]:!w-[140px]">
          <SortSelect
            compactSort={isComments}
            value={sortOrder}
            onValueChange={(v) => {
              setSortOrder(v);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="md:[&_button]:!w-[140px]">
          <BoardSelect
            boards={boards}
            value={boardFilter}
            onValueChange={(v) => {
              setBoardFilter(v);
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
                    key={isComments ? row.commentId : row.postId}
                    className="h-[50px] border-b border-[#B9B9B9] text-[14px] leading-[1.6] tracking-[-0.02em] text-[#454545] md:text-[16px]"
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
                      {formatDotDate(row.created)}
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
