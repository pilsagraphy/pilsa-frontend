// 관리자 목록 페이지(회원 · 게시판 · 게시글 · 댓글)가 공유하는 클래스
// 같은 시안에서 나온 화면들이라 래퍼 · 제목 · 액션 버튼 크기가 모두 같다.

// 페이지 전체를 감싸는 섹션 래퍼
export const listSectionClass =
  'mx-auto flex w-full max-w-[1016px] flex-col bg-white px-4 py-4 sm:px-6 sm:py-7 md:p-10';

// 페이지 제목 (예: 게시글 관리)
export const listTitleClass =
  "my-[15px] font-['Pretendard',sans-serif] text-[20px] font-semibold leading-[1.5] tracking-[-0.02em] text-[#212121] md:text-[24px]";

// 제목 아래 '목록' 라벨
export const listSubtitleClass = 'text-[18px] leading-[1.6] tracking-[-0.36px] text-[#212121]';

// 오른쪽 위 액션 버튼 두 개 (예: 선택 블라인드 · 선택 삭제)
export const actionButtonClass = 'h-[52px] w-[180px] rounded-[4px] text-[16px] font-normal';

// 목록 표의 체크박스 (헤더 · 행 공용)
export const checkboxClass =
  'size-6 rounded-[4px] border-[#919191] data-[state=checked]:border-[#212121] data-[state=checked]:bg-[#212121]';
