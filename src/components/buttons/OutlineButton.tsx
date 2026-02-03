interface OutlineButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

export function OutlineButton({ onClick, children }: OutlineButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md font-bold text-lg"
    >
      {children}
    </button>
  );
}
