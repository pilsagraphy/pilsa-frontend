import NoticeDetailView from '@/components/service/notices/detail/NoticeDetailView';

export default function Page({ params }) {
  const { id } = params;
  return <NoticeDetailView noticeId={id} />;
}
