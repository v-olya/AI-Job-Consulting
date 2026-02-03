interface SectionHeaderProps {
  icon: string;
  title: string;
  colorClass: string;
}

export function SectionHeader({ icon, title, colorClass }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h4 className={`font-semibold text-sm flex items-center gap-2 ${colorClass}`}>
        <span>{icon}</span>
        {title}
      </h4>
    </div>
  );
}