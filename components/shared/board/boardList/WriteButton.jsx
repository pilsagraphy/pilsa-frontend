import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

const baseClass = 'w-[200px] h-[52px] text-[16px] border';
const enabledClass = `${baseClass} bg-[#212121] text-white`;
const disabledClass = `${baseClass} bg-[#DEDEDE] text-[#919191] cursor-not-allowed hover:bg-[#DEDEDE]`;

// 글쓰기 권한(canWrite)이 없으면 버튼을 비활성 상태로 보여준다.
// canWrite 는 서버가 게시판의 write_level 과 로그인 사용자의 adminLevel 을 비교해 내려주는 값이다.
export default function WriteButton({ boardId, canWrite }) {
  // 권한이 없으면 링크로 감싸지 않는다 —
  // 감싸면 버튼이 disabled 여도 주변 여백 클릭으로 이동해 버린다.
  if (!canWrite) {
    return (
      <Button
        type="button"
        disabled
        aria-disabled="true"
        title="이 게시판에 글을 등록할 권한이 없습니다."
        className={disabledClass}
      >
        글 작성하기
      </Button>
    );
  }

  return (
    <Link href={ROUTES.BOARD_WRITE(boardId)}>
      <Button className={enabledClass}>글 작성하기</Button>
    </Link>
  );
}
