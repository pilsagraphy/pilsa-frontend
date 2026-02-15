// app/page.js (컴포넌트 테스트용)
import History from '@/components/service/History';
import Intro from '@/components/service/Intro';
export default function MainPage() {
  return (
    <section className="mx-auto flex w-full flex-col gap-8">
      <div className="space-y-2">
        <Intro />
      </div>
    </section>
  );
}
