import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// 디자인의 회원 표기 형식: 로그인ID / 학번 / 이름
// 서버가 주지 않는 값은 자동으로 생략된다. (신고 모달 · 관리자 조치 모달이 함께 쓴다)
export function formatMemberLabel(user) {
  return [user?.loginId, user?.studentId, user?.name].filter(Boolean).join(' / ');
}
