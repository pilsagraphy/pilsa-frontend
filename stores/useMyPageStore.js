import { create } from 'zustand';

import { getMyPage } from '@/apis/mypage';

// 마이페이지 프로필/활동 요약 상태
// (프로필 카드·인사말·활동 통계가 같은 요약 데이터를 공유한다)
const useMyPageStore = create((set, get) => ({
  // 상태 3종 세트
  summary: null, // 받아온 내용 { loginId, name, joinedAt, postCount, commentCount, likedCount, semester }
  isLoading: false, // 로딩 중?
  error: null, // 실패 이유(사용자용 문장)

  // 프로필/활동 요약 불러오기
  fetchSummary: async () => {
    // '동시 호출'만 막는다(영구 캐시 아님) — 계정을 바꿔 다시 진입하면 새로 불러와야 하기 때문.
    if (get().isLoading) return;

    set({ isLoading: true, error: null }); // 시작: 로딩 켜고 이전 에러 지우기
    try {
      const data = await getMyPage(); // getMyPage 가 이미 response.data(요약 객체)를 반환한다
      set({ summary: data, isLoading: false }); // 성공
    } catch (e) {
      set({ error: '마이페이지 정보를 불러오지 못했습니다.', isLoading: false }); // 실패
    }
  },

  // 이전 사용자 정보가 남지 않도록 초기화 (마이페이지를 떠날 때 호출)
  reset: () => set({ summary: null, isLoading: false, error: null }),
}));

export default useMyPageStore;
