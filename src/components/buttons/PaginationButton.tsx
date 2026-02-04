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
      className="px-6 py-2 rounded-lg disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:disabled:shadow-none text-lg"
    >
      {children}
    </button>
  );
}
