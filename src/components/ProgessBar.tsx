interface Props {
  percentage: number;
}

export default function ProgressBar({ percentage }: Props) {
  return (
    <div className="w-full bg-[#E3ECF5] rounded-full h-3 overflow-hidden">
      <div
        className="bg-[#2B6CB0] h-3 transition-all duration-700"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
