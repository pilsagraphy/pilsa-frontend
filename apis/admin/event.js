// 관리자 - 일정(캘린더) 관리 API 처리
// ※ 조회(목록/ICS)는 apis/event.js — 관리자 화면도 목록은 그쪽을 재사용한다
import axiosInstance from '@/apis/axiosInstance';

// 1. 일정 등록 (POST /api/admin/event) [ADMIN]
//    요청: { title, category, description, startDate, endDate }  // YYYY-MM-DD
//      description 은 DB NOT NULL — 빈 문자열이라도 채워 보낸다
//      category 는 varchar(50) 자유 입력 (선택지 목록 API 없음, NULL 허용)
//    응답: 201 { message, data: { eventId, title } }  ← 200 아님
//    실패: 400 시작일/종료일 필수 / 400 시작일 > 종료일 / 403 관리자 권한 필요

// 2. 일정 수정 (PUT /api/admin/event/{eventId}) [ADMIN]
//    요청: 전달한 필드만 반영 — title, category, description, startDate, endDate
//    응답: { message, data: { eventId, updatedAt } }
//    실패: 404 없거나 이미 삭제된 일정 / 403 관리자 권한 필요
//    ※ 등록과 달리 서버에 시작일<=종료일 검증이 없다 → FE 에서 검증할 것

// 3. 일정 삭제 (DELETE /api/admin/event/{eventId}) [ADMIN]
//    응답: { message } — 메서드는 DELETE 지만 실제 동작은 소프트 삭제
//    실패: 404 이미 삭제된 일정 / 403 관리자 권한 필요
