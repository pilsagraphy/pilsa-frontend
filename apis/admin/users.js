// 관리자 - 회원 목록/관리 API 처리
import axiosInstance from '@/apis/axiosInstance';

// 1. 회원 목록 (GET /api/admin/users) [ADMIN]
//    쿼리: page, size, keyword, sort
//    응답: { totalPages, totalCount, members: [{ userId, loginId, name, phone,
//           studentNo, email, memberType, adminLevel, postCount, commentCount,
//           banStartAt, banEndAt, banStatus }] }
export const getUsers = async (params) => {
  const response = await axiosInstance.get('/api/admin/users', { params });
  return response.data;
};

// 2. 회원 정보 수정 (PATCH /api/admin/users/{userId}) [ADMIN]
//    요청: 전달한 필드만 수정 — name, phone, studentNo, memberType, adminLevel
//          ※ email 은 수정 불가
//    응답: { message, userId }
//    실패: 400 유효하지 않은 memberType(STUDENT/ALUMNI) / 409 이미 사용 중인 이메일
export const updateUser = async (userId, payload) => {
  const response = await axiosInstance.patch(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    payload
  );
  return response.data;
};

// 3. 회원 정지 (PATCH /api/admin/users/{userId}/suspend) [ADMIN]
//    요청: { endDate: 'YYYY-MM-DD' } — 종료일 23:59:59 까지 정지
//    응답: { message, userId }
//    실패: 400 종료일이 과거 / 409 이미 영구차단된 회원
export const suspendUser = async (userId, endDate) => {
  const response = await axiosInstance.patch(
    `/api/admin/users/${encodeURIComponent(userId)}/suspend`,
    { endDate }
  );
  return response.data;
};

// 4. 회원 영구차단 - 단일/다중 (PATCH /api/admin/users/ban) [ADMIN]
//    요청: { userIds: [] }
//    응답: { message, userId: null }
//    all-or-nothing — 없는 id 가 하나라도 있으면 전체 실패(404)
export const banUsers = async (userIds) => {
  const response = await axiosInstance.patch('/api/admin/users/ban', { userIds });
  return response.data;
};

// 5. 회원 강제 탈퇴 (PATCH /api/admin/users/{userId}/withdraw) [ADMIN_LV3]
//    응답: { message, userId }
//    되돌릴 수 없다 — 개인정보 즉시 파기 + 학번 해시 보관 + 재가입 쿨다운 적용
//    실패: 404 없거나 이미 탈퇴 / 400 관리자 계정은 대상 불가 / 403 Lv3 미만
//    ※ FE 는 adminLevel < 3 이면 버튼 자체를 노출하지 않는다
export const withdrawUser = async (userId) => {
  const response = await axiosInstance.patch(
    `/api/admin/users/${encodeURIComponent(userId)}/withdraw`
  );
  return response.data;
};
