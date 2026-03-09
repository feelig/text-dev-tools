import { chromium } from '@playwright/test';
import fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'https://extformattools.com';

const tools = [
  'duplicate-line-remover',
  'paragraph-counter',
  'timestamp-converter',
  'json-to-csv',
  'csv-to-json',
  'html-escape',
  'html-unescape',
  'text-diff'
];

function looksPlaceholder(bodyText) {
  const t = (bodyText || '').toLowerCase();

  const genericSignals = [
    'helps you clean, format, and transform text directly in your browser',
    'free online text and developer tools',
    'tool helps you clean or transform text',
    'you can use it online for free'
  ];

  let score = 0;
  for (const s of genericSignals) {
    if (t.includes(s)) score++;
  }
  return score >= 2;
}

async function countVisible(page, selector) {
  const locator = page.locator(selector);
  const count = await locator.count();
  let visible = 0;
  for (let i = 0; i < count; i++) {
    const ok = await locator.nth(i).isVisible().catch(() => false);
    if (ok) visible++;
  }
  return visible;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  for (const slug of tools) {
    const notes = [];
    let status = 'PASS';
    const started = Date.now();

    try {
      const response = await page.goto(`${BASE_URL}/tools/${slug}/`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      if (!response || !response.ok()) {
        status = 'FAIL';
        notes.push(`HTTP ${response ? response.status() : 'NO_RESPONSE'}`);
      }

      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

      const title = await page.title().catch(() => '');
      const h1Count = await page.locator('h1').count().catch(() => 0);
      const buttonCount = await countVisible(page, 'button').catch(() => 0);
      const textareaCount = await countVisible(page, 'textarea').catch(() => 0);
      const inputCount = await countVisible(page, 'input[type="text"], input:not([type])').catch(() => 0);
      const outputLikeCount = await countVisible(page, 'textarea, [id*="output"], [class*="output"], .result, .results').catch(() => 0);
      const bodyText = await page.locator('body').innerText().catch(() => '');

      if (!title || title.trim().length < 3) {
        status = 'FAIL';
        notes.push('Missing/invalid title');
      }

      if (h1Count < 1) {
        status = 'FAIL';
        notes.push('Missing h1');
      }

      if (buttonCount < 1) {
        status = status === 'FAIL' ? 'FAIL' : 'WARN';
        notes.push('No visible button');
      }

      if (textareaCount + inputCount < 1) {
        status = status === 'FAIL' ? 'FAIL' : 'WARN';
        notes.push('No visible text input');
      }

      if (outputLikeCount < 1) {
        status = status === 'FAIL' ? 'FAIL' : 'WARN';
        notes.push('No obvious output area');
      }

      if (looksPlaceholder(bodyText)) {
        status = status === 'FAIL' ? 'FAIL' : 'WARN';
        notes.push('Looks generic/placeholder');
      }

      results.push({
        slug,
        checkStatus: status,
        timeMs: Date.now() - started,
        title,
        h1Count,
        buttonCount,
        inputCount: textareaCount + inputCount,
        outputLikeCount,
        notes: notes.join(' | ')
      });

      const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
      console.log(`${icon} ${status} ${slug}${notes.length ? ' | ' + notes.join(' | ') : ''}`);
    } catch (err) {
      results.push({
        slug,
        checkStatus: 'FAIL',
        timeMs: Date.now() - started,
        title: '',
        h1Count: 0,
        buttonCount: 0,
        inputCount: 0,
        outputLikeCount: 0,
        notes: err.message
      });
      console.log(`❌ FAIL ${slug} | ${err.message}`);
    }
  }

  await browser.close();

  fs.writeFileSync(
    './test-results/planned-pages-check.json',
    JSON.stringify(results, null, 2)
  );

  const pass = results.filter(r => r.checkStatus === 'PASS').length;
  const warn = results.filter(r => r.checkStatus === 'WARN').length;
  const fail = results.filter(r => r.checkStatus === 'FAIL').length;

  console.log('\n===== SUMMARY =====');
  console.log(`PASS: ${pass}`);
  console.log(`WARN: ${warn}`);
  console.log(`FAIL: ${fail}`);
  console.log('Saved report: test-results/planned-pages-check.json');

  if (fail > 0) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
