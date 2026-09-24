import Image from 'next/image';

// 방명록은 아직 준비 중이다. 다른 어바웃 페이지와 같은 틀(바깥 여백 · 제목 칸)에 안내 그림만 둔다 —
// 그림만 덜렁 두면 메뉴를 오갈 때 제목 자리가 사라졌다 나타나 화면이 튄다.
export default function GuestbookPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-8 bg-white px-4 py-4 sm:px-6 sm:py-7 md:gap-[40px] md:p-10">
      <header className="flex flex-col gap-[8px] border-b-[1.5px] border-[#DEDEDE] pb-6 md:gap-[12px] md:pb-[40px]">
        <h2 className="font-['Pretendard',sans-serif] text-[24px] font-semibold leading-[1.5] tracking-[-0.02em] text-[#212121]">
          방명록
        </h2>
        <p className="font-['Pretendard',sans-serif] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#919191]">
          준비 중입니다
        </p>
      </header>

      <Image
        src="/images/404.png"
        alt="방명록 준비 중"
        width={1000}
        height={1000}
        className="mx-auto h-auto w-full max-w-[640px] object-contain"
        priority
      />
    </div>
  );
}
