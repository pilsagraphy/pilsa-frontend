import svgPaths from "../../../constants/brandCI/BrandCIIcons"; 

export default function DownloadButton() {
  return (
    <button className="flex justify-center items-center w-[24px] h-[24px] cursor-pointer bg-transparent border-none p-0 hover:opacity-70 transition-opacity">
      <svg className="w-[13px] h-[19px]" viewBox="0 0 13 19" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d={svgPaths.p2b3a1200} stroke="#212121" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}