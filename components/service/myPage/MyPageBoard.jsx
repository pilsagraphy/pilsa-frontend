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

import { Eye, Heart } from 'lucide-react';
import CategoryBadge from '@/components/shared/board/boardList/CategoryBadge';
import { useRouter } from 'next/navigation';
import { getBoards } from '@/apis/board';
import { ROUTES } from '@/constants/routes';
import { getCommentAnchorId } from '@/lib/utils';
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
  const router = useRouter();

  // 행을 누르면 원글로. 댓글 탭은 그 댓글 위치(#comment-id)까지 — 응답에 boardId·postId 가 이 용도로 들어 있다
  const goToRow = (row) => {
    if (row.boardId == null || row.postId == null) return;
    const url = ROUTES.BOARD_POST(row.boardId, row.postId);
    router.push(isComments && row.commentId != null ? `${url}#${getCommentAnchorId(row.commentId)}` : url);
  };

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
      <div className="mt-[12px] flex flex-row items-center gap-2">
        {/* 댓글 탭은 서버가 최신순 고정이라 고를 수 있게 두면 안 된다 → compactSort(읽기 전용 '최신순') */}
        <div className="w-[96px] shrink-0 sm:w-auto">
          <SortSelect
            compactSort={isComments}
            value={sortOrder}
            onValueChange={(v) => {
              setSortOrder(v);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="w-[96px] shrink-0 sm:w-auto">
          <BoardSelect
            boards={boards}
            value={boardFilter}
            onValueChange={(v) => {
              setBoardFilter(v);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="min-w-0 flex-1 [&>*]:!max-w-none [&_svg]:!size-[17px]">
          <SearchInput
            value={searchQuery}
            onChange={(v) => {
              setSearchQuery(v);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* 폰: 게시판 목록과 같은 카드 줄. 좁은 화면에서 표를 쓰면 열이 잘려 제목만 남는다 */}
      <div className="flex flex-col border-b border-[#B9B9B9] md:hidden">
        {isLoading ? (
          <p className="py-8 text-center text-[14px] text-[#919191]">불러오는 중...</p>
        ) : error ? (
          <p className="py-8 text-center text-[14px] text-[#919191]">{error}</p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-[#919191]">
            {isComments ? '작성한 댓글이 없습니다.' : '게시글이 없습니다.'}
          </p>
        ) : (
          items.map((row) => (
            <div
              key={isComments ? row.commentId : row.postId}
              onClick={() => goToRow(row)}
              className="flex cursor-pointer flex-col gap-[6px] border-t border-[#DEDEDE] pb-2 pt-3 transition-colors active:bg-[#F6F6F6]"
            >
              {/* 윗줄: 게시판 + 제목 */}
              <div className="flex items-center gap-[10px] px-1">
                {row.categoryName && <CategoryBadge>{row.categoryName}</CategoryBadge>}
                <span className="min-w-0 flex-1 truncate text-[16px] font-medium leading-[1.6] tracking-[-0.04em] text-[#454545]">
                  {isComments ? row.postTitle : row.title}
                </span>
              </div>

              {/* 아랫줄: 댓글이면 내용, 글이면 좋아요·조회수 + 작성일 */}
              <div className="flex items-center gap-3 px-2 text-[13px] leading-[1.6] text-[#919191]">
                {isComments ? (
                  <span className="min-w-0 flex-1 truncate">{row.content}</span>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1">
                      <Heart size={16} strokeWidth={1.5} />
                      {row.likeCount ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye size={16} strokeWidth={1.5} />
                      {row.viewCount ?? 0}
                    </span>
                    <span className="flex-1" />
                  </>
                )}
                <span className="shrink-0">{formatDotDate(row.created)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PC: 표 (마지막 행 아래 줄까지 표시) */}
      <div className="hidden overflow-x-auto border-b border-[#B9B9B9] md:block">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow className="h-12 border-b border-[#B9B9B9] text-[14px] leading-[1.6] tracking-[-0.02em] text-[#424242] md:text-[16px]">
              <TableHead className="w-[56px] text-center text-[#424242]">번호</TableHead>
              <TableHead className="w-auto text-left text-[#424242]">제목</TableHead>
              {isComments ? (
                <TableHead className="hidden w-[40%] text-left text-[#424242] md:table-cell">
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
              <TableHead className="w-[104px] text-center text-[#424242]">작성일</TableHead>
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
                    onClick={() => goToRow(row)}
                    className="h-[50px] cursor-pointer border-b border-[#B9B9B9] text-[14px] leading-[1.6] tracking-[-0.02em] text-[#454545] transition-colors hover:bg-[#FAFAFA] md:text-[16px]"
                  >
                    <TableCell className="text-center">{no}</TableCell>
                    <TableCell className="max-w-0 truncate text-left">{title}</TableCell>
                    {isComments ? (
                      <TableCell className="hidden max-w-0 truncate text-left text-[#424242] md:table-cell">
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
