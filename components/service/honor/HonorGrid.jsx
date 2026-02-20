import HonorCard from "./HonorCard";

const HonorGrid = ({ title, items, rankType }) => {
  const props = {
    first: "flex justify-center",
    top: "grid grid-cols-3 gap-x-4 justify-items-center",
    normal:
      "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-2 gap-y-12 justify-items-center",
  };

  return (
    <section className="flex flex-col gap-8 mb-20">
      <h3 className="text-[24px] font-semibold leading-[1.5] tracking-[-0.02] text-[#757575]">
        {title}
      </h3>
      <div className={props[rankType]}>
        {items.map((item) => (
          <HonorCard
            key={`${item.name}-${item.dept}`}
            data={item}
            rankType={rankType}
          />
        ))}
      </div>
    </section>
  );
};

export default HonorGrid;
