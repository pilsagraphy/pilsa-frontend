export default function AdvisorSection({ advisors }) {
  return (
    <div className="flex flex-col gap-1 text-[16px] font-semibold leading-[1.6] tracking-[-0.02em]">
      <p className=" text-[#212121]">고문</p>

      {advisors.map((member, index) => (
        <p key={index} className="text-[#919191]">
          {member}
        </p>
      ))}
    </div>
  );
}
