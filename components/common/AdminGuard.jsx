'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import useAuthStore from '@/stores/useAuthStore';
import { BASE_PATH } from '@/constants/routes';

// 관리자 화면 보호막 — 로그인 여부(AuthGuard)와 별개로 관리레벨(adminLevel >= 1)을 확인한다.
// 서버도 /api/admin/** 을 ROLE_ADMIN 으로 막고 있으므로 이 가드는 UX용 1차 방어선이다.
export default function AdminGuard({ children }) {
  const router = useRouter();
  const { isLoggedIn, authChecked, adminLevel, memberType, fetchRole } = useAuthStore();
  const [roleChecked, setRoleChecked] = useState(false);

  useEffect(() => {
    if (!authChecked) return;

    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }

    // 새로고침 직후 등 role 미조회 상태면 서버에서 최신값 확인
    const verify = async () => {
      let level = adminLevel;
      if (memberType == null) {
        const data = await fetchRole();
        level = data?.adminLevel ?? 0;
      }
      if (level < 1) {
        toast.error('관리자만 접근할 수 있는 페이지입니다.');
        router.replace(BASE_PATH);
        return;
      }
      setRoleChecked(true);
    };

    verify();
  }, [authChecked, isLoggedIn, adminLevel, memberType, fetchRole, router]);

  if (!authChecked || !roleChecked) {
    return <div className="py-20 text-center text-[#919191]">권한 확인 중...</div>;
  }

  return children;
}
