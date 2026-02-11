// app/page.js (컴포넌트 테스트용)
import PreSignup from '@/components/service/PreSignup';

export default function MainPage() {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="space-y-2">
        <PreSignup />
      </div>
    </section>
  );
}
