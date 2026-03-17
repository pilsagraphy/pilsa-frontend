'use client';

import React, { useEffect, useState } from 'react';

import FreeHead from './FreeHead';
import FreeInfo from './FreeInfo';
import FreeAttachments from './FreeAttachments';
import FreeContent from './FreeContent';
import FreeActions from './FreeActions';
import FreeComments from './FreeComments';
import FreePrevNext from './FreePrevNext';

import { getFreePostDetail } from '@/apis/free';
import { getErrorMessage } from '@/apis/auth';

export default function FreeDetailView({ postId }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const data = await getFreePostDetail(postId);

      setPost({
        postId: data.postId,
        userId: data.userId,
        categoryName: data.categoryName,
        title: data.title,
        updated: data.updated,
        authorName: data.isAnonymous ? '익명' : data.authorName,
        content: data.content,
        likeCount: data.likeCount ?? 0,
        liked: Boolean(data.liked),
        attachments: Array.isArray(data.attachments) ? data.attachments : [],
        comments: Array.isArray(data.comments) ? data.comments : [],
        prevPostApi: data.prevPostApi,
        nextPostApi: data.nextPostApi,
      });
    } catch (error) {
      setPost(null);
      setErrorMessage(getErrorMessage(error, '게시글을 불러오지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!postId) return;
    fetchDetail();
  }, [postId]);

  if (loading) {
    return <div className="py-20 text-center text-[#919191]">불러오는 중입니다.</div>;
  }

  if (!post) {
    return (
      <div className="py-20 text-center text-[#919191]">
        {errorMessage || '존재하지 않는 게시글입니다.'}
      </div>
    );
  }

  return (
    <section className="mx-auto w-[920px] flex flex-col gap-[60px]">
      <FreeHead categoryName={post.categoryName} />

      <div className="flex flex-col">
        <FreeInfo
          categoryName={post.categoryName}
          title={post.title}
          date={post.updated}
          author={post.authorName}
        />
        <FreeAttachments attachments={post.attachments} />
      </div>

      <div className="flex flex-col">
        <FreeContent content={post.content} />

        <div className="w-full h-px bg-[#DEDEDE] mt-[48px]" />

        <div className="mt-[60px]">
          <FreeActions
            postId={post.postId}
            authorId={post.userId}
            likecount={post.likeCount}
            liked={post.liked}
          />
        </div>
      </div>

      <FreeComments postId={post.postId} comments={post.comments} onChanged={fetchDetail} />

      <FreePrevNext prevPostApi={post.prevPostApi} nextPostApi={post.nextPostApi} />
    </section>
  );
}
