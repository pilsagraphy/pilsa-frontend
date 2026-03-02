import HonorCard from "./HonorCard";

const HonorGrid = ({ items, rankType }) => {
  const props = {
    first: "flex justify-center",
    top: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-12 justify-items-center",
    normal:
      "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-2 gap-y-12 justify-items-center",
  };

  return (
    <section className="flex flex-col gap-8 mb-20">
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
