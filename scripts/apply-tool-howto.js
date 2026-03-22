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

function getHowToData(tool) {
  const custom = tool.howTo || {};
  const steps = Array.isArray(custom.steps) ? custom.steps.filter(Boolean) : [];

  if (custom.lead && steps.length) {
    return {
      lead: custom.lead,
      steps
    };
  }

  return {
    lead: 'Paste your input, run the tool, then copy the result you need.',
    steps: [
      'Paste or type the text or data you want to work with.',
      'Click the main action button to generate the result.',
      'Review the output and copy it into your next step.'
    ]
  };
}

function buildHowToSection(tool) {
  const howTo = getHowToData(tool);
  const steps = howTo.steps
    .map((step) => `          <li>${escapeHtml(step)}</li>`)
    .join('\n');

  return `
    <section class="tool-howto-section" aria-labelledby="tool-howto-title">
      <div class="container">
        <div class="section-card">
          <h2 id="tool-howto-title">How to use</h2>
          <p>${escapeHtml(howTo.lead)}</p>
          <ol class="howto-list">
${steps}
          </ol>
        </div>
      </div>
    </section>`;
}

function buildStyleBlock() {
  return `
  <style id="tool-howto-style">
    .tool-howto-section {
      margin-top: 32px;
    }
    .section-card {
      background: #fff;
      border: 1px solid #d9e2ef;
      border-radius: 14px;
      padding: 16px;
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
  html = html.replace(/<section[^>]*aria-labelledby="tool-howto-title"[\s\S]*?<\/section>/i, '');

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
