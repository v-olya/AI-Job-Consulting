interface StatCardProps {
  title: string;
  value: string | number;
  bgColor: string;
}

export function StatCard({ title, value, bgColor }: StatCardProps) {
  return (
    <div className={`${bgColor} p-4 rounded-lg shadow-sm`}>
      <h3 className="font-semibold text-gray-700 text-sm">{title}</h3>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
