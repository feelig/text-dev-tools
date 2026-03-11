const fs = require('fs');
const path = require('path');

const root = process.cwd();
const toolsPath = path.join(root, 'data', 'tools.json');
const toolsDir = path.join(root, 'tools');

const tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

function stripSection(html, className) {
  const pattern = new RegExp(`\\s*<section class="${className}"[\\s\\S]*?<\\/section>`, 'i');
  return html.replace(pattern, '');
}

function hasLegacyContent(html) {
  return /<div class="card content-section">/i.test(html);
}

function hasLegacyFaqSchema(html) {
  return /<script(?![^>]*id="tool-faq-schema")[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?"@type"\s*:\s*"FAQPage"[\s\S]*?<\/script>/i.test(
    html
  );
}

let updated = 0;

for (const tool of tools) {
  if (!tool.slug) continue;

  const filePath = path.join(toolsDir, tool.slug, 'index.html');
  if (!fs.existsSync(filePath)) continue;

  let html = fs.readFileSync(filePath, 'utf8');
  const original = html;

  if (hasLegacyContent(html)) {
    html = stripSection(html, 'related-tools-section');
    html = stripSection(html, 'tool-faq-section');
    html = stripSection(html, 'tool-howto-section');
    html = stripSection(html, 'tool-use-cases-section');
    html = stripSection(html, 'tool-example-section');
  }

  if (hasLegacyFaqSchema(html)) {
    html = html.replace(
      /\s*<script id="tool-faq-schema" type="application\/ld\+json">[\s\S]*?<\/script>/i,
      ''
    );
  }

  html = html.replace(/\n{4,}/g, '\n\n\n');

  if (html !== original) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ Cleaned duplicate content: tools/${tool.slug}/index.html`);
    updated++;
  }
}

console.log(`\nDone. Updated: ${updated}`);
