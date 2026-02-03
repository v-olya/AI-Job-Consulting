interface GradientButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant: 'blue' | 'green' | 'purple';
}

export function GradientButton({ onClick, disabled, children, variant }: GradientButtonProps) {
  const variantStyles = {
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    green: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 min-w-[200px] text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-bold text-lg ${variantStyles[variant]}`}
    >
      {children}
    </button>
  );
}
