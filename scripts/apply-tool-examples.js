const fs = require('fs');
const path = require('path');

const root = process.cwd();
const toolsPath = path.join(root, 'data', 'tools.json');
const toolsDir = path.join(root, 'tools');

const tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getExample(tool) {
  const slug = (tool.slug || '').toLowerCase();
  const name = tool.name || tool.title || tool.slug || 'Tool';

  if (slug === 'remove-line-breaks') {
    return {
      input: 'Hello\\nworld\\nfrom\\nthis\\ntool',
      output: 'Hello world from this tool'
    };
  }

  if (slug === 'remove-extra-spaces') {
    return {
      input: 'Hello     world     from     this     tool',
      output: 'Hello world from this tool'
    };
  }

  if (slug === 'word-counter') {
    return {
      input: 'This is a short example sentence.',
      output: 'Words: 6 · Characters: 33 · Lines: 1'
    };
  }

  if (slug === 'character-counter') {
    return {
      input: 'Count these characters.',
      output: 'Characters: 23'
    };
  }

  if (slug === 'paragraph-counter') {
    return {
      input: 'First paragraph.\\n\\nSecond paragraph.',
      output: 'Paragraphs: 2'
    };
  }

  if (slug === 'case-converter') {
    return {
      input: 'hello world from this tool',
      output: 'Hello World From This Tool'
    };
  }

  if (slug === 'text-sorter') {
    return {
      input: 'banana\\napple\\ncarrot',
      output: 'apple\\nbanana\\ncarrot'
    };
  }

  if (slug === 'duplicate-line-remover') {
    return {
      input: 'apple\\nbanana\\napple\\ncarrot',
      output: 'apple\\nbanana\\ncarrot'
    };
  }

  if (slug === 'json-formatter') {
    return {
      input: '{"name":"Alex","role":"dev","active":true}',
      output: '{\\n  "name": "Alex",\\n  "role": "dev",\\n  "active": true\\n}'
    };
  }

  if (slug === 'regex-tester') {
    return {
      input: 'Pattern: \\\\d+\\nText: Order 123 shipped on 2026-03-07',
      output: 'Matches: 123, 2026, 03, 07'
    };
  }

  if (slug === 'base64-encoder') {
    return {
      input: 'hello world',
      output: 'aGVsbG8gd29ybGQ='
    };
  }

  if (slug === 'url-encoder') {
    return {
      input: 'hello world?x=1&y=2',
      output: 'hello%20world%3Fx%3D1%26y%3D2'
    };
  }

  if (slug === 'uuid-generator') {
    return {
      input: 'Click generate',
      output: '550e8400-e29b-41d4-a716-446655440000'
    };
  }

  if (slug === 'password-generator') {
    return {
      input: 'Length: 16, include symbols',
      output: 'Example output: T8!mQ2#zLp9@Vr1K'
    };
  }

  if (slug === 'timestamp-converter') {
    return {
      input: '1710000000',
      output: '2024-03-09 16:00:00 UTC'
    };
  }

  if (slug === 'json-to-csv') {
    return {
      input: '[{"name":"Alex","age":30},{"name":"Sam","age":28}]',
      output: 'name,age\\nAlex,30\\nSam,28'
    };
  }

  if (slug === 'csv-to-json') {
    return {
      input: 'name,age\\nAlex,30\\nSam,28',
      output: '[{"name":"Alex","age":"30"},{"name":"Sam","age":"28"}]'
    };
  }

  if ((tool.category || '').toLowerCase() === 'developer-tools') {
    return {
      input: `Sample input for ${name}`,
      output: `Processed output from ${name}`
    };
  }

  return {
    input: `Sample input for ${name}`,
    output: `Processed output from ${name}`
  };
}

function buildExampleSection(tool) {
  const example = getExample(tool);

  return `
    <section class="tool-example-section" aria-labelledby="tool-example-title">
      <div class="section-card">
        <h2 id="tool-example-title">Example</h2>
        <p>A quick example of how this tool works.</p>
        <div class="tool-example-grid">
          <div class="example-box">
            <h3>Input</h3>
            <pre>${escapeHtml(example.input)}</pre>
          </div>
          <div class="example-box">
            <h3>Output</h3>
            <pre>${escapeHtml(example.output)}</pre>
          </div>
        </div>
      </div>
    </section>`;
}

function buildStyleBlock() {
  return `
  <style id="tool-example-style">
    .tool-example-section {
      margin-top: 32px;
    }
    .tool-example-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }
    .example-box {
      background: #fff;
      border: 1px solid #d9e2ef;
      border-radius: 14px;
      padding: 16px;
    }
    .example-box h3 {
      margin: 0 0 10px;
      font-size: 16px;
    }
    .example-box pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 13px;
      line-height: 1.6;
      color: #5f6f86;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
  </style>`;
}

let updated = 0;

for (const tool of tools) {
  if (!tool.slug) continue;

  const filePath = path.join(toolsDir, tool.slug, 'index.html');
  if (!fs.existsSync(filePath)) continue;

  let html = fs.readFileSync(filePath, 'utf8');

  html = html.replace(/<section class="tool-example-section"[\s\S]*?<\/section>/i, '');

  if (!html.includes('id="tool-example-style"')) {
    html = html.replace(/<\/head>/i, `${buildStyleBlock()}\n</head>`);
  }

  const sectionHtml = buildExampleSection(tool);

  if (/<\/main>/i.test(html)) {
    html = html.replace(/<\/main>/i, `${sectionHtml}\n</main>`);
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ Example added: tools/${tool.slug}/index.html`);
    updated++;
  } else {
    console.log(`⚠️ No </main> tag found: tools/${tool.slug}/index.html`);
  }
}

console.log(`\nDone. Updated: ${updated}`);
