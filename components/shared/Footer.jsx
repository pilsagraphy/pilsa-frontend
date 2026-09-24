import { HELP_LINKS } from '@/constants/routes';

// 동아리 외부 링크 — 긴 원본 URL은 노출하지 않고 라벨만 건다
const CLUB_LINKS = [
  { label: '동아리 인스타', href: 'https://instagram.com/pilsa_graphy' },
  { label: '중앙동아리 페이지', href: 'https://jajudy.khu.ac.kr/club/25720' },
  { label: '홈페이지 건의사항', href: 'https://forms.gle/ZyGebkpQrLoDk7e68' },
];

// 링크 한 줄 — 동아리 링크와 정책 링크가 같은 디자인을 공유한다
function FooterLinkRow({ label, links, className = '' }) {
  return (
    <nav
      aria-label={label}
      className={`mx-auto flex max-w-md flex-wrap items-center justify-center gap-x-2 gap-y-0.5 px-4 text-[11px] leading-[1.5] text-[#757575] md:gap-y-1 md:text-[12px] md:leading-[1.6] ${className}`}
    >
      {links.map((link, index) => (
        <span key={link.href} className="flex items-center gap-2">
          {index > 0 && <span className="text-[#D6D6D6]">·</span>}
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-700 hover:underline"
          >
            {link.label}
          </a>
        </span>
      ))}
    </nav>
  );
}

export default function Footer() {
  return (
    <footer className="w-full bg-white pb-6 pt-0 text-center not-italic md:py-10">
      <div className="mb-5 mt-6 h-px w-full bg-gray-200 md:my-10" />

      <div className="mx-auto max-w-md text-[#454545]">
        <h2 className="mb-2 text-[16px] font-medium leading-[1.4] md:mb-5 md:text-[20px] md:leading-[18px]">
          필사그래피
        </h2>

        <p className="text-[12px] leading-[1.5] md:text-[13px] md:leading-[1.6]">
          경희대학교 국제캠퍼스 학생회관 614호
        </p>
      </div>

      <FooterLinkRow label="동아리 링크" links={CLUB_LINKS} className="mt-3 md:mt-4" />
      <FooterLinkRow label="정책 및 도움말" links={HELP_LINKS} className="mt-1 md:mt-1.5" />

      <p className="mt-3 text-[11px] leading-[1.5] text-[#919191] md:mt-2 md:text-[12px] md:leading-[35px]">
        @Copyright 2026. pilsagraphy All Rights Reserved.
      </p>
    </footer>
  );
}
