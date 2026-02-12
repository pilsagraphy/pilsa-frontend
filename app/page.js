// app/page.js (컴포넌트 테스트용)
import Notice from "@/components/service/board/Notice";

export default function MainPage() {
  return (
    <section className="mx-auto flex w-full flex-col gap-6 ">
      <div className="space-y-2">
        <Notice />
      </div>
    </section>
  );
}
