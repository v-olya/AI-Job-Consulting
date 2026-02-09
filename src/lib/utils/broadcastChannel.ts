const CHANNEL_NAME = 'job-operations-sync';

// Singleton instance per tab
export const channel = typeof window !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;
