'use client';

import { useEffect, useState } from 'react';

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
  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');

  const [categoryMap, setCategoryMap] = useState({});

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

    // 카테고리 정보가 필요한데 아직 없는 경우 대기
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
        if (isIgnore) return; // 이전 요청이라면 무시

        const list = data?.posts ?? data?.notices ?? [];
        setPosts(
          list.map((post) => ({
            ...post,
            pinned: Boolean(post.pinned ?? post.isPinned),
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
  }, [boardType, currentPage, sortOrder, searchQuery, category, categoryMap[category]]); // 객체 대신 특정 값만 감시

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
        loading={loading}
        errorMessage={errorMessage}
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
