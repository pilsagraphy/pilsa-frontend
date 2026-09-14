// 동아리 일정 구독 주소(ICS 피드).
//
// 구글 캘린더 연동(서버가 각자 캘린더에 일정을 직접 넣어 주는 방식)과는 다른 길이다.
// 이쪽은 캘린더 앱이 주소를 주기적으로 읽어 가는 표준 구독이라, 구글 계정이 없어도 되고
// 아이폰 기본 캘린더처럼 구글 연동이 막히는 환경에서도 동작한다.
//
// 주소는 로그인 없이 열린다 — 동아리 일정은 공개 리소스다(백엔드 EventController).
export const CALENDAR_FEED_PATH = '/api/event/calendar.ics';

// 브라우저에서 열어 볼 수 있는 https 주소 (복사해서 다른 캘린더 앱에 붙여 넣을 때)
export const calendarFeedUrl = () =>
  typeof window === 'undefined' ? CALENDAR_FEED_PATH : `${window.location.origin}${CALENDAR_FEED_PATH}`;

// 캘린더 앱이 곧바로 열리는 주소.
// webcal:// 은 https 와 같은 곳을 가리키지만, OS 가 "브라우저로 열 것"이 아니라
// "캘린더 앱에 구독으로 넘길 것"으로 알아듣는다 — 아이폰은 이걸 눌러야 구독 창이 뜬다.
export const calendarWebcalUrl = () =>
  typeof window === 'undefined' ? CALENDAR_FEED_PATH : `webcal://${window.location.host}${CALENDAR_FEED_PATH}`;
