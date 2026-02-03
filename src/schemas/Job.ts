import mongoose, { Document, Schema } from 'mongoose';
import type { Job as JobType } from '@/types';

export interface IJob extends Omit<JobType, '_id' | 'postedDate' | 'scrapedAt'>, Document {
  postedDate: Date;
  scrapedAt: Date;
}

const JobSchema: Schema = new Schema({
  title: { type: String, required: true },
  company: { type: String, required: false },
  location: { type: String, required: false },
  description: { type: String, required: false },
  url: { type: String, required: false, unique: true, sparse: true },
  source: { type: String, enum: ['startupjobs', 'jobs.cz'], required: true },
  salary: { type: String },
  tags: [{ type: String }],
  postedDate: { type: Date, required: false },
  scrapedAt: { type: Date, default: Date.now },
  processed: { type: Boolean, default: false },
  aiAnalysis: {
    summary: String,
    skills: [String],
    seniority: String,
    remote: Boolean,
    score: Number
  }
});

export const Job = mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);