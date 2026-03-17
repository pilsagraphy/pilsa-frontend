import { Menu } from 'lucide-react';
import Link from 'next/link';
import { Zen_Dots } from 'next/font/google';

const zenDots = Zen_Dots({
  weight: '400',
  subsets: ['latin'],
});

export default function Header() {
  return (
    <header className="w-full h-40">
      <div
        className="
          grid h-full items-center
          px-2.5
          lg:px-24
        "
      >
        {/* 중앙 로고 */}
        <h1 className={`${zenDots.className} text-[48px] text-center whitespace-nowrap`}>
          <Link href="/" aria-label="홈으로 이동" className="inline-block">
            PILSAGRAPHY
          </Link>
        </h1>
      </div>
    </header>
  );
}
