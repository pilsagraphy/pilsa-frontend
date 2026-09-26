// 운영 관리 > 정책 설정 · 알림 설정 API (관리자)
import axiosInstance from '@/apis/axiosInstance';

// 1. 정책 전체 (GET /api/admin/policies) [ADMIN]
//    응답: { settings: [{ settingId, code, settingValue, description }], banPolicies: [{ banPolicyId, code, warningNo, banType, banDays, description }] }
//    알림 설정 화면은 settings 중 code 가 notify_ 로 시작하는 것만 쓴다
export const getPolicies = async () => {
  const response = await axiosInstance.get('/api/admin/policies');
  return response.data;
};

// 2. 정책 값 수정 (PUT /api/admin/policies/settings/{code}) [ADMIN level 3]
//    본문: { settingValue, description? }. 형식 오류 400, 없는 키 404, 레벨 부족 403. 바뀐 행 반환
export const updatePolicySetting = async (code, { settingValue, description }) => {
  const response = await axiosInstance.put(`/api/admin/policies/settings/${encodeURIComponent(code)}`, {
    settingValue,
    description,
  });
  return response.data;
};

// 3. 정지 단계 수정 (PUT /api/admin/policies/ban/{warningNo}) [ADMIN level 3]
//    본문: { banType: 'temporary'|'permanent', banDays?, description? }. 바뀐 행 반환
export const updateBanPolicy = async (warningNo, { banType, banDays, description }) => {
  const response = await axiosInstance.put(`/api/admin/policies/ban/${warningNo}`, {
    banType,
    banDays,
    description,
  });
  return response.data;
};
