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

function buildIntroHtml(tool) {
  const intro = (tool.intro || '').trim();
  if (!intro) return '';
  return `\n      <p class="tool-intro">${escapeHtml(intro)}</p>`;
}

function buildStyleBlock() {
  return `
  <style id="tool-intro-style">
    .tool-intro {
      margin: 12px 0 0;
      max-width: 760px;
      color: #5f6f86;
      font-size: 16px;
      line-height: 1.7;
    }
  </style>`;
}

let updated = 0;

for (const tool of tools) {
  if (!tool.slug) continue;

  const filePath = path.join(toolsDir, tool.slug, 'index.html');
  if (!fs.existsSync(filePath)) continue;

  let html = fs.readFileSync(filePath, 'utf8');

  html = html.replace(/\n?\s*<p class="tool-intro">[\s\S]*?<\/p>/i, '');

  if (!html.includes('id="tool-intro-style"')) {
    html = html.replace(/<\/head>/i, `${buildStyleBlock()}\n</head>`);
  }

  const introHtml = buildIntroHtml(tool);
  if (!introHtml) {
    fs.writeFileSync(filePath, html, 'utf8');
    continue;
  }

  if (/<h1[^>]*>[\s\S]*?<\/h1>/i.test(html)) {
    html = html.replace(/(<h1[^>]*>[\s\S]*?<\/h1>)/i, `$1${introHtml}`);
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ Intro added: tools/${tool.slug}/index.html`);
    updated++;
  } else {
    console.log(`⚠️ H1 not found: tools/${tool.slug}/index.html`);
  }
}

console.log(`\nDone. Updated: ${updated}`);
