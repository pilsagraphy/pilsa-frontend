// 로그인, 회원가입, 로그아웃, 아이디/비번 찾기 등 인증 관련 API 처리
import axiosInstance from '@/apis/axiosInstance';

// 공통 에러 메시지 추출
// 인증 API 는 실패 응답이 객체({ message })인 것과 문자열인 것이 섞여 있어 둘 다 받는다
export const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (typeof data === 'string') return data;
  if (typeof data?.message === 'string') return data.message;
  return fallback;
};

// 토큰 관련 API
// 1. 액세스 토큰 재발급 (POST /api/auth/token/access/refresh)
//    응답: { accessToken, userId, memberType, adminLevel, refreshExp }
// 본문 없이 refreshToken 쿠키로 동작한다. 재발급마다 쿠키도 새로 교체된다(sliding)
// 매번 DB 에서 회원 상태를 다시 확인하므로 정지된 계정은 즉시 막힌다
// 실패: 401 로그인 정보 없음 / 403 정지·차단 + banType, bannedUntil
//
// 진행 중인 재발급 요청을 재사용(single-flight)해 동시 호출로 인한
// 리프레시 토큰 회전(rotation) 레이스를 방지한다.
let refreshPromise = null;
export const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = axiosInstance
    .post('/api/auth/token/access/refresh')
    .then((response) => response.data) // 새로운 accessToken 반환 예상
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

// 2. 리프레시 토큰 검사 (POST /api/auth/token/refresh/validate) - 200(쿠키 있음) / 204(쿠키 없음)
// 자동 로그인 판정용. 본문이 없으므로 response.data 가 아니라 status 로 판단한다
export const validateRefreshToken = (token) => {
  return axiosInstance.post('/api/auth/token/refresh/validate');
};

// 3. 리프레시 토큰 연장 (POST /api/auth/token/refresh/extend)
//    응답: { accessToken, userId, memberType, adminLevel, refreshExp }
// 로그인 유지 수동 연장. 리프레시 토큰의 autoLogin claim 으로 원래 로그인의 수명을 승계한다
// 실패: 401 로그인 정보 없음 / 401 리프레시 토큰 무효 / 403 정지·차단 + banType, bannedUntil
export const extendRefreshToken = (token) => {
  return axiosInstance.post('/api/auth/token/refresh/extend');
};

// 로그인 관련 API
// 1. 로그인 (POST /api/auth/login)
//    응답: { accessToken, userId, memberType, adminLevel, refreshExp }
// autoLogin=true → refreshToken 쿠키 400일 / false·미전달 → 세션 쿠키 + 12시간
// 실패: 401 아이디 또는 비밀번호 불일치 / 401 승인되지 않은 계정
//      403 정지·차단 + banType('temporary'|'permanent'), bannedUntil
//      ★bannedUntil 은 ISO 가 아니라 화면 표기 그대로 'yyyy.MM.dd HH:mm' 다 (그대로 출력)
export const login = async (loginId, password, autoLogin = false) => {
  const response = await axiosInstance.post('/api/auth/login', { loginId, password, autoLogin });
  return response.data;
};

// 2. 회원가입 (POST /api/auth/register) - 응답: { message }
// 이메일 인증번호 검증 통과 후 30분 내에 호출해야 한다 (서버가 통과 플래그를 직접 검증)
// 관리 권한은 가입으로 얻을 수 없다(항상 0). memberType 미지정 시 STUDENT
// 실패: 403 이메일 인증 미완료·만료 / 409 아이디·이메일·학번·전화 중복
//      400 형식 위반(필드별 message) / 400 유효하지 않은 회원 구분
//      403 가입이 제한된 학번(영구차단 탈퇴) / 403 탈퇴 후 30일 재가입 쿨다운
export const registerUser = async (payload) => {
  const response = await axiosInstance.post('/api/auth/register', payload);
  return response.data;
};

// 2-1. 아이디 중복 확인 (GET /api/auth/check?loginId=value) - 200 본문 없음(사용 가능)
// 실패: 400 '이미 사용 중인 아이디입니다.' — 객체가 아니라 문자열로 내려온다
export const checkLoginIdDuplicate = async (loginId) => {
  const response = await axiosInstance.get('/api/auth/check', {
    params: { loginId },
  });
  return response.data;
};

// 2-2. 이메일 중복 확인 (GET /api/auth/check?email=value) - 200 본문 없음(사용 가능)
// loginId 와 email 중 하나만 보낸다. 둘 다 안 보내면 400
// 실패: 400 '이미 가입된 이메일 주소입니다.' — 문자열
export const checkEmailDuplicate = async (email) => {
  const response = await axiosInstance.get('/api/auth/check', {
    params: { email },
  });
  return response.data;
};

// 3. 로그아웃 (POST /api/auth/token/logout) - 200 본문 없음
// 본문 없이 refreshToken 쿠키를 삭제한다
// ※ 알림 토글과 다르다 — 로그아웃에서는 pushManager.unsubscribe() 를 하지 않는다
//   (notification.js 2번 주석 참고)
export const logout = async () => {
  const response = await axiosInstance.post('/api/auth/token/logout');
  return response.data;
};

// 4. 권한 조회 (GET /api/role) - 응답: { memberType: 'STUDENT'|'ALUMNI', adminLevel: 0~3 }
// adminLevel 0=일반회원, 1~3=관리자. 1기의 { role } 단일 값이 2축으로 갈린 것
export const getRole = async () => {
  const response = await axiosInstance.get('/api/role');
  return response.data;
};

// 4-1. 내 이름 조회 (GET /api/user/name) - 응답: { name }
// 헤더·마이페이지 진입부의 'OOO님' 표기용. 본인 이름만 조회된다
// 실패: 401 Authorization 헤더 누락/무효 / 404 탈퇴 처리된 계정의 토큰
export const getUserName = async () => {
  const response = await axiosInstance.get('/api/user/name');
  return response.data;
};

// 5. 아이디 찾기
// 5-1. 인증번호 검증 (POST /api/auth/id/verify) - 응답: { message }
// 이 검증을 통과해야 5-2 를 호출할 수 있다
export const verifyFindIdCode = async (email, code) => {
  const response = await axiosInstance.post('/api/auth/id/verify', { email, code });
  return response.data;
};

// 5-2. 아이디 찾기 (GET /api/auth/id/find) - 응답: { message, loginId }
// 인증이 완료된 이메일로만 조회된다 (5-1 선행 필수)
export const findLoginIdByEmail = async (email) => {
  const response = await axiosInstance.get('/api/auth/id/find', {
    params: { email },
  });
  return response.data; // { message, loginId }
};

// 5-3. 이메일 찾기 (POST /api/auth/email/find) [PUBLIC] — 미연동
//      요청: { studentNo, name }  ★기존 findEmailByLoginId(loginId) 스텁과 스펙이 다르다
//      응답: { email } — 마스킹된 이메일 (예: 'ho**@pilsa.co.kr')
//      GET + loginId 가 아니라 POST + 학번/이름이다. 함수명도 findEmailByStudentNo 로 맞출 것

// 6. 비밀번호 초기화
// 6-1. 인증번호 발송 (GET /api/auth/verification) - 응답: { message, expireTime }
// 아이디+이메일이 일치하는지 검증한 뒤 발송한다. expireTime 은 만료까지 남은 초
export const sendPasswordResetVerification = async (loginId, email) => {
  const response = await axiosInstance.get('/api/auth/verification', {
    params: { loginId, email },
  });
  return response.data;
};

// 6-2. 비밀번호 재설정 (PUT /api/auth/password/reset) - 200 본문 없음
// 인증 플로우: 6-1(발송) → mail.js 의 인증번호 검증 → 이 API (30분 내)
// 실패: 404 '해당 아이디는 존재하지 않습니다.'(문자열)
//      401 이메일 인증 미완료·만료 / 400 비밀번호 형식(문자·숫자·특수문자 8~20자)
// ※ 로그인 상태에서의 비밀번호 변경은 별개 API 다 (mypage.js)
export const resetPassword = async ({ loginId, newPassword }) => {
  const response = await axiosInstance.put('/api/auth/password/reset', { loginId, newPassword });
  return response.data;
};
