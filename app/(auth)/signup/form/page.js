// app/(auth)/signup/form/page.js
import SignupForm from '@/components/service/signup/SignupForm';
import { Suspense } from 'react';

export default function SignupFormPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
