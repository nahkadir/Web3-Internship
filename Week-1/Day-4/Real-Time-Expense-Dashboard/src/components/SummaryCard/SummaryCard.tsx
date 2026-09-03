interface SummaryCardProps {
  label: string;
  value: string;
  status: string;
}

const SummaryCard = ({ label, value, status }: SummaryCardProps) => {
  return (
    <div className="mx-auto mt-2 flex w-full max-w-7xl flex-col rounded-3xl border border-black/10 bg-white p-6">
      <div className="text-h4-mob md:text-h4 font-medium">{label}</div>
      <div className="text-h2-mob md:text-h2 font-bold">{value}</div>
      <div className="text-p-mob md:text-p">{status}</div>
    </div>
  );
};

export default SummaryCard;
