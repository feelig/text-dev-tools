import { chromium } from '@playwright/test';
import fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'https://extformattools.com';
const TOOLS_JSON_PATH = './data/tools.json';

function loadTools() {
  const raw = fs.readFileSync(TOOLS_JSON_PATH, 'utf-8');
  const data = JSON.parse(raw);
  return data
    .filter(item => item && item.slug)
    .map(item => ({
      slug: item.slug,
      title: item.title || item.slug,
      status: item.status || 'unknown',
      path: `/tools/${item.slug}/`
    }));
}

function isProbablyFallbackPage(title, bodyText, expectedTitle) {
  const t = (title || '').toLowerCase();
  const b = (bodyText || '').toLowerCase();
  const expected = (expectedTitle || '').toLowerCase();

  if (t.includes('text dev tools - free online text')) return true;
  if (b.includes('free online text and developer tools') && !b.includes(expected)) return true;
  return false;
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

async function run() {
  const tools = loadTools();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const results = [];

  for (const tool of tools) {
    const started = Date.now();
    let status = 'PASS';
    const notes = [];

    try {
      const response = await page.goto(`${BASE_URL}${tool.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      if (!response) {
        status = 'FAIL';
        notes.push('No response');
      } else if (!response.ok()) {
        status = 'FAIL';
        notes.push(`HTTP ${response.status()}`);
      }

      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

      const title = await page.title().catch(() => '');
      const h1Count = await page.locator('h1').count().catch(() => 0);
      const buttonCount = await countVisible(page, 'button').catch(() => 0);
      const textareaCount = await countVisible(page, 'textarea').catch(() => 0);
      const inputCount = await countVisible(page, 'input[type="text"], input:not([type])').catch(() => 0);
      const editableCount = await countVisible(page, '[contenteditable="true"]').catch(() => 0);
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

      if (textareaCount + inputCount + editableCount < 1) {
        status = status === 'FAIL' ? 'FAIL' : 'WARN';
        notes.push('No visible text input');
      }

      if (isProbablyFallbackPage(title, bodyText, tool.title)) {
        status = 'FAIL';
        notes.push('Looks like fallback/global page');
      }

      results.push({
        slug: tool.slug,
        toolStatus: tool.status,
        checkStatus: status,
        timeMs: Date.now() - started,
        title,
        h1Count,
        buttonCount,
        inputCount: textareaCount + inputCount + editableCount,
        notes: notes.join(' | ')
      });

      const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
      console.log(`${icon} ${status} ${tool.slug}${notes.length ? ' | ' + notes.join(' | ') : ''}`);
    } catch (err) {
      results.push({
        slug: tool.slug,
        toolStatus: tool.status,
        checkStatus: 'FAIL',
        timeMs: Date.now() - started,
        title: '',
        h1Count: 0,
        buttonCount: 0,
        inputCount: 0,
        notes: err.message
      });
      console.log(`❌ FAIL ${tool.slug} | ${err.message}`);
    }
  }

  await browser.close();

  fs.mkdirSync('./test-results', { recursive: true });
  fs.writeFileSync('./test-results/tools-health-check.json', JSON.stringify(results, null, 2));

  const pass = results.filter(r => r.checkStatus === 'PASS').length;
  const warn = results.filter(r => r.checkStatus === 'WARN').length;
  const fail = results.filter(r => r.checkStatus === 'FAIL').length;

  console.log('\n===== SUMMARY =====');
  console.log(`PASS: ${pass}`);
  console.log(`WARN: ${warn}`);
  console.log(`FAIL: ${fail}`);
  console.log('Saved report: test-results/tools-health-check.json');

  if (fail > 0) process.exit(1);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
