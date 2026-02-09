import * as cheerio from 'cheerio';
import z from 'zod';

export function stripHtmlAndPreserveSpaces(html: string): string {
  const $ = cheerio.load(html);
  
  $('script, style, iframe, noscript').remove();
  
  $('p, div, br, li, h1, h2, h3, h4, h5, h6').each((_, elem) => {
    $(elem).append(' ');
  });
  
  return $('body').text()
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US');
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseJsonFromString<T>(content: string, schema: z.ZodType<T>): T {
  const jsonContent = extractJsonFromString(content);
  const parsedData = JSON.parse(jsonContent);
  return schema.parse(parsedData);
}

function extractJsonFromString(content: string): string {
  if (!content) {
    throw new Error('Empty response from LLM');
  }
  // More robust JSON extraction: find first '{' and last '}'
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('No valid JSON object found in response');
  }

  return content.substring(firstBrace, lastBrace + 1);
}