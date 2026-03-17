'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import InfoHead from './InfoHead';
import InfoInfo from './InfoInfo';
import InfoAttachments from './InfoAttachments';
import InfoContent from './InfoContent';
import InfoActions from './InfoActions';
import InfoComments from './InfoComments';
import InfoPrevNext from './InfoPrevNext';

import { getInfoPostDetail } from '@/apis/info';
import { getErrorMessage } from '@/apis/auth';

function formatKoreanDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}. ${mm}. ${dd}.`;
}

export default function InfoDetailView({ postId }) {
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    try {
      setLoading(true);

      const raw = await getInfoPostDetail(postId);

      setPost({
        postId: raw.postId,
        userId: raw.userId,
        categoryName: raw.categoryName,
        title: raw.title,
        date: formatKoreanDate(raw.updated),
        author: raw.authorName,
        content: raw.content,
        likeCount: raw.likeCount ?? 0,
        liked: Boolean(raw.liked),
        attachments: (raw.attachments ?? []).map((a) => ({
          attachmentId: a.attachmentId,
          originName: a.originName,
          fileUrl: a.fileUrl,
        })),
        comments: raw.comments ?? [],
        links: {
          hasPrev: Boolean(raw.prevPostApi),
          hasNext: Boolean(raw.nextPostApi),
          prevPostApi: raw.prevPostApi,
          nextPostApi: raw.nextPostApi,
        },
      });
    } catch (error) {
      alert(getErrorMessage(error, '게시글을 불러오지 못했습니다.'));
      router.push('/students/info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) fetchDetail();
  }, [postId]);

  if (loading) {
    return <div className="py-20 text-center text-[#919191]">불러오는 중입니다.</div>;
  }

  if (!post) return null;

  return (
    <section className="mx-auto flex w-[920px] flex-col gap-[60px]">
      <InfoHead categoryName={post.categoryName} />

      <div className="flex flex-col">
        <InfoInfo
          categoryName={post.categoryName}
          title={post.title}
          date={post.date}
          author={post.author}
        />
        <InfoAttachments attachments={post.attachments} />
      </div>

      <div className="flex flex-col">
        <InfoContent content={post.content} />

        <div className="mt-[48px] h-px w-full bg-[#DEDEDE]" />

        <div className="mt-[60px]">
          <InfoActions
            postId={post.postId}
            authorId={post.userId}
            likeCount={post.likeCount}
            liked={post.liked}
            onDeleted={() => router.push('/students/info')}
          />
        </div>
      </div>

      <InfoComments postId={post.postId} comments={post.comments} onChanged={fetchDetail} />

      <InfoPrevNext links={post.links} />
    </section>
  );
}
