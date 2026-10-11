import { useRef } from 'react';
import { randomTilt } from './guestbookStyle';

// 카드 기울기 — 인접한 카드(같은 칸의 바로 위, 왼쪽 칸의 같은 줄)와 2.5° 이상 다르게 뽑는다 (PM 2026-10-11 "연달아 같은 각도 나오는 것 싫어").
// 한 번 정한 기울기는 ref 에 두어 글이 더 불러와져도(무한 스크롤) 이미 보이는 카드는 흔들리지 않는다.
export function useTilts(columns) {
  const map = useRef(new Map()).current;
  const differs = (t, o) => o == null || Math.abs(t - o) >= 2.5;
  columns.forEach((col, ci) =>
    col.forEach((note, ri) => {
      if (map.has(note.noteId)) return;
      const above = ri > 0 ? map.get(col[ri - 1].noteId) : null;
      const left = ci > 0 ? map.get(columns[ci - 1][ri]?.noteId) : null;
      let t = randomTilt();
      for (let i = 0; i < 16 && !(differs(t, above) && differs(t, left)); i += 1) t = randomTilt();
      map.set(note.noteId, t);
    })
  );
  return map;
}
