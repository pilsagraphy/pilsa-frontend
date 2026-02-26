import BoardSection from "@/components/service/notices/board/BoardSection";
import { DUMMY_POSTS_NOTICES } from "@/mocks/postsData";
export default function NoticePage() {
  return <BoardSection title="공지사항" boardType="notices" posts={DUMMY_POSTS_NOTICES}/>;
}
