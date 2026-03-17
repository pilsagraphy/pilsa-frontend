export default function Footer() {
  return (
    <footer className="w-full bg-white py-10 text-center font-['Pretendard',sans-serif] not-italic">
      <div className="my-10 h-px w-full bg-gray-200" />

      <div className="mx-auto max-w-md text-[#454545]">
        <h2 className="text-[20px] font-medium leading-[18px] mb-5">필사그래피</h2>

        <p className="text-[13px] leading-[1.6]">경희대학교 국제캠퍼스 학생회관 614호</p>

        <p className="text-[13px] leading-[1.6]">인스타 : @pilsa_graphy</p>

        <p className="text-[13px] leading-[1.6] break-all">
          중앙동아리 페이지 :{' '}
          <a
            href="https://jajudy.khu.ac.kr/club/25720"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-neutral-700"
          >
            https://jajudy.khu.ac.kr/club/25720
          </a>
        </p>
      </div>

      <p className="mt-2 text-[12px] leading-[35px] text-[#919191]">
        @Copyright 2026. pilsagraphy All Rights Reserved.
      </p>
    </footer>
  );
}
