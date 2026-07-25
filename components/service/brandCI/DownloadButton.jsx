import { Download } from 'lucide-react';

export default function DownloadButton() {
  return (
    <a
      href="/images/brandCI/logo.png"
      download="pilsagraphy-logo.png"
      aria-label="로고 다운로드"
      className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-[4px] text-black"
    >
      <Download size={20} strokeWidth={2} />
    </a>
  );
}
