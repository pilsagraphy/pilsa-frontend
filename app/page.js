import Signup from '@/components/service/Signup';
// app/page.js (컴포넌트 테스트용)
export default function MainPage() {
  return (
    <section className="mx-auto flex w-full flex-col gap-6 ">
      <div className="space-y-2">
        <Signup />
      </div>
    </section>
  );
}
