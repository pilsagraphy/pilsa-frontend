// app/(auth)/signup/form/page.js
import SignupForm from '@/components/service/Signup/SignupForm';
import { Suspense } from 'react';

export default function SignupFormPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
