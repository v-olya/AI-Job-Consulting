#!/usr/bin/env tsx

import fs from 'fs/promises';
import { connectDB } from '@/lib/utils/database';
import { Job } from '@/schemas/Job';
import { analyzeJob } from '@/lib/ai/ollama';
import { StartupJobsApiResponse, StartupJobsOffer } from '@/types';
import { HTML_ENTITIES, JOB_SOURCES } from '@/constants';

function cleanHtmlDescription(htmlDescription: string): string {
  let cleaned = htmlDescription.replace(/<[^>]*>/g, '');
  
  Object.entries(HTML_ENTITIES).forEach(([entity, replacement]) => {
    cleaned = cleaned.replace(new RegExp(entity, 'g'), replacement);
  });
  
  return cleaned.replace(/\s+/g, ' ').trim();
}

function formatSalary(salary?: StartupJobsOffer['salary']): string | undefined {
  if (!salary) return undefined;
  
  const { from, to, currency } = salary;
  const parts = [];
  
  if (from) parts.push(from.toString());
  if (to) parts.push(to.toString());
  
  if (!parts.length) return undefined;
  
  const range = parts.length === 2 ? `${parts[0]}-${parts[1]}` : parts[0];
  return `${range} ${currency || 'CZK'}`;
}

function extractLocation(locations: StartupJobsOffer['locations']): string {
  if (!locations?.length) return 'Not specified';
  
  return locations
    .map(loc => loc.name.cs || loc.name.en || 'Unknown')
    .join(', ');
}

function extractTags(offer: StartupJobsOffer): string[] {
  const tags = new Set<string>();
  
  offer.skills?.forEach(skill => {
    if (skill.name) tags.add(skill.name);
  });
  
  offer.fields?.forEach(field => {
    if (field.name.en) tags.add(field.name.en);
    if (field.name.cs) tags.add(field.name.cs);
  });
  
  offer.seniority?.forEach(level => tags.add(level));
  offer.employmentType?.forEach(type => tags.add(type));
  offer.locationPreference?.forEach(pref => tags.add(pref));
  
  return Array.from(tags);
}

function buildJobUrl(offer: StartupJobsOffer): string {
  return `https://www.startupjobs.cz/nabidka/${offer.displayId}/${offer.slug}`;
}

async function preprocessStartupJobsData(filePath: string): Promise<void> {
  try {
    console.log(`Reading file: ${filePath}`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const apiResponse: StartupJobsApiResponse = JSON.parse(fileContent);
    
    console.log(`Found ${apiResponse.totalItems} total items, processing ${apiResponse.member.length} jobs`);
    
    await connectDB();
    
    const processedJobs = [];
    const skippedJobs = [];
    
    for (const offer of apiResponse.member) {
      try {
        const jobUrl = buildJobUrl(offer);
        const existingJob = await Job.findOne({ url: jobUrl });
        
        if (existingJob) {
          console.log(`Job already exists: ${offer.title}`);
          skippedJobs.push(offer.title);
          continue;
        }
        
        const cleanDescription = cleanHtmlDescription(offer.description.cs);
        const location = extractLocation(offer.locations);
        const salary = formatSalary(offer.salary);
        const tags = extractTags(offer);
        
        const jobData = {
          title: offer.title.cs,
          company: offer.company.name,
          location,
          description: cleanDescription,
          url: jobUrl,
          source: JOB_SOURCES.STARTUPJOBS,
          salary,
          tags,
          postedDate: new Date(offer.boostedAt || Date.now()),
        };
        
        console.log(`Analyzing job: ${jobData.title}`);
        const aiAnalysis = await analyzeJob(jobData);
        
        const job = new Job({
          ...jobData,
          aiAnalysis,
          processed: true
        });
        
        await job.save();
        processedJobs.push(job);
        console.log(`✅ Processed: ${jobData.title} at ${jobData.company}`);
        
      } catch (error) {
        console.error(`❌ Error processing job ${offer.title}:`, error);
      }
    }
    
    console.log('\n📊 Processing Summary:');
    console.log(`Total jobs in file: ${apiResponse.member.length}`);
    console.log(`Successfully processed: ${processedJobs.length}`);
    console.log(`Skipped (already exist): ${skippedJobs.length}`);
    
  } catch (error) {
    console.error('❌ Error preprocessing data:', error);
    throw error;
  }
}

async function main() {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('Usage: tsx src/scripts/preprocess-startupjobs.ts <path-to-json-file>');
    process.exit(1);
  }
  
  if (!await fs.access(filePath).then(() => true).catch(() => false)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  
  await preprocessStartupJobsData(filePath);
}

if (require.main === module) {
  main().catch(console.error);
}

export { preprocessStartupJobsData };