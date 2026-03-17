// mocks/infoData.js
// 어떤 postId가 와도 동적으로 mock 데이터 생성

const BASE_DATA = {
  title: '2026-1 임원진 수칙',
  content: '2026 필사그래피 임원진 안내입니다.\n\n본문\n\n\n\n야호~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  userId: 101,
  authorName: '가성연',
  updated: '2026-02-25T03:00:00.000Z',
  categoryName: '정보게시판',
  likeCount: 1,
  attachments: [
    {
      attachmentId: 1,
      originName: '[붙임1] 필사그래피.pdf',
      fileUrl: '/files/pilsa.pdf',
      fileSize: 1048576,
    },
  ],
  attachmentCount: 1,
  comments: [
    {
      commentId: 1,
      content: '가냥아 나도 기대돼 ㅎㅎㅎ',
      authorName: '박건희',
      updated: '2026-02-22T00:00:00.000Z',
      userId: 301,
      private: false,
      parentId: null,
    },
    {
      commentId: 2,
      content: '저두욤',
      authorName: '한서은',
      updated: '2026-02-22T00:00:00.000Z',
      userId: 302,
      private: false,
      parentId: 1,
    },
    {
      commentId: 3,
      content: '비밀 댓글입니다.',
      authorName: '익명',
      updated: '2026-02-22T00:00:00.000Z',
      userId: 303,
      private: true,
      parentId: 1,
    },
  ],
  liked: false,
};

// 어떤 postId든 mock 데이터 반환
export function getMockInfoDetail(postId) {
  const id = Number(postId);
  return {
    ...BASE_DATA,
    postId: id,
    prevPostApi: id > 1 ? `/api/info/${id - 1}` : null,
    nextPostApi: `/api/info/${id + 1}`,
  };
}
