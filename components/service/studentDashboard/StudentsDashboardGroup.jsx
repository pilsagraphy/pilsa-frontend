'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getTop5Notices } from '@/apis/notice';
import { getTop5FreePosts } from '@/apis/free';
import { getTop5InfoPosts } from '@/apis/info';
import { getErrorMessage } from '@/apis/auth';
import CategoryBadge from '@/components/shared/board/CategoryBadge';

// 대시보드에 노출할 개수
const NOTICE_TOTAL_COUNT = 3; // 공지사항 전체
const PINNED_NOTICE_COUNT = 1; // 그중 '중요' 공지로 채울 수 있는 최대 개수
const BOARD_POST_COUNT = 5; // 자유 · 정보게시판

const isPinnedPost = (post) => Boolean(post.pinned ?? post.isPinned);

// 최신순 정렬. created가 없으면 postId가 클수록 최신으로 본다.
// (서버 정렬을 신뢰하지 않고 프론트에서도 한 번 더 맞춘다)
const sortByLatest = (posts) =>
  [...posts].sort((a, b) => {
    const aCreated = a.created ?? '';
    const bCreated = b.created ?? '';

    if (aCreated && bCreated && aCreated !== bCreated) {
      return bCreated.localeCompare(aCreated);
    }

    return (b.postId ?? 0) - (a.postId ?? 0);
  });

// 공지사항: 최신 '중요' 공지를 맨 앞에 두고, 남는 자리는 최신순으로 채워 3개를 만든다.
// - 중요 공지가 없으면 일반 공지 3개
// - 일반 공지가 부족하면 남은 중요 공지로 채운다
const pickNotices = (notices) => {
  const sorted = sortByLatest(notices);
  const pinned = sorted.filter(isPinnedPost).slice(0, PINNED_NOTICE_COUNT);
  const pinnedIds = new Set(pinned.map((notice) => notice.postId));

  const rest = sorted
    .filter((notice) => !pinnedIds.has(notice.postId))
    .slice(0, NOTICE_TOTAL_COUNT - pinned.length);

  return [...pinned, ...rest];
};

// 자유 · 정보게시판: 최신 5개
const pickLatestPosts = (posts) => sortByLatest(posts).slice(0, BOARD_POST_COUNT);

// 게시판 5개 노출
function BoardList({
  title,
  posts = [],
  boardType,
  loading = false,
  emptyText = '등록된 게시글이 없습니다.',
  className = '',
}) {
  // 중요 공지는 번호 대신 배지를 쓰므로, 번호는 일반 글끼리만 1부터 센다
  let normalIndex = 0;
  const rows = posts.map((post) => {
    const pinned = boardType === 'notices' && isPinnedPost(post);
    if (!pinned) normalIndex += 1;

    return { post, pinned, number: pinned ? null : normalIndex };
  });

  return (
    // 너비는 부모가 정한다 (공지사항은 전체 폭, 자유·정보게시판은 className으로 2단 분배)
    <div className={`flex min-w-0 w-full flex-col gap-[10px] ${className}`}>
      <div className="flex justify-between items-center pr-[20px] h-[30px] w-full">
        {/* 디자인 스펙: Pretendard / SemiBold(600) / 20px, 색상은 다른 제목들과 동일하게 #212121 */}
        <h3 className="font-['Pretendard',sans-serif] text-[20px] font-semibold tracking-[-0.02em] leading-[1.5] text-[#212121]">
          {title}
        </h3>

        {/* 목록 전체보기 (이동이므로 링크로 둔다) */}
        <Link
          href={`/students/${boardType}`}
          aria-label={`${title} 전체보기`}
          className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#F6F6F6] transition rounded-sm flex-shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#212121]"
        >
          <ArrowRight size={18} color="#1E1E1E" strokeWidth={2} aria-hidden />
        </Link>
      </div>

      <div className="flex flex-col w-full border-t border-[#B9B9B9]">
        {loading ? (
          <div className="flex items-center justify-center h-[56px] border-b border-[#B9B9B9] text-[14px] text-[#919191]">
            불러오는 중입니다.
          </div>
        ) : posts.length === 0 ? (
          <div className="flex items-center justify-center h-[56px] border-b border-[#B9B9B9] text-[14px] text-[#919191]">
            {emptyText}
          </div>
        ) : (
          rows.map(({ post, pinned, number }) => (
            <Link
              key={post.postId}
              href={`/students/${boardType}/${post.postId}`}
              className="flex items-center h-[56px] border-b border-[#B9B9B9] hover:bg-[#F6F6F6] transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#212121]"
            >
              {/* 번호/중요 뱃지 영역 */}
              <div className="w-[80px] flex justify-center items-center flex-shrink-0">
                {pinned ? (
                  <CategoryBadge variant="pinned">중요</CategoryBadge>
                ) : (
                  <span className="text-[16px] font-normal leading-[1.6] tracking-[-0.02em] text-[#454545]">
                    {number}
                  </span>
                )}
              </div>

              <div className="flex items-center flex-1 pr-[20px] overflow-hidden">
                <p className="text-[16px] font-normal leading-[1.6] tracking-[-0.02em] text-[#454545] truncate">
                  {post.title}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default function StudentsDashboardGroup() {
  const [noticePosts, setNoticePosts] = useState([]);
  const [freePosts, setFreePosts] = useState([]);
  const [infoPosts, setInfoPosts] = useState([]);

  const [loadingNotices, setLoadingNotices] = useState(true);
  const [loadingFree, setLoadingFree] = useState(true);
  const [loadingInfo, setLoadingInfo] = useState(true);

  const [noticeError, setNoticeError] = useState('');
  const [freeError, setFreeError] = useState('');
  const [infoError, setInfoError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchNotices = async () => {
      try {
        setLoadingNotices(true);
        setNoticeError('');
        const data = await getTop5Notices();
        if (!isMounted) return;
        setNoticePosts(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!isMounted) return;
        setNoticePosts([]);
        setNoticeError(getErrorMessage(error, '공지사항을 불러오지 못했습니다.'));
      } finally {
        if (isMounted) setLoadingNotices(false);
      }
    };

    const fetchFree = async () => {
      try {
        setLoadingFree(true);
        setFreeError('');
        const data = await getTop5FreePosts();
        if (!isMounted) return;
        setFreePosts(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!isMounted) return;
        setFreePosts([]);
        setFreeError(getErrorMessage(error, '자유게시판을 불러오지 못했습니다.'));
      } finally {
        if (isMounted) setLoadingFree(false);
      }
    };

    const fetchInfo = async () => {
      try {
        setLoadingInfo(true);
        setInfoError('');
        const data = await getTop5InfoPosts();
        if (!isMounted) return;
        setInfoPosts(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!isMounted) return;
        setInfoPosts([]);
        setInfoError(getErrorMessage(error, '정보게시판을 불러오지 못했습니다.'));
      } finally {
        if (isMounted) setLoadingInfo(false);
      }
    };

    fetchNotices();
    fetchFree();
    fetchInfo();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="mt-[20px] flex w-full flex-col gap-20 lg:gap-[60px]">
      {/* 공지사항: 전체 폭 */}
      <BoardList
        title="공지사항"
        posts={pickNotices(noticePosts)}
        boardType="notices"
        loading={loadingNotices}
        emptyText={noticeError || '등록된 게시글이 없습니다.'}
      />

      {/* 자유게시판 · 정보게시판: 넓은 화면에서 2단 */}
      <div className="flex w-full flex-col gap-20 lg:flex-row lg:gap-[66px]">
        <BoardList
          title="자유게시판"
          posts={pickLatestPosts(freePosts)}
          boardType="free"
          loading={loadingFree}
          emptyText={freeError || '등록된 게시글이 없습니다.'}
          className="lg:flex-1"
        />
        <BoardList
          title="정보게시판"
          posts={pickLatestPosts(infoPosts)}
          boardType="info"
          loading={loadingInfo}
          emptyText={infoError || '등록된 게시글이 없습니다.'}
          className="lg:flex-1"
        />
      </div>
    </div>
  );
}
