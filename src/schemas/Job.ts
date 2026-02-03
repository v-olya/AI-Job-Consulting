import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: 'startupjobs' | 'jobs.cz';
  salary?: string;
  tags: string[];
  postedDate: Date;
  scrapedAt: Date;
  processed: boolean;
  aiAnalysis?: {
    summary: string;
    skills: string[];
    seniority: string;
    remote: boolean;
    score: number;
  };
}

const JobSchema: Schema = new Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  url: { type: String, required: true, unique: true },
  source: { type: String, enum: ['startupjobs', 'jobs.cz'], required: true },
  salary: { type: String },
  tags: [{ type: String }],
  postedDate: { type: Date, required: true },
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