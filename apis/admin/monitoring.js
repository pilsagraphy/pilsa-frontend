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
