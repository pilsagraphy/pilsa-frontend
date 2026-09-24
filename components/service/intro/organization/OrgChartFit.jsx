'use client';

import { useEffect, useRef, useState } from 'react';

// 조직도 section 의 min-w 와 같은 값. 이보다 좁은 화면(폰)에서는 조직도를 통째로 이 비율로 줄인다.
const NATURAL_WIDTH = 600;

/**
 * 조직도의 T 자 모양은 그대로 두고 폰 폭에 맞춰 축소만 한다.
 * 폰용으로 레이아웃을 다시 짜면 원래 모양이 사라지고, 그냥 두면 가로 스크롤로만 볼 수 있어서 그 사이 절충.
 *
 * 축소는 `transform: scale` 로 한다. 예전에는 CSS `zoom` 을 썼는데(차지하는 높이까지 줄어드는 게 편해서),
 * iOS 사파리는 `zoom` 안의 `position:absolute`·퍼센트 위치를 크롬과 다르게 계산해 고문 영역·연결선·이름표가
 * 서로 겹쳐 글자가 깨져 보였다 (아이폰 13·16e 제보. 사파리 버전마다 달라 멀쩡한 기기도 있었다).
 * transform 은 레이아웃에 영향을 주지 않아 아래 내용과 겹치므로, 줄인 만큼의 높이를 바깥 상자에 직접 잡아 준다.
 */
export default function OrgChartFit({ children }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return undefined;

    const update = () => {
      const width = outer.clientWidth;
      const nextScale = width > 0 && width < NATURAL_WIDTH ? width / NATURAL_WIDTH : 1;
      setScale(nextScale);
      // offsetHeight 는 transform 의 영향을 받지 않는(축소 전) 값이라, 배율을 곱하면 실제로 보이는 높이가 된다.
      // 배율이 1이면 높이를 잡지 않고 내용에 맡긴다 (데스크톱에서 max-w 까지 자유롭게 늘어나야 한다)
      setHeight(nextScale < 1 ? inner.offsetHeight * nextScale : null);
    };
    update();

    // inner 도 함께 본다 — 폰트 로딩 등으로 내용 높이가 뒤늦게 바뀌면 잡아 둔 높이도 다시 맞춰야 한다
    const observer = new ResizeObserver(update);
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  const scaling = scale < 1;

  return (
    <div ref={outerRef} className="w-full" style={{ height: height ?? undefined }}>
      <div
        ref={innerRef}
        style={{
          // 축소할 때만 원래 폭(600px)으로 고정하고 왼쪽 위를 기준으로 줄인다.
          // 축소하지 않을 때는 폭을 건드리지 않아야 데스크톱에서 max-w-[1200px] 까지 늘어난다
          width: scaling ? NATURAL_WIDTH : '100%',
          transform: scaling ? `scale(${scale})` : undefined,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  );
}
