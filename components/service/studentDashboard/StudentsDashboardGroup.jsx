'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DUMMY_POSTS_FREE } from '@/mocks/top4Data';
import { ArrowRight } from 'lucide-react';
import { getTop5Notices } from '@/apis/notice';
import { getErrorMessage } from '@/apis/auth';

// 게시판 5개 노출
function BoardList({
  title,
  posts = [],
  boardType,
  loading = false,
  emptyText = '등록된 게시글이 없습니다.',
}) {
  const router = useRouter();

  const goList = () => {
    router.push(`/students/${boardType}`);
  };

  const goDetail = (postId) => {
    router.push(`/students/${boardType}/${postId}`);
  };

  return (
    <div className="flex flex-col gap-[10px] w-full lg:w-[424.5px]">
      <div className="flex justify-between items-center pr-[20px] h-[30px] w-full">
        <h3 className="mx-auto text-[20px] font-medium tracking-[-0.02em] leading-[1.5] text-black pl-[16px]">
          {title}
        </h3>

        <div
          onClick={goList}
          className="w-[24px] h-[24px] cursor-pointer flex items-center justify-center hover:bg-[#F6F6F6] transition rounded-sm flex-shrink-0"
        >
          <ArrowRight size={18} color="#1E1E1E" strokeWidth={2} />
        </div>
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
          posts.map((post, index) => (
            <div
              key={post.postId}
              onClick={() => goDetail(post.postId)}
              className="flex items-center h-[56px] border-b border-[#B9B9B9] cursor-pointer hover:bg-[#F6F6F6] transition"
            >
              <div className="w-[80px] flex justify-center items-center flex-shrink-0">
                {boardType === 'notices' && post.isPinned ? (
                  <div className="flex justify-center items-center px-[12px] py-[10px] w-[46px] h-[27px] bg-[#212121] rounded-[103px]">
                    <span className="text-[12px] font-normal leading-[1.4] tracking-[-0.02em] text-white">
                      중요
                    </span>
                  </div>
                ) : (
                  <span className="text-[16px] font-normal leading-[1.6] tracking-[-0.02em] text-[#454545]">
                    {index + 1}
                  </span>
                )}
              </div>

              <div className="flex items-center flex-1 pr-[20px] overflow-hidden">
                <p className="text-[16px] font-normal leading-[1.6] tracking-[-0.02em] text-[#454545] truncate">
                  {post.title}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function StudentsDashboardGroup() {
  const [noticePosts, setNoticePosts] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [noticeError, setNoticeError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchTop5 = async () => {
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

    fetchTop5();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-row gap-[66px] w-full mt-[20px]">
      <BoardList
        title="공지사항"
        posts={noticePosts}
        boardType="notices"
        loading={loadingNotices}
        emptyText={noticeError || '등록된 게시글이 없습니다.'}
      />
      <BoardList title="자유게시판" posts={DUMMY_POSTS_FREE} boardType="free" />
    </div>
  );
}
