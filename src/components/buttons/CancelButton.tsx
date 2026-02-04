interface CancelButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const CancelButton = ({ onClick, disabled = false }: CancelButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
    >
      Cancel
    </button>
  );
};