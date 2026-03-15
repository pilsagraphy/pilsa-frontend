import Image from 'next/image';

export default function GalleryPage() {
  return (
    <Image
      src="/images/404.png"
      alt="활동 사진들"
      width={1000}
      height={1000}
      className="object-contain max-w-full h-auto"
      priority
    />
  );
}
