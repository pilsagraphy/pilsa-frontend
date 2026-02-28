import NoticeDetailView from '@/components/service/notices/detail/NoticeDetailView';

export default function Page({ params }) {
  return <NoticeDetailView noticeId={params.id} />;
}
