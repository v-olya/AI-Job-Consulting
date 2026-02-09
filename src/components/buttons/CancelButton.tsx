interface CancelButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function CancelButton({ onClick, disabled }: CancelButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95"
      aria-label="Cancel operation"
    >
      <b>✕</b>&nbsp; Cancel Operation
    </button>
  );
}
