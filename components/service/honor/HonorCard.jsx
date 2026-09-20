import Image from 'next/image';

// 액자 크기는 한 단계씩 줄였다 (240/180/140/200 → 170/130/104/140). 큰 얼굴 사진이 화면을 차지해 부담스럽다는 PM 의견 (2026-09-20)
const HonorCard = ({ data, rankType }) => {
  const props = {
    first: {
      w: 'w-full max-w-[170px]',
      gap: 'gap-5',
      info: 'text-[16px] font-semibold leading-[28px]',
      insert: 'inset-[12%]', // 액자 두께에 맞게 조절
    },
    top: {
      w: 'w-full max-w-[130px]',
      gap: 'gap-4',
      info: 'text-[16px] font-semibold',
      insert: 'inset-[12%]',
    },
    normal: {
      w: 'w-full max-w-[104px]',
      gap: 'gap-3',
      info: 'text-[12px]',
      insert: 'inset-[12%]',
    },
    // 후원자가 몇 명 없을 때. 등수로 크기를 가르지 않고 모두 같은 크기로 세운다
    equal: {
      w: 'w-full max-w-[140px]',
      gap: 'gap-4',
      info: 'text-[15px] font-semibold leading-[26px]',
      insert: 'inset-[12%]',
    },
  };

  const style = props[rankType];

  const isAnonymous = Boolean(data.isAnonymous);
  const displayName = isAnonymous ? '익명' : data.displayName;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  const imageUrl = data.photoUrl ? `${baseUrl}${data.photoUrl}` : null;

  return (
    <div className={`flex flex-col items-center ${style.w} ${style.gap}`}>
      {/* 프레임 + 이미지 영역 */}
      <div className="relative w-full aspect-[3/4]">
        {/* 이미지 영역 (액자 안쪽) */}
        <div className={`absolute ${style.insert} overflow-hidden bg-gray-200`}>
          {!isAnonymous && imageUrl && (
            <Image src={imageUrl} alt={data.displayName} fill className="object-cover" />
          )}
        </div>
        {/* 프레임 영역 */}
        <Image
          src="/images/honor/frame.png"
          alt="frame"
          fill
          className="object-contain pointer-events-none select-none"
          priority={rankType === 'first'}
        />
      </div>

      {/* 인포 영역 — 이름과 소속만. 남긴 말은 칸 크기에 따라 넘치거나 줄이 뒤틀려 빼 두었다 */}
      <div className={`text-center ${style.info}`}>
        <p className="font-semibold">{displayName}</p>
        {!isAnonymous && (
          <>
            <p>{data.affiliation}</p>
            <p>{data.major}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default HonorCard;
