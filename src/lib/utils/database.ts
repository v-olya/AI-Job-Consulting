import mongoose from 'mongoose';
import { DATABASE_CONFIG } from '@/constants';
import { CachedConnection } from '@/types';

const MONGODB_URI = process.env.MONGODB_URI || DATABASE_CONFIG.DEFAULT_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached: CachedConnection = (global as unknown as { mongoose?: CachedConnection }).mongoose || { conn: null, promise: null };

if (!cached) {
  cached = (global as unknown as { mongoose: CachedConnection }).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  // Check if we have a healthy connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Reset cache if connection was dropped
  if (mongoose.connection.readyState === 0) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    // Attach error handler to ensure retry is possible
    cached.promise = mongoose.connect(MONGODB_URI, DATABASE_CONFIG.CONNECTION_OPTIONS)
      .catch((e) => {
        // Reset on failure so next call can retry
        cached.promise = null;
        throw e;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}