import { useEffect } from 'react';

// Executes a callback when the window gains focus: 
// needed for data refreshing without 3rd-party async state managers

export function useRefreshOnFocus(onFocus: () => void) {
  useEffect(() => {
    const handleFocus = () => {
      onFocus();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [onFocus]);
}
