import BoardDetailView from '@/components/service/frees/BoardDetailView';

export default function Page({ params }) {
  const { id } = params;
  return <BoardDetailView postId={id} />;
}
