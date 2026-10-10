import Guestbook from '@/components/service/guestbook/Guestbook';

// 메모판 바탕 비교용 임시 페이지 (PM 10/10 밤) — 결정되면 지운다
export default function GuestbookGrayTestPage() {
  return <Guestbook boardTheme="gray" />;
}
