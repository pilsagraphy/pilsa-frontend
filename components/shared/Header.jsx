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
          px-[5px]  /* 양옆 최소 간격 5px 유지 */
          lg:px-24
        "
      >
        {/* 중앙 로고: clamp를 사용하여 유동적인 폰트 크기 적용 */}
        <h1
          className={`${zenDots.className} text-center whitespace-nowrap`}
          style={{
            /* clamp(최소값, 가변값, 최대값)
               - 최소: 24px (모바일 최저치)
               - 가변: 9vw (화면 너비의 9%에 맞춰 변화)
               - 최대: 48px
            */
            fontSize: 'clamp(24px, 9vw, 48px)',
          }}
        >
          <Link href="/" aria-label="홈으로 이동" className="inline-block">
            PILSAGRAPHY
          </Link>
        </h1>
      </div>
    </header>
  );
}
