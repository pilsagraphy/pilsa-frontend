// 관리자 - 운영 관리 > 조직도 편집 API (PM 2026-10-10). 조회는 apis/org.js 의 getOrganization (공개)
import axiosInstance from '@/apis/axiosInstance';

// 1. 기수(회장) 등록 (POST /api/admin/org/presidents) [ADMIN]
//    요청: { seqNo, name, startYear, endYear(null=현재) } → 201 기수 한 칸(officers 빈 배열). 같은 기수 있으면 409
export const createPresident = async (body) => {
  const response = await axiosInstance.post('/api/admin/org/presidents', body);
  return response.data;
};

// 2. 기수 수정 (PUT /api/admin/org/presidents/{presidentId}) [ADMIN] — 요청·응답은 등록과 같다
export const updatePresident = async (presidentId, body) => {
  const response = await axiosInstance.put(`/api/admin/org/presidents/${encodeURIComponent(presidentId)}`, body);
  return response.data;
};

// 3. 기수 삭제 (DELETE /api/admin/org/presidents/{presidentId}) [ADMIN] — 소프트. 학기 명단도 함께 숨는다
export const deletePresident = async (presidentId) => {
  const response = await axiosInstance.delete(`/api/admin/org/presidents/${encodeURIComponent(presidentId)}`);
  return response.data;
};

// 4. 회장 사진 (POST /api/admin/org/presidents/{presidentId}/photo) [ADMIN] — multipart file 1장(이미지만). 바뀐 기수를 돌려준다
export const uploadPresidentPhoto = async (presidentId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post(
    `/api/admin/org/presidents/${encodeURIComponent(presidentId)}/photo`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 2 * 60 * 1000 }
  );
  return response.data;
};

// 5. 학기 명단 저장 (PUT /api/admin/org/presidents/{presidentId}/terms/{term}) [ADMIN]
//    없던 학기면 생성, 있던 학기면 통째로 교체. 요청: { roles: [{ role, names[] }], teams: [{ title, leader, members[] }], advisors[] }
export const saveOrgTerm = async (presidentId, term, body) => {
  const response = await axiosInstance.put(
    `/api/admin/org/presidents/${encodeURIComponent(presidentId)}/terms/${encodeURIComponent(term)}`,
    body
  );
  return response.data;
};

// 6. 학기 라벨 변경 (PATCH …/terms/{term}) [ADMIN] — 요청: { term: '새 라벨' }. 이미 있으면 409
export const renameOrgTerm = async (presidentId, term, newTerm) => {
  const response = await axiosInstance.patch(
    `/api/admin/org/presidents/${encodeURIComponent(presidentId)}/terms/${encodeURIComponent(term)}`,
    { term: newTerm }
  );
  return response.data;
};

// 7. 학기 삭제 (DELETE …/terms/{term}) [ADMIN] — 소프트
export const deleteOrgTerm = async (presidentId, term) => {
  const response = await axiosInstance.delete(
    `/api/admin/org/presidents/${encodeURIComponent(presidentId)}/terms/${encodeURIComponent(term)}`
  );
  return response.data;
};
