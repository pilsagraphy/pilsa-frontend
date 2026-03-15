'use client';

import { useEffect, useMemo, useState } from 'react';

import SortSelect from './SortSelect';
import CategorySelect from './CategorySelect';
import SearchInput from './SearchInput';
import PostTable from './PostTable';
import WriteButton from './WriteButton';
import PaginationWithEllipsis from '@/components/shared/PaginationWithEllipsis';

import { getNoticeList } from '@/apis/notice';
import { getErrorMessage } from '@/apis/auth';

const NOTICE_PAGE_SIZE = 10;

const NOTICE_SORT_MAP = {
  latest: 'created',
  views: 'viewCount',
};

// @param {'notices' | 'free' | 'info'} props.boardType - 게시판 타입
export default function BoardSection({ title, boardType, postsData = { posts: [] } }) {
  const isNoticeBoard = boardType === 'notices';

  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('latest'); // 정렬 상태
  const [searchQuery, setSearchQuery] = useState(''); // 검색 상태
  const [category, setCategory] = useState('all'); // 카테고리 상태

  const [noticePosts, setNoticePosts] = useState([]);
  const [noticeTotalPages, setNoticeTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSortChange = (value) => {
    setSortOrder(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value) => {
    setCategory(value);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!isNoticeBoard) return;

    let isMounted = true;

    const fetchNotices = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        const data = await getNoticeList({
          page: currentPage,
          size: NOTICE_PAGE_SIZE,
          keyword: searchQuery,
          sort: NOTICE_SORT_MAP[sortOrder] ?? 'created',
        });

        if (!isMounted) return;

        const notices = Array.isArray(data?.notices)
          ? data.notices.map((post) => ({
              ...post,
              pinned: Boolean(post.isPinned),
            }))
          : [];

        setNoticePosts(notices);
        setNoticeTotalPages(Math.max(1, Number(data?.totalPages) || 1));
      } catch (error) {
        if (!isMounted) return;
        setNoticePosts([]);
        setNoticeTotalPages(1);
        setErrorMessage(getErrorMessage(error, '공지사항을 불러오지 못했습니다.'));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchNotices();

    return () => {
      isMounted = false;
    };
  }, [isNoticeBoard, currentPage, searchQuery, sortOrder]);

  const allPosts = postsData?.posts || [];

  // 1. 검색(제목, 작성자) 및 카테고리 필터링
  const filteredPosts = useMemo(() => {
    let filtered = allPosts;

    // 카테고리 필터링
    if (boardType !== 'notices' && category && category !== 'all') {
      filtered = filtered.filter((post) => post.categoryName === category);
    }

    // 검색어 필터링
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title?.toLowerCase().includes(lower) ||
          post.authorName?.toLowerCase().includes(lower)
      );
    }

    return filtered;
  }, [allPosts, searchQuery, category, boardType]);

  // 2. 정렬 로직 (pinned 우선 + 정렬 조건)
  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      // 공지사항 게시판일 경우만 pinned 체크
      if (boardType === 'notices') {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      }

      if (sortOrder === 'likes') return (b.likeCount || 0) - (a.likeCount || 0);
      if (sortOrder === 'views') return (b.viewCount || 0) - (a.viewCount || 0);
      return new Date(b.created).getTime() - new Date(a.created).getTime();
    });
  }, [filteredPosts, sortOrder, boardType]);

  // 3. 페이지네이션 로직
  const localTotalPages = Math.max(1, Math.ceil(sortedPosts.length / NOTICE_PAGE_SIZE));

  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * NOTICE_PAGE_SIZE;
    const end = start + NOTICE_PAGE_SIZE;
    return sortedPosts.slice(start, end);
  }, [currentPage, sortedPosts]);

  const posts = isNoticeBoard ? noticePosts : paginatedPosts;
  const totalPages = isNoticeBoard ? noticeTotalPages : localTotalPages;

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col bg-white p-8">
      <h2 className="font-['Pretendard',sans-serif] font-semibold text-[24px] leading-[1.5] tracking-[-0.02em] text-[#212121]">
        {title}
      </h2>

      <div className="flex justify-between items-end mt-[10px] mb-4 gap-10">
        <span className="text-[18px] leading-[1.6] tracking-[-0.02em] text-[#212121] shrink-0">
          목록
        </span>

        <div className="flex gap-2">
          <SortSelect boardType={boardType} value={sortOrder} onValueChange={handleSortChange} />

          {boardType !== 'notices' && (
            <CategorySelect
              boardType={boardType}
              value={category}
              onValueChange={handleCategoryChange}
            />
          )}

          <SearchInput value={searchQuery} onChange={handleSearchChange} />
        </div>
      </div>

      <PostTable
        posts={posts}
        boardType={boardType}
        sortOrder={sortOrder}
        loading={isNoticeBoard && loading}
        errorMessage={isNoticeBoard ? errorMessage : ''}
      />

      <div className="flex justify-end mt-[34px] mb-[120px]">
        <WriteButton href={`/students/${boardType}/write`} boardType={boardType} />
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
