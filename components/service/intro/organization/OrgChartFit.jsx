'use client';

import { useEffect, useRef, useState } from 'react';

// 조직도 section 의 min-w 와 같은 값. 이보다 좁은 화면(폰)에서는 조직도를 통째로 이 비율로 줄인다.
const NATURAL_WIDTH = 600;

// 조직도의 T 자 모양은 그대로 두고 폰 폭에 맞춰 축소만 한다.
// 폰용으로 레이아웃을 다시 짜면 원래 모양이 사라지고, 그냥 두면 가로 스크롤로만 볼 수 있어서 그 사이 절충.
// zoom 은 transform 과 달리 차지하는 높이도 같이 줄어 아래 내용이 겹치지 않는다.
export default function OrgChartFit({ children }) {
  const ref = useRef(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const update = () => {
      const width = el.clientWidth;
      setZoom(width > 0 && width < NATURAL_WIDTH ? width / NATURAL_WIDTH : 1);
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full">
      <div style={{ zoom }}>{children}</div>
    </div>
  );
}
