import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants/routes';

// /about 에는 보여 줄 내용이 없다. 소개는 하위 다섯 화면(소개·연혁·브랜드CI·명예의전당·역대회장)으로 나뉘어 있고
// 이 경로는 그 묶음의 이름일 뿐이라, 예전에는 빈 화면이 그려졌다(관리자 사이드바의 'ABOUT 필사' 가 여기로 왔다).
// 첫 화면으로 넘겨 준다.
export default function AboutIndexPage() {
  redirect(ROUTES.ABOUT_INTRO);
}
