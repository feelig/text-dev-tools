import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const tools = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'data', 'tools.json'), 'utf8'));

const genericPhrases = [
  'helps you clean, format, and transform text directly in your browser',
  'use it online for free',
  'use this free',
  'three simple steps',
  'common situations where this tool can help'
];

const placeholderPhrases = [
  'top ad slot',
  'middle ad slot',
  'bottom ad slot',
  'homepage ad slot'
];

const pages = [
  {
    slug: 'home',
    path: 'index.html',
    type: 'site',
    expectedRobots: 'index,follow',
    thinThreshold: 140
  },
  {
    slug: 'text-tools',
    path: 'text-tools/index.html',
    type: 'category',
    expectedRobots: 'noindex,follow',
    thinThreshold: 90
  },
  {
    slug: 'developer-tools',
    path: 'developer-tools/index.html',
    type: 'category',
    expectedRobots: 'noindex,follow',
    thinThreshold: 90
  },
  ...tools
    .filter((tool) => tool && tool.slug)
    .map((tool) => ({
      slug: tool.slug,
      path: `tools/${tool.slug}/index.html`,
      type: 'tool',
      status: tool.status || 'unknown',
      faqCountFromData: Array.isArray(tool.faq) ? tool.faq.length : 0,
      hasCustomHowTo: Boolean(tool.howTo && tool.howTo.lead && Array.isArray(tool.howTo.steps) && tool.howTo.steps.length),
      hasCustomUseCases: Boolean(tool.useCases && tool.useCases.lead && Array.isArray(tool.useCases.items) && tool.useCases.items.length),
      expectedRobots: tool.status === 'live' ? 'index,follow' : 'noindex,follow',
      thinThreshold: tool.status === 'live' ? 120 : 80
    }))
];

function normalizeText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function stripHtml(html) {
  return normalizeText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
  );
}

function countMatches(html, pattern) {
  return (html.match(pattern) || []).length;
}

const results = [];
let blockingIssues = 0;

for (const page of pages) {
  const absolutePath = path.join(ROOT_DIR, page.path);
  if (!fs.existsSync(absolutePath)) {
    results.push({
      slug: page.slug,
      path: page.path,
      type: page.type,
      status: 'FAIL',
      issues: ['Missing file']
    });
    blockingIssues++;
    continue;
  }

  const html = fs.readFileSync(absolutePath, 'utf8');
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '').trim();
  const h1Count = countMatches(html, /<h1\b/gi);
  const robots = (html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i)?.[1] || '').trim();
  const faqHeadingCount =
    countMatches(html, /<h2[^>]*>\s*FAQ\s*<\/h2>/gi) +
    countMatches(html, /<h2[^>]*>\s*Frequently asked questions\s*<\/h2>/gi);
  const relatedHeadingCount = countMatches(html, /<h2[^>]*>\s*Related tools\s*<\/h2>/gi);
  const faqSchemaCount = countMatches(html, /"@type"\s*:\s*"FAQPage"/gi);
  const contentSectionCount = countMatches(html, /<div class="card content-section">/gi);
  const hasMain = /<main\b/i.test(html);
  const wordCount = stripHtml(html).split(/\s+/).filter(Boolean).length;
  const genericHits = genericPhrases.reduce((count, phrase) => {
    return count + (html.toLowerCase().includes(phrase) ? 1 : 0);
  }, 0);
  const placeholderHits = placeholderPhrases.reduce((count, phrase) => {
    return count + (html.toLowerCase().includes(phrase) ? 1 : 0);
  }, 0);

  const issues = [];
  const warnings = [];

  if (!title) issues.push('Missing title');
  if (h1Count < 1) issues.push('Missing h1');
  if (robots !== page.expectedRobots) issues.push(`Robots mismatch: expected ${page.expectedRobots}, got ${robots || 'missing'}`);
  if (faqHeadingCount > 1) issues.push(`Duplicate FAQ headings (${faqHeadingCount})`);
  if (relatedHeadingCount > 1) issues.push(`Duplicate Related tools headings (${relatedHeadingCount})`);
  if (faqSchemaCount > 1) issues.push(`Duplicate FAQ schema blocks (${faqSchemaCount})`);
  if (placeholderHits > 0) issues.push(`Placeholder UI copy present (${placeholderHits} hits)`);
  if (page.type === 'tool' && page.status === 'live' && genericHits > 0) {
    issues.push(`Live tool still uses template wording (${genericHits} generic phrase hits)`);
  }
  if (page.type === 'tool' && page.status === 'live' && page.faqCountFromData < 2) {
    issues.push(`Live tool needs at least 2 FAQ items in data (${page.faqCountFromData})`);
  }
  if (page.type === 'tool' && page.status === 'live' && !page.hasCustomHowTo) {
    issues.push('Live tool is missing custom how-to content');
  }
  if (page.type === 'tool' && page.status === 'live' && !page.hasCustomUseCases) {
    issues.push('Live tool is missing custom use-case content');
  }

  if (page.type === 'tool' && page.status === 'live' && !hasMain) {
    warnings.push('Missing <main> structure');
  }
  if (wordCount < page.thinThreshold) {
    warnings.push(`Thin visible copy (${wordCount} words)`);
  }
  if (page.type !== 'tool' || page.status !== 'live') {
    if (genericHits >= 3) {
      warnings.push(`Heavy template wording (${genericHits} generic phrase hits)`);
    }
  } else if (genericHits > 0 && !issues.some((issue) => issue.startsWith('Live tool still uses template wording'))) {
    warnings.push(`Heavy template wording (${genericHits} generic phrase hits)`);
  }
  if (page.type === 'tool' && contentSectionCount === 0 && page.status === 'live' && wordCount < 170) {
    warnings.push('Live tool lacks richer supporting content');
  }

  const status = issues.length ? 'FAIL' : warnings.length ? 'WARN' : 'PASS';
  if (issues.length) blockingIssues++;

  results.push({
    slug: page.slug,
    path: page.path,
    type: page.type,
    toolStatus: page.status || '',
    status,
    title,
    robots,
    h1Count,
    wordCount,
    faqHeadingCount,
    relatedHeadingCount,
    faqSchemaCount,
    hasMain,
    genericHits,
    issues,
    warnings
  });

  const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
  const details = [...issues, ...warnings].join(' | ');
  console.log(`${icon} ${status} ${page.slug}${details ? ` | ${details}` : ''}`);
}

fs.mkdirSync(path.join(ROOT_DIR, 'test-results'), { recursive: true });
fs.writeFileSync(
  path.join(ROOT_DIR, 'test-results', 'content-audit.json'),
  JSON.stringify(results, null, 2)
);

const pass = results.filter((result) => result.status === 'PASS').length;
const warn = results.filter((result) => result.status === 'WARN').length;
const fail = results.filter((result) => result.status === 'FAIL').length;

console.log('\n===== SUMMARY =====');
console.log(`PASS: ${pass}`);
console.log(`WARN: ${warn}`);
console.log(`FAIL: ${fail}`);
console.log('Saved report: test-results/content-audit.json');

if (blockingIssues > 0) {
  process.exit(1);
}
