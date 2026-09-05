'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useMinWidthMd } from '@/lib/useMinWidthMd';
import { buildBoardListQuery } from '@/lib/boardDetail';
import useBoard from '@/hooks/useBoard';

import SortSelect from './SortSelect';
import CategorySelect from './CategorySelect';
import SearchInput from './SearchInput';
import PostTable from './PostTable';
import WriteButton from './WriteButton';
import PaginationWithEllipsis from '@/components/shared/PaginationWithEllipsis';

import { getBoardPosts, getBoardCategories } from '@/apis/board';
import { getErrorMessage } from '@/apis/auth';

const PAGE_SIZE = 10;

// 검색은 타이핑마다 요청하지 않고 잠깐 멈춘 뒤에 한 번만 보낸다
const SEARCH_DEBOUNCE_MS = 350;

const MESSAGE_CLASS = 'px-4 py-12 text-center text-sm text-[#919191] md:py-20 md:text-base';

// 새 API 정렬값: created(최신) | viewCount(조회수)
export default function BoardSection({ boardId }) {
  const isMdUp = useMinWidthMd();

  // 게시판 정책(플래그)·이름은 목록 API(useBoardStore)에서 가져온다
  const { board, boards, error: boardError } = useBoard(boardId);
  const title = board?.boardName ?? '';
  const categoryMode = Boolean(board?.categoryMode);
  const canWrite = Boolean(board?.canWrite);

  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  // 목록 상태는 주소(쿼리)에서 읽어와 시작한다 —
  // 글을 보고 돌아왔을 때 페이지·검색어가 그대로 복원되고, 목록 주소를 공유할 수도 있다.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [currentPage, setCurrentPage] = useState(() => {
    const page = Number(searchParams.get('page'));
    return Number.isFinite(page) && page > 0 ? page : 1;
  });
  const [sortOrder, setSortOrder] = useState(() => searchParams.get('sort') || 'created');
  // searchInput = 입력창에 보이는 값, searchKeyword = 실제로 조회에 쓰는 값(디바운스 후)
  const [searchInput, setSearchInput] = useState(() => searchParams.get('keyword') || '');
  const [searchKeyword, setSearchKeyword] = useState(() => searchParams.get('keyword') || '');
  const [category, setCategory] = useState(() => searchParams.get('categoryId') || 'all'); // 'all' | String(categoryId)

  const [categories, setCategories] = useState([]);

  // 첫 조회가 끝나기 전에 '등록된 게시글이 없습니다.' 가 스치지 않도록 true 로 시작한다
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSortChange = (value) => {
    setSortOrder(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchInput(value);
  };

  // 입력이 멈춘 뒤에만 조회 키워드를 갱신한다 (타이핑 한 글자마다 요청하지 않도록)
  useEffect(() => {
    const timer = setTimeout(() => setSearchKeyword(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // 검색어가 바뀌면 첫 페이지부터 다시 본다.
  // 첫 렌더는 건너뛴다 — 주소에서 읽어온 페이지 번호를 1로 덮어써 버리기 때문이다.
  const isFirstKeywordRun = useRef(true);
  useEffect(() => {
    if (isFirstKeywordRun.current) {
      isFirstKeywordRun.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchKeyword]);

  // 목록 상태를 주소에 반영한다.
  // 기본값은 주소에 넣지 않아 주소가 깔끔하게 유지되고, replace 라서 뒤로가기 기록도 쌓이지 않는다.
  const listQuery = buildBoardListQuery({
    page: currentPage > 1 ? currentPage : '',
    sort: sortOrder !== 'created' ? sortOrder : '',
    keyword: searchKeyword.trim(),
    categoryId: category !== 'all' ? category : '',
  });

  useEffect(() => {
    router.replace(listQuery ? `${pathname}?${listQuery}` : pathname, { scroll: false });
  }, [listQuery, pathname, router]);

  const handleCategoryChange = (value) => {
    setCategory(value);
    setCurrentPage(1);
  };

  // 모바일(768px 미만)에서는 조회순 미노출 → 정렬을 최신순으로 고정
  useEffect(() => {
    if (isMdUp) return;
    if (sortOrder === 'viewCount') setSortOrder('created');
  }, [isMdUp, sortOrder]);

  // 카테고리 목록 (카테고리를 쓰는 게시판만)
  useEffect(() => {
    if (!boardId || !categoryMode) {
      setCategories([]);
      return;
    }

    let isIgnore = false;
    const fetchCategories = async () => {
      try {
        const data = await getBoardCategories(boardId);
        if (isIgnore) return;
        setCategories(Array.isArray(data) ? data : []);
      } catch (e) {
        if (isIgnore) return;
        setCategories([]);
        console.error('카테고리 조회 실패', e);
      }
    };

    fetchCategories();
    return () => {
      isIgnore = true;
    };
  }, [boardId, categoryMode]);

  // 게시글 목록
  useEffect(() => {
    if (!boardId) return;

    const categoryId = category !== 'all' ? Number(category) : undefined;

    let isIgnore = false; // 레이스 컨디션 방지 플래그

    const fetchPosts = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        const params = {
          page: currentPage,
          size: PAGE_SIZE,
          sort: sortOrder,
          ...(searchKeyword.trim() ? { keyword: searchKeyword.trim() } : {}),
          ...(categoryId !== undefined ? { categoryId } : {}),
        };

        const data = await getBoardPosts(boardId, params);
        if (isIgnore) return;

        setPosts(Array.isArray(data?.posts) ? data.posts : []);
        setTotalPages(Math.max(1, Number(data?.totalPages) || 1));
      } catch (error) {
        if (isIgnore) return;
        setPosts([]);
        setTotalPages(1);
        setErrorMessage(getErrorMessage(error, '게시글을 불러오지 못했습니다.'));
      } finally {
        if (!isIgnore) setLoading(false);
      }
    };

    fetchPosts();

    return () => {
      isIgnore = true;
    };
  }, [boardId, currentPage, sortOrder, searchKeyword, category]);

  // 게시판 정책(플래그)이 확정되기 전에 화면을 그리면
  // 제목이 비고 글쓰기 버튼·카테고리·댓글 열이 '없는 게시판'처럼 보인다.
  if (boardError) {
    return <div className={MESSAGE_CLASS}>{boardError}</div>;
  }

  if (!boards) {
    return <div className={MESSAGE_CLASS}>불러오는 중입니다.</div>;
  }

  if (!board) {
    return <div className={MESSAGE_CLASS}>존재하지 않는 게시판입니다.</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col bg-white px-4 py-4 sm:px-6 sm:py-7 md:p-10">
      <h2 className="font-['Pretendard',sans-serif] text-[20px] font-semibold leading-[1.5] tracking-[-0.02em] my-[15px] text-[#212121] sm:text-[20px] md:text-[24px]">
        {title}
      </h2>

      <div className="mb-[5px] mt-[5px] flex flex-col gap-3 md:mb-4 md:mt-[10px] md:flex-row md:items-end md:justify-between md:gap-10">
        <span className="hidden shrink-0 text-[16px] leading-[1.6] tracking-[-0.02em] text-[#212121] md:block md:text-[18px]">
          목록
        </span>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch sm:justify-end">
          <SortSelect value={sortOrder} onValueChange={handleSortChange} compactSort={!isMdUp} />

          {categoryMode && (
            <CategorySelect
              categories={categories}
              value={category}
              onValueChange={handleCategoryChange}
            />
          )}

          <div className="mb-[5px] min-w-0 sm:min-w-[200px] md:mb-0 sm:flex-1">
            <SearchInput value={searchInput} onChange={handleSearchChange} />
          </div>
        </div>
      </div>

      <PostTable
        posts={posts}
        boardId={boardId}
        board={board}
        listQuery={listQuery}
        loading={loading}
        errorMessage={errorMessage}
      />

      <div className="mt-6 mb-16 flex justify-end md:mt-[34px] md:mb-[120px]">
        <WriteButton boardId={boardId} canWrite={canWrite} />
      </div>

      <div className="flex justify-center">
        <PaginationWithEllipsis
          currentPage={currentPage}
          totalPages={Math.max(1, totalPages)}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
