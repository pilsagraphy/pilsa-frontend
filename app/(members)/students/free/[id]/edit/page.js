import Edit from '@/components/shared/Edit';

export default async function FreeEditPage({ params }) {
  const { id } = await params;

  return <Edit postId={id} boardType="free" titleText="자유게시판 글 수정" />;
}
