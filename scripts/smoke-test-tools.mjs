import { chromium } from '@playwright/test';
import fs from 'fs';
import http from 'http';
import path from 'path';

const ROOT_DIR = process.cwd();

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

const tools = [
  {
    slug: 'remove-line-breaks',
    path: '/tools/remove-line-breaks/',
    async run(page) {
      await page.locator('#inputText').fill('Hello\nworld\nfrom\ntool');
      await page.locator('#processBtn').click();
      await expectValue(page, '#outputText', 'Hello world from tool');
      await expectText(page, '#statusMessage', 'Line breaks removed successfully.');
    }
  },
  {
    slug: 'remove-extra-spaces',
    path: '/tools/remove-extra-spaces/',
    async run(page) {
      await page.locator('#inputText').fill('Hello     world\nfrom    tool');
      await page.locator('#processBtn').click();
      await expectValue(page, '#outputText', 'Hello world\nfrom tool');
      await expectText(page, '#statusMessage', 'Extra spaces removed successfully.');

      await page.locator('#inputText').fill('\tAlpha   beta  \n  gamma\t\t');
      await page.locator('#processBtn').click();
      await expectValue(page, '#outputText', 'Alpha beta\ngamma');
    }
  },
  {
    slug: 'remove-empty-lines',
    path: '/tools/remove-empty-lines/',
    async run(page) {
      await page.locator('#inputText').fill('Apple\n\nBanana\n   \nCarrot');
      await page.locator('#processBtn').click();
      await expectValue(page, '#outputText', 'Apple\nBanana\nCarrot');
      await expectText(page, '#statusMessage', 'Empty lines removed successfully.');
    }
  },
  {
    slug: 'duplicate-line-remover',
    path: '/tools/duplicate-line-remover/',
    async run(page) {
      await page.locator('#inputText').fill('apple\nbanana\napple\ncarrot');
      await page.locator('#processBtn').click();
      await expectValue(page, '#outputText', 'apple\nbanana\ncarrot');
      await expectText(page, '#statusMessage', 'Duplicate lines removed successfully.');
    }
  },
  {
    slug: 'trim-lines',
    path: '/tools/trim-lines/',
    async run(page) {
      await page.locator('#inputText').fill('  first  \n\tsecond\t\n third ');
      await page.locator('#processBtn').click();
      await expectValue(page, '#outputText', 'first\nsecond\nthird');
      await expectText(page, '#statusMessage', 'Line edges trimmed successfully.');
    }
  },
  {
    slug: 'replace-tabs-with-spaces',
    path: '/tools/replace-tabs-with-spaces/',
    async run(page) {
      await page.locator('#inputText').fill('name\trole');
      await page.locator('#processBtn').click();
      await expectValue(page, '#outputText', 'name    role');
      await expectText(page, '#statusMessage', 'Tabs replaced with spaces successfully.');
    }
  },
  {
    slug: 'word-counter',
    path: '/tools/word-counter/',
    async run(page) {
      await page.locator('#inputText').fill('Alpha beta\ngamma');
      await page.locator('#processBtn').click();
      await expectValue(
        page,
        '#outputText',
        'Words: 3\nCharacters: 16\nCharacters (no spaces): 14\nLines: 2'
      );
      await expectText(page, '#statWords', '3');
      await expectText(page, '#statChars', '16');
      await expectText(page, '#statCharsNoSpaces', '14');
      await expectText(page, '#statLines', '2');

      await page.locator('#inputText').fill('One\t two  \n\nthree ');
      await page.locator('#processBtn').click();
      await expectValue(
        page,
        '#outputText',
        'Words: 3\nCharacters: 18\nCharacters (no spaces): 11\nLines: 3'
      );
      await expectText(page, '#statWords', '3');
      await expectText(page, '#statChars', '18');
      await expectText(page, '#statCharsNoSpaces', '11');
      await expectText(page, '#statLines', '3');
    }
  },
  {
    slug: 'case-converter',
    path: '/tools/case-converter/',
    async run(page) {
      await page.locator('#inputText').fill('hello world.\nsecond line');
      await page.locator('#upperBtn').click();
      await expectValue(page, '#outputText', 'HELLO WORLD.\nSECOND LINE');
      await expectText(page, '#statusMessage', 'Text converted successfully.');

      await page.locator('#inputText').fill('HELLO WORLD. SECOND LINE! third line?');
      await page.locator('#sentenceBtn').click();
      await expectValue(page, '#outputText', 'Hello world. Second line! Third line?');
    }
  },
  {
    slug: 'text-sorter',
    path: '/tools/text-sorter/',
    async run(page) {
      await page.locator('#inputText').fill('banana\napple\n\ncarrot');
      await page.locator('#sortAscBtn').click();
      await expectValue(page, '#outputText', 'apple\nbanana\ncarrot');
      await expectText(page, '#statusMessage', 'Lines sorted successfully.');
    }
  },
  {
    slug: 'line-counter',
    path: '/tools/line-counter/',
    async run(page) {
      await page.locator('#inputText').fill('apple\nbanana\n\norange');
      await page.locator('#runBtn').click();
      await expectValue(page, '#outputText', 'Total lines: 4\nNon-empty lines: 3\nEmpty lines: 1');
      await expectText(page, '#stats', 'Total: 4 | Non-empty: 3 | Empty: 1');
    }
  },
  {
    slug: 'character-counter',
    path: '/tools/character-counter/',
    async run(page) {
      await page.locator('#inputText').fill('Hi there\nok');
      await page.locator('#countBtn').click();
      await expectText(page, '#statChars', '11');
      await expectText(page, '#statCharsNoSpaces', '9');
      await expectText(page, '#statWords', '3');
      await expectText(page, '#statLines', '2');
      await expectText(page, '#statusMessage', 'Text counted successfully.');

      await page.locator('#inputText').fill('Hi 世界.\n\nNext line!');
      await page.locator('#countBtn').click();
      await expectText(page, '#statChars', '18');
      await expectText(page, '#statCharsNoSpaces', '14');
      await expectText(page, '#statWords', '4');
      await expectText(page, '#statLines', '3');
      await expectText(page, '#statParagraphs', '2');
      await expectText(page, '#statSentences', '2');
    }
  },
  {
    slug: 'sentence-counter',
    path: '/tools/sentence-counter/',
    async run(page) {
      await page.locator('#inputText').fill('Hello world. How are you? I am fine!');
      await page.locator('#runBtn').click();
      await expectValue(page, '#outputText', 'Sentence count: 3');
      await expectText(page, '#stats', 'Estimated sentences: 3');
    }
  },
  {
    slug: 'json-formatter',
    path: '/tools/json-formatter/',
    async run(page) {
      await page.locator('#inputText').fill('{"name":"Alice","count":2,"active":true}');
      await page.locator('#formatBtn').click();
      await expectValue(
        page,
        '#outputText',
        '{\n  "name": "Alice",\n  "count": 2,\n  "active": true\n}'
      );
      await expectText(page, '#statusMessage', 'JSON formatted successfully.');

      await page.locator('#inputText').fill('[{"id":1},{"id":2}]');
      await page.locator('#formatBtn').click();
      await expectValue(
        page,
        '#outputText',
        '[\n  {\n    "id": 1\n  },\n  {\n    "id": 2\n  }\n]'
      );

      await page.locator('#inputText').fill('{"name": }');
      await page.locator('#formatBtn').click();
      await expectContainsText(page, '#statusMessage', 'Invalid JSON:');

      await page.locator('#inputText').fill('[1,2,]');
      await page.locator('#formatBtn').click();
      await expectContainsText(page, '#statusMessage', 'Invalid JSON:');
    }
  },
  {
    slug: 'json-validator',
    path: '/tools/json-validator/',
    async run(page) {
      await page.locator('#inputText').fill('{"name":"Alice","count":2,"active":true}');
      await page.locator('#processBtn').click();
      await expectValue(
        page,
        '#outputText',
        '{\n  "name": "Alice",\n  "count": 2,\n  "active": true\n}'
      );
      await expectText(page, '#statusMessage', 'JSON is valid and has been formatted.');

      await page.locator('#inputText').fill('{"items":[1,2],"ok":false}');
      await page.locator('#processBtn').click();
      await expectValue(
        page,
        '#outputText',
        '{\n  "items": [\n    1,\n    2\n  ],\n  "ok": false\n}'
      );

      await page.locator('#inputText').fill('{"name": }');
      await page.locator('#processBtn').click();
      await expectContainsText(page, '#statusMessage', 'Unexpected token');
    }
  },
  {
    slug: 'regex-tester',
    path: '/tools/regex-tester/',
    async run(page) {
      await page.locator('#patternInput').fill('\\d+');
      await page.locator('#flagsInput').fill('g');
      await page.locator('#inputText').fill('Order 12 ships on 2026-03-07');
      await page.locator('#testBtn').click();
      await expectValue(
        page,
        '#outputText',
        'Match 1: 12 (index 6)\nMatch 2: 2026 (index 18)\nMatch 3: 03 (index 23)\nMatch 4: 07 (index 26)'
      );
      await expectText(page, '#matchCount', '4 matches');
      await expectText(page, '#statusMessage', 'Regex tested successfully.');

      await page.locator('#patternInput').fill('^');
      await page.locator('#flagsInput').fill('gm');
      await page.locator('#inputText').fill('Alpha\nBeta');
      await page.locator('#testBtn').click();
      await expectValue(page, '#outputText', 'Match 1:  (index 0)\nMatch 2:  (index 6)');
      await expectText(page, '#matchCount', '2 matches');

      await page.locator('#patternInput').fill('\\d+');
      await page.locator('#flagsInput').fill('g');
      await page.locator('#inputText').fill('letters only');
      await page.locator('#testBtn').click();
      await expectValue(page, '#outputText', 'No matches found.');
      await expectText(page, '#matchCount', '0 matches');

      await page.locator('#patternInput').fill('[');
      await page.locator('#testBtn').click();
      await expectContainsText(page, '#statusMessage', 'Invalid regex:');
    }
  },
  {
    slug: 'text-reverser',
    path: '/tools/text-reverser/',
    async run(page) {
      await page.locator('#inputText').fill('abcd 123');
      await page.locator('#runBtn').click();
      await expectValue(page, '#outputText', '321 dcba');
      await expectText(page, '#stats', 'Characters reversed: 8');
    }
  },
  {
    slug: 'base64-encoder',
    path: '/tools/base64-encoder/',
    async run(page) {
      await page.locator('#input').fill('hello world');
      await page.getByRole('button', { name: 'Encode' }).click();
      await expectValue(page, '#output', 'aGVsbG8gd29ybGQ=');

      await page.locator('#input').fill('aGVsbG8gd29ybGQ=');
      await page.getByRole('button', { name: 'Decode' }).click();
      await expectValue(page, '#output', 'hello world');

      await page.locator('#input').fill('not-base64%%%');
      await expectDialog(page, 'Invalid Base64', async () => {
        await page.getByRole('button', { name: 'Decode' }).click();
      });
    }
  },
  {
    slug: 'url-encoder',
    path: '/tools/url-encoder/',
    async run(page) {
      await page.locator('#input').fill('hello world?x=1&y=2');
      await page.getByRole('button', { name: 'Encode' }).click();
      await expectValue(page, '#output', 'hello%20world%3Fx%3D1%26y%3D2');

      await page.locator('#input').fill('hello%20world%3Fx%3D1%26y%3D2');
      await page.getByRole('button', { name: 'Decode' }).click();
      await expectValue(page, '#output', 'hello world?x=1&y=2');

      const unicodeUrl = 'https://example.com/搜索?q=你好 world';
      await page.locator('#input').fill(unicodeUrl);
      await page.getByRole('button', { name: 'Encode' }).click();
      await expectValue(page, '#output', encodeURIComponent(unicodeUrl));

      await page.locator('#input').fill('%');
      await expectDialog(page, 'Invalid encoded URL', async () => {
        await page.getByRole('button', { name: 'Decode' }).click();
      });
    }
  },
  {
    slug: 'trim-text',
    path: '/tools/trim-text/',
    async run(page) {
      await page.locator('#inputText').fill('   hello world   ');
      await page.locator('#runBtn').click();
      await expectValue(page, '#outputText', 'hello world');
      await expectText(page, '#stats', 'Removed 6 leading/trailing whitespace characters.');
    }
  },
  {
    slug: 'password-generator',
    path: '/tools/password-generator/',
    async run(page) {
      await page.locator('#lengthInput').fill('20');
      await ensureChecked(page, '#upperCheck', true);
      await ensureChecked(page, '#lowerCheck', true);
      await ensureChecked(page, '#numberCheck', true);
      await ensureChecked(page, '#symbolCheck', true);
      await page.locator('#generateBtn').click();

      const password = await page.locator('#outputText').innerText();
      if (password.trim().length !== 20) {
        throw new Error(`Expected 20-character password, got ${JSON.stringify(password)}`);
      }
      if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) {
        throw new Error(`Password does not include every selected character type: ${JSON.stringify(password)}`);
      }
      await expectText(page, '#statusMessage', 'Password generated successfully.');
    }
  },
  {
    slug: 'uuid-generator',
    path: '/tools/uuid-generator/',
    async run(page) {
      await page.locator('#countInput').fill('3');
      await page.locator('#generateBtn').click();
      const output = normalize(await page.locator('#outputText').inputValue());
      const lines = output.split('\n').filter(Boolean);
      if (lines.length !== 3) {
        throw new Error(`Expected 3 UUIDs, got ${lines.length}`);
      }
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      for (const line of lines) {
        if (!uuidPattern.test(line)) {
          throw new Error(`Invalid UUID generated: ${line}`);
        }
      }
      await expectText(page, '#statusMessage', 'UUIDs generated successfully.');
    }
  }
];

function normalize(value) {
  return String(value ?? '').replace(/\r\n/g, '\n').trim();
}

function resolvePath(urlPath) {
  const cleaned = decodeURIComponent(new URL(urlPath, 'http://127.0.0.1').pathname);
  const candidate = path.join(ROOT_DIR, cleaned);
  let filePath = candidate;

  if (cleaned.endsWith('/')) {
    filePath = path.join(candidate, 'index.html');
  } else if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
    filePath = path.join(candidate, 'index.html');
  }

  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(ROOT_DIR)) {
    return null;
  }
  return normalized;
}

function createStaticServer() {
  const server = http.createServer((req, res) => {
    const filePath = resolvePath(req.url || '/');

    if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'content-type': MIME_TYPES[ext] || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () =>
          new Promise((closeResolve, closeReject) => {
            server.close((error) => (error ? closeReject(error) : closeResolve()));
          })
      });
    });
  });
}

async function gotoTool(page, baseUrl, tool) {
  const response = await page.goto(`${baseUrl}${tool.path}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  if (!response || !response.ok()) {
    throw new Error(`Page failed to load: ${tool.path} status=${response ? response.status() : 'NO_RESPONSE'}`);
  }

  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
}

async function basicChecks(page, tool) {
  const title = (await page.title()).trim();
  if (!title) {
    throw new Error(`Missing <title> on ${tool.slug}`);
  }

  const h1Count = await page.locator('h1').count();
  if (h1Count < 1) {
    throw new Error(`Missing <h1> on ${tool.slug}`);
  }

  const inputCount =
    (await page.locator('textarea').count()) +
    (await page.locator('input[type="text"]').count()) +
    (await page.locator('input[type="number"]').count()) +
    (await page.locator('input:not([type])').count());

  if (inputCount < 1) {
    throw new Error(`No input control found on ${tool.slug}`);
  }

  const buttonCount = await page.locator('button').count();
  if (buttonCount < 1) {
    throw new Error(`No button found on ${tool.slug}`);
  }
}

async function expectValue(page, selector, expected) {
  const actual = normalize(await page.locator(selector).inputValue());
  if (actual !== expected) {
    throw new Error(`Value mismatch for ${selector}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

async function expectText(page, selector, expected) {
  const actual = normalize(await page.locator(selector).innerText());
  if (actual !== expected) {
    throw new Error(`Text mismatch for ${selector}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

async function expectContainsText(page, selector, expectedPart) {
  const actual = normalize(await page.locator(selector).innerText());
  if (!actual.includes(expectedPart)) {
    throw new Error(`Expected ${selector} to include ${JSON.stringify(expectedPart)} but got ${JSON.stringify(actual)}`);
  }
}

async function expectDialog(page, expectedMessage, action) {
  const dialogPromise = page.waitForEvent('dialog', { timeout: 5000 });
  const actionPromise = action();
  const dialog = await dialogPromise;
  const actual = normalize(dialog.message());
  await dialog.dismiss();
  await actionPromise;

  if (actual !== expectedMessage) {
    throw new Error(`Dialog mismatch\nExpected: ${JSON.stringify(expectedMessage)}\nActual: ${JSON.stringify(actual)}`);
  }
}

async function ensureChecked(page, selector, expected) {
  const locator = page.locator(selector);
  const current = await locator.isChecked();
  if (current !== expected) {
    await locator.click();
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const server = await createStaticServer();
  const results = [];

  try {
    for (const tool of tools) {
      const page = await browser.newPage();
      const consoleErrors = [];

      page.on('pageerror', (error) => {
        consoleErrors.push(`pageerror: ${error.message}`);
      });
      page.on('console', (message) => {
        if (message.type() === 'error') {
          consoleErrors.push(`console error: ${message.text()}`);
        }
      });

      const started = Date.now();

      try {
        await gotoTool(page, server.baseUrl, tool);
        await basicChecks(page, tool);
        await tool.run(page);

        if (consoleErrors.length) {
          throw new Error(consoleErrors.join(' | '));
        }

        results.push({
          tool: tool.slug,
          status: 'PASS',
          timeMs: Date.now() - started,
          notes: ''
        });
        console.log(`✅ PASS ${tool.slug}`);
      } catch (error) {
        results.push({
          tool: tool.slug,
          status: 'FAIL',
          timeMs: Date.now() - started,
          notes: error.message
        });
        console.log(`❌ FAIL ${tool.slug} | ${error.message}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }

  fs.mkdirSync(path.join(ROOT_DIR, 'test-results'), { recursive: true });
  fs.writeFileSync(
    path.join(ROOT_DIR, 'test-results', 'smoke-test-tools.json'),
    JSON.stringify(results, null, 2)
  );

  const pass = results.filter((result) => result.status === 'PASS').length;
  const fail = results.length - pass;

  console.log('\n===== SUMMARY =====');
  console.log(`PASS: ${pass}`);
  console.log(`FAIL: ${fail}`);
  console.log('Saved report: test-results/smoke-test-tools.json');

  if (fail > 0) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
