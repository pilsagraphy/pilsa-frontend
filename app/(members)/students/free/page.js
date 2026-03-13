import BoardSection from "@/components/shared/board/BoardSection";
import { DUMMY_POSTS_FREE } from "@/mocks/postsData";
export default function FreePage() {
  return <BoardSection title="자유게시판" boardType="free" postsData={DUMMY_POSTS_FREE}/>;
}