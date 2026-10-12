// app/(auth)/signup/form/page.js
import SignupForm from '@/components/service/Signup/SignupForm';
import AppLoading from '@/components/common/AppLoading';
import { Suspense } from 'react';

// 폴백은 다른 화면과 같은 공용 로딩 애니메이션 — 'Loading...' 글자만 보이던 것 (PM 2026-10-13)
export default function SignupFormPage() {
  return (
    <Suspense fallback={<AppLoading full />}>
      <SignupForm />
    </Suspense>
  );
}
