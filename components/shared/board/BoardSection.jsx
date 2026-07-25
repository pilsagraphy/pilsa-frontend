'use client';

import { useEffect, useMemo, useState } from 'react';

import { useMinWidthMd } from '@/lib/useMinWidthMd';

import SortSelect from './SortSelect';
import CategorySelect from './CategorySelect';
import SearchInput from './SearchInput';
import PostTable from './PostTable';
import WriteButton from './WriteButton';
import PaginationWithEllipsis from '@/components/shared/PaginationWithEllipsis';

import { getNoticeList } from '@/apis/notice';
import { getFreePostList, getFreeCategories } from '@/apis/free';
import { getInfoPostList, getInfoCategories } from '@/apis/info';
import { getErrorMessage } from '@/apis/auth';

const PAGE_SIZE = 10;

const SORT_MAP = {
  latest: 'created',
  views: 'viewCount',
  likes: 'likeCount',
};

// 게시판별 API 매핑
const BOARD_API_MAP = {
  notices: getNoticeList,
  free: getFreePostList,
  info: getInfoPostList,
};

export default function BoardSection({ title, boardType }) {
  const isMdUp = useMinWidthMd();

  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');

  const [categoryMap, setCategoryMap] = useState({});
  const categoryNameToIdMap = useMemo(() => {
    const reversed = {};
    Object.entries(categoryMap).forEach(([name, id]) => {
      reversed[name] = id;
    });
    return reversed;
  }, [categoryMap]);

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

  // 모바일(768px 미만)에서는 조회순·인기순 미노출 → 정렬을 최신순으로 고정
  useEffect(() => {
    if (isMdUp) return;
    if (sortOrder === 'views' || sortOrder === 'likes') {
      setSortOrder('latest');
    }
  }, [isMdUp, sortOrder]);

  // 카테고리 API 호출
  useEffect(() => {
    if (boardType !== 'free' && boardType !== 'info') return;

    const fetchCategories = async () => {
      try {
        const categories =
          boardType === 'free' ? await getFreeCategories() : await getInfoCategories();

        const map = {};
        categories.forEach((c) => {
          map[c.name] = c.categoryId;
        });

        setCategoryMap(map);
      } catch (e) {
        console.error('카테고리 조회 실패', e);
      }
    };

    fetchCategories();
  }, [boardType]);

  // 게시글 목록 API 호출
  useEffect(() => {
    const api = BOARD_API_MAP[boardType];
    if (!api) return;

    const categoryId = category !== 'all' ? categoryMap[category] : null;
    if ((boardType === 'free' || boardType === 'info') && category !== 'all' && !categoryId) {
      return;
    }

    let isIgnore = false; // 레이스 컨디션 방지 플래그

    const fetchPosts = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        let resolvedSort = SORT_MAP[sortOrder] ?? 'created';

        if (boardType === 'free' && resolvedSort === 'likeCount') {
          resolvedSort = 'created';
        }

        const params = {
          page: currentPage,
          size: PAGE_SIZE,
          keyword: searchQuery.trim(),
          sort: resolvedSort,
          ...(categoryId !== null && categoryId !== undefined ? { categoryId } : {}), // 값이 있을 때만 추가
        };

        const data = await api(params);
        if (isIgnore) return;

        const list = data?.posts ?? data?.notices ?? [];
        setPosts(
          list.map((post) => ({
            ...post,
            pinned: Boolean(post.pinned ?? post.isPinned),
            categoryId: post.categoryId ?? categoryNameToIdMap[post.categoryName] ?? null,
          }))
        );
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
    }; // Cleanup 시 플래그 변경
  }, [boardType, currentPage, sortOrder, searchQuery, category, categoryMap, categoryNameToIdMap]); // 객체 대신 특정 값만 감시

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
          <SortSelect
            boardType={boardType}
            value={sortOrder}
            onValueChange={handleSortChange}
            compactSort={!isMdUp}
          />

          {boardType !== 'notices' && (
            <CategorySelect
              boardType={boardType}
              value={category}
              onValueChange={handleCategoryChange}
            />
          )}

          <div className="mb-[5px] min-w-0 sm:min-w-[200px] md:mb-0 sm:flex-1">
            <SearchInput value={searchQuery} onChange={handleSearchChange} />
          </div>
        </div>
      </div>

      <PostTable
        posts={posts}
        boardType={boardType}
        sortOrder={sortOrder}
        loading={loading}
        errorMessage={errorMessage}
      />

      <div className="mt-6 mb-16 flex justify-end md:mt-[34px] md:mb-[120px]">
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
