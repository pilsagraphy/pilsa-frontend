import FreeEdit from '@/components/service/freeEdit/FreeEdit';

export default async function FreeEditPage({ params }) {
  const resolvedParams = await params;
  const postId = resolvedParams?.id;

  return <FreeEdit postId={postId} />;
}
