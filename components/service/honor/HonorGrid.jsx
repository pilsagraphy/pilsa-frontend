import HonorCard from "./HonorCard";

const HonorGrid = ({ items, rankType }) => {
  const props = {
    first: "flex justify-center",
    top: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-12 justify-items-center",
    normal:
      "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-2 gap-y-12 justify-items-center",
    // 몇 명 없을 때: 칸 수를 정하지 않고 가운데로 모은다 (두 명이면 두 명이 가운데 나란히)
    equal: "flex flex-wrap justify-center gap-x-8 gap-y-12",
  };

  return (
    <section className="flex flex-col gap-8 mb-20">
      <div className={props[rankType]}>
        {items.map((item) => (
          <HonorCard
            key={item.donationId}
            data={item}
            rankType={rankType}
          />
        ))}
      </div>
    </section>
  );
};

export default HonorGrid;
