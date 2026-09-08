import AuthGuard from '@/components/common/AuthGuard';
import ReportListSection from '@/components/service/adminReports/ReportListSection';

// 게시글 관리 · 댓글 관리의 '신고 관리로 이동' 버튼이 ?tab=post|comment 를 달고 보낸다.
// 어느 탭을 열지는 여기서 읽어 넘긴다 — 목록 컴포넌트가 주소를 직접 읽지 않게 해서
// 신고 관리 API 연동(브랜치 182)이 그 파일을 고칠 때 겹치는 부분을 최소로 둔다.
// 값이 없거나 이상하면 ReportListSection 이 기본 탭(게시글 신고)으로 되돌린다.
export default async function AdminReportsPage({ searchParams }) {
  const { tab } = await searchParams;

  return (
    <AuthGuard>
      <ReportListSection title="신고 관리" initialTab={tab} />
    </AuthGuard>
  );
}
