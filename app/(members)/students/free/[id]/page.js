import FreeDetailView from '@/components/service/frees/FreeDetailView';

export default function Page({ params }) {
  const { id } = params;
  return <FreeDetailView postId={id} />;
}
