'use client';

import { useEffect, useRef, useState } from 'react';
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
 * speed 는 게이트를 통과할 때 거는 배속이다. 바늘은 마운트 후 JS(rAF)가 각도를 직접 굴리고, 배속은 스프링으로
 * 따라가게 해서 눌렀을 때 뚝 끊기지 않고 이어지듯 빨라진다. JS 가 뜨기 전에는 CSS 키프레임이 대신 돌린다.
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

// 목표 배속으로 따라붙는 속도(클수록 빨리 붙는다). 임계 감쇠라 튕기지 않고 S 자로 부드럽게 올라간다
const SPEED_STIFFNESS = 9;

// 바늘 하나가 낼 수 있는 최고 각속도(도/초) — 초당 두 바퀴쯤. 배속을 그대로 곱하면 초침이 초당 10바퀴가 되는데,
// 그쯤 되면 프레임마다 비슷한 각도에 찍혀 도는 게 아니라 깜빡이는 것처럼 보인다. 여기서 잘라 주면
// 느린 바늘(시침·분침)은 계속 빨라지고 초침만 일정 속도로 흐르듯 돌아 전체가 부드럽게 감긴다.
const MAX_DEG_PER_SEC = 760;

export default function ClockScene({ speed = 1 }) {
  const handRefs = useRef([]);
  const targetSpeed = useRef(speed);
  // JS 가 바늘을 굴리기 시작하면 CSS 키프레임을 끈다 (둘이 같이 돌면 CSS 쪽이 이긴다).
  // 하이드레이션 전·JS 실패 시에는 기존 CSS 애니메이션이 그대로 돌아 화면이 멈춰 보이지 않는다
  const [jsDriven, setJsDriven] = useState(false);

  useEffect(() => {
    targetSpeed.current = speed;
  }, [speed]);

  useEffect(() => {
    const setAngle = (i, deg) => {
      const el = handRefs.current[i];
      if (el) el.style.transform = `rotate(${deg.toFixed(2)}deg)`;
    };

    setJsDriven(true);

    // 움직임을 줄여 달라는 설정이면 원본 첫 프레임 각도로 세워만 둔다
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      HANDS.forEach((h, i) => setAngle(i, h.start));
      return undefined;
    }

    // 예전에는 CSS animation-duration 을 배속으로 나눴다. 그러면 (1) 속도가 계단처럼 뚝 바뀌고
    // (2) 음수 animation-delay 가 새 duration 기준으로 다시 계산돼 바늘이 엉뚱한 각도로 튀었다.
    // 여기서는 각도를 프레임마다 직접 적분하고, 배속만 스프링으로 따라가게 해서 이어지듯 가속한다.
    const angles = HANDS.map((h) => h.start);
    let current = targetSpeed.current;
    let velocity = 0;
    let last = performance.now();
    let raf = requestAnimationFrame(function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05); // 탭 전환 등으로 크게 벌어진 간격은 잘라 낸다
      last = now;

      const accel =
        SPEED_STIFFNESS * SPEED_STIFFNESS * (targetSpeed.current - current) -
        2 * SPEED_STIFFNESS * velocity;
      velocity += accel * dt;
      current = Math.max(0, current + velocity * dt);

      HANDS.forEach((h, i) => {
        // 평상시 각속도에 배속을 곱하되, 눈이 따라갈 수 있는 선에서 자른다
        const degPerSec = Math.min((360 / h.period) * current, MAX_DEG_PER_SEC);
        angles[i] = (angles[i] + degPerSec * dt) % 360;
        setAngle(i, angles[i]);
      });

      raf = requestAnimationFrame(frame);
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`clockScene${jsDriven ? ' clockScene--js' : ''}`}
      style={{ '--clock-speed': speed }}
      aria-hidden
    >
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
            ref={(el) => {
              handRefs.current[i] = el;
            }}
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
