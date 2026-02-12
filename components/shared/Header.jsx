import { Menu } from 'lucide-react';
import { Zen_Dots } from 'next/font/google';
import BackArrow from '@/components/shared/BackArrow';

const zenDots = Zen_Dots({
  weight: '400',
  subsets: ['latin'],
});

export default function Header() {
  return (
    <header className="relative w-full h-40">
      <BackArrow
        className="
      absolute
      left-64
      top-32
      -translate-y-1/2"
      />
      <div
        className="
          grid h-full items-center
          grid-cols-[1fr_auto_1fr]
          px-2.5
          lg:px-24
        "
      >
        {/* 왼쪽 여백 */}
        <div />

        {/* 중앙 로고 */}
        <h1 className={`${zenDots.className} text-[48px] text-center whitespace-nowrap`}>
          PILSAGRAPHY
        </h1>

        {/* 오른쪽 메뉴 */}
        <div className="flex justify-end min-w-9 ml-1">
          <button type="button" aria-label="Open menu" className="text-zinc-300">
            <Menu className="w-9 h-9" />
          </button>
        </div>
      </div>
    </header>
  );
}
