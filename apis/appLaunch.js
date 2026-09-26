// 설치형 앱(TWA) 실행 신호 — 운영 관리 > 모니터링의 '앱 접속 점검' 원본
import axiosInstance from '@/apis/axiosInstance';

// 앱 실행 기록 (POST /api/user/app-launch) [MEMBER]
//   앱(시작 URL /?launch=app)으로 연 세션에서 로그인 뒤 하루 한 번 부른다 (AppLaunchBeacon).
//   회원·날짜당 1행이라 여러 번 불러도 횟수만 오른다. 응답 204.
export const recordAppLaunch = async () => {
  await axiosInstance.post('/api/user/app-launch');
};
