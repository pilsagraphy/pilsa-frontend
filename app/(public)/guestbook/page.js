import Image from 'next/image';

export default function GuestbookPage() {
  return (
    <Image
      src="/images/404.png"
      alt="방명록"
      width={1000}
      height={1000}
      className="object-contain max-w-full h-auto"
      priority
    />
  );
}
