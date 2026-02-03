interface ConfigFieldProps {
  label: string;
  items: string[];
  colorClass: string;
}

export function ConfigField({ label, items, colorClass }: ConfigFieldProps) {
  return (
    <div>
      <span className="font-medium text-gray-700 block mb-2">{label}:</span>
      <div className="flex flex-wrap gap-2">
        {items.map((item: string, idx: number) => (
          <span key={idx} className={`${colorClass} px-3 py-1 rounded-full text-sm font-medium`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
