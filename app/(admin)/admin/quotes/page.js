import AuthGuard from '@/components/common/AuthGuard';
import QuoteListSection from '@/components/service/adminQuotes/QuoteListSection';

export default function AdminQuotesPage() {
  return (
    <AuthGuard>
      <QuoteListSection title="이 주의 문장" />
    </AuthGuard>
  );
}
