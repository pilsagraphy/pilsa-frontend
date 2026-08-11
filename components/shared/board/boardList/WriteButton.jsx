import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

const buttonClass = 'w-[200px] h-[52px] bg-[#212121] text-[16px] text-white border';

// 글쓰기 권한(canWrite)이 있는 게시판에서만 노출한다
export default function WriteButton({ boardId, canWrite }) {
  if (!canWrite) return null;

  return (
    <Link href={ROUTES.BOARD_WRITE(boardId)}>
      <Button className={buttonClass}>글 작성하기</Button>
    </Link>
  );
}
