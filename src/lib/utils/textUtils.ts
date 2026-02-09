import * as cheerio from 'cheerio';

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
