# Pilsa Frontend

필사 홈페이지 제작단 Frontend팀

## 👥 Team Members

- 윤정민 [@Kristyn-Yoon](https://github.com/Kristyn-Yoon)
- 문예빈 [@yeabhin37](https://github.com/yeabhin37)
- 신채원 [@kalrae](https://github.com/kalrae)
- 정주환 [@juhwan12345](https://github.com/juhwan12345)
- 하종연 [@jngyeon125](https://github.com/jngyeon125)

## 할당업무 (추후 업데이트 예정)

- 윤정민
- 문예빈
- 신채원
- 정주환
- 하종연

## 폴더구조

```
├── app/ #  Next.js App Router (라우팅 전용)
│   ├── layout.js  # 전역 레이아웃 (Header 등)
│   ├── page.js  # 메인 페이지
│   ├── (auth)/  # 인증 관련 라우트 그룹
│   ├── (member)/  # 로그인 후 영역 - 재학생, 졸업생
│   └── (public)/  # 비로그인 접근 가능 페이지
├── components/  # 재사용 가능한 UI 컴포넌트
│   ├── ui/  # 가장 작은 단위 UI (shadcn, button, input 등)
│   ├── common/  # 전역 공통 단일 컴포넌트
│   ├── shared/  # 여러 컴포넌트가 조합 + 여러 곳에서 사용되는 컴포넌트
│   └── service/  # 특정 도메인 전용 컴포넌트
├── hooks/  # 커스텀 React Hooks
├── apis/  # API 통신 관련 로직
├── stores/  # Zustand 전역 상태
├── utils/  # 유틸리티 함수
└── constants/  # 상수 정의
```

## 기술 스택

![Next.js](https://img.shields.io/badge/Next.js-000?logo=next.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-000?logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-000?logo=react&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000?logo=radixui&logoColor=white)
