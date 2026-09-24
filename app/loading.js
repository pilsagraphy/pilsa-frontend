import AppLoading from '@/components/common/AppLoading';

// 라우트 전환·첫 진입 중 보이는 로딩 화면. 화면 전체가 비는 자리라 full.
// (예전엔 "로딩.. 임시 UI.." 문구였다)
export default function Loading() {
  return <AppLoading full />;
}
