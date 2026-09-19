import * as cheerio from 'cheerio';

/** Strips markup and collapses whitespace, for full-text indexing and excerpts. */
export function htmlToText(html: string | null | undefined): string | null {
  if (!html) return null;
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  $('br').replaceWith('\n');
  $('p, li, div, h1, h2, h3, h4, tr').after('\n');
  const text = $.root().text()
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text.length ? text : null;
}

/**
 * Some APIs return HTML that has been entity-escaped once (Greenhouse does
 * this on the job board endpoint). Decode before parsing, or every tag ends
 * up as literal text in the description.
 */
export function decodeEntities(input: string): string {
  return cheerio.load(`<div>${input}</div>`)('div').text();
}

export function looksEscaped(input: string): boolean {
  return /&lt;(p|div|br|ul|li|strong|h[1-6])\b/i.test(input);
}
