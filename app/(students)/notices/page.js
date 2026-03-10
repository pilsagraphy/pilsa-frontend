import BoardSection from "@/components/shared/board/BoardSection";
import { DUMMY_POSTS_NOTICES } from "@/mocks/postsData";
export default function NoticePage() {
  return <BoardSection title="공지사항" boardType="notices" postsData={DUMMY_POSTS_NOTICES}/>;
}