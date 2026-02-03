interface ConfigCardProps {
  title: string;
  titleColor: string;
  borderColor: string;
  children: React.ReactNode;
}

export function ConfigCard({ title, titleColor, borderColor, children }: ConfigCardProps) {
  return (
    <div className="space-y-4 bg-white p-4 rounded-lg">
      <h3 className={`text-lg font-semibold ${titleColor} border-b-2 ${borderColor} pb-2`}>
        {title}
      </h3>
      {children}
    </div>
  );
}
