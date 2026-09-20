import Image from 'next/image';

const HonorCard = ({ data, rankType }) => {
  const props = {
    first: {
      w: 'w-full max-w-[240px]',
      gap: 'gap-5',
      info: 'text-[18px] font-semibold leading-[32px]',
      insert: 'inset-[12%]', // 액자 두께에 맞게 조절
    },
    top: {
      w: 'w-full max-w-[180px]',
      gap: 'gap-4',
      info: 'text-[16px] font-semibold',
      insert: 'inset-[12%]',
    },
    normal: {
      w: 'w-full max-w-[140px]',
      gap: 'gap-3',
      info: 'text-[12px]',
      insert: 'inset-[12%]',
    },
    // 후원자가 몇 명 없을 때. 등수로 크기를 가르지 않고 모두 같은 크기로 세운다
    equal: {
      w: 'w-full max-w-[200px]',
      gap: 'gap-4',
      info: 'text-[16px] font-semibold leading-[28px]',
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

      {/* 인포 영역. 남긴 말은 1등과 '모두 같은 크기'에서만 보여 준다 (작은 칸에는 들어가지 않는다) */}
      <div className={`text-center ${style.info}`}>
        {rankType === 'first' || rankType === 'equal' ? (
          <>
            {/* 1등(first) · 모두 같은 크기(equal) */}
            <p>{displayName}</p>
            {!isAnonymous && (
              <>
                <p>{data.affiliation}</p>
                <p>{data.major}</p>
              </>
            )}
            {data.message && <p>&quot; {data.message} &quot;</p>}
          </>
        ) : (
          <>
            {/* 2등 ~ n등 (top, normal) */}
            <p className="font-semibold">{displayName}</p>
            {!isAnonymous && (
              <>
                <p>{data.affiliation}</p>
                <p>{data.major}</p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HonorCard;
