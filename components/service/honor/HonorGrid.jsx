import HonorCard from "./HonorCard";

const HonorGrid = ({ items, rankType }) => {
  const props = {
    // 폰은 가운데, PC 는 왼쪽부터 (PM 요청 — 페이지의 다른 글과 왼쪽 선을 맞춘다)
    first: "flex justify-center md:justify-start",
    top: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-12 justify-items-center md:justify-items-start",
    normal:
      "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-2 gap-y-12 justify-items-center md:justify-items-start",
    // 몇 명 없을 때: 칸 수를 정하지 않고 늘어놓는다
    equal: "flex flex-wrap justify-center gap-x-8 gap-y-12 md:justify-start",
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
