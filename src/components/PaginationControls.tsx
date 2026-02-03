interface PaginationControlsProps {
  currentSkip: number;
  currentLimit: number;
  total: number;
  hasMore: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export function PaginationControls({ 
  currentSkip, 
  currentLimit, 
  total, 
  hasMore, 
  onPrevious, 
  onNext 
}: PaginationControlsProps) {
  return (
    <div className="flex gap-3 mb-8 items-center">
      <button 
        onClick={onPrevious}
        disabled={currentSkip === 0}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-all shadow-sm hover:shadow-md font-bold text-lg"
      >
        ← Previous
      </button>
      <span className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 font-bold text-gray-700 text-base">
        Showing {currentSkip + 1}-{Math.min(currentSkip + currentLimit, total)} of {total}
      </span>
      <button 
        onClick={onNext}
        disabled={!hasMore}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-all shadow-sm hover:shadow-md font-bold text-lg"
      >
        Next →
      </button>
    </div>
  );
}
