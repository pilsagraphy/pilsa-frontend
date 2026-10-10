// 운영 관리 > 모니터링 API (관리자)
import axiosInstance from '@/apis/axiosInstance';

// 1. 앱 접속 점검 (GET /api/admin/monitoring/app-launches?date=YYYY-MM-DD) [ADMIN]
//    응답: { date, trackingSince, totalMembers, launchedCount, notLaunchedCount, webOnlyCount,
//            members: [{ userId, name, memberType, adminLevel, joinedDate, launched, launchedAt, launchCount,
//                        webAccessedAt, lastLaunchDate, missStreak }] }
//    정렬: 안 연 사람(연속 미접속 긴 순) → 연 사람(이른 시각 순). date 생략 시 오늘
export const getAppLaunchReport = async (date) => {
  const response = await axiosInstance.get('/api/admin/monitoring/app-launches', { params: { date } });
  return response.data;
};

// 2. 일별 접속 추이 (GET /api/admin/monitoring/access/daily?days=30) [ADMIN]
//    응답: [{ date, activeUsers, appLaunches }] 오래된 날부터, 빈 날 0
export const getDailyAccess = async (days = 30) => {
  const response = await axiosInstance.get('/api/admin/monitoring/access/daily', { params: { days } });
  return response.data;
};

// 3. 시간대별 접속 (GET /api/admin/monitoring/access/hourly?date=) [ADMIN]
//    응답: [{ hour: 0..23, count }]
export const getHourlyAccess = async (date) => {
  const response = await axiosInstance.get('/api/admin/monitoring/access/hourly', { params: { date } });
  return response.data;
};

// 4. 주간 신규 가입 (GET /api/admin/monitoring/signups/weekly?weeks=12) [ADMIN]
//    응답: [{ statWeek, signupCount, studentCount, alumniCount, capturedAt }] 오래된 주부터
export const getWeeklySignups = async (weeks = 12) => {
  const response = await axiosInstance.get('/api/admin/monitoring/signups/weekly', { params: { weeks } });
  return response.data;
};

// 5. 급상승 집계 (GET /api/admin/monitoring/trending?hours=48&onlyTrending=false&limit=50) [ADMIN]
//    응답: [{ statHour, postId, boardId, boardName, title, readScope, rankNo, isTrending, rawScore, baselineScore,
//             spikeRatio, finalScore, viewDelta, likeDelta, commentDelta, viewCount, likeCount, commentCount }]
export const getTrending = async ({ hours = 48, onlyTrending = false, limit = 50 } = {}) => {
  const response = await axiosInstance.get('/api/admin/monitoring/trending', {
    params: { hours, onlyTrending, limit },
  });
  return response.data;
};

// ── 고도화 (PM 2026-10-10 밤) ──
// 요약 카드: { dau, wau, mau, membersTotal, signupsThisMonth, postsLast7, commentsLast7, postsLast30, commentsLast30, pendingReports, pushRegisteredMembers }
export const getMonitoringSummary = async () => (await axiosInstance.get('/api/admin/monitoring/summary')).data;
// N일 이상 미접속 회원: [{ userId, name, loginId, memberType, adminLevel, joinedAt, lastAccessAt, daysSince, deviceCount }]
export const getInactiveMembers = async (days = 14) => (await axiosInstance.get('/api/admin/monitoring/inactive', { params: { days } })).data;
// 게시판 활동: { days, boards: [{ boardId, boardName, postCount, commentCount, likeCount }], daily: [{ date, posts, comments }] }
export const getBoardActivity = async (days = 30) => (await axiosInstance.get('/api/admin/monitoring/boards/activity', { params: { days } })).data;
// 푸시 미등록 회원 (미접속 목록과 같은 행)
export const getPushUnregistered = async () => (await axiosInstance.get('/api/admin/monitoring/push/unregistered')).data;
// 활동 상위 회원 (postCount·commentCount 는 기간 안 수)
export const getTopMembers = async (days = 30, limit = 10) =>
  (await axiosInstance.get('/api/admin/monitoring/top-members', { params: { days, limit } })).data;
// 급상승 판정 기준값: { minScore, spikeRatio, topN }
export const getTrendingPolicy = async () => (await axiosInstance.get('/api/admin/monitoring/trending/policy')).data;
