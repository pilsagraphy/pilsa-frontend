const HonorCard = ({ data, rankType }) => {
  const props = {
    first: {
      w: "w-full max-w-[240px]",
      aspect: "aspect-[3/4]",
      gap: "gap-5",
      info: "text-[18px] font-semibold leading-[32px]",
    },
    top: {
      w: "w-full max-w-[180px]",
      aspect: "aspect-[3/4]",
      gap: "gap-4",
      info: "text-[16px] font-semibold",
    },
    normal: {
      w: "w-full max-w-[129px]",
      aspect: "aspect-[3/4]",
      gap: "gap-3",
      info: "text-[12px]",
    },
  };

  const style = props[rankType];

  return (
    <div className={`flex flex-col items-center ${style.w} ${style.gap}`}>
      {/* 이미지 영역 */}
      <div className={`w-full bg-gray-200 overflow-hidden ${style.aspect}`}>
        {data.imageUrl && (
          <Image
            src={data.imageUrl}
            alt={data.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* 인포 영역 */}
      <div className={`text-center ${style.info}`}>
        {rankType === "first" ? (
          <>
            {/* 1등 (first) */}
            <p>{data.name}</p>
            <p>{data.org}</p>
            <p>{data.dept}</p>
            <p>" {data.message} "</p>
          </>
        ) : (
          <>
            {/* 2등 ~ n등 (top, normal) */}
            <p className="font-semibold">{data.name}</p>
            <p>{data.org}</p>
            <p>{data.dept}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default HonorCard;
