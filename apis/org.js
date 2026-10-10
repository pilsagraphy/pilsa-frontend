// 조직 (역대 회장 · 학기별 임원진 · 현재 조직도) — 공개 API. 관리자 편집은 apis/admin/org.js
// 예전엔 constants/leader.js · constants/organization.js 상수였다 → 운영 관리 > 조직도 편집에서 고친다 (PM 2026-10-10)
import axiosInstance from '@/apis/axiosInstance';
import { apiUrl } from '@/lib/apiBase';

// 1. 조직 전체 (GET /api/org) [PUBLIC]
//    응답: { currentTerm, presidents: [{ presidentId, seqNo, order('초대 회장'), name, startYear, endYear, period('(2021~2022)'),
//            photoUrl, officers: [{ term, roles: [{ role, names[] }], teams: [{ title, leader, members[] }], advisors[] }] }] }
//    소개 페이지 조직도는 currentTerm(마지막 기수의 마지막 학기)을 그린다
export const getOrganization = async () => {
  const response = await axiosInstance.get('/api/org');
  return response.data;
};

// photoUrl 이 /api/.. 면 서버에 올린 사진(API 도메인을 붙인다), /images/.. 면 프론트 정적 파일 그대로
export const orgPhotoSrc = (photoUrl) => {
  if (!photoUrl) return null;
  return photoUrl.startsWith('/api/') ? apiUrl(photoUrl) : photoUrl;
};

// 현재 조직도에 그릴 학기 — currentTerm 라벨과 같은 officers 칸 (가장 최근 기수부터 찾는다)
export const findCurrentTerm = (data) => {
  if (!data?.currentTerm) return null;
  const presidents = [...(data.presidents ?? [])].reverse();
  for (const p of presidents) {
    const found = (p.officers ?? []).find((t) => t.term === data.currentTerm);
    if (found) return { ...found, president: p };
  }
  return null;
};
