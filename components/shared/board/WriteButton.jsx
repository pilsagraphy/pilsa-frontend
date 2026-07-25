import Link from "next/link";
import { Button } from "@/components/ui/button";

const buttonClass =
  "w-[200px] h-[52px] bg-[#212121] text-[16px] text-white border";

export default function WriteButton({ href, boardType }) {
  if (boardType === "notices") {
    return null;
  }

  return (
    <Link href={href}>
      <Button className={buttonClass}>글 작성하기</Button>
    </Link>
  );
}
