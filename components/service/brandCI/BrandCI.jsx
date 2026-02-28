import BrandCIHeader from "./BrandCIHeader";
import BrandCIContent from "./BrandCIContent";

export default function BrandCI() {
  return (
    <div className="flex p-[80px] justify-center items-center bg-white w-full min-h-screen">
      <div className="flex gap-[40px] flex-col w-[915px]">
        <BrandCIHeader />
        <BrandCIContent />
      </div>
    </div>
  );
}