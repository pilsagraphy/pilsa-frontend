'use client';

import { Zen_Dots } from 'next/font/google';

// 헤더 로고와 같은 서체
const zenDots = Zen_Dots({ weight: '400', subsets: ['latin'] });

const WORD = 'PILSAGRAPHY';

/**
 * 공용 로딩 화면 — 로고 글자가 왼쪽부터 차례로 떠올랐다 가라앉고 아래에 얇은 선이 흐른다 (스타일은 globals.css .appLoading).
 *
 * 화면마다 "불러오는 중입니다." · "로딩 중..." 처럼 제각각이던 문구를 이 하나로 모은다.
 * full 은 라우트 전환처럼 화면 전체가 비는 경우(app/loading.js), 기본은 페이지 안 한 영역이 비는 경우다.
 */
export default function AppLoading({ full = false, label = '불러오는 중' }) {
  return (
    <div
      className={`appLoading${full ? ' appLoading--full' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <p className={`${zenDots.className} appLoading__word`} aria-hidden>
        {WORD.split('').map((ch, i) => (
          <span key={i} className="appLoading__letter" style={{ '--i': i }}>
            {ch}
          </span>
        ))}
      </p>
      <span className="appLoading__bar" aria-hidden />
    </div>
  );
}
