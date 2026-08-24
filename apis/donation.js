// 명예의 전당(후원자) 관련 API 처리
// ※ honor.js(/api/public/honor/) 를 대체한다
import axiosInstance from '@/apis/axiosInstance';

// 1. 후원자 전체 목록 (GET /api/donations) [PUBLIC]
//    응답: [{ donationId, amount, displayName, affiliation, major, message,
//           donatedAt, isAnonymous, photoUrl }]
//    비로그인 열람 가능. 익명 후원이면 displayName 이 '익명후원자'로 치환되어 내려온다
//    photoUrl(/uploads/Honor/**)은 공개 정적 서빙이 유지되므로 그대로 <img src> 로 쓴다
