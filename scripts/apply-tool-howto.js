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
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHowToSection(tool) {
  const toolName = escapeHtml(tool.name || tool.title || tool.slug || 'this tool');

  return `
    <section class="tool-howto-section" aria-labelledby="tool-howto-title">
      <div class="section-card">
        <h2 id="tool-howto-title">How to use</h2>
        <p>Use ${toolName} in three simple steps.</p>
        <ol class="howto-list">
          <li><strong>Paste or enter your input.</strong> Add the text or data you want to process.</li>
          <li><strong>Run the tool.</strong> Click the main action button to generate the result.</li>
          <li><strong>Copy or reuse the output.</strong> Review the result and use it in your workflow.</li>
        </ol>
      </div>
    </section>`;
}

function buildStyleBlock() {
  return `
  <style id="tool-howto-style">
    .tool-howto-section {
      margin-top: 32px;
    }
    .howto-list {
      margin: 16px 0 0;
      padding-left: 20px;
      color: #5f6f86;
    }
    .howto-list li {
      margin: 0 0 12px;
      line-height: 1.7;
    }
    .howto-list strong {
      color: #152033;
    }
  </style>`;
}

let updated = 0;

for (const tool of tools) {
  if (!tool.slug) continue;

  const filePath = path.join(toolsDir, tool.slug, 'index.html');
  if (!fs.existsSync(filePath)) continue;

  let html = fs.readFileSync(filePath, 'utf8');

  html = html.replace(/<section class="tool-howto-section"[\s\S]*?<\/section>/i, '');

  if (!html.includes('id="tool-howto-style"')) {
    html = html.replace(/<\/head>/i, `${buildStyleBlock()}\n</head>`);
  }

  const howtoHtml = buildHowToSection(tool);

  if (/<\/main>/i.test(html)) {
    html = html.replace(/<\/main>/i, `${howtoHtml}\n</main>`);
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ How to use added: tools/${tool.slug}/index.html`);
    updated++;
  } else {
    console.log(`⚠️ No </main> tag found: tools/${tool.slug}/index.html`);
  }
}

console.log(`\nDone. Updated: ${updated}`);
