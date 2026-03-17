import Edit from '@/components/shared/Edit';

export default async function InfoEditPage({ params }) {
  const { id } = await params;

  return <Edit postId={id} boardType="info" titleText="정보게시판 글 수정" />;
}
