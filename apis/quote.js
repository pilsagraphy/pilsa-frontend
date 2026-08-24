// 이 주의 문장 관련 API 처리 (메인페이지)
// ※ 관리자용 문장 등록·수정·삭제는 apis/admin/quotes.js
import axiosInstance from '@/apis/axiosInstance';

// 1. 이 주의 문장 (GET /api/quotes/current) [PUBLIC]
//    응답: { content }
//    노출기간(startDate~endDate) 내 문장 중 랜덤 1건. 비로그인 열람 가능
