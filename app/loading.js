import { Zen_Dots } from 'next/font/google';

// 헤더 로고와 같은 서체
const zenDots = Zen_Dots({ weight: '400', subsets: ['latin'] });

const WORD = 'PILSAGRAPHY';

// 라우트 전환·첫 진입 중 보이는 로딩 화면.
// 흰 바탕에 로고 글자만 두고, 글자가 왼쪽부터 차례로 떠올랐다 가라앉는 물결로 "진행 중"을 보여 준다
// (스타일은 globals.css .appLoading). 예전엔 "로딩.. 임시 UI.." 문구였다.
export default function Loading() {
  return (
    <main className="appLoading" role="status" aria-live="polite" aria-label="불러오는 중">
      <p className={`${zenDots.className} appLoading__word`} aria-hidden>
        {WORD.split('').map((ch, i) => (
          <span key={i} className="appLoading__letter" style={{ '--i': i }}>
            {ch}
          </span>
        ))}
      </p>
      <span className="appLoading__bar" aria-hidden />
    </main>
  );
}
