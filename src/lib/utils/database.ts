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
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, DATABASE_CONFIG.CONNECTION_OPTIONS);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}