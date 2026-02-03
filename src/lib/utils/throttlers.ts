import { THROTTLING_CONFIG } from '@/constants';

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class Throttler {
  private lastCall: number = 0;
  private minInterval: number;

  constructor(minIntervalMs: number) {
    this.minInterval = minIntervalMs;
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;
    
    if (timeSinceLastCall < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastCall;
      await delay(waitTime);
    }
    
    this.lastCall = Date.now();
  }
}

export const API_THROTTLER = new Throttler(THROTTLING_CONFIG.API_CALLS);
export const SCRAPING_THROTTLER = new Throttler(THROTTLING_CONFIG.PAGE_SCRAPING);
export const DETAIL_THROTTLER = new Throttler(THROTTLING_CONFIG.DETAIL_SCRAPING);