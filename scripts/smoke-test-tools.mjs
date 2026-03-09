import { chromium } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://extformattools.com';

const tools = [
  {
    slug: 'remove-blank-lines',
    path: '/tools/remove-blank-lines/',
    kind: 'transform',
    input: 'apple\n\nbanana\n   \norange\n\n\ngrape',
    expected: 'apple\nbanana\norange\ngrape',
    actionPattern: /remove|clean|process|format|convert|run/i
  },
  {
    slug: 'line-counter',
    path: '/tools/line-counter/',
    kind: 'count',
    input: 'a\nb\n\nc',
    expectedCount: 4,
    actionPattern: /count|calculate|analyze|run|check/i
  },
  {
    slug: 'sentence-counter',
    path: '/tools/sentence-counter/',
    kind: 'count',
    input: 'Hello world. How are you? I am fine!',
    expectedCount: 3,
    actionPattern: /count|calculate|analyze|run|check/i
  },
  {
    slug: 'text-reverser',
    path: '/tools/text-reverser/',
    kind: 'transform',
    input: 'abcd 123',
    expected: '321 dcba',
    actionPattern: /reverse|convert|process|run/i
  },
  {
    slug: 'trim-text',
    path: '/tools/trim-text/',
    kind: 'transform',
    input: '   hello world   ',
    expected: 'hello world',
    actionPattern: /trim|clean|convert|process|run/i
  }
];

function normalize(s) {
  return String(s ?? '').replace(/\r\n/g, '\n').trim();
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function collectErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`console error: ${msg.text()}`);
    }
  });
  return errors;
}

async function gotoTool(page, tool) {
  const response = await page.goto(`${BASE_URL}${tool.path}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  if (!response || !response.ok()) {
    throw new Error(`Page failed to load: ${tool.path} status=${response ? response.status() : 'NO_RESPONSE'}`);
  }

  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
}

async function basicChecks(page, tool) {
  const title = await page.title();
  if (!title || title.trim().length < 3) {
    throw new Error(`Missing or invalid <title> on ${tool.slug}`);
  }

  const h1Count = await page.locator('h1').count();
  if (h1Count < 1) {
    throw new Error(`Missing <h1> on ${tool.slug}`);
  }

  const inputCount =
    await page.locator('textarea').count() +
    await page.locator('input[type="text"]').count() +
    await page.locator('input:not([type])').count();

  if (inputCount < 1) {
    throw new Error(`No text input control found on ${tool.slug}`);
  }

  const buttonCount = await page.locator('button').count();
  if (buttonCount < 1) {
    throw new Error(`No button found on ${tool.slug}`);
  }
}

async function findPrimaryInput(page) {
  const candidates = [
    page.locator('textarea'),
    page.locator('input[type="text"]'),
    page.locator('input:not([type])')
  ];

  for (const locator of candidates) {
    const count = await locator.count();
    if (count > 0) return locator.first();
  }

  throw new Error('No input control available');
}

async function findPossibleOutputText(page) {
  const selectors = [
    'textarea',
    'input[type="text"]',
    'input:not([type])',
    '[id*="output"]',
    '[class*="output"]',
    '[data-output]',
    '.result',
    '.results'
  ];

  for (const sel of selectors) {
    const locator = page.locator(sel);
    const count = await locator.count();
    if (count >= 2 && (sel === 'textarea' || sel.startsWith('input'))) {
      const second = locator.nth(1);
      if (await second.isVisible().catch(() => false)) {
        const tag = await second.evaluate(el => el.tagName.toLowerCase());
        if (tag === 'textarea' || tag === 'input') {
          return normalize(await second.inputValue());
        }
      }
    }

    if (count > 0 && !(sel === 'textarea' || sel.startsWith('input'))) {
      const first = locator.first();
      if (await first.isVisible().catch(() => false)) {
        return normalize(await first.innerText().catch(() => ''));
      }
    }
  }

  return '';
}

async function clickPrimaryAction(page, pattern) {
  const roleButton = page.getByRole('button', { name: pattern });
  if (await roleButton.count() > 0) {
    await roleButton.first().click();
    await page.waitForTimeout(300);
    return;
  }

  const allButtons = page.locator('button');
  const count = await allButtons.count();
  if (count > 0) {
    await allButtons.first().click();
    await page.waitForTimeout(300);
    return;
  }

  throw new Error('Could not find a clickable action button');
}

async function runTransformTest(page, tool) {
  const input = await findPrimaryInput(page);
  await input.fill(tool.input);
  await clickPrimaryAction(page, tool.actionPattern);

  const combinedText = normalize(await page.locator('body').innerText());
  const outputText = await findPossibleOutputText(page);

  const expected = normalize(tool.expected);

  if (outputText.includes(expected) || combinedText.includes(expected)) {
    return;
  }

  throw new Error(
    `${tool.slug} output mismatch\nExpected to find: ${JSON.stringify(expected)}\nDetected output: ${JSON.stringify(outputText.slice(0, 300))}`
  );
}

async function runCountTest(page, tool) {
  const input = await findPrimaryInput(page);
  await input.fill(tool.input);
  await clickPrimaryAction(page, tool.actionPattern);

  const bodyText = normalize(await page.locator('body').innerText());
  const patterns = [
    new RegExp(`\\b${tool.expectedCount}\\b`),
    new RegExp(`total\\s+lines?\\D+${tool.expectedCount}`, 'i'),
    new RegExp(`lines?\\D+${tool.expectedCount}`, 'i'),
    new RegExp(`sentences?\\D+${tool.expectedCount}`, 'i'),
    new RegExp(`count\\D+${tool.expectedCount}`, 'i')
  ];

  if (patterns.some((re) => re.test(bodyText))) {
    return;
  }

  throw new Error(
    `${tool.slug} did not show expected count ${tool.expectedCount}\nPage text sample: ${JSON.stringify(bodyText.slice(0, 500))}`
  );
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  for (const tool of tools) {
    const started = Date.now();
    const errors = await collectErrors(page);

    try {
      await gotoTool(page, tool);
      await basicChecks(page, tool);

      if (tool.kind === 'transform') {
        await runTransformTest(page, tool);
      } else if (tool.kind === 'count') {
        await runCountTest(page, tool);
      }

      results.push({
        tool: tool.slug,
        status: 'PASS',
        timeMs: Date.now() - started,
        notes: errors.length ? errors.join(' | ') : ''
      });
      console.log(`✅ PASS ${tool.slug}`);
    } catch (err) {
      results.push({
        tool: tool.slug,
        status: 'FAIL',
        timeMs: Date.now() - started,
        notes: err.message
      });
      console.log(`❌ FAIL ${tool.slug}`);
      console.log(err.message);
    }
  }

  await browser.close();

  console.log('\n===== SUMMARY =====');
  for (const r of results) {
    console.log(`${r.status} | ${r.tool} | ${r.timeMs}ms${r.notes ? ' | ' + r.notes : ''}`);
  }

  const failed = results.filter(r => r.status === 'FAIL');
  if (failed.length) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
