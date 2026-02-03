interface PaginationButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function PaginationButton({ onClick, disabled, children }: PaginationButtonProps) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className="px-6 py-2 bg-blue-500 text-white rounded-lg disabled:bg-blue-200 disabled:cursor-not-allowed hover:bg-blue-600 transition-all shadow-sm hover:shadow-md font-bold text-lg"
    >
      {children}
    </button>
  );
}
