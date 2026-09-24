'use client';

import { useEffect, useState } from 'react';

/**
 * 값이 잠잠해진 뒤에야 바뀌는 사본을 돌려준다.
 *
 * 검색창은 글자를 칠 때마다 값이 바뀌는데, 그 값을 그대로 서버 조회에 쓰면
 * 한 글자당 요청이 한 번씩 나간다. 입력창은 즉시 반응해야 하므로 값 자체는 그대로 두고,
 * 서버에 보낼 값만 여기서 늦춘다.
 *
 * @param {*} value 원본 값 (검색어 등)
 * @param {number} delay 잠잠해질 때까지 기다릴 시간(ms)
 * @returns {*} delay 만큼 지연된 값
 */
export default function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    // 값이 또 바뀌면 이전 타이머를 버리고 다시 센다
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
