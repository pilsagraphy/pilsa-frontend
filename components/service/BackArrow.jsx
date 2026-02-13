'use client';

import { useRouter } from 'next/navigation';

export default function BackArrow({ className = '' }) {
  const router = useRouter();

  return (
    // ✅ 클릭하면 뒤로가기 되도록 버튼으로 감쌈
    <button
      type="button"
      aria-label="Go back"
      onClick={() => router.back()}
      className={`inline-flex items-center justify-center ${className}`}
    >
      {/* ✅ 피그마 SVG 그대로 */}
      <svg
        width="11.5"
        height="23"
        viewBox="0 0 11.5 23"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_123_409)">
          <line
            stroke="#454545"
            strokeLinecap="round"
            strokeWidth="3"
            x1="11.5"
            x2="2.12132"
            y1="2.12132"
            y2="11.5"
          />
          <line
            stroke="#454545"
            strokeLinecap="round"
            strokeWidth="3"
            transform="matrix(-0.707107 -0.707107 -0.707107 0.707107 11.5 23)"
            x1="1.5"
            x2="14.7635"
            y1="-1.5"
            y2="-1.5"
          />
        </g>
        <defs>
          <clipPath id="clip0_123_409">
            <rect width="11.5" height="23" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </button>
  );
}
