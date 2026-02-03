export interface ErrorAnalysis {
  isTimeout: boolean;
  isNetwork: boolean;
  isRetryable: boolean;
  errorType: 'timeout' | 'network' | 'parsing' | 'format' | 'unknown';
}

export function analyzeError(error: Error): ErrorAnalysis {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();
  
  const isTimeout = message.includes('timeout') || 
                   message.includes('abort') ||
                   name === 'aborterror' ||
                   message.includes('und_err_headers_timeout');
  
  const isNetwork = message.includes('fetch failed') ||
                   message.includes('econnrefused') ||
                   message.includes('enotfound') ||
                   message.includes('network') ||
                   message.includes('connection');
  
  const isParsing = message.includes('json') ||
                   message.includes('parse') ||
                   message.includes('syntax');
  
  const isFormat = message.includes('invalid') && 
                  (message.includes('response') || message.includes('format'));
  
  let errorType: ErrorAnalysis['errorType'] = 'unknown';
  if (isTimeout) errorType = 'timeout';
  else if (isNetwork) errorType = 'network';
  else if (isParsing) errorType = 'parsing';
  else if (isFormat) errorType = 'format';
  
  const isRetryable = isTimeout || isNetwork;
  
  return {
    isTimeout,
    isNetwork,
    isRetryable,
    errorType
  };
}

export function getErrorDescription(analysis: ErrorAnalysis): string {
  switch (analysis.errorType) {
    case 'timeout':
      return 'Request timed out';
    case 'network':
      return 'Network connection failed';
    case 'parsing':
      return 'Failed to parse response';
    case 'format':
      return 'Invalid response format';
    default:
      return 'Unknown error';
  }
}