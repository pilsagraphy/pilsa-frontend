'use client';

import {
  BAND_CELLS,
  CENTER_DOT,
  CROSS_CELLS,
  DIAL,
  DOT_FONT,
  DOT_TEXT,
  GRID_OFFSET,
  HANDS,
  HAND_COLOR,
  WAVES,
  WEDGES,
} from './clockShapes';

/**
 * 게이트 화면의 시계 배경.
 *
 * 원본은 Lottielab 에서 만든 Lottie(clock_hands.json, 600KB)였다. 고정 캔버스(1280×900)를 contain 으로
 * 맞추던 터라 화면 비율이 다르면 사방에 흰 여백이 생겼고, 무료 플랜 워터마크도 함께 실려 있었다.
 * 그래서 그 JSON 에서 도형·색·각도·격자 위치를 그대로 뽑아(clockShapes.js) SVG+CSS 로 다시 그린다.
 *
 * 두 층으로 나눈다:
 *  - 배경(격자·회색 칸·모서리 장식)은 화면 크기와 무관하게 항상 꽉 찬다. 격자 한 칸(--cell)은
 *    다이얼 지름에서 파생시켜 원본의 비율(다이얼 = 15.9칸)을 어떤 화면비에서도 지킨다.
 *  - 다이얼은 SVG(viewBox 0~100, 중심 50,50) 로 중앙에 두고 화면의 짧은 변에 맞춘다(vmin).
 *
 * speed 는 게이트를 통과할 때 배속을 걸기 위한 값이다 (CSS 변수로 내려 애니메이션 시간에 곱한다).
 */

const HAIRLINE = 'rgba(0,0,0,0.85)';

/** 부채꼴 path — 중심(50,50), 반지름 r, 12시 기준 시계 방향 각도 */
function sectorPath(from, to, r) {
  const pt = (deg) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return `${(50 + r * Math.cos(rad)).toFixed(2)},${(50 + r * Math.sin(rad)).toFixed(2)}`;
  };
  const large = to - from > 180 ? 1 : 0;
  return `M50,50 L${pt(from)} A${r},${r} 0 ${large},1 ${pt(to)} Z`;
}

/** 도트 글꼴 텍스트. 가로 중앙(x=50) 정렬, top 은 글줄 윗변. */
function DotText({ text, top, pitch, dotR, gap }) {
  const glyphs = [...text].map((ch) => DOT_FONT[ch] ?? DOT_FONT[' ']);
  const totalCols = glyphs.reduce((n, g) => n + g[0].length, 0) + gap * (glyphs.length - 1);
  const startX = 50 - (totalCols * pitch) / 2;

  const dots = [];
  let col = 0;
  glyphs.forEach((glyph, gi) => {
    glyph.forEach((row, ri) => {
      [...row].forEach((cell, ci) => {
        if (cell !== '#') return;
        dots.push(
          <circle
            key={`${gi}-${ri}-${ci}`}
            cx={(startX + (col + ci + 0.5) * pitch).toFixed(2)}
            cy={(top + (ri + 0.5) * pitch).toFixed(2)}
            r={dotR}
          />
        );
      });
    });
    col += glyph[0].length + gap;
  });
  return <g fill="#000">{dots}</g>;
}

export default function ClockScene({ speed = 1 }) {
  return (
    <div className="clockScene" style={{ '--clock-speed': speed }} aria-hidden>
      {/* 격자선 — CSS 그라디언트라 화면이 아무리 커져도 끊기지 않는다 */}
      <div className="clockGrid" />

      {/* 원본에서 회색으로 칠해진 격자 칸들. 다이얼 중심 기준 칸 단위 좌표라 격자선과 정확히 맞물린다 */}
      <svg className="clockBands" viewBox="-16 -11 32 22" shapeRendering="crispEdges">
        {BAND_CELLS.map(([i, j]) => (
          <rect
            key={`${i},${j}`}
            x={i + GRID_OFFSET.x}
            y={j + GRID_OFFSET.y}
            width="1"
            height="1"
            fill="rgba(0,0,0,0.07)"
          />
        ))}
      </svg>

      {/* 시계 다이얼 — 짧은 변 기준이라 어떤 화면비에서도 잘리지 않는다 */}
      <svg className="clockDial" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={DIAL.outerR} fill="#fff" stroke={HAIRLINE} strokeWidth="0.1" />
        <circle cx="50" cy="50" r={DIAL.innerR} fill="none" stroke={HAIRLINE} strokeWidth="0.1" />

        {WEDGES.map((w, i) => (
          <path
            key={i}
            d={sectorPath(w.from, w.to, DIAL.innerR)}
            fill={w.fill}
            stroke={w.stroke ? HAIRLINE : 'none'}
            strokeWidth="0.1"
            strokeLinejoin="round"
          />
        ))}

        {/* 바늘은 중심(50,50)에 바로 그리고 CSS 가 그 자리에서 rotate 만 건다.
            translate 로 옮겨 놓고 돌리면 transform-origin 과 이중으로 밀려 밑동이 떠돈다.
            음수 딜레이로 원본 첫 프레임의 각도(start)에서 출발시킨다. */}
        {HANDS.map((h, i) => (
          <line
            key={i}
            className="clockHand"
            style={{ '--hand-dur': `${h.period}s`, '--hand-delay': `${(-(h.start / 360) * h.period).toFixed(3)}s` }}
            x1="50"
            y1="50"
            x2="50"
            y2={50 - h.len}
            stroke={HAND_COLOR}
            strokeWidth={h.width}
          />
        ))}

        <circle cx="50" cy="50" r={CENTER_DOT.r} fill={CENTER_DOT.fill} />

        <DotText {...DOT_TEXT} />
      </svg>

      {/* 모서리 장식. 원본과 같이 다이얼 위에 얹히고 화면 밖으로 살짝 걸친다 */}
      <svg className="clockDeco clockDeco--cross" viewBox="0 0 5 6">
        {CROSS_CELLS.map(([x, y]) => (
          <rect key={`${x},${y}`} x={x} y={y} width="1" height="1" fill="#cdcdcd" stroke="#ababad" strokeWidth="0.097" />
        ))}
      </svg>
      <svg className="clockDeco clockDeco--trDark" viewBox={WAVES.vThick.viewBox}>
        <path d={WAVES.vThick.d} fill="#737373" />
      </svg>
      <svg className="clockDeco clockDeco--trLight" viewBox={WAVES.vThin.viewBox}>
        <path d={WAVES.vThin.d} fill="#cccccc" />
      </svg>
      <svg className="clockDeco clockDeco--lDark" viewBox={WAVES.vThick.viewBox}>
        <path d={WAVES.vThick.d} fill="#a1a1a1" />
      </svg>
      <svg className="clockDeco clockDeco--lLight" viewBox={WAVES.vThin.viewBox}>
        <path d={WAVES.vThin.d} fill="#cccccc" />
      </svg>
      <svg className="clockDeco clockDeco--rWave" viewBox={WAVES.h5.viewBox}>
        <path d={WAVES.h5.d} fill="#a1a1a1" />
      </svg>
      <svg className="clockDeco clockDeco--blWave" viewBox={WAVES.h4.viewBox}>
        <path d={WAVES.h4.d} fill="#cccccc" />
      </svg>
      <div className="clockDeco clockDeco--brSquare" />
    </div>
  );
}
